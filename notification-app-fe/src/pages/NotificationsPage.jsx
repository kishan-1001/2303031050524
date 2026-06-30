import { useState, useCallback } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { Log } from "../lib/logger";
import { useEffect } from "react";

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [readCount, setReadCount] = useState(0);

  const { notifications, page, hasNextPage, loading, error, goToPage } = useNotifications(
    filter === "All" ? null : filter
  );

  useEffect(() => {
    Log("frontend", "info", "page", "NotificationsPage mounted");
  }, []);

  const unreadCount = notifications.filter((n) => {
    try {
      const ids = new Set(JSON.parse(localStorage.getItem("read_notification_ids") ?? "[]"));
      return !ids.has(n.ID);
    } catch {
      return true;
    }
  }).length;

  const handleFilterChange = useCallback((newFilter) => {
    Log("frontend", "info", "page", `NotificationsPage filter changed to ${newFilter}`);
    setFilter(newFilter);
  }, []);

  const handleRead = useCallback(() => {
    setReadCount((c) => c + 1);
  }, []);

  const handlePrev = () => goToPage(page - 1);
  const handleNext = () => goToPage(page + 1);

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 28 }} />
        </Badge>
        <Typography variant="h5" fontWeight={700}>
          All Notifications
        </Typography>
        {unreadCount > 0 && (
          <Typography variant="caption" color="text.secondary">
            {unreadCount} unread
          </Typography>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">Failed to load notifications: {error}</Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No notifications found.</Alert>
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={1.5}>
          {notifications.map((n) => (
            <NotificationCard key={n.ID} notification={n} onRead={handleRead} />
          ))}
        </Stack>
      )}

      {!loading && !error && (
        <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={4}>
          <Button
            startIcon={<ChevronLeftIcon />}
            disabled={page <= 1}
            onClick={handlePrev}
            variant="outlined"
            size="small"
          >
            Prev
          </Button>
          <Typography variant="body2" color="text.secondary">
            Page {page}
          </Typography>
          <Button
            endIcon={<ChevronRightIcon />}
            disabled={!hasNextPage}
            onClick={handleNext}
            variant="outlined"
            size="small"
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}
