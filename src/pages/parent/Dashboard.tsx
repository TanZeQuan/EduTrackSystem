import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStudents, type Student } from "../../services/student";
import { getUnreadFeedbackCountByStudent } from "../../services/feedback";

// --- Hooks: Device Detection ---
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

// --- Types ---
type Card = {
  student: Student;
  unread: number;
};

export default function ParentDashboard() {
  const { isMobile, isTablet } = useDeviceType();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setMsg(null);
      setLoading(true);
      try {
        const students = await listStudents();
        const results = await Promise.allSettled(
          students.map(async (s) => {
            const unread = await getUnreadFeedbackCountByStudent(s.id);
            return { student: s, unread } as Card;
          })
        );
        if (!alive) return;
        const ok = results
          .filter((r): r is PromiseFulfilledResult<Card> => r.status === "fulfilled")
          .map((r) => r.value);
        setCards(ok);
      } catch (e: unknown) {
        if (!alive) return;
        setMsg(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  // Responsive styles
  const containerPadding = isMobile ? "16px" : isTablet ? "20px 24px" : "24px 32px";
  const headerFontSize = isMobile ? 22 : isTablet ? 24 : 28;
  const cardPadding = isMobile ? 14 : 16;
  const cardBorderRadius = isMobile ? 10 : 12;
  const avatarSize = isMobile ? 42 : 48;
  const nameFontSize = isMobile ? 16 : 18;
  const gradeFontSize = isMobile ? 13 : 14;

  return (
    <div style={{
      width: "100%",
      maxWidth: "1200px", // Added a max-width for better desktop look
      boxSizing: "border-box",
      padding: containerPadding,
      margin: "0 auto",
      overflowX: "hidden",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: "#334155",
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: isMobile ? 16 : 20,
        gap: 8,
      }}>
        <h2 style={{
          fontSize: headerFontSize,
          fontWeight: 700,
          color: "#0f172a",
          margin: 0,
          lineHeight: 1.2
        }}>
          Dashboard
        </h2>
        <p style={{
          margin: 0,
          fontSize: isMobile ? 13 : 14,
          color: "#64748b",
        }}>
          Overview of your children's progress
        </p>
      </header>

      {/* NEW: Guideline Section */}
      <div style={{
        backgroundColor: "#f0f9ff",
        border: "1px solid #bae6fd",
        borderRadius: isMobile ? 10 : 12,
        padding: isMobile ? "12px" : "16px",
        marginBottom: isMobile ? 20 : 28,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: 12,
      }}>
        <div style={{
          backgroundColor: "#3b82f6",
          color: "#fff",
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: "bold",
          flexShrink: 0
        }}>i</div>
        <div style={{ fontSize: isMobile ? 12 : 13, color: "#0369a1", lineHeight: 1.5 }}>
          <strong>Quick Tip:</strong> Click on a student card below to view their 
          <span style={{ color: "#0c4a6e", fontWeight: 600 }}> Academic Attendance</span>, 
          <span style={{ color: "#0c4a6e", fontWeight: 600 }}> Progress Reports</span>, 
          <span style={{ color: "#0c4a6e", fontWeight: 600 }}> Teacher Feedback</span>, and 
          <span style={{ color: "#0c4a6e", fontWeight: 600 }}> Course Materials</span>.
        </div>
      </div>

      {/* Error Message */}
      {msg && (
        <div style={{
          padding: isMobile ? 12 : 16,
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          borderRadius: isMobile ? 6 : 8,
          marginBottom: 16,
          fontSize: isMobile ? 13 : 14
        }}>
          {msg}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile 
            ? "1fr" 
            : "repeat(auto-fill, minmax(300px, 1fr))",
          gap: isMobile ? 16 : 24,
        }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-card" style={{
              height: 140,
              backgroundColor: "#f8fafc",
              borderRadius: cardBorderRadius,
            }} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          color: "#94a3b8",
          backgroundColor: "#f8fafc",
          borderRadius: 16,
        }}>
          <p>No students linked to your account.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile 
            ? "1fr" 
            : "repeat(auto-fill, minmax(300px, 1fr))",
          gap: isMobile ? 16 : 24,
        }}>
          {cards.map((c) => (
            <Link
              key={c.student.id}
              to={`/parent/students/${c.student.id}`}
              className="student-card"
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: cardBorderRadius,
                padding: cardPadding,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
                gap: 12
              }}>
                <div style={{ display: "flex", gap: 16, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: "12px", 
                    backgroundColor: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 700,
                    color: "#3b82f6",
                    flexShrink: 0,
                  }}>
                    {getInitials(c.student.name)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: nameFontSize,
                      fontWeight: 700,
                      color: "#1e293b",
                      marginBottom: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {c.student.name}
                    </div>
                    <div style={{ fontSize: gradeFontSize, color: "#64748b" }}>
                      Grade: {c.student.grade || "N/A"}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: c.unread > 0 ? "#ef4444" : "#10b981",
                  color: "#fff",
                  textTransform: "uppercase"
                }}>
                 {c.unread > 0 ? `${c.unread} New` : "Up to date"}
                </div>
              </div>

              <div style={{
                borderTop: "1px solid #f1f5f9",
                paddingTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>View Full Profile</span>
                <span style={{ color: "#3b82f6", fontWeight: "bold" }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .student-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1) !important;
          border-color: #3b82f6 !important;
        }
        .skeleton-card {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}