# Stage 1: REST API Architecture & Real-Time Notification Contract

### Core System Actions
1. **Fetch Notifications (`GET`):** Allows a student's client dashboard to request their targeted feed of campus announcements.
2. **Acknowledge Update Status (`PATCH`):** Updates a specific notification item's state to "read" to instantly clear notification badges on the client interface.
3. **Administrative Broadcast Pipeline (`POST`):** Provides a secure pipeline for departments (e.g., Placement Cell) to dispatch a single notice to a large array of student IDs.

---

### REST API Contracts

#### 1. GET /api/v1/notifications
- **Description:** Pulls a paginated list of alerts mapped to the authenticated student session.
- **Headers:**
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhYmhpc2hla3IyNjEwMDJAZ21haWwuY29tIiwiZXhwIjoxNzgxMTYyNjY0LCJpYXQiOjE3ODExNjE3NjQsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI0OWE5OWU3Zi1iZmJjLTRkNzctOTlhNy0xM2ViYWFiMTBlOWMiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJhYmhpc2hlayByYWpwdXQiLCJzdWIiOiI3NjQ1ZGQ2Ni05YjFlLTQyZTctOWM2YS00Y2I4NDFlMTNiZWYifSwiZW1haWwiOiJhYmhpc2hla3IyNjEwMDJAZ21haWwuY29tIiwibmFtZSI6ImFiaGlzaGVrIHJhanB1dCIsInRFly00NoIjoiMjMwMzQ5MDEwMDAwNCIsImFjY2Vzc0NvZGUiOiJCQVZEU2giLCJjbGllbnREIjoiNzY0NWRkNjYtOWIxZS00MmU3LTljNmEtNGNiODQxZTEzYmVmIiwiY2xpZW50U2VjcmV0IjoiUHVKeFluSGFla0tIY3BidCJ9.cx-IRIpXj-7Y5hc-GMRAtEqtE5C_LSiOTfC1SpYUwd8
  Accept: application/json

# Stage 2: Database Layer & High-Volume Scale Architecture

### 1. Suggested Storage Engine: PostgreSQL (Relational DBMS)
For a high-throughput campus notification ecosystem, a relational database management system (RDBMS) like **PostgreSQL** is highly superior to NoSQL alternatives (like MongoDB) for the following reasons:
- **Strict Transactional ACID Consistency:** Updating a notification state (e.g., changing `isRead` from `false` to `true`) requires absolute consistency across multiple client sessions. PostgreSQL ensures transactions are processed reliably without risking stale data states.
- **Relational Integrity:** Notifications are strictly tied to specific student profiles. PostgreSQL enforces foreign key constraints, which ensures that if a student profile is deleted, orphan notification records are instantly cleaned up via cascading deletions (`ON DELETE CASCADE`), preventing disk clutter.

---

### 2. Database Physical Schema Design
We define an explicit enumeration type for strict category validation and construct two cleanly linked operational tables:

```sql
-- Create an explicit ENUM for type-safe categories
CREATE TYPE notification_category AS ENUM ('Event', 'Result', 'Placement');

-- Core Student Profiles Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table linked via Foreign Key
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT NOT NULL,
    notification_type notification_category NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_student 
        FOREIGN KEY(student_id) 
        REFERENCES students(id) 
        ON DELETE CASCADE
);

### 3. When the database sizes hit millions of rows over semesters, the system will start lagging.

The Issue: B-tree indexes get so large they overflow the memory buffer pool capacity. This forces the server to swap data to the physical disk, creating immense I/O lag on simple queries.

The Solution: We can implement Horizontal Table Partitioning based on ranges of the created_at timestamp (like setting up monthly tables). Since historical notifications are rarely touched by students, the query manager can completely drop old sub-tables from its scanning pathway, keeping active current reads fast.

##4. Application Logic Queries
Running the Paginated Fetch (For the GET /api/v1/notifications endpoint)

SELECT id, notification_type, message, is_read, created_at 
FROM notifications
WHERE student_id = 1042 
  AND notification_type = 'Placement'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

Running the Status Update (For the PATCH /api/v1/notifications/:id/read endpoint)

UPDATE notifications 
SET is_read = TRUE 
WHERE id = 'd146095a-0d86-4a34-9e69-3900a14576bc';

---

# Stage 3: High-Volume Query Optimization & Indexing

### Query Performance Critique
The previous developer's query looks like this:
```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;
```
Is it accurate? No, it has a functional bug. It sorts by createdAt ASC (oldest first). A real notification feed should show the newest records first (DESC), otherwise students have to scroll past weeks of old alerts to find today's placement news.

Why is it slow? With 5,000,000 records, the database engine is forced to execute a Sequential Scan (Full Table Scan). It evaluates every single row on disk one-by-one, extracts the matches into a temporary memory pool, and spends massive CPU cycles sorting them before returning the result.

Optimization Fix:
We can resolve this completely by adding a targeted Composite Index covering the search predicates and the sort order:
```sql
CREATE INDEX idx_notifications_student_unread_date_desc 
ON notifications (student_id, is_read, created_at DESC);
```
Computational Cost Reduction: This transitions search operations from an expensive linear $O(N)$ lookup straight to an optimal $O(\log N)$ logarithmic index scan. The database reads the exact matches out of memory pre-sorted, dropping execution times down to a few milliseconds.

The "Index Every Column" Pitfall
Adding an index on every single column to be "safe" is an anti-pattern that slows everything down:
1.  Every time a new notification is inserted or an old one is marked as read, the database has to update and rewrite every single index tree on disk, killing write throughput.
2.  It causes massive storage bloat, often making the index files larger than the actual data tables.

#Specialized Analytical Query (Past 7-Day Placements)   
   To find all students who received a placement alert in the last week, we use an inner join:

   ```sql
    SELECT DISTINCT s.id, s.roll_number, s.email 
    FROM students s
    INNER JOIN notifications n ON s.id = n.student_id
    WHERE n.notification_type = 'Placement'
    AND n.created_at >= NOW() - INTERVAL '7 days';
  ```