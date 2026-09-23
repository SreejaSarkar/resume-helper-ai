import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import App from "./App.jsx";
import AuthProvider from "./utils/AuthProvider.jsx";
import { ResumeDraftProvider } from "./utils/ResumeDraftContext.jsx";
import theme from "./theme"; // 👈 make sure this file exists

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <ResumeDraftProvider>
            <App />
          </ResumeDraftProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
