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

---

# Stage 4

## Eliminating Per-Page-Load DB Queries for Notifications

---

## The Problem

On every page load, the frontend calls `GET /api/notifications` for the authenticated student. With 50,000 students hitting this endpoint simultaneously, the database receives 50,000 read queries in a short window — many returning identical data to what was returned seconds ago. No data has changed, but the DB bears the full cost regardless. This is a polling-under-the-hood problem dressed as an API call.

---

## Strategy 1: Server-Side Caching with Redis

Cache each student's notification list in Redis immediately after the first DB fetch. Subsequent requests within the TTL are served entirely from memory — the database is never touched.

**Flow:**

```
Request arrives
    |
    +- Cache HIT  -> Return cached response (no DB query)
    |
    +- Cache MISS -> Query DB -> Store in Redis with TTL -> Return response
```

**Cache key structure:**
```
notifications:<studentID>:page:<page>:isRead:<filter>
```

**Invalidation on every write path:**
```
POST /api/notifications        -> DEL notifications:<studentID>:*
PATCH .../read                 -> DEL notifications:<studentID>:*
PATCH .../read-all             -> DEL notifications:<studentID>:*
DELETE /api/notifications/:id  -> DEL notifications:<studentID>:*
```

**Tradeoffs:**

| Benefit | Cost |
|---|---|
| Near-zero DB load on cache hits — O(1) memory lookup | Cache invalidation is the hard part — a missed invalidation serves stale data |
| Response time drops from 50–200ms (DB) to <1ms (Redis) | Memory cost — 50,000 students x average cached payload = significant RAM |
| Scales horizontally — all API instances share one Redis | TTL choice is a constant tradeoff: short TTL = more DB hits, long TTL = stale data |
| Unread count is already a separate Redis counter (Stage 2) | Every write path must be cache-aware — tight coupling between writes and cache |

**When this breaks down:** If invalidation logic is incomplete (e.g. a background job creates notifications without clearing cache), students see stale data until the TTL expires.

---

## Strategy 2: HTTP Caching with ETags

Push caching to the HTTP layer. The server computes a hash (ETag) of the response and sends it with the response. On subsequent requests, the client sends the ETag back. If nothing has changed, the server returns `304 Not Modified` with an empty body — zero data transferred, minimal processing.

**Flow:**

```
First request:
GET /api/notifications
<- 200 OK
   ETag: "a3f9c2d..."
   Cache-Control: no-cache
   [full response body]

Subsequent requests:
GET /api/notifications
   If-None-Match: "a3f9c2d..."
<- 304 Not Modified
   [empty body]
```

ETag is derived from a single cheap DB query — e.g. MAX(createdAt) or row count for the student — not a full fetch.

**Tradeoffs:**

| Benefit | Cost |
|---|---|
| Browser handles caching automatically — no extra infrastructure | Server still receives every request — connection overhead remains |
| Works across devices if ETag is stored server-side per student | ETag computation still requires a DB query — lightweight but not zero |
| No stale data risk — validation happens on every request | Does not help if the client disables HTTP caching |
| No additional services required | Consistent ETag generation must be maintained across all write paths |

**When this breaks down:** ETags reduce bandwidth and serialisation cost but do not reduce connection overhead. At 50,000 concurrent students, the server still handles 50,000 HTTP connections per page load.

---

## Strategy 3: Replace Polling with SSE (Already Designed in Stage 1)

The root cause is that the frontend fetches on every page load because it has no way to know if data changed. SSE solves this at the architecture level: the client fetches once on login, then receives push events. There is nothing to poll.

**Flow:**

```
Student logs in
    |
    +- GET /api/notifications          (fetch initial list — once)
    |
    +- GET /api/notifications/stream   (SSE connection — open for session)
            |
            +- Server pushes new notification  -> client appends to list
            +- Server pushes read confirmation -> client updates isRead flag
            +- Server pushes delete event      -> client removes item
```

The frontend never calls `GET /api/notifications` on page navigation again. State lives in memory, kept current by the stream.

**Tradeoffs:**

| Benefit | Cost |
|---|---|
| Eliminates per-page-load DB queries entirely — the problem is solved, not mitigated | 50,000 persistent TCP connections is a significant server resource demand |
| Data is always fresh — no TTL, no staleness, no invalidation logic | Every write must publish events (new notification, read, delete) |
| Reduces total HTTP requests from N per session to 1 per session | Load balancers must support long-lived HTTP connections — disable request timeouts |
| Pairs with Redis Pub/Sub (Stage 2) to work across multiple server instances | Mobile clients on poor networks drop connections frequently — reconnect must reconcile state |

