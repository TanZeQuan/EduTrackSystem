import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// --- Hooks: 检测移动端 ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// --- Icons (视觉锚点) ---
const IconUsers = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: "#3b82f6" }}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCalendar = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: "#10b981" }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconMessage = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: "#8b5cf6" }}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconChart = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: "#ec4899" }}
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

// --- Components ---
function DashboardCard(props: {
  to: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={props.to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textDecoration: "none",
        color: "inherit",
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover
          ? "0 10px 15px -3px rgba(0,0,0,0.1)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        borderColor: hover ? "#cbd5e1" : "#e2e8f0",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        {props.icon}
      </div>
      <div>
        <b
          style={{
            fontSize: 18,
            color: "#1e293b",
            display: "block",
            marginBottom: 6,
          }}
        >
          {props.title}
        </b>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
          {props.desc}
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const isMobile = useIsMobile();

  const containerStyle = {
    padding: isMobile ? "24px 16px" : "40px",
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#334155",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 24,
    marginTop: 32,
  };

  const workflowStyle = {
    marginTop: 40,
    backgroundColor: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 16,
    padding: isMobile ? 20 : 32,
  };

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={{ marginBottom: 8 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 8px 0",
          }}
        >
          Admin Dashboard
        </h2>
        <p style={{ margin: 0, fontSize: 16, color: "#64748b" }}>
          Welcome back. Here is an overview of your school management tools.
        </p>
      </div>

      {/* Cards Grid */}
      <div style={gridStyle}>
        <DashboardCard
          to="/admin/students"
          title="Students"
          desc="Manage student profiles & parent links."
          icon={<IconUsers />}
        />
        <DashboardCard
          to="/admin/attendance"
          title="Attendance"
          desc="Mark and review daily attendance."
          icon={<IconCalendar />}
        />
        <DashboardCard
          to="/admin/feedback"
          title="Feedback"
          desc="Communicate with parents via messages."
          icon={<IconMessage />}
        />
        <DashboardCard
          to="/admin/progress"
          title="Progress"
          desc="Track academic scores and comments."
          icon={<IconChart />}
        />
      </div>

      {/* Workflow Section */}
      <div style={workflowStyle}>
        <h3 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: 18 }}>
          💡 Quick Workflow Guide
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { step: 1, text: "Create Students", sub: "Assign to parents" },
            { step: 2, text: "Mark Attendance", sub: "Daily routine" },
            { step: 3, text: "Send Feedback", sub: "Weekly updates" },
            { step: 4, text: "Update Progress", sub: "Exam results" },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#334155",
                    fontSize: 14,
                  }}
                >
                  {item.text}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
