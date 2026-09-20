import React, { useContext } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { AuthContext } from "../../utils/AuthContext";
import { APP_SHORT_NAME } from "../../utils/brand";

const Header = ({ onMenuClick }) => {
  const { user } = useContext(AuthContext);

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: "#0f172a",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            // sx={{ display: { md: "none" } }}   // hide on desktop
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="img"
            src="/resume-helper-mark.svg"
            alt={APP_SHORT_NAME}
            sx={{ width: 30, height: 30, borderRadius: 1.5 }}
          />

          <Typography fontWeight={700} fontSize={18}>
            {APP_SHORT_NAME}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography fontSize={14}>
            {user?.displayName || "User"}
          </Typography>
          <Avatar src={user?.photoURL} />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
