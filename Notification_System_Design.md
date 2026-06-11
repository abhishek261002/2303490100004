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
```
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


  ---

# Stage 4: Cache Eviction & Database Offloading Strategies

Hitting the core database on every single page load or manual refresh creates an unnecessary bottleneck. We can protect PostgreSQL by deploying an in-memory caching tier like **Redis** using a **Cache-Aside Pattern**.

### 1. Cache-Aside Optimization Layout
- When a student opens the dashboard, the backend app checks Redis first using a key pattern like `user:1042:unread_notifications`.
- **Cache Hit:** If the data is found in Redis, it returns it instantly within sub-milliseconds without touching disk storage.
- **Cache Miss:** If it's not in Redis, the server runs the PostgreSQL query, sends the rows back to the user, and asynchronously populates Redis with a short TTL (Time-To-Live) window like 5 minutes.
- **Eviction/Invalidation Strategy:** Whenever a student clicks an alert and hits our `PATCH` endpoint to mark it as read, the backend must immediately delete or invalidate that student's specific Redis cache key so their next refresh pulls fresh database records.

### 2. Strategy Tradeoffs
* **Redis Caching:**
  - *Pros:* Drastically slashes database read metrics and handles high-frequency polling easily.
  - *Cons:* Adds architectural footprint and exposes a risk of serving stale alerts if the invalidation code fails during a state change.
* **HTTP Conditional Headers (`ETag` / `If-None-Match`):**
  - *Pros:* Keeps network data consumption minimal. If nothing changed, the server replies instantly with a lightweight `304 Not Modified` header instead of sending a massive JSON block.
  - *Cons:* The Express backend still has to run check logic or check the database to compute the validation string unless paired with memory tokens.

  ---

# Stage 5: Concurrent System Redesign for Bulk Operations

### Structural Failures in the Baseline Pseudocode
1. **Synchronous Thread Blocking:** The loop processes commands linearly. If the external Email Gateway API takes 200ms per call, processing 50,000 records sequentially will stall the system's event execution path for over **2.7 hours**!
2. **Cascading Failure & Data Loss:** If the `send_email` call encounters a transient gateway timeout on the 201st student, the entire thread panics or crashes out. There is no automated retry mechanism, meaning the remaining 49,800 students get completely skipped.

### Decoupling Architecture Redesign
The core database writes and external transmission steps **must be separated immediately**. We can implement an asynchronous architecture using a message queue system (e.g., RabbitMQ or BullMQ powered by Redis). 

The admin request will batch write rows to the database and immediately publish 50,000 tiny event payloads to the message queue, returning a rapid `202 Accepted` status back to the dashboard within milliseconds. Independent worker loops then pull jobs out of the queue and distribute emails asynchronously.

### Production-Grade Resilient Pseudocode

```python
# API Route Controller: Completes execution in a split-second
function notify_all(student_ids: array, message: string):
    log("backend", "info", "controller", "Mass broadcast request initialized by administrator.")
    
    # 1. Optimize data layer throughput via a single batch database insert
    batch_save_to_db(student_ids, message)
    
    # 2. Push independent tasks to the asynchronous task queue broker
    for student_id in student_ids:
        message_queue.publish({
            "student_id": student_id,
            "message": message,
            "current_retry": 0
        })
        
    log("backend", "info", "service", "Successfully offloaded 50,000 tasks to asynchronous queue handlers.")
    return HTTP_202_ACCEPTED

# Decoupled Asynchronous Queue Workers running in background threads
function process_queue_message(job_payload):
    try:
        # Process distributions independently
        send_email(job_payload.student_id, job_payload.message)
        push_to_app_sse_stream(job_payload.student_id, job_payload.message)
    except TransientNetworkException as error:
        log("backend", "warn", "cron_job", f"Distribution bottleneck on user: {job_payload.student_id}")
        
        # Resilient Retry Logic with Backoff
        if job_payload.current_retry < 3:
            job_payload.current_retry += 1
            # Re-queue job with a 30-second backoff delay
            message_queue.publish_with_delay(job_payload, delay_seconds=30)
        else:
            log("backend", "fatal", "cron_job", f"Exhausted email delivery channels for user: {job_payload.student_id}")



---

# Stage 6: Stream Sorting & Algorithm Maintenance

### 1. Algorithmic Approach
To calculate the true importance of an incoming notification without relying on a database, we assign a numerical weight value to each notification category type based on urgency: Placement (3), Result (2), and Event (1). We combine this category tier weight with the notification's date/time string converted into a Unix epoch millisecond value. This mathematical configuration ensures that category tier importance takes priority, while sorting items by recency within the same tier level.

### 2. Stream Maintenance Strategy
When handling a live stream of high-frequency notification entries on the client, running a full array sort on every single update will freeze the application thread. Instead of sorting a flat array, we can implement a **Min-Heap structure** restricted to a maximum size of `n` (10). For every incoming notification, we compute its priority score. If the heap is not full, we insert it. If it is full, we compare its score against the root element (the lowest score in our top 10). If the new item scores higher, we pop the root and insert the new item. This drops insertion costs to an optimal $O(\log n)$ calculation space, protecting system memory.