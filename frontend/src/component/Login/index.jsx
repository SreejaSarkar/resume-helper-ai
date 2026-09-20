import React from "react";
import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import GoogleIcon from "@mui/icons-material/Google";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../utils/firebase";
import { APP_NAME, APP_SHORT_NAME } from "../../utils/brand";

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      // Firebase user object
      const user = result.user;

      console.log("Google Login Success:", user);

      // redirect after login
      navigate("/");
    } catch (error) {
      console.error("Google Login Error:", error);
      alert(error.message);
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(255,255,255,0.2)",
      }}
    >
      <Card
        sx={{
          width: { xs: "85%", sm: 420 },
          borderRadius: 4,
          backgroundColor: "#000",
          color: "#fff",
        }}
      >
        <CardContent>
          {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                component="img"
                src="/resume-helper-mark.svg"
                alt={APP_SHORT_NAME}
                sx={{ width: 34, height: 34, borderRadius: 1.5 }}
              />
              <Box>
                <Typography variant="h5">Login</Typography>
                <Typography fontSize={12} color="grey.400">
                  {APP_NAME}
                </Typography>
              </Box>
            </Box>
            <VpnKeyIcon />
          </Box>

          {/* Buttons */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<EmailIcon />}
              sx={authBtnStyle}
              onClick={() => navigate("/login/email")}
            >
              Continue with Email
            </Button>

            <Button
              variant="contained"
              fullWidth
              startIcon={<PhoneIphoneIcon />}
              sx={authBtnStyle}
              onClick={() => navigate("/login/phone")}
            >
              Continue with Phone
            </Button>

            <Button
              variant="contained"
              fullWidth
              startIcon={<GoogleIcon sx={{ color: "red" }} />}
              sx={authBtnStyle}
              onClick={handleGoogleLogin}
            >
              Sign in with Google
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

const authBtnStyle = {
  backgroundColor: "#fff",
  color: "#000",
  borderRadius: "30px",
  fontSize: "18px",
  padding: "14px",
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#f5f5f5",
  },
};

export default Login;
