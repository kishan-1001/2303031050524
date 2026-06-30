import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const FILTERS = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value ?? "All"}
      exclusive
      onChange={(_, newValue) => {
        if (newValue !== null) onChange(newValue);
      }}
      size="small"
      sx={{ flexWrap: "wrap", gap: 0.5 }}
    >
      {FILTERS.map((type) => (
        <ToggleButton
          key={type}
          value={type}
          sx={{ textTransform: "none", px: 2, borderRadius: "20px !important" }}
        >
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}