**When this breaks down:** On reconnect the client must re-fetch the current list to catch events missed during disconnection. If reconnects are frequent, this can increase DB load compared to a simple poll.

---

## Strategy 4: Client-Side Stale-While-Revalidate

The frontend caches the notification list in memory (or localStorage). On page load, it renders cached data immediately and fires a background fetch. If the fetch returns new data, the UI updates silently. If not, the cache stays.

**Flow:**

```
Page load
    |
    +- Render cached notifications instantly (0ms perceived latency)
    |
    +- Background: GET /api/notifications
            |
            +- Response differs -> update UI
            +- Response same   -> discard
```

**Tradeoffs:**

| Benefit | Cost |
|---|---|
| Immediate UI render — zero perceived loading time for returning students | Background fetch still hits the DB — server load problem is not solved |
| No backend changes required — pure frontend implementation | Cache is per-device — no cross-device sync |
| Pairs well with ETags — background fetch uses If-None-Match, returns 304 if unchanged | State management complexity increases — UI must handle cache-to-fresh transitions |
| Eliminates loading spinners entirely for returning students | localStorage quotas may be exceeded for large notification histories |

**When this breaks down:** This improves perceived performance but does not reduce DB load at scale. Best used in combination with a server-side strategy, not as a standalone fix.

---

## Recommended Combined Approach

No single strategy is sufficient at scale. The right architecture layers them:

| Layer | Strategy | What It Solves |
|---|---|---|
| **Architecture** | SSE replaces page-load polling | Eliminates per-navigation DB queries entirely |
| **Server cache** | Redis caches initial notification fetch on login | First load hits Redis, not DB |
| **DB reads** | Route reads to PostgreSQL read replica | Isolates read load from write operations |
| **Client** | Stale-while-revalidate on SSE reconnect | Instant render after reconnection |
| **HTTP** | ETags on REST fallback endpoints | Reduces data transfer on non-SSE clients |

SSE handles the ongoing session. Redis handles the cold-start load. Read replicas handle DB-level scale. ETags and client caching handle edge cases. Together, these reduce the per-page-load DB query problem to effectively zero under normal operating conditions.

---

# Stage 5

## Reliable Bulk Notification - Redesigning notify_all

---

## 1. The Given Implementation

```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)   # calls Email API
        save_to_db(student_id, message)   # DB insert
        push_to_app(student_id, message)  # SSE push
```

---

## 2. Shortcomings

### Sequential synchronous processing at 50,000 scale

The loop processes one student at a time. Each iteration makes three network calls in sequence, an external email API, a DB write, and an SSE push. If each operation takes 100ms, 50,000 students x 300ms per student = 15,000 seconds = over 4 hours. This is not a notification system. It is a batch job that will never complete in any acceptable window.

### No partial failure handling

When `send_email` fails for student 5000, the function either crashes (students 5001–50000 get nothing) or continues silently (no record of who failed). There is no retry mechanism, no dead-letter tracking, and no way to resume from the point of failure. The 200 failed students are simply lost unless someone manually investigates logs.

### 50,000 individual DB inserts

Each `save_to_db` call is a separate round-trip to the database. 50,000 sequential single-row inserts is orders of magnitude slower than a single bulk insert. It also holds connections open for the entire duration of the loop, starving other requests of DB connections.

### Tight coupling between unrelated operations

Email delivery, DB persistence, and SSE push have completely different failure modes and latency profiles. Coupling them in a single synchronous loop means a slow email API (which is common) blocks DB writes and SSE delivery for every single student. An unreliable external service takes down the entire pipeline.

### No idempotency

If the function crashes at student 25,000 and is re-run, the first 25,000 students receive duplicate emails. There is no mechanism to detect that a notification was already sent to a specific student.

---

## 3. The 200 Failed Emails. What Now?

With the current implementation, the situation is:

- Some students received the email, some did not. The exact split is unknown unless detailed per-student logs exist.
- The DB may or may not have records for the failed students — it depends on whether `save_to_db` ran before or after `send_email` in the sequence. In the given code, `send_email` runs first, so a failed email means `save_to_db` never ran either. Those students have no in-app notification and no email.
- Re-running `notify_all` on all 50,000 students sends duplicate emails to the 49,800 who already received theirs.
- Re-running only on the 200 requires knowing exactly who they are, which requires complete logging that the current implementation does not guarantee.

