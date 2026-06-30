# Stage 1

## Notification Platform — REST API Design & Contract

---

## 1. Core Actions Identified

A notification platform for logged-in users must support the following core actions:

| # | Action | Description |
|---|---|---|
| 1 | **Create Notification** | Server/admin triggers a notification for a user |
| 2 | **Fetch All Notifications** | User retrieves their full notification list (paginated) |
| 3 | **Fetch Single Notification** | User retrieves details of one notification by ID |
| 4 | **Mark as Read** | User marks a single notification as read |
| 5 | **Mark All as Read** | User marks all their notifications as read |
| 6 | **Delete a Notification** | User deletes a single notification |
| 7 | **Get Unread Count** | Returns the count of unread notifications for a user |
| 8 | **Real-Time Delivery** | Push new notifications to the client without polling |

---

## 2. Authentication

All endpoints are **protected**. Every request must include a valid Bearer token in the `Authorization` header.

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

The token encodes the authenticated user's identity. The backend extracts the `userID` from the token — it is **never passed as a request body field**.

---

## 3. REST API Endpoints

---

### 3.1 Create Notification

**`POST /api/notifications`**

Creates a new notification targeted at a specific user. Typically called by the server or an admin service.

#### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "recipientUserID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "New Message Received",
  "message": "You have a new message from Rahul.",
  "type": "info",
  "link": "/messages/123"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `recipientUserID` | `string (uuid)` | ✅ | The user who receives this notification |
| `title` | `string` | ✅ | Short heading of the notification |
| `message` | `string` | ✅ | Full notification body text |
| `type` | `string` | ✅ | One of: `"info"`, `"success"`, `"warning"`, `"error"` |
| `link` | `string` | ❌ | Optional deep-link URL for the notification action |

#### Response — `201 Created`
```json
{
  "notificationID": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "recipientUserID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "New Message Received",
  "message": "You have a new message from Rahul.",
  "type": "info",
  "link": "/messages/123",
  "isRead": false,
  "createdAt": "2024-06-30T09:00:00Z"
}
```

#### Error Responses
| Status | Reason |
|---|---|
| `400 Bad Request` | Missing required fields or invalid `type` value |
| `401 Unauthorized` | Missing or invalid Bearer token |

---

### 3.2 Fetch All Notifications (Paginated)

**`GET /api/notifications`**

Returns all notifications for the authenticated user, sorted by `createdAt` descending (newest first). Supports pagination and filtering by read status.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Query Parameters
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | `integer` | `1` | Page number |
| `limit` | `integer` | `20` | Items per page (max 100) |
| `isRead` | `boolean` | _(none)_ | Filter by read status (`true` / `false`) |

#### Example Request
```
GET /api/notifications?page=1&limit=10&isRead=false
```

#### Response — `200 OK`
```json
{
  "page": 1,
  "limit": 10,
  "totalCount": 42,
  "unreadCount": 5,
  "notifications": [
    {
      "notificationID": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
      "title": "New Message Received",
      "message": "You have a new message from Rahul.",
      "type": "info",
      "link": "/messages/123",
      "isRead": false,
      "createdAt": "2024-06-30T09:00:00Z"
    },
    {
      "notificationID": "a1b2c3d4-0000-1111-2222-333344445555",
      "title": "Your order was shipped",
      "message": "Order #4521 has been dispatched.",
      "type": "success",
      "link": "/orders/4521",
      "isRead": false,
      "createdAt": "2024-06-29T15:30:00Z"
    }
  ]
}
```

#### Error Responses
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |

---

### 3.3 Fetch Single Notification

**`GET /api/notifications/:notificationID`**

Retrieves details of one specific notification by its ID. Users can only fetch their own notifications.

#### Headers
```
Authorization: Bearer <access_token>
```

#### URL Parameter
| Param | Type | Description |
|---|---|---|
| `notificationID` | `string (uuid)` | ID of the notification to fetch |

#### Response — `200 OK`
```json
{
  "notificationID": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "recipientUserID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "New Message Received",
  "message": "You have a new message from Rahul.",
  "type": "info",
  "link": "/messages/123",
  "isRead": false,
  "createdAt": "2024-06-30T09:00:00Z"
}
```

#### Error Responses
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `403 Forbidden` | Notification belongs to a different user |
| `404 Not Found` | No notification with the given ID |

---

### 3.4 Mark a Notification as Read

**`PATCH /api/notifications/:notificationID/read`**

Marks a single notification as read. Idempotent — marking an already-read notification returns `200` without error.

#### Headers
```
Authorization: Bearer <access_token>
```

