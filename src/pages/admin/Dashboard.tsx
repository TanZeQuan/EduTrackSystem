import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// --- Hooks: Device Detection with Breakpoints ---
function useDeviceType() {
  const [deviceType, setDeviceType] = useState({
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDeviceType({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024
      });
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
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
  isMobile: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  return (
    <Link
      to={props.to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      style={{
        textDecoration: "none",
        color: "inherit",
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: props.isMobile ? 12 : 16,
        padding: props.isMobile ? 16 : 24,
        display: "flex",
        flexDirection: "column",
        gap: props.isMobile ? 10 : 12,
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        transform: hover || active ? "translateY(-4px)" : "none",
        boxShadow: hover || active
          ? "0 10px 15px -3px rgba(0,0,0,0.1)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        borderColor: hover || active ? "#cbd5e1" : "#e2e8f0",
        WebkitTapHighlightColor: "transparent",
        cursor: "pointer",
        minHeight: props.isMobile ? "auto" : "180px"
      }}
    >
      <div
        style={{
          width: props.isMobile ? 42 : 48,
          height: props.isMobile ? 42 : 48,
          borderRadius: props.isMobile ? 10 : 12,
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: props.isMobile ? 2 : 4,
          flexShrink: 0
        }}
      >
        <div style={{ transform: props.isMobile ? "scale(0.9)" : "scale(1)" }}>
          {props.icon}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <b
          style={{
            fontSize: props.isMobile ? 16 : 18,
            color: "#1e293b",
            display: "block",
            marginBottom: props.isMobile ? 4 : 6,
            lineHeight: 1.3
          }}
        >
          {props.title}
        </b>
        <div style={{ 
          fontSize: props.isMobile ? 13 : 14, 
          color: "#64748b", 
          lineHeight: 1.5 
        }}>
          {props.desc}
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { isMobile, isTablet } = useDeviceType();

  // Responsive styling
  const containerStyle: React.CSSProperties = {
    padding: isMobile ? "16px" : isTablet ? "24px" : "40px",
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#334155",
    width: "100%",
    boxSizing: "border-box"
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile 
      ? "1fr" 
      : isTablet 
        ? "repeat(2, 1fr)" 
        : "repeat(auto-fill, minmax(260px, 1fr))",
    gap: isMobile ? 16 : isTablet ? 20 : 24,
    marginTop: isMobile ? 20 : isTablet ? 24 : 32
  };

  const workflowStyle: React.CSSProperties = {
    marginTop: isMobile ? 24 : isTablet ? 32 : 40,
    backgroundColor: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: isMobile ? 12 : 16,
    padding: isMobile ? 16 : isTablet ? 24 : 32
  };

  const workflowGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
        ? "repeat(2, 1fr)"
        : "repeat(auto-fit, minmax(200px, 1fr))",
    gap: isMobile ? 12 : 16
  };

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={{ marginBottom: isMobile ? 4 : 8 }}>
        <h2
          style={{
            fontSize: isMobile ? 22 : isTablet ? 24 : 28,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 8px 0",
            lineHeight: 1.2
          }}
        >
          Admin Dashboard
        </h2>
        <p style={{ 
          margin: 0, 
          fontSize: isMobile ? 14 : 16, 
          color: "#64748b",
          lineHeight: 1.5
        }}>
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
          isMobile={isMobile}
        />
        <DashboardCard
          to="/admin/attendance"
          title="Attendance"
          desc="Mark and review daily attendance."
          icon={<IconCalendar />}
          isMobile={isMobile}
        />
        <DashboardCard
          to="/admin/feedback"
          title="Feedback"
          desc="Communicate with parents via messages."
          icon={<IconMessage />}
          isMobile={isMobile}
        />
        <DashboardCard
          to="/admin/progress"
          title="Progress"
          desc="Record all student progress."
          icon={<IconChart />}
          isMobile={isMobile}
        />
      </div>

      {/* Workflow Section */}
      <div style={workflowStyle}>
        <h3 style={{ 
          margin: "0 0 16px 0", 
          color: "#1e293b", 
          fontSize: isMobile ? 16 : 18,
          lineHeight: 1.3
        }}>
          💡 Quick Workflow Guide
        </h3>

        <div style={workflowGridStyle}>
          {[
            { step: 1, text: "Create Students", sub: "Assign to parents" },
            { step: 2, text: "Mark Attendance", sub: "Daily routine" },
            { step: 3, text: "Send Feedback", sub: "Weekly updates" },
            { step: 4, text: "Update Progress", sub: "Student Progress" },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                display: "flex",
                gap: isMobile ? 10 : 12,
                alignItems: "flex-start",
                padding: isMobile ? "8px 0" : "4px 0"
              }}
            >
              <div
                style={{
                  width: isMobile ? 22 : 24,
                  height: isMobile ? 22 : 24,
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: isMobile ? 11 : 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#334155",
                    fontSize: isMobile ? 13 : 14,
                    lineHeight: 1.4
                  }}
                >
                  {item.text}
                </div>
                <div style={{ 
                  fontSize: isMobile ? 11 : 12, 
                  color: "#94a3b8",
                  lineHeight: 1.4
                }}>
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