import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Typography,
  Card,
  Divider,
  Skeleton,
  Button,
  Chip,
  LinearProgress,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl, getAuthHeaders } from "../../utils/api";

const InterviewPrep = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state?.resumeFile || !state?.jobDesc) {
      navigate("/");
      return;
    }

    const fetchPrep = async () => {
      try {
        const formData = new FormData();
        formData.append("resume", state.resumeFile);
        formData.append("jobDescription", state.jobDesc);
        const headers = await getAuthHeaders({
          "Content-Type": "multipart/form-data",
        });
        const res = await axios.post(
          buildApiUrl("/resume/interview-readiness"),
          formData,
          { headers }
        );

        setData(res.data.interviewReadiness);
      } catch {
        setError("Failed to generate interview preparation");
      } finally {
        setLoading(false);
      }
    };

    fetchPrep();
  }, [state, navigate]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb", p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <Typography fontSize={{ xs: 28, md: 40 }} fontWeight={700}>
          Interview Coach
        </Typography>
        <Typography color="text.secondary">
          Practice better answers using your actual resume evidence and likely recruiter pressure points.
        </Typography>
      </Box>

      {/* Loading */}
      {loading && (
        <>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              height={220}
              sx={{ borderRadius: 4, mb: 3 }}
            />
          ))}
        </>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {!loading && data && (
        <Stack spacing={3}>
          <Card sx={heroCard}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography fontSize={14} color="text.secondary">
                  Candidate
                </Typography>
                <Typography fontSize={{ xs: 24, md: 30 }} fontWeight={700}>
                  {data.candidateName || "Interview Plan"}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
                  {data.roleFitSummary}
                </Typography>
              </Box>

              <Card sx={scoreCard}>
                <Typography fontSize={13} color="text.secondary">
                  Readiness Score
                </Typography>
                <Typography fontSize={34} fontWeight={700}>
                  {data.readinessScore}%
                </Typography>
              </Card>
            </Box>

            <Box sx={{ mt: 3 }}>
              <LinearProgress
                variant="determinate"
                value={data.readinessScore || 0}
                sx={{ height: 10, borderRadius: 999 }}
              />
            </Box>

            {data.strengthsToLead?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography fontWeight={700} mb={1}>
                  Lead With These Strengths
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {data.strengthsToLead.map((item) => (
                    <Chip
                      key={item}
                      icon={<CheckCircleOutlineOutlinedIcon />}
                      label={item}
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Card>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "0.95fr 1.25fr" }, gap: 3 }}>
            <Stack spacing={3}>
              <Card sx={panelCard}>
                <Box sx={panelHeader}>
                  <WarningAmberOutlinedIcon sx={{ color: "#b45309" }} />
                  <Typography fontSize={22} fontWeight={700}>
                    Focus Areas
                  </Typography>
                </Box>

                <Stack spacing={2} sx={{ mt: 2 }}>
                  {data.focusAreas?.map((area) => (
                    <Box key={area.area} sx={detailBlock}>
                      <Typography fontWeight={700}>{area.area}</Typography>
                      <Typography fontSize={14} color="text.secondary" sx={{ mt: 1 }}>
                        {area.reason}
                      </Typography>
                      <Typography fontSize={14} sx={{ mt: 1.25 }}>
                        <b>Practice:</b> {area.practicePrompt}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>

              <Card sx={panelCard}>
                <Box sx={panelHeader}>
                  <RecordVoiceOverOutlinedIcon sx={{ color: "#2563eb" }} />
                  <Typography fontSize={22} fontWeight={700}>
                    General Questions
                  </Typography>
                </Box>

                <Stack spacing={2} sx={{ mt: 2 }}>
                  {data.generalQuestions?.map((item, index) => (
                    <Box key={`${item.question}-${index}`} sx={detailBlock}>
                      <Typography fontWeight={700}>{item.question}</Typography>
                      <Typography fontSize={14} color="text.secondary" sx={{ mt: 1 }}>
                        {item.whyAsked}
                      </Typography>
                      <Typography fontSize={14} sx={{ mt: 1.25 }}>
                        <b>How to answer:</b> {item.answerStrategy}
                      </Typography>
                      {item.supportingEvidence?.length > 0 && (
                        <Box sx={{ mt: 1.25 }}>
                          {item.supportingEvidence.map((evidence, evidenceIndex) => (
                            <Typography key={evidenceIndex} fontSize={14}>
                              • {evidence}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Stack>

            <Stack spacing={3}>
              {data.experiences?.map((exp, idx) => (
                <Card key={idx} sx={panelCard}>
                  <Box sx={panelHeader}>
                    <AutoAwesomeIcon sx={{ color: "#7c3aed" }} />
                    <Typography fontSize={22} fontWeight={700}>
                      {exp.title}
                    </Typography>
                  </Box>

                  <Typography fontSize={14} color="text.secondary" sx={{ mt: 1.5 }}>
                    {exp.relevance}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography fontWeight={700} mb={1}>
                    Likely Questions
                  </Typography>
                  <Stack spacing={2}>
                    {exp.questions?.map((question, questionIndex) => (
                      <Box key={`${question.question}-${questionIndex}`} sx={detailBlock}>
                        <Typography fontWeight={700}>{question.question}</Typography>
                        <Typography fontSize={14} color="text.secondary" sx={{ mt: 1 }}>
                          {question.whyAsked}
                        </Typography>
                        <Typography fontSize={14} sx={{ mt: 1.25 }}>
                          <b>How to answer:</b> {question.answerStrategy}
                        </Typography>
                        {question.supportingEvidence?.length > 0 && (
                          <Box sx={{ mt: 1.25 }}>
                            <Typography fontSize={13} fontWeight={700} sx={{ mb: 0.5 }}>
                              Supporting evidence
                            </Typography>
                            {question.supportingEvidence.map((item, evidenceIndex) => (
                              <Typography key={evidenceIndex} fontSize={14}>
                                • {item}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Typography fontWeight={700} mb={1}>
                    Key Talking Points
                  </Typography>
                  {exp.talkingPoints?.map((p, i) => (
                    <Typography key={i} fontSize={14} sx={{ mb: 0.75 }}>
                      • {p}
                    </Typography>
                  ))}

                  <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#fff7ed" }}>
                    <Typography fontSize={14}>
                      <b>Interviewer is evaluating:</b> {exp.evaluationFocus}
                    </Typography>
                    <Typography fontSize={14} sx={{ mt: 1 }}>
                      <b>Likely follow-up risk:</b> {exp.followUpRisk}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>
        </Stack>
      )}

      {/* Empty */}
      {!loading && data?.experiences?.length === 0 && (
        <Typography>No interview preparation data available.</Typography>
      )}
    </Box>
  );
};

const heroCard = {
  p: { xs: 2.5, md: 4 },
  borderRadius: 4,
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const scoreCard = {
  minWidth: 170,
  p: 2.5,
  borderRadius: 3,
  boxShadow: "none",
  bgcolor: "#f8fafc",
  alignSelf: "flex-start",
};

const panelCard = {
  p: { xs: 2.5, md: 3 },
  borderRadius: 4,
  boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  gap: 1.25,
};

const detailBlock = {
  p: 2,
  borderRadius: 3,
  bgcolor: "#f8fafc",
};

export default InterviewPrep;