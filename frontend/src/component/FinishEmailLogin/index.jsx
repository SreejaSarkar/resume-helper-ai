import React, { useEffect, useState } from "react";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { auth } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { APP_NAME, APP_SHORT_NAME } from "../../utils/brand";

export default function FinishEmailLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem("emailForSignIn") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const completeSignIn = async (nextEmail) => {
    if (!nextEmail) {
      setError("Enter the same email address you used to request the sign-in link.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await signInWithEmailLink(auth, nextEmail.trim().toLowerCase(), window.location.href);
      localStorage.removeItem("emailForSignIn");
      navigate("/", { replace: true });
    } catch (nextError) {
      console.error(nextError);
      setError("This sign-in link is invalid or expired. Request a new email link and try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setError("This page must be opened from a valid email sign-in link.");
      setLoading(false);
      return;
    }

    if (!email) {
      setLoading(false);
      return;
    }

    completeSignIn(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f7fb",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460, borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                component="img"
                src="/resume-helper-mark.svg"
                alt={APP_SHORT_NAME}
                sx={{ width: 32, height: 32, borderRadius: 1.5 }}
              />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Finish Email Sign-In
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {APP_NAME}
                </Typography>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={24} />
                <Typography>Signing you in...</Typography>
              </Box>
            ) : (
              <>
                <Typography color="text.secondary">
                  Confirm the same email address you used to request the sign-in link.
                </Typography>

                <TextField
                  fullWidth
                  label="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="contained" onClick={() => completeSignIn(email)}>
                    Continue
                  </Button>
                  <Button onClick={() => navigate("/login/email", { replace: true })}>
                    Request new link
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
