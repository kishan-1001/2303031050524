import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline, Box } from "@mui/material";
import { Navbar } from "./components/Navbar";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityInboxPage } from "./pages/PriorityInboxPage";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7c3aed",
    },
    secondary: {
      main: "#3b82f6",
    },
    background: {
      default: "#0d1117",
      paper: "#161b22",
    },
    divider: "#30363d",
    text: {
      primary: "#e6edf3",
      secondary: "#8b949e",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #30363d",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#161b22",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: "1px solid #30363d",
          "&.Mui-selected": {
            backgroundColor: "#7c3aed22",
            color: "#7c3aed",
            borderColor: "#7c3aed",
          },
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Navbar />
        <Box sx={{ minHeight: "calc(100vh - 64px)" }}>
          <Routes>
            <Route path="/" element={<NotificationsPage />} />
            <Route path="/priority" element={<PriorityInboxPage />} />
          </Routes>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}