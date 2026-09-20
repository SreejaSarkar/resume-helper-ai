import { Box, Typography, Button } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Typography variant="h2" fontWeight="bold">404</Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Page not found
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate("/")}
      >
        Go Home
      </Button>
    </Box>
  );
}