#### URL Parameter
| Param | Type | Description |
|---|---|---|
| `notificationID` | `string (uuid)` | ID of the notification to mark as read |

#### Request Body
_None required._

#### Response — `200 OK`
```json
{
  "notificationID": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "isRead": true,
  "message": "Notification marked as read"
}
```

#### Error Responses
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `403 Forbidden` | Notification belongs to a different user |
| `404 Not Found` | No notification with the given ID |

---

### 3.5 Mark All Notifications as Read

**`PATCH /api/notifications/read-all`**

Marks every unread notification for the authenticated user as read in one operation.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Request Body
_None required._

#### Response — `200 OK`
```json
{
  "updatedCount": 5,
  "message": "All notifications marked as read"
}
```

#### Error Responses
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |

---

### 3.6 Delete a Notification

**`DELETE /api/notifications/:notificationID`**

Permanently deletes a single notification. Users can only delete their own notifications.

#### Headers
```
Authorization: Bearer <access_token>
```

#### URL Parameter
| Param | Type | Description |
|---|---|---|
| `notificationID` | `string (uuid)` | ID of the notification to delete |

#### Response — `200 OK`
```json
{
  "notificationID": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "message": "Notification deleted successfully"
}
```

#### Error Responses
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `403 Forbidden` | Notification belongs to a different user |
| `404 Not Found` | No notification with the given ID |

---

### 3.7 Get Unread Notification Count

**`GET /api/notifications/unread-count`**

Returns the total count of unread notifications for the authenticated user. Lightweight endpoint designed to be polled by the frontend badge/indicator.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response — `200 OK`
```json
{
  "unreadCount": 7
}
```

#### Error Responses
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |

---

## 4. Real-Time Notification Mechanism

### Approach: Server-Sent Events (SSE)

SSE is chosen over WebSockets because:
- Notifications are **unidirectional** — server pushes to client, client does not send messages back.
- SSE works over standard **HTTP/HTTPS** with no protocol upgrade complexity.
- Native browser support via `EventSource` API with **automatic reconnection**.
- Simpler to implement and scale compared to WebSockets for this use case.

---

### 4.1 SSE Connection Endpoint

**`GET /api/notifications/stream`**

The frontend opens a persistent SSE connection on login. The server keeps this connection alive and pushes events as they occur.

#### Headers (Request)
```
Authorization: Bearer <access_token>
Accept: text/event-stream
Cache-Control: no-cache
```

#### Response Headers (Server)
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

---

### 4.2 Event Format

Every real-time push follows the SSE event format:

```
id: f7e6d5c4-b3a2-1098-fedc-ba9876543210
event: notification
data: {"notificationID":"f7e6d5c4-b3a2-1098-fedc-ba9876543210","title":"New Message Received","message":"You have a new message from Rahul.","type":"info","link":"/messages/123","isRead":false,"createdAt":"2024-06-30T09:00:00Z"}

```

| SSE Field | Description |
|---|---|
| `id` | The `notificationID` — allows the browser to resume from the last event on reconnect |
| `event` | Always `"notification"` for new notifications |
| `data` | JSON-stringified notification object |

---

### 4.3 Keepalive Ping

The server sends a comment ping every **30 seconds** to prevent the connection from being dropped by proxies or firewalls:

```
: ping

```

---

### 4.4 Frontend Integration (Client-Side)

```javascript
const eventSource = new EventSource("/api/notifications/stream", {
  headers: { Authorization: `Bearer ${accessToken}` }
});

eventSource.addEventListener("notification", (event) => {
  const notification = JSON.parse(event.data);
  // Display toast / update notification badge
  showToast(notification);
  incrementUnreadBadge();
});

eventSource.onerror = () => {
  // EventSource auto-reconnects — no manual handling needed
  console.warn("SSE connection lost, reconnecting...");
};
```

---

## 5. Notification Data Model

```json
{
  "notificationID": "string (uuid)",
  "recipientUserID": "string (uuid)",
  "title": "string",
  "message": "string",
  "type": "info | success | warning | error",
  "link": "string | null",
  "isRead": "boolean",
  "createdAt": "ISO 8601 datetime string"
}
```

---

