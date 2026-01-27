import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";

import LoginPage from "./pages/login/LoginPage";
import Unauthorized from "./pages/Unauthorized";

import AdminLayout from "./layout/AdminLayout";
import ParentLayout from "./layout/ParentLayout";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminAttendance from "./pages/admin/Attendance";
import AdminMaterials from "./pages/admin/Materials";
import AdminFeedback from "./pages/admin/feedback";
import AdminProgress from "./pages/admin/Progress";

import ParentDashboard from "./pages/parent/Dashboard";
import ParentStudentDetail from "./pages/parent/StudentDetail";

import { useAuth } from "./auth/authContext";

function RoleHome() {
  const { role, loading, userId } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!userId) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/parent/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<RoleHome />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireAuth allow={["admin"]}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="materials" element={<AdminMaterials />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="progress" element={<AdminProgress />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Parent */}
      <Route
        path="/parent"
        element={
          <RequireAuth allow={["parent", "admin"]}>
            <ParentLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="students/:id" element={<ParentStudentDetail />} />
        {/* <Route path="materials" element={<ParentMaterialsCenter />} /> */}
        <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
