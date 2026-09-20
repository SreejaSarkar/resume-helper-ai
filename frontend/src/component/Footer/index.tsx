import React from "react";
import { Box, Typography, Divider } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        px: { xs: 2, md: 6 },
        py: 1.5, // reduced padding for thinness
        background:
          "linear-gradient(180deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,1) 100%)",
        color: "#e5e7eb",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -5px 15px rgba(0,0,0,0.15)", // softer shadow
      }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="center"
      >
        {/* Brand */}
        <Typography fontSize={13} sx={{ opacity: 0.85 }}>
          © {new Date().getFullYear()}{" "}
          <Box component="span" sx={{ fontWeight: 600, color: "#fff" }}>
            Resume AI
          </Box>{" "}
          — Smarter resumes, better interviews
        </Typography>

        {/* Version */}
        <Typography fontSize={12} sx={{ opacity: 0.6, mt: { xs: 0.5, md: 0 } }}>
          v1.0 • Built with ❤️
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mt: 1 }} />
    </Box>
  );
};

export default Footer;
