import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext";
import type { Role } from "../auth/type";

export default function RequireAuth({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow?: Role[];
}) {
  const { loading, userId, role } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!userId) return <Navigate to="/login" replace />;

  if (allow && role && !allow.includes(role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
