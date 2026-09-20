import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  Stack,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import axios from "axios";
import { AuthContext } from "../../utils/AuthContext";
import { useTheme, useMediaQuery } from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
} from "@mui/material";
import { buildApiUrl, getAuthHeaders } from "../../utils/api";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const currentEmail = user?.email;
  const currentRole = user.role

  const fetchData = async () => {
    try {
      const headers = await getAuthHeaders();

      const [usersRes, statsRes] = await Promise.all([
        axios.get(buildApiUrl("/admin/users"), { headers }),
        axios.get(buildApiUrl("/admin/stats"), { headers }),
      ]);

      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Admin fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackModal = async (user) => {
    try {
      setSelectedUser(user);
      setFeedbackOpen(true);
      setLoadingFeedback(true);

      const headers = await getAuthHeaders();

      const res = await axios.get(
        buildApiUrl(`/feedback/admin/${user.id}`),
        { headers }
      );

      setFeedbacks(res.data);
    } catch (err) {
      console.error("Failed to fetch feedback", err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const suspendUser = async (id, suspended) => {
    const headers = await getAuthHeaders();

    await axios.patch(
      buildApiUrl(`/admin/users/${id}/suspend`),
      { suspended },
      { headers }
    );

    fetchData();
  };

  const toggleRole = async (id) => {
    const headers = await getAuthHeaders();

    await axios.patch(
      buildApiUrl(`/admin/users/${id}/role`),
      {},
      { headers }
    );

    fetchData();
  };

  const resetQuota = async (id) => {
    const headers = await getAuthHeaders();

    await axios.patch(
      buildApiUrl(`/admin/users/${id}/reset-quota`),
      {},
      { headers }
    );

    fetchData();
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f5f7fb", minHeight: "100vh" }}>
      <Typography fontSize={{ xs: 26, md: 36 }} fontWeight={700}>
        Admin Dashboard
      </Typography>

      <Typography color="text.secondary" mb={3}>
        Manage users & monitor platform analytics
      </Typography>

      {/* -------- STATS -------- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mb={3}
        flexWrap="wrap"
      >
        <StatCard title="Users Today" value={stats?.usersToday} />
        <StatCard title="AI Calls Today" value={stats?.aiCallsToday} />
        <StatCard title="ATS Scans Today" value={stats?.atsCallsToday} />
        <StatCard title="Uploads Today" value={stats?.uploadsToday} />
      </Stack>

      {/* -------- USERS TABLE -------- */}
      <Card sx={{ p: 3, borderRadius: 4 }}>
        <Typography fontWeight={700} mb={2}>
          User Management
        </Typography>

        <Divider sx={{ mb: 2 }} />
        {isMobile ? (
          <Stack spacing={2}>
            {users.map((u) => (
              <Card key={u.id} sx={{ p: 2, borderRadius: 3 }}>
                <Stack spacing={1}>
                  <Typography fontWeight={600}>
                    {u.name || "-"}
                  </Typography>

                  <Typography fontSize={13} color="text.secondary">
                    {u.email}
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      label={u.role.replace("_", " ").toUpperCase()}
                      color={
                        u.role === "super_admin"
                          ? "error"
                          : u.role === "admin"
                            ? "success"
                            : "default"
                      }
                    />
                    <Chip
                      size="small"
                      label={u.suspended ? "Suspended" : "Active"}
                      color={u.suspended ? "error" : "success"}
                    />
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontSize={13}>
                      Feedbacks: <b>{u.feedbackCount}</b>
                    </Typography>
                  </Stack>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between">
                    {(() => {
                      const canSuspend = () => {
                        if (u.role === "super_admin") return false;
                        if (u.role === "admin" && currentRole !== "super_admin") return false;
                        if (u.email === currentEmail) return false;
                        return true;
                      };
                      const allowSuspend = canSuspend();

                      return (
                        <IconButton
                          disabled={!allowSuspend}
                          onClick={() => suspendUser(u.id)}
                          sx={{
                            color: !allowSuspend ? "#4B5563" : "error.main",
                            cursor: !allowSuspend ? "not-allowed" : "pointer",
                            "&.Mui-disabled": {
                              color: "#4B5563",
                              opacity: 1,
                            },
                          }}
                        >
                          <BlockIcon />
                        </IconButton>
                      );
                    })()}

                    <IconButton
                      onClick={() => openFeedbackModal(u)}
                      sx={{ color: "#6366f1" }}
                    >
                      <CommentIcon />
                    </IconButton>

                    {(() => {
                      const canModifyRole = () => {
                        if (currentRole !== "super_admin") return false;
                        if (u.role === "super_admin") return false;
                        return true;
                      };
                      const allowRoleChange = canModifyRole();

                      return (
                        <IconButton
                          disabled={!allowRoleChange}
                          onClick={() => toggleRole(u.id)}
                          sx={{
                            color: !allowRoleChange ? "#4B5563" : "success.main",
                            cursor: !allowRoleChange ? "not-allowed" : "pointer",
                            "&.Mui-disabled": {
                              color: "#4B5563",
                              opacity: 1,
                            },
                          }}
                        >
                          <AdminPanelSettingsIcon />
                        </IconButton>
                      );
                    })()}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Name</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Role</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Feedbacks</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name || "-"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.role.replace("_", " ").toUpperCase()}
                      color={
                        u.role === "super_admin"
                          ? "error"
                          : u.role === "admin"
                            ? "success"
                            : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.suspended ? "Suspended" : "Active"}
                      color={u.suspended ? "error" : "success"}
                    />
                  </TableCell>
                  <TableCell>{u.feedbackCount}</TableCell>

                  <TableCell>
                    {(() => {
                      const canSuspend = () => {
                        if (u.role === "super_admin") return false;
                        if (u.role === "admin" && currentRole !== "super_admin") return false;
                        if (u.email === currentEmail) return false;
                        return true;
                      };
                      const allowSuspend = canSuspend();

                      return (
                        <Tooltip
                          title={
                            !allowSuspend
                              ? "Insufficient permission"
                              : u.suspended
                                ? "Unsuspend"
                                : "Suspend"
                          }
                        >
                          <span>
                            <IconButton
                              disabled={!allowSuspend}
                              onClick={() => suspendUser(u.id)}
                              sx={{
                                color: !allowSuspend ? "#4B5563" : "error.main",
                                cursor: !allowSuspend ? "not-allowed" : "pointer",
                                "&.Mui-disabled": {
                                  color: "#4B5563",
                                  opacity: 1,
                                },
                              }}
                            >
                              <BlockIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      );
                    })()}

                    <Tooltip title="View Feedback">
                      <IconButton
                        onClick={() => openFeedbackModal(u)}
                        sx={{ color: "#6366f1" }}
                      >
                        <CommentIcon />
                      </IconButton>
                    </Tooltip>

                    {(() => {
                      const isAdmin = u.role === "admin";
                      const canModifyRole = () => {
                        if (currentRole !== "super_admin") return false;
                        if (u.role === "super_admin") return false;
                        return true;
                      };
                      const allowRoleChange = canModifyRole();

                      return (
                        <Tooltip
                          title={
                            !allowRoleChange
                              ? "Only Super Admin can modify roles"
                              : u.role === "admin"
                                ? "Demote to User"
                                : "Promote to Admin"
                          }
                        >
                          <span>
                            <IconButton
                              disabled={!allowRoleChange}
                              onClick={() => toggleRole(u.id)}
                              sx={{
                                color: !allowRoleChange ? "#4B5563" : "success.main",
                                cursor: !allowRoleChange ? "not-allowed" : "pointer",
                                "&.Mui-disabled": {
                                  color: "#4B5563",
                                  opacity: 1,
                                },
                              }}
                            >
                              <AdminPanelSettingsIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Dialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Feedback — {selectedUser?.name || selectedUser?.email}
        </DialogTitle>

        <DialogContent dividers>
          {loadingFeedback ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : feedbacks.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              No feedback available
            </Typography>
          ) : (
            <Stack spacing={2}>
              {feedbacks.map((f) => (
                <Card
                  key={f.id}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: "#f9fafb",
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Chip
                        size="small"
                        label={f.type.toUpperCase()}
                        color={
                          f.type === "ai"
                            ? "primary"
                            : f.type === "ats"
                              ? "success"
                              : "default"
                        }
                      />

                      <Typography fontSize={12} color="text.secondary">
                        {new Date(f.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>

                    <Rating value={f.rating} readOnly />

                    {f.comment && (
                      <Typography fontSize={14}>
                        {f.comment}
                      </Typography>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setFeedbackOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const StatCard = ({ title, value }) => (
  <Card
    sx={{
      flex: 1,
      p: 3,
      borderRadius: 4,
      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    }}
  >
    <Typography fontSize={14} color="text.secondary">
      {title}
    </Typography>
    <Typography fontSize={32} fontWeight={700}>
      {value ?? "-"}
    </Typography>
  </Card>
);

export default Admin;
