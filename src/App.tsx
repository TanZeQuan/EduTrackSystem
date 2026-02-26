import  { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";
import { useAuth } from "./auth/authContext";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";

// ✅ Lazy pages
const LoginPage = lazy(() => import("./pages/login/LoginPage"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

const AdminLayout = lazy(() => import("./layout/AdminLayout"));
const ParentLayout = lazy(() => import("./layout/ParentLayout"));

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminStudents = lazy(() => import("./pages/admin/Students"));
const AdminAttendance = lazy(() => import("./pages/admin/Attendance"));
const AdminMaterials = lazy(() => import("./pages/admin/Materials"));
const AdminFeedback = lazy(() => import("./pages/admin/feedback"));
const AdminProgress = lazy(() => import("./pages/admin/Progress"));

const ParentDashboard = lazy(() => import("./pages/parent/Dashboard"));
const ParentStudentDetail = lazy(() => import("./pages/parent/StudentDetail"));

function RoleHome() {
  const { role, loading, userId } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!userId) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/parent/dashboard" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
          <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
