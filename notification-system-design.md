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
