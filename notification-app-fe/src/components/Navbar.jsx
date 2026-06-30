import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";
import { NavLink } from "react-router-dom";

export function Navbar() {
  return (
    <AppBar position="static" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
      <Toolbar sx={{ gap: 2 }}>
        <NotificationsIcon sx={{ color: "primary.main" }} />
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          Campus Notify
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={NavLink}
            to="/"
            startIcon={<NotificationsIcon />}
            size="small"
            sx={{
              textTransform: "none",
              color: "text.secondary",
              "&.active": { color: "primary.main" },
            }}
          >
            All Notifications
          </Button>
          <Button
            component={NavLink}
            to="/priority"
            startIcon={<StarIcon />}
            size="small"
            sx={{
              textTransform: "none",
              color: "text.secondary",
              "&.active": { color: "primary.main" },
            }}
          >
            Priority Inbox
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
