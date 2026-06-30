import { getToken } from "../lib/auth";
import { Log } from "../lib/logger";

const BASE = "/eval-api/evaluation-service/notifications";

export async function fetchNotifications({ page = 1, limit = 8, notificationType } = {}) {
  Log("frontend", "info", "api", `Fetching notifications page=${page} limit=${limit} type=${notificationType ?? "all"}`);

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (notificationType && notificationType !== "All") {
    params.set("notification_type", notificationType);
  }

  const token = await getToken();

  const response = await fetch(`${BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    Log("frontend", "error", "api", `Failed to fetch notifications: ${response.status}`);
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  Log("frontend", "info", "api", `Received ${data.notifications?.length ?? 0} notifications`);
  return data.notifications ?? [];
}

export async function fetchAllNotifications() {
  Log("frontend", "info", "api", "Fetching all notifications for priority inbox");
  const token = await getToken();

  const response = await fetch(`${BASE}?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    Log("frontend", "error", "api", `Failed to fetch all notifications: ${response.status}`);
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.notifications ?? [];
}
