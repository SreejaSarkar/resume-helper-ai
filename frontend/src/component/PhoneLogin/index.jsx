import React, { useEffect, useRef, useState } from "react";
import { auth } from "../../utils/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { useNavigate } from "react-router-dom";
import { APP_NAME, APP_SHORT_NAME } from "../../utils/brand";

export default function PhoneLogin() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const verifierRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, "recaptcha", {
      size: "normal",
      callback: () => {
        setError("");
        setRecaptchaReady(true);
      },
      "expired-callback": () => {
        setRecaptchaReady(false);
        setMessage("");
        setError("reCAPTCHA expired. Please complete it again before requesting a new OTP.");
      },
    });

    verifierRef.current = verifier;

    verifier
      .render()
      .then((widgetId) => {
        widgetIdRef.current = widgetId;
      })
      .catch((nextError) => {
        console.error("Failed to render reCAPTCHA", nextError);
        setError("Could not initialize phone verification. Refresh the page and try again.");
      });

    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
      widgetIdRef.current = null;
    };
  }, []);

  const normalizePhoneNumber = (value) => {
    const trimmed = value.replace(/[\s()-]/g, "");

    if (trimmed.startsWith("+")) {
      return trimmed;
    }

    if (/^\d{10}$/.test(trimmed)) {
      return `+91${trimmed}`;
    }

    return trimmed;
  };

  const resetRecaptcha = () => {
    setRecaptchaReady(false);

    if (
      widgetIdRef.current !== null &&
      typeof window !== "undefined" &&
      window.grecaptcha?.reset
    ) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  };

  const getFriendlyFirebaseError = (nextError) => {
    const code = nextError?.code;
    const messageText = String(nextError?.message || "");

    if (code === "auth/invalid-phone-number") {
      return "Firebase rejected the phone number format. Use the full international format, for example +919876543210.";
    }

    if (
      code === "auth/captcha-check-failed" ||
      code === "auth/invalid-app-credential" ||
      messageText.includes("NO_RECAPTCHA")
    ) {
      if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
        return "Phone auth is failing at the Firebase reCAPTCHA verification step on localhost. Use a real hosted domain or a dev tunnel domain added to Firebase Authorized domains, or use Firebase test phone numbers for local development.";
      }

      return "Firebase rejected the reCAPTCHA verification. Complete the reCAPTCHA again and confirm that your current domain is added in Firebase Authentication > Settings > Authorized domains.";
    }

    if (code === "auth/too-many-requests") {
      return "Too many OTP attempts were made for this phone flow. Wait a while or use a Firebase test phone number during development.";
    }

    if (code === "auth/quota-exceeded") {
      return "Firebase phone-auth SMS quota has been exceeded for this project.";
    }

    return "Failed to send OTP. Check the phone number, complete the reCAPTCHA, and try again.";
  };

  const sendOTP = async () => {
    try {
      setError("");
      setMessage("");
      setSending(true);
      const normalizedPhone = normalizePhoneNumber(phone);

      if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
        setError("Enter a valid phone number in international format, for example +919876543210.");
        return;
      }

      if (!verifierRef.current) {
        setError("Phone verification is still initializing. Wait a moment and try again.");
        return;
      }

      if (!recaptchaReady) {
        setError("Complete the reCAPTCHA verification before requesting an OTP.");
        return;
      }

      const result = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        verifierRef.current,
      );
      setConfirm(result);
      setPhone(normalizedPhone);
      setMessage("OTP sent. Enter the verification code to continue.");
    } catch (nextError) {
      console.error(nextError);
      setError(getFriendlyFirebaseError(nextError));
      resetRecaptcha();
    } finally {
      setSending(false);
    }
  };

  const verifyOTP = async () => {
    if (!confirm) {
      setError("Request an OTP first.");
      return;
    }

    if (!code.trim()) {
      setError("Enter the OTP you received.");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      await confirm.confirm(code.trim());
      navigate("/", { replace: true });
    } catch (nextError) {
      console.error(nextError);
      setError("OTP verification failed. Request a new code and try again.");
    } finally {
      setVerifying(false);
    }
  };

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
      <Card sx={{ width: "100%", maxWidth: 420, borderRadius: 4, position: "relative" }}>
        <IconButton
          onClick={() => navigate("/login", { replace: true })}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                component="img"
                src="/resume-helper-mark.svg"
                alt={APP_SHORT_NAME}
                sx={{ width: 30, height: 30, borderRadius: 1.5 }}
              />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Login with Phone
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {APP_NAME}
                </Typography>
              </Box>
              <VpnKeyIcon sx={{ ml: "auto" }} />
            </Box>

            <Typography color="text.secondary">
              Use your phone number in international format. If you enter a 10-digit number, the app will treat it as an Indian number and prefix +91.
            </Typography>

            {["localhost", "127.0.0.1"].includes(window.location.hostname) && (
              <Alert severity="warning">
                Real Firebase phone auth often fails on localhost because the reCAPTCHA/domain verification step is stricter than Google sign-in. For local development, prefer Firebase test phone numbers or run this app on a real tunnel/domain that is added to Authorized domains.
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}

            <TextField
              fullWidth
              label="Phone number"
              placeholder="+919876543210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={sending || verifying}
            />

            <Box>
              <div id="recaptcha"></div>
            </Box>

            <Button
              variant="contained"
              onClick={sendOTP}
              disabled={sending || verifying || !recaptchaReady}
            >
              {sending ? <CircularProgress size={22} color="inherit" /> : confirm ? "Resend OTP" : "Send OTP"}
            </Button>

            <TextField
              fullWidth
              label="Verification code"
              placeholder="Enter OTP"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={!confirm || verifying}
            />

            <Button
              variant="outlined"
              onClick={verifyOTP}
              disabled={!confirm || verifying}
            >
              {verifying ? <CircularProgress size={22} color="inherit" /> : "Verify and Continue"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