## 6. Endpoint Summary

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/notifications` | Create a notification | ✅ |
| `GET` | `/api/notifications` | Get all notifications (paginated) | ✅ |
| `GET` | `/api/notifications/unread-count` | Get unread count | ✅ |
| `GET` | `/api/notifications/:notificationID` | Get single notification | ✅ |
| `PATCH` | `/api/notifications/:notificationID/read` | Mark one as read | ✅ |
| `PATCH` | `/api/notifications/read-all` | Mark all as read | ✅ |
| `DELETE` | `/api/notifications/:notificationID` | Delete a notification | ✅ |
| `GET` | `/api/notifications/stream` | SSE — real-time push stream | ✅ |

---

# Stage 2

## Notification Platform — Persistent Storage, Schema & Scaling

---

## 1. Database Choice: PostgreSQL

**PostgreSQL** is the chosen database for this notification platform.

### Reasoning

Notifications are structured, relational data. Each notification belongs to exactly one student, has a fixed set of fields, and its read/unread state must be consistent — if a student marks something as read, that change must never be lost or partially applied. PostgreSQL gives us:

| Factor | Why PostgreSQL Wins |
|---|---|
| **ACID compliance** | Read/unread state changes are transactional — no partial updates |
| **Structured schema** | Notifications have a fixed, well-known shape — a relational model fits perfectly |
| **Indexing** | Composite indexes on `(studentID, isRead, createdAt)` make the most frequent queries fast |
| **Aggregations** | `COUNT` queries for unread badges are efficient with proper indexing |
| **Scalability path** | Read replicas, partitioning, and connection pooling (via PgBouncer) are mature and well-documented |
| **JSONB support** | Optional metadata field can store arbitrary JSON without sacrificing query performance |

A document database like MongoDB would introduce eventual consistency risks on the `isRead` field and lacks the native aggregation performance that PostgreSQL's query planner provides for this workload.

---

## 2. Database Schema

### Table: `students`

This table is owned by the authentication service. Defined here for reference only, as `notifications` holds a foreign key to it.

```sql
CREATE TABLE students (
    studentID    SERIAL PRIMARY KEY,
    email        VARCHAR(255) NOT NULL UNIQUE,
    name         VARCHAR(255) NOT NULL,
    createdAt    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### Table: `notifications`

```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE notifications (
    notificationID    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studentID         INT NOT NULL REFERENCES students(studentID) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    message           TEXT NOT NULL,
    notificationType  notification_type NOT NULL,
    link              TEXT,
    isRead            BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_notifications_student_created
    ON notifications (studentID, createdAt DESC);

CREATE INDEX idx_notifications_student_unread
    ON notifications (studentID, isRead)
    WHERE isRead = FALSE;
```

**Why these indexes:**
- `idx_notifications_student_created` — covers the primary fetch-all query which always filters by student and sorts by date.
- `idx_notifications_student_unread` — a partial index (only unread rows). Keeps the index small and makes unread count queries and unread-filtered fetches significantly faster as the table grows.

---

## 3. Scaling Problems & Solutions

### Problem 1: Table Growth

A platform with 50,000 students generating 10 notifications/day accumulates **182 million rows per year**. Sequential scans become unusable. Even indexed queries degrade as the index itself grows to hundreds of millions of entries.

**Solution: Time-based Table Partitioning**

Partition `notifications` by `createdAt` using PostgreSQL range partitioning. Each partition covers one month of data.

```sql
CREATE TABLE notifications (
    notificationID    UUID NOT NULL DEFAULT gen_random_uuid(),
    studentID         INT NOT NULL,
    title             VARCHAR(255) NOT NULL,
    message           TEXT NOT NULL,
    notificationType  notification_type NOT NULL,
    link              TEXT,
    isRead            BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt         TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (createdAt);

CREATE TABLE notifications_2024_06
    PARTITION OF notifications
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE notifications_2024_07
    PARTITION OF notifications
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
```

Old partitions (e.g., 6+ months old) can be detached and archived to cold storage, keeping the active table small. This is operationally far simpler and faster than row-by-row deletion.

---

### Problem 2: Slow Pagination at High Offsets

`OFFSET 10000 LIMIT 20` forces PostgreSQL to scan and discard 10,000 rows before returning 20. At scale this becomes a full index scan with O(n) cost.

**Solution: Cursor-based Pagination**

Instead of `OFFSET`, use the `createdAt` and `notificationID` of the last seen row as a cursor.

```sql
SELECT *
FROM notifications
WHERE studentID = $1
  AND (createdAt, notificationID) < ($2, $3)
ORDER BY createdAt DESC, notificationID DESC
LIMIT $4;
```

The client receives the `createdAt` and `notificationID` of the last item in the response and sends them as the cursor for the next page. This is O(log n) regardless of page depth.

---

### Problem 3: SSE Does Not Scale Across Multiple Server Instances

SSE maintains a persistent HTTP connection per student. If the backend runs across multiple instances (horizontal scaling), a notification created on instance A has no way to reach a student connected to instance B.

**Solution: Redis Pub/Sub as the Message Bus**

Every server instance subscribes to a Redis channel. When a notification is created, the backend publishes it to Redis. All instances receive it and push it to any connected clients they hold.

```
[API Instance A] ──creates notification──▶ [PostgreSQL]
                                        │
                                        └──▶ [Redis PUBLISH student:<studentID>]
                                                    │
                              ┌─────────────────────┘
                              │
                   [Redis SUBSCRIBE on all instances]
                              │
              [Instance B holds SSE connection for student]
                              │
                         ──push event──▶ [Client Browser]
```

Each instance subscribes to `student:<studentID>` channels for students currently connected to it. This decouples notification creation from delivery and works across any number of instances.

---

### Problem 4: Unread Count Queries Under Load

`SELECT COUNT(*) WHERE isRead = FALSE` is called on every page load to render the notification badge. At high traffic this hammers the DB even with the partial index.

**Solution: Maintain a Counter in Redis**

Keep a Redis counter per student: `unread_count:<studentID>`. Increment on notification creation, decrement on mark-as-read. The HTTP endpoint for unread count reads from Redis in O(1) with no DB hit. Periodically reconcile with the DB as a background job to handle any drift.

---

## 4. SQL Queries for Stage 1 APIs

---

### POST `/api/notifications` — Create Notification

```sql
INSERT INTO notifications (
    studentID,
    title,
    message,
    notificationType,
    link
)
VALUES ($1, $2, $3, $4, $5)
RETURNING
    notificationID,
    studentID,
    title,
    message,
    notificationType,
    link,
    isRead,
    createdAt;
```

---

### GET `/api/notifications` — Fetch All (Paginated, cursor-based)

```sql
SELECT
    notificationID,
    title,
    message,
    notificationType,
    link,
    isRead,
    createdAt
FROM notifications
WHERE studentID = $1
  AND ($2::boolean IS NULL OR isRead = $2)
  AND (
      $3::timestamptz IS NULL
      OR (createdAt, notificationID) < ($3, $4)
  )
ORDER BY createdAt DESC, notificationID DESC
LIMIT $5;
```

Parameters: `$1` = studentID, `$2` = isRead filter (nullable), `$3` = cursor timestamp, `$4` = cursor notificationID, `$5` = limit.

---

### GET `/api/notifications/unread-count` — Unread Count

```sql
SELECT COUNT(*) AS unreadCount
FROM notifications
WHERE studentID = $1
  AND isRead = FALSE;
```

---

### GET `/api/notifications/:notificationID` — Fetch Single

```sql
SELECT
    notificationID,
    studentID,
    title,
    message,
    notificationType,
    link,
    isRead,
    createdAt
FROM notifications
WHERE notificationID = $1;
```

Ownership check (`studentID = authenticated studentID`) is enforced in application code after fetching.

---

### PATCH `/api/notifications/:notificationID/read` — Mark One as Read

```sql
UPDATE notifications
SET isRead = TRUE
WHERE notificationID = $1
  AND studentID = $2
RETURNING notificationID, isRead;
```

`$2` = authenticated student's ID. If no row is returned, the notification either does not exist or belongs to a different student — the application layer returns `404` or `403` accordingly.

---

### PATCH `/api/notifications/read-all` — Mark All as Read

```sql
UPDATE notifications
SET isRead = TRUE
WHERE studentID = $1
  AND isRead = FALSE;
```

Returns the affected row count to report how many notifications were updated.

---

### DELETE `/api/notifications/:notificationID` — Delete Notification

```sql
DELETE FROM notifications
WHERE notificationID = $1
  AND studentID = $2
RETURNING notificationID;
```

Same ownership enforcement pattern as mark-as-read. If no row is returned, the application responds with `404` or `403`.

---

# Stage 3

## Query Analysis, Indexing Strategy & Optimised Queries

---

## 1. The Given Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

---

## 2. Is This Query Accurate?

**Functionally? Yes. Structurally? No.**

The query returns the correct data: all unread notifications for student 1042, ordered oldest first. The logic is not wrong. However it has two structural problems:

**`SELECT *` is always wrong in production code.**
It fetches every column — including the `message` TEXT field which can be kilobytes per row. At 5,000,000 rows, even a filtered result of 200 unread notifications per student transfers far more data than necessary. Every column also breaks application code silently if the schema changes. Always select only the columns the consumer actually needs.

**`ORDER BY createdAt ASC` is debatable for an inbox.**
Newest-first (`DESC`) is the standard pattern for a notification inbox since users care about recent activity. Oldest-first is only correct if the intent is "read in the order they arrived". The query as written is accurate only if that intent was explicitly decided.

---

## 3. Why Is This Query Slow?

At 5,000,000 rows, this query triggers a **full sequential scan** of the entire `notifications` table.

PostgreSQL evaluates every row in the table to check whether it satisfies `studentID = 1042 AND isRead = false`. It cannot skip irrelevant rows because there is no index guiding it to the right rows. After scanning all 5,000,000 rows, it sorts the filtered result by `createdAt`.

The breakdown of cost:

| Phase | Operation | Cost |
|---|---|---|
| Filter | Full sequential scan — 5,000,000 rows read | O(n) |
| Sort | Sort filtered result by `createdAt` | O(k log k) where k = unread count |
| Transfer | `SELECT *` fetches all columns per row | Unnecessarily high I/O |

With 50,000 students, each averaging ~100 rows in the result, the DB is doing 5,000,000 row reads to return 100 rows. This is the worst possible access pattern.

---

## 4. What to Change & Computation Cost After the Fix

**Fix 1: Add a composite index**

```sql
CREATE INDEX idx_notifications_student_isread_created
    ON notifications (studentID, isRead, createdAt ASC);
```

Or use the partial index from Stage 2 (only indexes unread rows, making it smaller and faster):

```sql
CREATE INDEX idx_notifications_student_unread_created
    ON notifications (studentID, createdAt ASC)
    WHERE isRead = FALSE;
```

**Fix 2: Replace `SELECT *` with explicit columns**

```sql
SELECT
    notificationID,
    title,
    message,
    notificationType,
    link,
    createdAt
FROM notifications
WHERE studentID = 1042
  AND isRead = FALSE
ORDER BY createdAt ASC;
```

**Computation cost after fix:**

| Phase | Operation | Cost |
|---|---|---|
| Lookup | B-tree index seek on `(studentID, isRead)` | O(log n) |
| Scan | Index range scan — only matching rows fetched | O(k) where k = unread count |
| Sort | Already in `createdAt ASC` order from index | O(1) — no sort step needed |

The query goes from scanning 5,000,000 rows to reading only the ~100 rows that actually match. On a table of this size, this is the difference between a 2–5 second query and a sub-millisecond one.

---

## 5. Is Adding Indexes on Every Column a Good Idea?

**No. This is actively harmful advice.**

Here is why:

### Every index has a write cost

An index is not free. PostgreSQL maintains a separate B-tree structure for every index on a table. Every `INSERT`, `UPDATE`, and `DELETE` must update **every index** on the table. At 5,000,000 rows with continuous notification writes (new notifications created for 50,000 students), indexing every column multiplies the write overhead by the number of indexes. What started as a read performance problem becomes a write performance problem.

### Indexes consume significant disk space

Each index on a 5,000,000-row table can consume as much disk as the table itself. Indexing 8 columns means up to 8× the storage of the raw data — for indexes the query planner will never use.

### The query planner uses at most one or two indexes per query

PostgreSQL's query planner selects the most selective index for a given query. Having 8 indexes does not mean 8× the performance — it means 8× the maintenance cost for roughly the same query speed.

### Low-cardinality columns are especially wasteful

A column like `isRead` has only two distinct values (`TRUE` / `FALSE`). A standalone index on `isRead` is nearly useless — it narrows the result to 50% of all rows, which is worse than a sequential scan at that selectivity. The query planner will ignore it.

**The correct approach:** index only on columns used in `WHERE` clauses, `JOIN` conditions, and `ORDER BY` expressions of actual production queries. Composite and partial indexes are almost always better than single-column indexes on high-volume tables.

---

## 6. Query: Students Who Received a Placement Notification in the Last 7 Days

```sql
SELECT DISTINCT
    s.studentID,
    s.name,
    s.email
FROM notifications n
JOIN students s ON n.studentID = s.studentID
WHERE n.notificationType = 'Placement'
  AND n.createdAt >= NOW() - INTERVAL '7 days';
```

**What this does:**
- Filters the `notifications` table to only `Placement` type notifications created in the last 7 days
- Joins to `students` to return identifying information about each student
- `DISTINCT` ensures a student who received multiple placement notifications in the window appears only once

**Index that makes this fast:**

```sql
CREATE INDEX idx_notifications_type_created
    ON notifications (notificationType, createdAt DESC);
```

With this index, PostgreSQL performs a narrow index range scan on `notificationType = 'Placement'` and `createdAt >= NOW() - INTERVAL '7 days'` instead of scanning all 5,000,000 rows. The join to `students` then operates only on the small filtered set.
