import { useCallback } from "react";
import {
  Box,
  Chip,
  Paper,
  Typography,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const TYPE_COLOR = {
  Placement: "#f59e0b",
  Result: "#3b82f6",
  Event: "#10b981",
};

const READ_KEY = "read_notification_ids";

function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function markRead(id) {
  const ids = getReadIds();
  ids.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export function NotificationCard({ notification, onRead, showScore = false }) {
  const isRead = getReadIds().has(notification.ID);
  const accentColor = TYPE_COLOR[notification.Type] ?? "#6b7280";

  const handleClick = useCallback(() => {
    if (!isRead) {
      markRead(notification.ID);
      onRead?.(notification.ID);
    }
  }, [isRead, notification.ID, onRead]);

  return (
    <Paper
      onClick={handleClick}
      elevation={0}
      sx={{
        display: "flex",
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 2,
        p: 2,
        cursor: isRead ? "default" : "pointer",
        bgcolor: isRead ? "background.paper" : "action.hover",
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: "action.selected",
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          {!isRead && (
            <FiberManualRecordIcon sx={{ fontSize: 10, color: "primary.main", flexShrink: 0 }} />
          )}
          <Chip
            label={notification.Type}
            size="small"
            sx={{
              bgcolor: accentColor + "22",
              color: accentColor,
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 20,
            }}
          />
          <Typography variant="caption" color="text.disabled" sx={{ ml: "auto", flexShrink: 0 }}>
            {new Date(notification.Timestamp).toLocaleString()}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          fontWeight={isRead ? 400 : 600}
          color={isRead ? "text.secondary" : "text.primary"}
          noWrap
        >
          {notification.Message}
        </Typography>

        {showScore && (
          <Tooltip title={`Priority score: ${notification.score?.toFixed(4)}`} placement="bottom-start">
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(notification.score ?? 0) * 100}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: "divider",
                  "& .MuiLinearProgress-bar": { bgcolor: accentColor },
                }}
              />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
}
