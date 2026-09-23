import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Rating,
  Snackbar,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CommentIcon from "@mui/icons-material/Comment";
import SearchIcon from "@mui/icons-material/Search";
import InsightsIcon from "@mui/icons-material/Insights";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Groups2Icon from "@mui/icons-material/Groups2";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import axios from "axios";

import { AuthContext } from "../../utils/AuthContext";
import { buildApiUrl, getAuthHeaders } from "../../utils/api";

const defaultFilters = {
  search: "",
  role: "all",
  status: "all",
  sort: "recent",
};

const roleLabels = {
  user: "User",
  admin: "Admin",
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

const formatRelativeDate = (value) => {
  if (!value) {
    return "No activity yet";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Active in the last hour";
  }

  if (diffHours < 24) {
    return `Active ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Active ${diffDays}d ago`;
};

const parseNumber = (value) => Number(value ?? 0);

const Admin = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [suspendDialogUser, setSuspendDialogUser] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [roleLoadingId, setRoleLoadingId] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const currentEmail = user?.email;
  const currentRole = user?.role;
  const currentUserId = user?.id;

  const users = dashboard?.users ?? [];
  const overview = dashboard?.overview;
  const activity = dashboard?.activity;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.search.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters.role !== "all") {
      params.set("role", filters.role);
    }

    if (filters.status !== "all") {
      params.set("status", filters.status);
    }

    if (filters.sort !== "recent") {
      params.set("sort", filters.sort);
    }

    const query = params.toString();
    return query ? `?${query}` : "";
  }, [filters]);

  const fetchDashboard = async () => {
    try {
      setError("");
      const headers = await getAuthHeaders();
      const res = await axios.get(buildApiUrl(`/admin/dashboard${queryString}`), {
        headers,
      });

      setDashboard(res.data);
    } catch (err) {
      console.error("Admin fetch failed", err);
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchDashboard();
  }, [queryString]);

  const openFeedbackModal = async (targetUser) => {
    try {
      setSelectedUser(targetUser);
      setFeedbackOpen(true);
      setLoadingFeedback(true);

      const headers = await getAuthHeaders();

      const res = await axios.get(buildApiUrl(`/feedback/admin/${targetUser.id}`), {
        headers,
      });

      setFeedbacks(res.data);
    } catch (err) {
      console.error("Failed to fetch feedback", err);
      setFeedbacks([]);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const suspendUser = async (targetUser) => {
    try {
      setSuspendLoading(true);
      const headers = await getAuthHeaders();

      await axios.patch(buildApiUrl(`/admin/users/${targetUser.id}/suspend`), {}, { headers });

      await fetchDashboard();

      setSnackbar({
        open: true,
        message: targetUser.suspended
          ? `${targetUser.name || targetUser.email || "User"} has been reactivated.`
          : `${targetUser.name || targetUser.email || "User"} has been suspended.`,
        severity: "success",
      });
      setSuspendDialogUser(null);
    } catch (err) {
      console.error("Suspend action failed", err);
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.message ||
          "Failed to update this user account.",
        severity: "error",
      });
    } finally {
      setSuspendLoading(false);
    }
  };

  const toggleRole = async (id) => {
    try {
      setRoleLoadingId(id);
      const headers = await getAuthHeaders();

      await axios.patch(buildApiUrl(`/admin/users/${id}/role`), {}, { headers });

      await fetchDashboard();
      setSnackbar({
        open: true,
        message: "User role updated successfully.",
        severity: "success",
      });
    } catch (err) {
      console.error("Role update failed", err);
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.message ||
          "Failed to update this user role.",
        severity: "error",
      });
    } finally {
      setRoleLoadingId("");
    }
  };

  const getRoleColor = (role) => {
    if (role === "admin") return "success";
    return "default";
  };

  const canSuspend = (targetUser) => {
    if (targetUser.id && currentUserId && targetUser.id === currentUserId) return false;
    if (targetUser.email && targetUser.email === currentEmail) return false;
    return true;
  };

  const canModifyRole = (targetUser) => {
    return currentRole === "admin";
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f4f7fb", minHeight: "100vh" }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(37,99,235,0.92) 100%)",
            color: "white",
            boxShadow: "0 28px 70px rgba(30,64,175,0.25)",
          }}
        >
          <Stack spacing={2}>
            <Chip
              label="Admin Control Room"
              sx={{
                alignSelf: "flex-start",
                bgcolor: "rgba(255,255,255,0.14)",
                color: "white",
                fontWeight: 600,
              }}
            />

            <Typography fontSize={{ xs: 30, md: 40 }} fontWeight={800}>
              Platform operations at a glance
            </Typography>

            <Typography sx={{ maxWidth: 780, color: "rgba(255,255,255,0.82)" }}>
              Monitor adoption, identify inactive or suspended accounts, and moderate admin access without leaving one screen.
            </Typography>
          </Stack>
        </Card>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap">
          <StatCard
            icon={<Groups2Icon />}
            title="Total users"
            value={overview?.totalUsers}
            helper={`${overview?.usersCreatedLast7Days ?? 0} joined in the last 7 days`}
          />
          <StatCard
            icon={<PersonOffIcon />}
            title="Suspended users"
            value={overview?.suspendedUsers}
            helper={`${overview?.activeUsersLast7Days ?? 0} active users in the last 7 days`}
          />
          <StatCard
            icon={<TrendingUpIcon />}
            title="Analyses last 7 days"
            value={activity?.analysesLast7Days}
            helper={`${activity?.uploadsLast7Days ?? 0} uploads in the last 7 days`}
          />
          <StatCard
            icon={<InsightsIcon />}
            title="Today"
            value={activity?.usersToday}
            helper={`${activity?.aiCallsToday ?? 0} AI, ${activity?.atsCallsToday ?? 0} ATS, ${activity?.uploadsToday ?? 0} uploads`}
          />
        </Stack>

        <Card sx={{ p: 3, borderRadius: 5, boxShadow: "0 16px 40px rgba(15,23,42,0.07)" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            mb={3}
          >
            <Box>
              <Typography fontSize={24} fontWeight={700}>
                User governance
              </Typography>
              <Typography color="text.secondary">
                Filter by role or account status, inspect recent activity, and review feedback before taking action.
              </Typography>
            </Box>

            <Chip
              icon={<ManageSearchIcon />}
              label={`${users.length} matching users`}
              color="primary"
              variant="outlined"
            />
          </Stack>

          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} mb={3}>
            <TextField
              fullWidth
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  search: event.target.value,
                }))
              }
              placeholder="Search by name, email, or phone"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
              }}
            />

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    role: event.target.value,
                  }))
                }
              >
                <MenuItem value="all">All roles</MenuItem>
                <MenuItem value="user">Users</MenuItem>
                <MenuItem value="admin">Admins</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value,
                  }))
                }
              >
                <MenuItem value="all">All statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 170 }}>
              <InputLabel>Sort</InputLabel>
              <Select
                value={filters.sort}
                label="Sort"
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    sort: event.target.value,
                  }))
                }
              >
                <MenuItem value="recent">Newest first</MenuItem>
                <MenuItem value="lastActive">Last active</MenuItem>
                <MenuItem value="feedback">Most feedback</MenuItem>
                <MenuItem value="usage">Most usage</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => setFilters(defaultFilters)}
              sx={{ minWidth: 120 }}
            >
              Reset
            </Button>
          </Stack>

          {isMobile ? (
            <Stack spacing={2}>
              {users.map((targetUser) => (
                <UserCard
                  key={targetUser.id}
                  user={targetUser}
                  onSuspend={setSuspendDialogUser}
                  onToggleRole={toggleRole}
                  onOpenFeedback={openFeedbackModal}
                  canSuspend={canSuspend(targetUser)}
                  canModifyRole={canModifyRole(targetUser)}
                  getRoleColor={getRoleColor}
                  suspendLoading={suspendLoading}
                  suspendDialogUser={suspendDialogUser}
                  roleLoadingId={roleLoadingId}
                />
              ))}
            </Stack>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>User</b></TableCell>
                  <TableCell><b>Role</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell><b>Usage</b></TableCell>
                  <TableCell><b>Feedback</b></TableCell>
                  <TableCell><b>Activity</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {users.map((targetUser) => {
                  const allowSuspend = canSuspend(targetUser);
                  const allowRoleChange = canModifyRole(targetUser);
                  const feedbackCount = parseNumber(targetUser.feedbackCount);
                  const avgFeedbackRating = Number(targetUser.avgFeedbackRating ?? 0);
                  const historyCount = parseNumber(targetUser.historyCount);

                  return (
                    <TableRow key={targetUser.id} hover>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={700}>{targetUser.name || "Unnamed user"}</Typography>
                          <Typography fontSize={13} color="text.secondary">
                            {targetUser.email || targetUser.phoneNumber || "No contact info"}
                          </Typography>
                          <Typography fontSize={12} color="text.secondary">
                            Joined {formatDateTime(targetUser.createdAt)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={roleLabels[targetUser.role] || targetUser.role}
                          color={getRoleColor(targetUser.role)}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={targetUser.suspended ? "Suspended" : "Active"}
                          color={targetUser.suspended ? "error" : "success"}
                          variant={targetUser.suspended ? "filled" : "outlined"}
                        />
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={600}>{historyCount} analyses</Typography>
                          <Typography fontSize={12} color="text.secondary">
                            {parseNumber(targetUser.aiAnalysisCount)} AI, {parseNumber(targetUser.atsAnalysisCount)} ATS
                          </Typography>
                          <Typography fontSize={12} color="text.secondary">
                            {parseNumber(targetUser.resumeUploads)} uploads recorded
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={600}>{feedbackCount} items</Typography>
                          <Typography fontSize={12} color="text.secondary">
                            Avg rating {avgFeedbackRating.toFixed(1)} / 5
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={600}>{formatRelativeDate(targetUser.lastActiveAt)}</Typography>
                          <Typography fontSize={12} color="text.secondary">
                            Last analysis {formatDateTime(targetUser.lastAnalysisAt)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip
                            title={
                              !allowSuspend
                                ? "Insufficient permission"
                                : targetUser.suspended
                                  ? "Unsuspend user"
                                  : "Suspend user"
                            }
                          >
                            <span>
                              <IconButton
                                disabled={!allowSuspend || roleLoadingId === targetUser.id}
                                onClick={() => setSuspendDialogUser(targetUser)}
                                sx={{
                                  color: !allowSuspend ? "#94A3B8" : "error.main",
                                  "&.Mui-disabled": { color: "#94A3B8" },
                                }}
                              >
                                {suspendLoading && suspendDialogUser?.id === targetUser.id ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : (
                                  <BlockIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Open feedback history">
                            <IconButton
                              onClick={() => openFeedbackModal(targetUser)}
                              sx={{ color: "#4F46E5" }}
                            >
                              <CommentIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip
                            title={
                              !allowRoleChange
                                ? "Admin access required"
                                : targetUser.role === "admin"
                                  ? "Demote to user"
                                  : "Promote to admin"
                            }
                          >
                            <span>
                              <IconButton
                                disabled={!allowRoleChange || suspendLoading}
                                onClick={() => toggleRole(targetUser.id)}
                                sx={{
                                  color: !allowRoleChange ? "#94A3B8" : "success.main",
                                  "&.Mui-disabled": { color: "#94A3B8" },
                                }}
                              >
                                {roleLoadingId === targetUser.id ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : (
                                  <AdminPanelSettingsIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </Stack>

      <Dialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Feedback history — {selectedUser?.name || selectedUser?.email}
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
              {feedbacks.map((feedback) => (
                <Card
                  key={feedback.id}
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
                        label={feedback.type.toUpperCase()}
                        color={
                          feedback.type === "ai"
                            ? "primary"
                            : feedback.type === "ats"
                              ? "success"
                              : "default"
                        }
                      />

                      <Typography fontSize={12} color="text.secondary">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>

                    <Rating value={feedback.rating} readOnly />

                    {feedback.comment && (
                      <Typography fontSize={14}>{feedback.comment}</Typography>
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

      <Backdrop
        open={suspendLoading}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress color="inherit" />
          <Typography fontWeight={600}>Updating user status...</Typography>
        </Stack>
      </Backdrop>

      <Dialog
        open={Boolean(suspendDialogUser)}
        onClose={() => {
          if (!suspendLoading) {
            setSuspendDialogUser(null);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {suspendDialogUser?.suspended ? "Reactivate user" : "Suspend user"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography>
              {suspendDialogUser?.suspended
                ? `This will restore access for ${suspendDialogUser?.name || suspendDialogUser?.email || "this user"}.`
                : `This will block ${suspendDialogUser?.name || suspendDialogUser?.email || "this user"} from using the app until an admin reactivates the account.`}
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              The change takes effect the next time the user hits a backend-protected route.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSuspendDialogUser(null)}
            disabled={suspendLoading}
          >
            Cancel
          </Button>
          <Button
            color={suspendDialogUser?.suspended ? "success" : "error"}
            variant="contained"
            disabled={suspendLoading || !suspendDialogUser}
            onClick={() => suspendDialogUser && suspendUser(suspendDialogUser)}
          >
            {suspendLoading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} color="inherit" />
                <span>Saving...</span>
              </Stack>
            ) : suspendDialogUser?.suspended ? (
              "Reactivate"
            ) : (
              "Suspend"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const UserCard = ({
  user,
  onSuspend,
  onToggleRole,
  onOpenFeedback,
  canSuspend,
  canModifyRole,
  getRoleColor,
  suspendLoading,
  suspendDialogUser,
  roleLoadingId,
}) => {
  const feedbackCount = parseNumber(user.feedbackCount);
  const avgFeedbackRating = Number(user.avgFeedbackRating ?? 0);
  const historyCount = parseNumber(user.historyCount);

  return (
    <Card sx={{ p: 2.5, borderRadius: 4 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Box>
            <Typography fontWeight={700}>{user.name || "Unnamed user"}</Typography>
            <Typography fontSize={13} color="text.secondary">
              {user.email || user.phoneNumber || "No contact info"}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={user.suspended ? "Suspended" : "Active"}
            color={user.suspended ? "error" : "success"}
          />
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="small" label={roleLabels[user.role] || user.role} color={getRoleColor(user.role)} />
          <Chip size="small" label={`${historyCount} analyses`} variant="outlined" />
          <Chip size="small" label={`${feedbackCount} feedback`} variant="outlined" />
        </Stack>

        <Divider />

        <Typography fontSize={13} color="text.secondary">
          Average feedback rating: {avgFeedbackRating.toFixed(1)} / 5
        </Typography>
        <Typography fontSize={13} color="text.secondary">
          Last active: {formatRelativeDate(user.lastActiveAt)}
        </Typography>
        <Typography fontSize={13} color="text.secondary">
          Last analysis: {formatDateTime(user.lastAnalysisAt)}
        </Typography>

        <Stack direction="row" justifyContent="space-between">
          <Tooltip title={canSuspend ? (user.suspended ? "Unsuspend user" : "Suspend user") : "Insufficient permission"}>
            <span>
              <IconButton
                disabled={!canSuspend || roleLoadingId === user.id}
                onClick={() => onSuspend(user)}
                sx={{
                  color: !canSuspend ? "#94A3B8" : "error.main",
                  "&.Mui-disabled": { color: "#94A3B8" },
                }}
              >
                {suspendLoading && suspendDialogUser?.id === user.id ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <BlockIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Open feedback history">
            <IconButton onClick={() => onOpenFeedback(user)} sx={{ color: "#4F46E5" }}>
              <CommentIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={canModifyRole ? (user.role === "admin" ? "Demote to user" : "Promote to admin") : "Admin access required"}>
            <span>
              <IconButton
                disabled={!canModifyRole || suspendLoading}
                onClick={() => onToggleRole(user.id)}
                sx={{
                  color: !canModifyRole ? "#94A3B8" : "success.main",
                  "&.Mui-disabled": { color: "#94A3B8" },
                }}
              >
                {roleLoadingId === user.id ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <AdminPanelSettingsIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Card>
  );
};

const StatCard = ({ icon, title, value, helper }) => (
  <Card
    sx={{
      flex: 1,
      minWidth: 220,
      p: 3,
      borderRadius: 5,
      boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
      background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    }}
  >
    <Stack spacing={1.5}>
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 3,
          display: "grid",
          placeItems: "center",
          color: "primary.main",
          bgcolor: "rgba(37,99,235,0.08)",
        }}
      >
        {icon}
      </Box>

      <Typography fontSize={14} color="text.secondary">
        {title}
      </Typography>

      <Typography fontSize={30} fontWeight={800}>
        {value ?? "-"}
      </Typography>

      <Typography fontSize={13} color="text.secondary">
        {helper}
      </Typography>
    </Stack>
  </Card>
);

export default Admin;
