import { useContext } from "react";
import { AuthContext } from "./utils/AuthContext";
import { Box } from "@mui/material";
import React from "react";
import SideBar from "./component/SideBar/SideBar";
import { Route, Routes } from "react-router-dom";
import Login from "./component/Login";
import EmailLogin from "./component/EmailLogin";
import PhoneLogin from "./component/PhoneLogin";
import FinishEmailLogin from "./component/FinishEmailLogin";
import ProtectedRoute from "./utils/ProtectedRoute";
import Dashboard from "./component/Dashboard/Dashboard";
import Admin from "./component/Admin";
import AutoOptimize from "./component/AutoOptimize";
import InterviewPrep from "./component/InterviewPrep";
import Footer from "./component/Footer";
import History from "./component/History/index"
import NotFound from "./component/NotFound";
import PublicRoute from "./utils/PublicRoute";
import AdminRoute from "./utils/AdminRoute";
import Header from "./component/Header";

function App() {
  const { user, loading } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (loading) return null; // or loader

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {user && <Header onMenuClick={() => setSidebarOpen(prev => !prev)} />}
      {user && (
        <SideBar open={sidebarOpen} setOpen={setSidebarOpen} />
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: { xs: 0, md: sidebarOpen ? "280px" : 0 },
          mt: user ? "64px" : 0,   // 🔥 critical fix
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "whitesmoke",
        }}
      >

        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <Routes>
            <Route path="*" element={<NotFound />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/login/email"
              element={
                <PublicRoute>
                  <EmailLogin />
                </PublicRoute>
              }
            />
            <Route
              path="/login/phone"
              element={
                <PublicRoute>
                  <PhoneLogin />
                </PublicRoute>
              }
            />
            <Route path="/finish-signin" element={<FinishEmailLogin />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />

            <Route
              path="/auto-optimize"
              element={
                <ProtectedRoute>
                  <AutoOptimize />
                </ProtectedRoute>
              }
            />

            <Route
              path="/interview-prep"
              element={
                <ProtectedRoute>
                  <InterviewPrep />
                </ProtectedRoute>
              }
            />

            <Route
              path="/star-stories"
              element={
                <ProtectedRoute>
                  <InterviewPrep />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Box>

        <Footer />
      </Box>
    </Box>
  );
}
export default App
