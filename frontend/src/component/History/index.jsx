import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  Chip,
  Stack,
  Divider,
  Skeleton,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplayIcon from "@mui/icons-material/Replay";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axios from "axios";
import { buildApiUrl, buildAssetUrl, getAuthHeaders } from "../../utils/api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Pagination } from "@mui/material";


const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [jdOpen, setJdOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [reportOpen, setReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportLoadingId, setReportLoadingId] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });


  const fetchHistory = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(buildApiUrl("/history"), { headers });
      setHistory(res.data);
    } catch (err) {
      console.error("History fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchReport = async (item) => {
    try {
      setReportLoadingId(item.id);
      setReportType(item.type);
      setReportLoading(true);
      setReportOpen(true);

      const headers = await getAuthHeaders();

      let url = "";

      if (item.type === "ai") {
        url = buildApiUrl(`/resume/report/${item.aiAnalysisId}`);
      } else if (item.type === "ats") {
        url = buildApiUrl(`/ats/report/${item.atsAnalysisId}`);
      }

      const res = await axios.get(url, { headers });

      setReportData(res.data);
    } catch (err) {
      console.error("Failed to load report", err);
      setSnackbar({
        open: true,
        message: "Failed to load report.",
        severity: "error",
      });
    } finally {
      setReportLoading(false);
      setReportLoadingId("");
    }
  };

  const handleDelete = async (item) => {
    try {
      setDeleteLoadingId(item.id);
      const headers = await getAuthHeaders();

      await axios.delete(
        buildApiUrl(`/history/${item.id}`),
        { headers }
      );

      setHistory(prev => prev.filter(h => h.id !== item.id));
    } catch (err) {
      console.error('Delete failed', err);
      setSnackbar({
        open: true,
        message: "Failed to delete this history item.",
        severity: "error",
      });
    } finally {
      setDeleteLoadingId("");
    }
  };

  const paginatedHistory = history.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: "100vh",
        p: { xs: 2, md: 4 },
        bgcolor: "#f5f7fb",
      }}
    >
      <Typography fontSize={36} fontWeight={700}>
        History
      </Typography>

      <Typography color="text.secondary" mb={3}>
        Your past resume analysis records
      </Typography>

      {loading && <Skeleton height={180} sx={{ borderRadius: 4 }} />}

      {!loading && history.length === 0 && (
        <Card sx={{ p: 4, borderRadius: 4, textAlign: "center" }}>
          <Typography fontWeight={600}>
            No history found
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Analyze your first resume to see results here.
          </Typography>
        </Card>
      )}

      <Stack spacing={3}>
        {paginatedHistory.map((item) => (
          <Card
            key={item.id}
            sx={{
              p: 3,
              borderRadius: 4,
              boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Box>
                <Typography
                  fontWeight={700}
                  sx={{ cursor: "pointer", color: "#5b5fc7" }}
                  onClick={() => {
                    setSelectedItem(item);
                    setPdfOpen(true);
                  }}
                >
                  📄 {item.resumeName}
                </Typography>

                <Typography
                  fontSize={14}
                  color="text.secondary"
                  sx={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => {
                    setSelectedItem(item);
                    setJdOpen(true);
                  }}
                >
                  View Job Description
                </Typography>


                <Typography fontSize={12} color="text.secondary" mt={0.5}>
                  {new Date(item.createdAt).toLocaleString()}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center">
                {item.aiScore !== null && item.aiScore !== undefined && (
                  <Chip
                    label={`AI ${item.aiScore}%`}
                    color={item.aiScore >= 75 ? "success" : "warning"}
                  />
                )}

                {item.atsScore !== null && item.atsScore !== undefined && (
                  <Chip
                    label={`ATS ${item.atsScore}%`}
                    color={item.atsScore >= 75 ? "success" : "warning"}
                  />
                )}

                <Tooltip title="View Report">
                  <IconButton
                    onClick={() => fetchReport(item)}
                    disabled={deleteLoadingId === item.id || reportLoadingId === item.id}
                  >
                    {reportLoadingId === item.id ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <VisibilityIcon />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete">
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(item)}
                    disabled={deleteLoadingId === item.id || reportLoadingId === item.id}
                  >
                    {deleteLoadingId === item.id ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>
      {history.length > rowsPerPage && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={Math.ceil(history.length / rowsPerPage)}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
      <Dialog open={pdfOpen} onClose={() => setPdfOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Resume Preview</DialogTitle>
        <DialogContent sx={{ height: "80vh" }}>
          {selectedItem?.resumeUrl ? (
            <iframe
              src={buildAssetUrl(selectedItem.resumeUrl)}
              width="100%"
              height="100%"
              style={{ border: "none" }}
              title="Resume Preview"
            />
          ) : (
            <Typography>No preview available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={jdOpen} onClose={() => setJdOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Job Description</DialogTitle>
        <DialogContent dividers>
          <Typography
            sx={{ whiteSpace: "pre-wrap", fontSize: 14 }}
          >
            {selectedItem?.jobSummary || "No description available"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJdOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            fontWeight: 700,
            fontSize: 20,
            bgcolor: "#f8fafc",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {reportType === "ai" ? "AI Resume Analysis" : "ATS Compatibility Report"}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {reportLoading && <Skeleton height={300} />}

          {/* AI REPORT */}
          {!reportLoading && reportType === "ai" && reportData && (
            <Stack spacing={3}>
              {/* Score Card */}
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "#eef2ff",
                  border: "1px solid #c7d2fe",
                }}
              >
                <Typography fontSize={14} color="text.secondary">
                  Overall Score
                </Typography>
                <Typography fontSize={36} fontWeight={800} color="#4338ca">
                  {reportData.score}%
                </Typography>
              </Card>

              {reportData.summary && (
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700} mb={1}>Summary</Typography>
                  <Typography fontSize={14}>{reportData.summary}</Typography>
                </Card>
              )}

              {reportData.recommendation && (
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700} mb={1}>Recommendation</Typography>
                  <Chip label={String(reportData.recommendation).replace(/_/g, " ").toUpperCase()} color="primary" />
                </Card>
              )}

              {reportData.matchedSkills?.length > 0 && (
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700} mb={1}>Matched Skills</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {reportData.matchedSkills.map((skill, i) => (
                      <Chip key={i} label={skill} color="success" variant="outlined" />
                    ))}
                  </Stack>
                </Card>
              )}

              {reportData.strengths?.length > 0 && (
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700} mb={1}>Strengths</Typography>
                  <Stack spacing={1}>
                    {reportData.strengths.map((item, idx) => (
                      <Typography key={idx} fontSize={14}>• {item}</Typography>
                    ))}
                  </Stack>
                </Card>
              )}

              {reportData.keywordCoverage && (
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700} mb={1}>Keyword Coverage</Typography>
                  <Typography fontSize={14}>
                    {reportData.keywordCoverage.matched} / {reportData.keywordCoverage.total} tracked keywords matched ({reportData.keywordCoverage.percentage}%)
                  </Typography>
                </Card>
              )}

              {/* Missing Skills */}
              {reportData.missingSkills.length > 0 &&
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700} mb={1}>
                    Missing Skills
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {reportData.missingSkills?.map((s, i) => (
                      <Chip
                        key={i}
                        label={s}
                        sx={{ bgcolor: "#fef3c7", fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                </Card>
              }

              {/* Improvements */}
              {reportData.improvements.length > 0 &&
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700} mb={1}>
                    Recommended Improvements
                  </Typography>

                  <Stack spacing={1}>
                    {reportData.improvements?.map((i, idx) => (
                      <Typography key={idx} fontSize={14}>
                        • {i}
                      </Typography>
                    ))}
                  </Stack>
                </Card>
              }

              {reportData.sectionAnalysis?.length > 0 && (
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography fontWeight={700} mb={1}>Section Coverage</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {reportData.sectionAnalysis.map((section, idx) => (
                      <Chip
                        key={idx}
                        label={`${section.section}: ${section.present ? "present" : "missing"}`}
                        color={section.present ? "success" : "warning"}
                        variant={section.present ? "filled" : "outlined"}
                      />
                    ))}
                  </Stack>
                </Card>
              )}
            </Stack>
          )}

          {/* ATS REPORT */}
          {!reportLoading && reportType === "ats" && reportData && (
            <Stack spacing={3}>
              {/* Score Card */}
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "#ecfeff",
                  border: "1px solid #67e8f9",
                }}
              >
                <Typography fontSize={14} color="text.secondary">
                  ATS Score
                </Typography>
                <Typography fontSize={36} fontWeight={800} color="#0e7490">
                  {reportData.atsScore}%
                </Typography>
              </Card>

              {/* Breakdown */}
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography fontWeight={700} mb={1}>
                  Score Breakdown
                </Typography>

                <Stack spacing={1}>
                  {Object.entries(reportData.breakdown || {}).map(
                    ([key, val]) => (
                      <Box
                        key={key}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography fontSize={14}>
                          {key.replace(/([A-Z])/g, " $1")}
                        </Typography>
                        <Chip label={val} size="small" />
                      </Box>
                    )
                  )}
                </Stack>
              </Card>

              {/* Missing Keywords */}
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography fontWeight={700} mb={1}>
                  Missing Keywords
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {reportData.missingKeywords?.map((k, i) => (
                    <Chip
                      key={i}
                      label={k}
                      sx={{ bgcolor: "#fee2e2", fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              </Card>

              {/* Issues */}
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography fontWeight={700} mb={1}>
                  Detected Issues
                </Typography>

                <Stack spacing={1}>
                  {reportData.issues?.map((i, idx) => (
                    <Typography key={idx} fontSize={14}>
                      ⚠ {i}
                    </Typography>
                  ))}
                </Stack>
              </Card>
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e5e7eb",
            bgcolor: "#f8fafc",
          }}
        >
          <Button
            variant="contained"
            onClick={() => setReportOpen(false)}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: "none",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default History;
