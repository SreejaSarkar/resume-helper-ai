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
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import FlareOutlinedIcon from "@mui/icons-material/FlareOutlined";
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
          buildApiUrl("/resume/star-stories"),
          formData,
          { headers }
        );

        setData(res.data.starStories);
      } catch {
        setError("Failed to generate STAR stories");
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
          STAR Story Builder
        </Typography>
        <Typography color="text.secondary">
          Turn your resume into reusable STAR stories you can use in recruiter screens, interviews, and networking conversations.
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
                  {data.candidateName || "Story Builder"}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
                  {data.roleSummary}
                </Typography>
              </Box>

              <Card sx={scoreCard}>
                <Typography fontSize={13} color="text.secondary">
                  Story Strategy
                </Typography>
                <Typography fontSize={16} fontWeight={700} sx={{ maxWidth: 240 }}>
                  {data.storyStrategy}
                </Typography>
              </Card>
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
                  <TipsAndUpdatesOutlinedIcon sx={{ color: "#b45309" }} />
                  <Typography fontSize={22} fontWeight={700}>
                    Practice Tips
                  </Typography>
                </Box>

                <Stack spacing={2} sx={{ mt: 2 }}>
                  {data.practiceTips?.map((tip, index) => (
                    <Box key={index} sx={detailBlock}>
                      <Typography fontSize={14}>{tip}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>

              <Card sx={panelCard}>
                <Box sx={panelHeader}>
                  <WorkOutlineOutlinedIcon sx={{ color: "#2563eb" }} />
                  <Typography fontSize={22} fontWeight={700}>
                    Best Uses
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                  {Array.from(new Set((data.stories || []).map((story) => story.bestUse))).map((useCase) => (
                    <Chip key={useCase} label={useCase} variant="outlined" />
                  ))}
                </Box>
              </Card>
            </Stack>

            <Stack spacing={3}>
              {data.stories?.map((story, idx) => (
                <Card key={idx} sx={panelCard}>
                  <Box sx={panelHeader}>
                    <FlareOutlinedIcon sx={{ color: "#7c3aed" }} />
                    <Typography fontSize={22} fontWeight={700}>
                      {story.title}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
                    <Chip icon={<AutoAwesomeIcon />} label={story.bestUse} color="secondary" variant="outlined" />
                  </Box>

                  <Typography fontSize={14} color="text.secondary" sx={{ mt: 1.5 }}>
                    {story.relevance}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <Box sx={detailBlock}>
                      <Typography fontWeight={700}>Situation</Typography>
                      <Typography fontSize={14} sx={{ mt: 1 }}>{story.situation}</Typography>
                    </Box>
                    <Box sx={detailBlock}>
                      <Typography fontWeight={700}>Task</Typography>
                      <Typography fontSize={14} sx={{ mt: 1 }}>{story.task}</Typography>
                    </Box>
                    <Box sx={detailBlock}>
                      <Typography fontWeight={700}>Action</Typography>
                      <Typography fontSize={14} sx={{ mt: 1 }}>{story.action}</Typography>
                    </Box>
                    <Box sx={detailBlock}>
                      <Typography fontWeight={700}>Result</Typography>
                      <Typography fontSize={14} sx={{ mt: 1 }}>{story.result}</Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography fontWeight={700} mb={1}>
                    Recruiter Version
                  </Typography>
                  <Box sx={detailBlock}>
                    <Typography fontSize={14}>{story.recruiterVersion}</Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography fontWeight={700} mb={1}>
                    Deep-Dive Version
                  </Typography>
                  <Box sx={detailBlock}>
                    <Typography fontSize={14}>{story.deepDiveVersion}</Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <Box sx={detailBlock}>
                      <Typography fontWeight={700} mb={1}>Proof Points</Typography>
                      {story.proofPoints?.map((item, i) => (
                        <Typography key={i} fontSize={14} sx={{ mb: 0.75 }}>
                          • {item}
                        </Typography>
                      ))}
                    </Box>
                    <Box sx={detailBlock}>
                      <Typography fontWeight={700} mb={1}>Likely Follow-Ups</Typography>
                      {story.likelyFollowUps?.map((item, i) => (
                        <Typography key={i} fontSize={14} sx={{ mb: 0.75 }}>
                          • {item}
                        </Typography>
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#fff7ed" }}>
                    <Typography fontWeight={700} mb={1}>Weak Spots To Fix</Typography>
                    {story.weakSpots?.map((item, i) => (
                      <Typography key={i} fontSize={14} sx={{ mb: 0.75 }}>
                        • {item}
                      </Typography>
                    ))}
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>
        </Stack>
      )}

      {/* Empty */}
      {!loading && data?.stories?.length === 0 && (
        <Typography>No STAR stories available.</Typography>
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
  minWidth: 250,
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