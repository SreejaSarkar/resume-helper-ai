import React, { useContext } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../utils/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { APP_SHORT_NAME } from "../../utils/brand";

const drawerWidth = 280;

const SideBar = ({ open, setOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const mainItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
  ];

  const toolItems = [
    { label: "History", icon: <ManageSearchIcon />, path: "/history" },
    ...(["admin", "super_admin"].includes(user?.role)
      ? [{ label: "Admin", icon: <AdminPanelSettingsIcon />, path: "/admin" }]
      : []),
  ];

  const logout = async () => {
    await signOut(auth);
  };

  const renderItem = (item) => {
    const isActive = location.pathname === item.path;

    return (
      <ListItemButton
        key={item.path}
        onClick={() => {
          navigate(item.path);
          setOpen(false);
        }}
        sx={{
          my: 0.5,
          borderRadius: 3,
          px: 2,
          bgcolor: isActive ? "rgba(255,152,0,0.15)" : "transparent",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.08)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 36,
            color: isActive ? "#ff9800" : "rgba(255,255,255,0.85)",
          }}
        >
          {item.icon}
        </ListItemIcon>

        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontSize: 15,
            fontWeight: isActive ? 600 : 400,
          }}
        />
      </ListItemButton>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        height: "100%",
        background: "linear-gradient(180deg, #0f172a, #020617)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        px: 2,
      }}
    >
      {/* Brand */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
        <Avatar
          src="/resume-helper-mark.svg"
          alt={APP_SHORT_NAME}
          sx={{ background: "linear-gradient(135deg, #ff9800, #ff5722)" }}
        >
          <ArticleIcon />
        </Avatar>
        <Typography fontSize={18} fontWeight={700}>
          {APP_SHORT_NAME}
        </Typography>

        {isMobile && (
          <IconButton
            sx={{ ml: "auto", color: "#fff" }}
            onClick={() => setOpen(false)
            }
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Typography sx={{ fontSize: 12, letterSpacing: 1, opacity: 0.6, px: 1, mb: 1 }}>
        MAIN
      </Typography>

      <List>{mainItems.map(renderItem)}</List>

      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />

      <Typography sx={{ fontSize: 12, letterSpacing: 1, opacity: 0.6, px: 1, mb: 1 }}>
        TOOLS
      </Typography>

      <List>{toolItems.map(renderItem)}</List>

      <Box sx={{ flexGrow: 1 }} />

      {/* User */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: 2,
          px: 1,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Avatar src={user?.photoURL} />
        <Box sx={{ flex: 1 }}>
          <Typography fontSize={14} fontWeight={600}>
            {user?.displayName || "User"}
          </Typography>
          <Typography fontSize={12} color="rgba(255,255,255,0.6)">
            Free Plan
          </Typography>
        </Box>
        <LogoutIcon
          onClick={logout}
          sx={{
            cursor: "pointer",
            opacity: 0.7,
            "&:hover": { opacity: 1 },
          }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDrawer-paper": { width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>



      {/* Desktop Drawer */}
      {/* <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer> */}
    </>
  );
};

export default SideBar;