This is a data integrity and operational nightmare. The only safe recovery is a manual intervention — extract the list of failed student IDs from logs, verify no DB record exists for them, and re-send only to those students. Every step of this recovery is manual, error-prone, and does not scale.

---

## 4. Should DB Save and Email Send Happen Together?

**No. They must be decoupled.**

DB persistence and email delivery serve fundamentally different purposes:

| Concern | DB Save | Email Send |
|---|---|---|
| Purpose | Source of truth for in-app notification | External side effect for student awareness |
| Latency | Milliseconds — local network | Hundreds of ms to seconds — external API |
| Reliability | PostgreSQL is under our control | External email provider can be down, throttle, or reject |
| Failure consequence | Notification does not exist anywhere | Student did not receive email, but in-app notification still exists |
| Retry safety | Idempotent with unique constraint | Must be idempotent — retrying a failed email must not duplicate |

If they are coupled and the email API fails, the DB write is skipped. The student has no in-app notification and no email. The notification is lost entirely.

If they are decoupled — DB write always happens first, email is a downstream async job — then a failed email means the student at minimum has the in-app notification. The email can be retried without any risk to data integrity.

**Save to DB first, always. Email is a side effect that is delivered eventually.**

---

## 5. Redesigned Implementation

### Core Principles

1. **Bulk DB insert first** — all 50,000 notifications are persisted in a single transaction before any email or push is attempted. The DB is the source of truth.
2. **Message queue for decoupling** — individual email jobs are enqueued for async processing. Workers consume jobs independently.
3. **Automatic retry with backoff** — failed jobs are retried by the queue. After max retries, jobs move to a dead-letter queue for inspection.
4. **Idempotency** — each job carries a unique notification ID. Re-processing a job that already succeeded is a no-op.
5. **SSE push is fire-and-forget** — it is not retried. The student will see the notification in-app on next fetch if the SSE push was missed.

### Revised Pseudocode

```
function notify_all(student_ids: array, message: string):
    notification_records = []
    for student_id in student_ids:
        notification_records.append({
            notificationID:   generate_uuid(),
            studentID:        student_id,
            title:            "Placement Notification",
            message:          message,
            notificationType: "Placement",
            isRead:           false,
            createdAt:        now()
        })

    bulk_insert_to_db(notification_records)

    for record in notification_records:
        enqueue_job("email_queue", {
            notificationID: record.notificationID,
            studentID:      record.studentID,
            message:        record.message
        })
        push_to_app(record.studentID, record)


function email_worker(job):
    if already_sent(job.notificationID):
        return

    success = send_email(job.studentID, job.message)

    if success:
        mark_email_sent(job.notificationID)
    else:
        raise RetryableError("email delivery failed")


function bulk_insert_to_db(records: array):
    INSERT INTO notifications
        (notificationID, studentID, title, message, notificationType, isRead, createdAt)
    VALUES
        (record_1), (record_2), ..., (record_50000)
    ON CONFLICT (notificationID) DO NOTHING


function already_sent(notificationID: string) -> bool:
    return EXISTS (
        SELECT 1 FROM email_delivery_log
        WHERE notificationID = notificationID
    )


function mark_email_sent(notificationID: string):
    INSERT INTO email_delivery_log (notificationID, sentAt)
    VALUES (notificationID, now())
```

### Queue Behaviour

```
notify_all() called
    |
    +-- bulk_insert_to_db()          (1 DB round-trip for 50,000 rows)
    |
    +-- enqueue_job() x 50,000      (jobs pushed to email_queue)
    |
    +-- push_to_app() x 50,000      (SSE events fired, fire-and-forget)
    |
    +-- Returns to HR immediately   (function completes in seconds, not hours)

email_queue (processed by N parallel workers):
    |
    +-- email_worker(job)
            |
            +-- Check already_sent()  -> if yes, skip (idempotent)
            |
            +-- send_email()
                    |
                    +-- Success -> mark_email_sent()
                    |
                    +-- Failure -> queue retries with exponential backoff
                                    after max retries -> dead-letter queue
```

### Additional Table: email_delivery_log

