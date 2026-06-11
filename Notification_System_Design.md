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
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhYmhpc2hla3IyNjEwMDJAZ21haWwuY29tIiwiZXhwIjoxNzgxMTYyNjY0LCJpYXQiOjE3ODExNjE3NjQsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI0OWE5OWU3Zi1iZmJjLTRkNzctOTlhNy0xM2ViYWFiMTBlOWMiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJhYmhpc2hlayByYWpwdXQiLCJzdWIiOiI3NjQ1ZGQ2Ni05YjFlLTQyZTctOWM2YS00Y2I4NDFlMTNiZWYifSwiZW1haWwiOiJhYmhpc2hla3IyNjEwMDJAZ21haWwuY29tIiwibmFtZSI6ImFiaGlzaGVrIHJhanB1dCIsInJvbGxObyI6IjIzMDM0OTAxMDAwMDQiLCJhY2Nlc3NDb2RlIjoiQkFWRFNoIiwiY2xpZW50SUQiOiI3NjQ1ZGQ2Ni05YjFlLTQyZTctOWM2YS00Y2I4NDFlMTNiZWYiLCJjbGllbnRTZWNyZXQiOiJQdUt4WW5IYWVoS0hjcGJ0In0.cx-IRIpXj-7Y5hc-GMRAtEqtE5C_LSiOTfC1SpYUwd8
  Accept: application/json