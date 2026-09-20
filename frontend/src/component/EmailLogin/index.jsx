import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CloseIcon from "@mui/icons-material/Close";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import { APP_NAME, APP_SHORT_NAME, getFinishSigninUrl } from "../../utils/brand";

export default function EmailLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const sendLink = async () => {
    if (!email) {
      setSnackbar({
        open: true,
        message: "Please enter your email.",
        severity: "warning",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setSnackbar({
        open: true,
        message: "Enter a valid email address.",
        severity: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const finishSigninUrl = getFinishSigninUrl();

      await sendSignInLinkToEmail(auth, normalizedEmail, {
        url: finishSigninUrl,
        handleCodeInApp: true,
      });
      localStorage.setItem("emailForSignIn", normalizedEmail);
      setEmail(normalizedEmail);
      setEmailSent(true);
      setSnackbar({
        open: true,
        message: "Check your email for the sign-in link!",
        severity: "success",
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Failed to send link. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1300,
        }}
      >
        <Card
          sx={{
            width: { xs: "90%", sm: 400 },
            borderRadius: 3,
            backgroundColor: "#000",
            color: "#fff",
            position: "relative",
            p: 2,
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={() => navigate("/login", { replace: true })}
            sx={{ position: "absolute", top: 8, right: 8, color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>

          <CardContent>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={2}>
              <Box
                component="img"
                src="/resume-helper-mark.svg"
                alt={APP_SHORT_NAME}
                sx={{ width: 30, height: 30, mr: 1.25, borderRadius: 1.5 }}
              />
              <Box>
                <Typography variant="h5">Login with Email</Typography>
                <Typography fontSize={12} color="grey.400">
                  {APP_NAME}
                </Typography>
              </Box>
            </Box>

            {/* Input and Button */}
            <Stack spacing={2}>
              <TextField
                variant="outlined"
                fullWidth
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || emailSent}
                InputProps={{
                  sx: {
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ccc",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#fff",
                    },
                  },
                }}
                InputLabelProps={{ style: { color: "#fff" } }}
              />

              <Button
                variant="contained"
                onClick={sendLink}
                disabled={loading}
                sx={{
                  backgroundColor: "#fff",
                  color: "#000",
                  borderRadius: "30px",
                  fontSize: "16px",
                  padding: "12px",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                {loading ? "Sending..." : emailSent ? "Resend Sign-In Link" : "Send Sign-In Link"}
              </Button>

              {emailSent && (
                <Typography fontSize={13} color="grey.400">
                  We sent a sign-in link to {email}. Open it on this device or enter the same email on the finish page if you switch devices.
                </Typography>
              )}

              {window.location.hostname === "localhost" && (
                <Alert severity="warning">
                  This email was generated from a localhost flow. For production-quality emails, set <b>VITE_PUBLIC_APP_URL</b> to your HTTPS app domain and use that domain in Firebase authorized domains.
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={/** @type {'success' | 'info' | 'warning' | 'error'} */ (snackbar.severity)}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
