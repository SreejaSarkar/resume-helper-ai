import React, { useContext, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  TextField,
  Skeleton,
  Avatar,
  Divider,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  LinearProgress,
} from "@mui/material";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import axios from "axios";
import { AuthContext } from "../../utils/AuthContext";
import SpeedIcon from "@mui/icons-material/Speed";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";
import InsightsIcon from "@mui/icons-material/Insights";
import RuleIcon from "@mui/icons-material/Rule";
import TuneIcon from "@mui/icons-material/Tune";
import QuizIcon from "@mui/icons-material/Quiz";
import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
} from "@mui/material";
import { buildApiUrl, getAuthHeaders } from "../../utils/api";

const FEEDBACK_ACTION_COUNT_KEY = "resumeAnalyzer:feedbackActionCount";
const FEEDBACK_SNOOZE_UNTIL_KEY = "resumeAnalyzer:feedbackSnoozeUntil";
const FEEDBACK_SUBMITTED_UNTIL_KEY = "resumeAnalyzer:feedbackSubmittedUntil";
const FEEDBACK_SNOOZE_MS = 1000 * 60 * 60 * 24 * 3;
const FEEDBACK_SUBMITTED_MS = 1000 * 60 * 60 * 24 * 30;


const Dashboard = () => {
  const [uploadFileText, setUploadFileText] = useState(
    "Upload your resume (.pdf)"
  );
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [atsResult, setAtsResult] = useState(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  // const [analysisId, setAnalysisId] = useState(() => uuid());
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const isActionDisabled = !resumeFile || !jobDesc.trim();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPromptOpen, setFeedbackPromptOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState("general");
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const recommendationMap = {
    strong_match: { label: "Strong Match", color: "success" },
    good_foundation: { label: "Good Foundation", color: "primary" },
    needs_work: { label: "Needs Work", color: "warning" },
    weak_match: { label: "Weak Match", color: "error" },
  };

  const handleOnChangeFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PDF
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setAlertMessage("Only PDF files are allowed.");
      setAlertOpen(true);
      return;
    }

    // Set file state and display filename
    setResumeFile(file);
    setUploadFileText(file.name);
    // setAnalysisId(uuid());
  };

  const handleClearFile = () => {
    setResumeFile(null);
    setUploadFileText("Upload your resume (.pdf)");

    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // ⭐ critical
    }
  };

  const maybePromptFeedback = (type) => {
    const now = Date.now();
    const snoozeUntil = Number(localStorage.getItem(FEEDBACK_SNOOZE_UNTIL_KEY) || 0);
    const submittedUntil = Number(localStorage.getItem(FEEDBACK_SUBMITTED_UNTIL_KEY) || 0);

    if (now < snoozeUntil || now < submittedUntil) {
      return;
    }

    const nextCount = Number(localStorage.getItem(FEEDBACK_ACTION_COUNT_KEY) || 0) + 1;
    localStorage.setItem(FEEDBACK_ACTION_COUNT_KEY, String(nextCount));

    if (nextCount < 2) {
      return;
    }

    setFeedbackTarget(type);
    setFeedbackPromptOpen(true);
  };

  const handleOpenFeedbackDialog = (type) => {
    setFeedbackPromptOpen(false);
    setFeedbackTarget(type);
    setFeedbackOpen(true);
  };

  const handleFeedbackLater = () => {
    localStorage.setItem(
      FEEDBACK_SNOOZE_UNTIL_KEY,
      String(Date.now() + FEEDBACK_SNOOZE_MS),
    );
    setFeedbackPromptOpen(false);
  };


  const handleAIAnalysis = async () => {
    if (!resumeFile || !jobDesc.trim()) {
      setError("Upload resume and paste job description");
      return;
    }

    setError("");
    setLoading(true);
    setAiResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDesc);
      const headers = await getAuthHeaders({
        "Content-Type": "multipart/form-data",
      });
      const response = await axios.post(
        buildApiUrl("/resume/analyze"),
        formData,
        {
          headers,
        }
      );

      setAiResult(response.data.analysis);
      maybePromptFeedback("ai");
    } catch (err) {
      setError("Failed to analyze resume (AI)");
    } finally {
      setLoading(false);
      setAtsResult(null)
    }
  };

  const handleATSAnalysis = async () => {
    if (!resumeFile || !jobDesc.trim()) {
      setError("Upload resume and paste job description");
      return;
    }

    setError("");
    setLoading(true);
    setAtsResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDesc);
      const headers = await getAuthHeaders({
        "Content-Type": "multipart/form-data",
      });
      const response = await axios.post(
        buildApiUrl("/ats/analyze"),
        formData,
        {
          headers,
        }
      );

      setAtsResult(response.data);
      maybePromptFeedback("ats");
    } catch (err) {
      setError("Failed to calculate ATS score");
    } finally {
      setLoading(false);
      setAiResult(null)
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const headers = await getAuthHeaders();

      await axios.post(
        buildApiUrl("/feedback"),
        {
          rating,
          comment: feedbackText,
          type: feedbackTarget || (aiResult ? "ai" : "ats"),
        },
        {
          headers,
        }
      );

      localStorage.setItem(
        FEEDBACK_SUBMITTED_UNTIL_KEY,
        String(Date.now() + FEEDBACK_SUBMITTED_MS),
      );
      localStorage.removeItem(FEEDBACK_ACTION_COUNT_KEY);
      setFeedbackPromptOpen(false);
      setFeedbackOpen(false);
      setRating(0);
      setFeedbackText("");
    } catch (err) {
      console.error("Feedback submit failed", err);
    } finally {
      setFeedbackLoading(false);
    }
  };


  const BreakdownRow = ({
    label,
    value,
    max,
    isPenalty = false,
  }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", my: 0.5 }}>
      <Typography fontSize={14}>{label}</Typography>
      <Typography
        fontSize={14}
        fontWeight={600}
        color={isPenalty ? "error.main" : "text.primary"}
      >
        {isPenalty ? `- ${value}` : `${value} / ${max}`}
      </Typography>
    </Box>
  );




  return (
    <>
      <Box
        sx={{
          flex: 1,
          minHeight: "100vh",
          p: { xs: 2, md: 4 },
          bgcolor: "#f5f7fb",
          display: "flex",
          gap: 4,
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        {/* LEFT PANEL */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography fontSize={14} color="text.secondary">
              AI Powered Resume Analysis
            </Typography>
            <Typography fontSize={{ xs: 30, md: 44 }} fontWeight={700}>
              Resume Match Score
            </Typography>
          </Box>

          {/* Instructions */}
          <Card sx={cardGlass}>
            <Typography fontWeight={600}>🔔 Instructions</Typography>
            <Typography fontSize={14}>
              • Paste the complete job description <br />
              • Only <b>PDF resumes</b> are supported
            </Typography>
          </Card>

          {/* Upload */}
          <Card sx={card}>
            <Typography fontWeight={600} mb={2}>
              Upload Resume
            </Typography>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box
                sx={{
                  ...uploadBox,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography
                  fontSize={14}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {uploadFileText}
                </Typography>

                {resumeFile && (
                  <IconButton
                    size="small"
                    onClick={handleClearFile}
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "error.main" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Button
                component="label"
                startIcon={<UploadFileIcon />}
                variant="contained"
                sx={gradientBtn}
              >
                Choose File
                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept=".pdf"
                  onChange={handleOnChangeFile}
                />
              </Button>
            </Box>
          </Card>


          {/* Job Description */}
          <Card sx={card}>
            <Typography fontWeight={600} mb={2}>
              Job Description
            </Typography>

            <TextField
              multiline
              rows={6}
              fullWidth
              placeholder="Paste job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />

            {error && (
              <Typography color="error" mt={1}>
                {error}
              </Typography>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
                mt: 3,
              }}
            >
              <Button
                fullWidth
                onClick={handleAIAnalysis}
                startIcon={<InsightsIcon />}
                variant="contained"
                sx={{
                  ...gradientBtn,
                  height: 52,
                }}
                disabled={isActionDisabled}
              >
                AI Match Analysis
              </Button>

              <Button
                fullWidth
                onClick={handleATSAnalysis}
                startIcon={<RuleIcon />}
                variant="contained"
                sx={{
                  ...gradientBtn,
                  height: 52,
                }}
                disabled={isActionDisabled}
              >
                ATS Friendliness Check
              </Button>

              <Button
                fullWidth
                startIcon={<TuneIcon />}
                variant="contained"
                sx={{
                  ...gradientBtn,
                  height: 52,
                }}
                onClick={() =>
                  navigate("/auto-optimize", {
                    state: { resumeFile, jobDesc },
                  })
                }
                disabled={isActionDisabled}
              >
                Close Skill Gaps
              </Button>

              <Button
                fullWidth
                startIcon={<QuizIcon />}
                variant="contained"
                sx={{
                  ...gradientBtn,
                  height: 52,
                }}
                onClick={() =>
                  navigate("/interview-prep", {
                    state: { resumeFile, jobDesc },
                  })
                }
                disabled={isActionDisabled}
              >
                Interview Coach
              </Button>
            </Box>

          </Card>
          {/* Result */}
          {loading && <Skeleton height={260} sx={{ borderRadius: 4 }} />}

          {aiResult && (
            <Card sx={card}>
              <Typography fontWeight={600} textAlign="center">
                Match Score
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                <Typography fontSize={48} fontWeight={700}>
                  {aiResult.score}%
                </Typography>
                <CreditScoreIcon color="success" sx={{ ml: 1, mt: 1 }} />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Chip
                  color={recommendationMap[aiResult.recommendation]?.color || "default"}
                  label={recommendationMap[aiResult.recommendation]?.label || "Analysis Ready"}
                />
              </Box>

              {aiResult.summary && (
                <Typography fontSize={14} textAlign="center" color="text.secondary">
                  {aiResult.summary}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {aiResult.keywordCoverage && (
                <>
                  <Typography fontWeight={600}>Keyword Coverage</Typography>
                  <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.5 }}>
                    Matched {aiResult.keywordCoverage.matched} of {aiResult.keywordCoverage.total} tracked job keywords
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={aiResult.keywordCoverage.percentage}
                    sx={{ mt: 1, mb: 2, height: 8, borderRadius: 999 }}
                  />
                </>
              )}

              {aiResult.matchedSkills?.length > 0 && (
                <>
                  <Typography fontWeight={600}>Matched Skills</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", my: 1 }}>
                    {aiResult.matchedSkills.map((skill) => (
                      <Chip key={skill} label={skill} color="success" variant="outlined" />
                    ))}
                  </Box>
                </>
              )}

              {aiResult.strengths?.length > 0 && (
                <>
                  <Typography fontWeight={600} mt={2}>Strengths</Typography>
                  {aiResult.strengths.map((item, i) => (
                    <Typography key={i} fontSize={14}>
                      • {item}
                    </Typography>
                  ))}
                </>
              )}

              <Typography fontWeight={600}>Missing Skills</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", my: 1 }}>
                {aiResult.missingSkills.map((skill) => (
                  <Chip key={skill} label={skill} />
                ))}
              </Box>

              <Typography fontWeight={600} mt={2}>
                Improvements
              </Typography>
              {aiResult.improvements.map((item, i) => (
                <Typography key={i} fontSize={14}>
                  • {item}
                </Typography>
              ))}

              {aiResult.learningSuggestions?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />

                  <Typography fontWeight={600}>
                    Skill Gap Learning Suggestions
                  </Typography>

                  {aiResult.learningSuggestions.map((suggestion, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "#f8f9fd",
                      }}
                    >
                      <Typography fontWeight={600}>
                        📌 {suggestion.skill}
                        <Typography
                          component="span"
                          fontSize={12}
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          ({suggestion.level})
                        </Typography>
                      </Typography>

                      <Box sx={{ mt: 1 }}>
                        {suggestion.resources.map((res, i) => (
                          <Typography
                            key={i}
                            fontSize={14}
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            • <b>{res.type.toUpperCase()}</b>:
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#5b5fc7",
                                textDecoration: "none",
                                fontWeight: 500,
                              }}
                            >
                              {res.title}
                            </a>
                            — <i>{res.platform}</i>
                          </Typography>
                        ))}

                      </Box>
                    </Box>
                  ))}
                </>
              )}

              {aiResult.sectionAnalysis?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography fontWeight={600}>Section Coverage</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {aiResult.sectionAnalysis.map((section) => (
                      <Chip
                        key={section.section}
                        label={`${section.section}: ${section.present ? "present" : "missing"}`}
                        color={section.present ? "success" : "warning"}
                        variant={section.present ? "filled" : "outlined"}
                      />
                    ))}
                  </Box>
                </>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button size="small" onClick={() => handleOpenFeedbackDialog("ai")}>
                  Share feedback
                </Button>
              </Box>

            </Card>
          )}

          {atsResult && (
            <Card sx={card}>
              <Typography fontWeight={600} textAlign="center">
                ATS Friendliness Score
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                <Typography
                  fontSize={48}
                  fontWeight={700}
                  color={
                    atsResult.atsScore >= 80
                      ? "success.main"
                      : atsResult.atsScore >= 60
                        ? "warning.main"
                        : "error.main"
                  }
                >
                  {atsResult.atsScore}%
                </Typography>
                <SpeedIcon sx={{ ml: 1, mt: 1 }} />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Breakdown */}
              <Typography fontWeight={600}>Score Breakdown</Typography>

              <BreakdownRow label="Keyword Match" value={atsResult.breakdown.keywordScore} max={40} />
              <BreakdownRow label="Formatting" value={atsResult.breakdown.formattingScore} max={25} />
              <BreakdownRow label="Sections" value={atsResult.breakdown.sectionScore} max={15} />
              <BreakdownRow label="Readability" value={atsResult.breakdown.readabilityScore} max={10} />
              <BreakdownRow
                label="Penalty"
                value={atsResult.breakdown.penalty}
                max={10}
                isPenalty
              />

              <Divider sx={{ my: 2 }} />

              {/* ATS Issues */}
              {atsResult.issues.length > 0 && (
                <>
                  <Typography fontWeight={600} color="warning.main">
                    ATS Issues
                  </Typography>
                  {atsResult.issues.map((issue, i) => (
                    <Typography key={i} fontSize={14}>
                      <WarningAmberIcon fontSize="inherit" /> {issue}
                    </Typography>
                  ))}
                </>
              )}

              {/* Missing ATS Keywords */}
              {atsResult.missingKeywords.length > 0 && (
                <>
                  <Typography fontWeight={600} mt={2}>
                    Missing ATS Keywords
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                    {atsResult.missingKeywords.map((kw) => (
                      <Chip key={kw} label={kw} color="warning" />
                    ))}
                  </Box>
                </>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button size="small" onClick={() => handleOpenFeedbackDialog("ats")}>
                  Share feedback
                </Button>
              </Box>
            </Card>
          )}
        </Box>

        {/* <Card sx={cardCenter}>
            <Avatar src={user?.photoURL} sx={{ width: 80, height: 80, mx: "auto" }} />
            <Typography fontWeight={600}>{user?.displayName}</Typography>
            <Typography fontSize={13} color="text.secondary">
              Resume Analyzer
            </Typography>
          </Card> */}


      </Box>
      <Dialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          ⭐ How was your experience?
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: "center", my: 2 }}>
            <Rating
              value={rating}
              onChange={(e, val) => setRating(val)}
              size="large"
            />
          </Box>

          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="What can we improve? (optional)"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFeedbackOpen(false)}>
            Skip
          </Button>

          <Button
            onClick={handleSubmitFeedback}
            variant="contained"
            sx={gradientBtn}
            disabled={!rating || feedbackLoading}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={feedbackPromptOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="info"
          variant="filled"
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button color="inherit" size="small" onClick={handleFeedbackLater}>
                Later
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => handleOpenFeedbackDialog(feedbackTarget || (aiResult ? "ai" : "ats"))}
              >
                Give feedback
              </Button>
            </Box>
          }
          onClose={handleFeedbackLater}
          sx={{ width: "100%" }}
        >
          Was this analysis useful? Share quick feedback when you are ready.
        </Alert>
      </Snackbar>
      <Snackbar
        open={alertOpen}
        autoHideDuration={4000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlertOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

/* ---------- styles ---------- */

const card = {
  p: 3,
  mb: 4,
  borderRadius: 4,
  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
};

const cardGlass = {
  ...card,
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(10px)",
};

const cardCenter = {
  ...card,
  textAlign: "center",
};

const uploadBox = {
  flex: 1,
  minWidth: 0, // ⭐ THIS FIXES IT
  p: 2,
  borderRadius: 3,
  bgcolor: "#f1f3f9",
  fontSize: 14,
};

const gradientBtn = {
  borderRadius: 3,
  fontWeight: 700,
  background: "linear-gradient(135deg, #667eea, #764ba2)",
};

export default Dashboard;