```sql
CREATE TABLE email_delivery_log (
    notificationID  UUID PRIMARY KEY REFERENCES notifications(notificationID),
    sentAt          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

This table guarantees exactly-once email delivery. Before sending, the worker checks for an existing row. After sending successfully, it inserts a row. If the worker crashes between send and insert, the next retry will re-send — this is the one acceptable edge case, and most email providers handle deduplication at their end as well.

---

## 6. What Changed and Why

| Original | Redesigned | Reason |
|---|---|---|
| 50,000 sequential iterations | 1 bulk DB insert + queue enqueue | Reduces DB round-trips from 50,000 to 1 |
| Email blocks DB write | DB write always happens first | Decouples reliability of in-app from email delivery |
| No retry on failure | Queue handles retry with backoff | 200 failed emails are retried automatically |
| No idempotency | notificationID as idempotency key | Safe to retry any job without duplicate delivery |
| Function runs for hours | Function returns in seconds | Workers process the queue asynchronously in parallel |
| Silent partial failure | Dead-letter queue captures permanent failures | Failures are visible and actionable, not silently lost |

---

# Stage 6

## Priority Inbox - Top N Notifications by Weight and Recency

---

## Approach

The priority inbox must rank notifications by two factors simultaneously:

- **Type weight**: Placement (highest) > Result > Event (lowest)
- **Recency**: Newer notifications rank higher within the same type

A single composite score combines both, so a very recent Event can outrank a very old Placement. The score formula is:

```
finalScore = 0.6 * typeScore + 0.4 * recencyScore
```

Where:
- `typeScore` is normalised: Placement = 1.0, Result = 0.667, Event = 0.333
- `recencyScore` is normalised to [0, 1] across the current notification set — 1 = newest, 0 = oldest

With these weights, a recent Event (recencyScore = 1.0) scores `0.6 * 0.333 + 0.4 * 1.0 = 0.6`, which equals a very old Placement (recencyScore = 0.0) scoring `0.6 * 1.0 + 0.4 * 0.0 = 0.6`. This is the intended behaviour: recency can compensate for lower type weight, but not completely override it.

---

## Data Structure: Min-Heap of Size N

A min-heap of fixed size N is the correct data structure for maintaining the top N notifications efficiently.

**Why a min-heap and not a sorted array:**

| Operation | Sorted Array | Min-Heap (size N) |
|---|---|---|
| Insert one notification | O(n) — find position and shift | O(log N) — push and bubble up |
| Find top N | O(1) — already sorted | O(N log N) — heap to sorted array |
| Memory | O(all notifications) | O(N) — only top N stored |

The heap always holds exactly N elements. The root is always the lowest-scoring item in the current top N.

**Insertion logic for each new notification:**
```
score = computeScore(notification)

if heap.size < N:
    heap.push(notification)
else if score > heap.peek().score:
    heap.pop()           // remove the weakest in the current top N
    heap.push(notification)  // insert the new stronger one
else:
    discard              // not in top N
```

This is O(log N) per insertion, regardless of total notification volume. As new notifications stream in continuously, the heap self-maintains — no re-sorting of the full dataset required.

---

## Handling Continuously Arriving Notifications

New notifications shift the recency distribution, which means scores of existing notifications change relative to new ones. Two strategies:

**Strategy A — Periodic full recompute (used in this implementation):**
On a fixed interval (e.g., every 30 seconds), re-fetch all notifications, recompute scores with the updated min/max timestamps, and rebuild the heap from scratch. Simple and correct. Acceptable for a polling-based fetch.

**Strategy B — Incremental update via SSE:**
When a new notification arrives over the SSE stream (designed in Stage 1), compute its score against the current known min/max timestamps, then run the heap insertion logic. The heap updates in O(log N). If the new notification redefines `maxTs` (it is the newest), scores of all existing items decrease slightly — but the relative ranking within the heap remains stable enough that a full rebuild is only needed infrequently (e.g., when score variance exceeds a threshold).

---

## Code

Implementation is in [`stage-6/priorityInbox.js`](stage-6/priorityInbox.js).

**Key functions:**

- `computeScore(notification, minTs, maxTs)` — returns the composite priority score
- `buildTopNHeap(notifications, n, minTs, maxTs)` — processes all fetched notifications through the heap in O(n log N)
- `ingestNewNotification(heap, notification, n, minTs, maxTs)` — processes a single incoming notification in O(log N)
- `fetchNotifications()` — fetches from the evaluation API with Bearer auth
- `main()` — orchestrates fetch, scoring, output, and streaming demo

---

## Output Screenshots

Screenshots of the program output are included in the `stage-6/` directory of this repository.
