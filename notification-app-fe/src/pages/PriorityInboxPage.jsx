import { useState, useEffect } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { NotificationCard } from "../components/NotificationCard";
import { usePriorityInbox } from "../hooks/usePriorityInbox";
import { Log } from "../lib/logger";

export function PriorityInboxPage() {
  const [topN, setTopN] = useState(10);
  const { prioritized, loading, error } = usePriorityInbox(topN);

  useEffect(() => {
    Log("frontend", "info", "page", "PriorityInboxPage mounted");
  }, []);

  const handleSliderChange = (_, value) => {
    Log("frontend", "info", "page", `Priority inbox top N changed to ${value}`);
    setTopN(value);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <StarIcon sx={{ fontSize: 28, color: "#f59e0b" }} />
        <Typography variant="h5" fontWeight={700}>
          Priority Inbox
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Top notifications ranked by type importance (Placement &gt; Result &gt; Event) combined with recency.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 4, px: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Show top notifications
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {topN}
          </Typography>
        </Stack>
        <Slider
          value={topN}
          onChange={handleSliderChange}
          min={5}
          max={20}
          step={1}
          marks={[
            { value: 5, label: "5" },
            { value: 10, label: "10" },
            { value: 15, label: "15" },
            { value: 20, label: "20" },
          ]}
          valueLabelDisplay="auto"
        />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">Failed to load notifications: {error}</Alert>
      )}

      {!loading && !error && prioritized.length === 0 && (
        <Alert severity="info">No notifications available.</Alert>
      )}

      {!loading && !error && prioritized.length > 0 && (
        <Stack spacing={1.5}>
          {prioritized.map((n, index) => (
            <Box key={n.ID} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.disabled"
                sx={{ minWidth: 24, pt: 1.5 }}
              >
                #{index + 1}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <NotificationCard notification={n} showScore />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
