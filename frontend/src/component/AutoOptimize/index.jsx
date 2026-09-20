import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl, getAuthHeaders } from "../../utils/api";

const priorityColorMap = {
  critical: "error",
  important: "warning",
  nice_to_have: "default",
};

const AutoOptimize = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bridge, setBridge] = useState(null);

  useEffect(() => {
    if (!state?.resumeFile || !state?.jobDesc) {
      navigate("/");
      return;
    }

    const fetchBridge = async () => {
      try {
        const formData = new FormData();
        formData.append("resume", state.resumeFile);
        formData.append("jobDescription", state.jobDesc);
        const headers = await getAuthHeaders({
          "Content-Type": "multipart/form-data",
        });

        const res = await axios.post(
          buildApiUrl("/resume/skill-gap-bridge"),
          formData,
          { headers }
        );

        setBridge(res.data.bridge);
      } catch (err) {
        console.error("Skill gap bridge failed:", err);
        setError("Failed to generate a skill gap plan for this resume.");
      } finally {
        setLoading(false);
      }
    };

    fetchBridge();
  }, [state, navigate]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb", p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>

        <Typography fontSize={{ xs: 28, md: 40 }} fontWeight={700}>
          Skill Gap Bridge
        </Typography>
        <Typography color="text.secondary">
          Close the highest-impact gaps without rewriting your resume into generic AI copy.
        </Typography>
      </Box>

      {loading && (
        <>
          <Box sx={{ display: "flex", justifyContent: "center", my: 6 }}>
            <CircularProgress />
          </Box>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} height={220} sx={{ borderRadius: 4, mb: 3 }} />
          ))}
        </>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && bridge && (
        <Stack spacing={3}>
          <Card sx={heroCard}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
              <Box>
                <Typography fontSize={14} color="text.secondary">
                  Candidate
                </Typography>
                <Typography fontSize={28} fontWeight={700}>
                  {bridge.candidateName || "Your Resume"}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
                  {bridge.summary}
                </Typography>
              </Box>

              <Card sx={scoreCard}>
                <Typography fontSize={13} color="text.secondary">
                  Match Score
                </Typography>
                <Typography fontSize={36} fontWeight={700}>
                  {bridge.score}%
                </Typography>
              </Card>
            </Box>

            {bridge.keywordCoverage && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography fontWeight={600}>Keyword Coverage</Typography>
                  <Typography fontSize={14} color="text.secondary">
                    {bridge.keywordCoverage.matched} / {bridge.keywordCoverage.total} tracked keywords
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={bridge.keywordCoverage.percentage || 0}
                  sx={{ height: 10, borderRadius: 999 }}
                />
              </Box>
            )}

            {bridge.matchedSkills?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography fontWeight={600} mb={1}>
                  Matched Skills
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {bridge.matchedSkills.map((skill) => (
                    <Chip key={skill} icon={<CheckCircleOutlineIcon />} label={skill} color="success" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Card>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.25fr 0.95fr" }, gap: 3 }}>
            <Stack spacing={3}>
              <Card sx={sectionCard}>
                <Box sx={sectionHeader}>
                  <WarningBadge />
                  <Typography fontSize={22} fontWeight={700}>
                    Critical Gaps
                  </Typography>
                </Box>

                {bridge.criticalGaps?.length > 0 ? (
                  <Stack spacing={2.5} sx={{ mt: 2 }}>
                    {bridge.criticalGaps.map((gap) => (
                      <Box key={gap.skill} sx={detailBlock}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                          <Typography fontWeight={700}>{gap.skill}</Typography>
                          <Chip
                            size="small"
                            label={gap.priority.replaceAll("_", " ")}
                            color={priorityColorMap[gap.priority] || "default"}
                          />
                        </Box>
                        <Typography fontSize={14} color="text.secondary" sx={{ mt: 1 }}>
                          {gap.whyItMatters}
                        </Typography>
                        <Typography fontSize={14} sx={{ mt: 1.5 }}>
                          <b>Action:</b> {gap.actionPlan}
                        </Typography>
                        {gap.evidenceHints?.length > 0 && (
                          <Box sx={{ mt: 1.5 }}>
                            {gap.evidenceHints.map((hint, index) => (
                              <Typography key={index} fontSize={14}>
                                • {hint}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ mt: 2 }}>No major skill gaps were detected for this role.</Typography>
                )}
              </Card>

              <Card sx={sectionCard}>
                <Box sx={sectionHeader}>
                  <TrendingUpOutlinedIcon sx={{ color: "#0f766e" }} />
                  <Typography fontSize={22} fontWeight={700}>
                    Transferable Strengths
                  </Typography>
                </Box>

                <Stack spacing={2.5} sx={{ mt: 2 }}>
                  {bridge.transferableStrengths?.map((strength) => (
                    <Box key={strength.title} sx={detailBlock}>
                      <Typography fontWeight={700}>{strength.title}</Typography>
                      {strength.evidence?.map((item, index) => (
                        <Typography key={index} fontSize={14} sx={{ mt: 1 }}>
                          • {item}
                        </Typography>
                      ))}
                      <Typography fontSize={14} color="text.secondary" sx={{ mt: 1.5 }}>
                        {strength.positioningTip}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>

              <Card sx={sectionCard}>
                <Box sx={sectionHeader}>
                  <AutoAwesomeIcon sx={{ color: "#7c3aed" }} />
                  <Typography fontSize={22} fontWeight={700}>
                    Proof Suggestions
                  </Typography>
                </Box>

                <Stack spacing={2.5} sx={{ mt: 2 }}>
                  {bridge.proofSuggestions?.map((item) => (
                    <Box key={item.focus} sx={detailBlock}>
                      <Typography fontWeight={700}>{item.focus}</Typography>
                      {item.suggestions?.map((suggestion, index) => (
                        <Typography key={index} fontSize={14} sx={{ mt: 1 }}>
                          • {suggestion}
                        </Typography>
                      ))}
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Stack>

            <Stack spacing={3}>
              <Card sx={sectionCard}>
                <Typography fontSize={22} fontWeight={700}>
                  Quick Wins
                </Typography>
                <Divider sx={{ my: 2 }} />
                {bridge.quickWins?.length > 0 ? (
                  bridge.quickWins.map((item, index) => (
                    <Typography key={index} fontSize={14} sx={{ mb: 1.25 }}>
                      • {item}
                    </Typography>
                  ))
                ) : (
                  <Typography fontSize={14} color="text.secondary">
                    No quick wins were generated.
                  </Typography>
                )}
              </Card>

              <Card sx={sectionCard}>
                <Box sx={sectionHeader}>
                  <SchoolOutlinedIcon sx={{ color: "#1d4ed8" }} />
                  <Typography fontSize={22} fontWeight={700}>
                    Learning Plan
                  </Typography>
                </Box>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {bridge.learningPlan?.map((item, index) => (
                    <Box key={`${item.skill}-${index}`} sx={detailBlock}>
                      <Typography fontWeight={700}>
                        {item.skill}
                        <Typography component="span" fontSize={12} color="text.secondary" sx={{ ml: 1 }}>
                          ({item.level})
                        </Typography>
                      </Typography>

                      {item.resources?.map((resource, resourceIndex) => (
                        <Typography key={resourceIndex} fontSize={14} sx={{ mt: 1 }}>
                          • <b>{resource.type.toUpperCase()}</b>: {resource.title} - {resource.platform}
                        </Typography>
                      ))}
                    </Box>
                  ))}
                </Stack>
              </Card>

              <Card sx={sectionCard}>
                <Typography fontSize={22} fontWeight={700}>
                  Section Priorities
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {bridge.sectionPriorities?.map((item) => (
                    <Box key={item.section} sx={detailBlockCompact}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                        <Typography fontWeight={700}>{item.section}</Typography>
                        <Chip
                          size="small"
                          label={item.status}
                          color={item.status === "keep" ? "success" : "warning"}
                          variant="outlined"
                        />
                      </Box>
                      <Typography fontSize={14} color="text.secondary" sx={{ mt: 1 }}>
                        {item.action}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Stack>
          </Box>
        </Stack>
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

const sectionCard = {
  p: { xs: 2.5, md: 3 },
  borderRadius: 4,
  boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: 1.25,
};

const detailBlock = {
  p: 2,
  borderRadius: 3,
  bgcolor: "#f8fafc",
};

const detailBlockCompact = {
  p: 1.75,
  borderRadius: 3,
  bgcolor: "#f8fafc",
};

const WarningBadge = () => (
  <Box
    sx={{
      width: 34,
      height: 34,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      bgcolor: "#fff1f2",
      color: "#be123c",
      fontWeight: 700,
      fontSize: 18,
    }}
  >
    !
  </Box>
);

export default AutoOptimize;
