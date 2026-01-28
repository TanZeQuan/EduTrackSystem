import React, { useEffect, useState } from "react";
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
      maxWidth: "100vw",
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
        marginBottom: isMobile ? 20 : 24,
        gap: 8,
      }}>
        <div>
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
            margin: "4px 0 0",
            fontSize: isMobile ? 13 : 14,
            color: "#64748b",
            lineHeight: 1.5
          }}>
            Overview of your children's progress
          </p>
        </div>
      </header>

      {/* Error Message */}
      {msg && (
        <div style={{
          padding: isMobile ? 12 : 16,
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          borderRadius: isMobile ? 6 : 8,
          marginBottom: isMobile ? 16 : 24,
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
            : isTablet 
              ? "repeat(auto-fill, minmax(280px, 1fr))" 
              : "repeat(auto-fill, minmax(300px, 1fr))",
          gap: isMobile ? 16 : 24,
        }}>
          {[1, 2].map((i) => (
            <div 
              key={i} 
              style={{
                height: isMobile ? 120 : 140,
                backgroundColor: "#f8fafc",
                borderRadius: isMobile ? 10 : 16,
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }} 
            />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: isMobile ? 40 : 60,
          color: "#94a3b8",
          backgroundColor: "#f8fafc",
          borderRadius: isMobile ? 12 : 16,
          fontSize: isMobile ? 13 : 14
        }}>
          <p style={{ margin: 0 }}>No students linked to your account.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile 
            ? "1fr" 
            : isTablet 
              ? "repeat(auto-fill, minmax(280px, 1fr))" 
              : "repeat(auto-fill, minmax(300px, 1fr))",
          gap: isMobile ? 16 : 24,
        }}>
          {cards.map((c) => (
            <Link
              key={c.student.id}
              to={`/parent/students/${c.student.id}`}
              style={{
                width: "100%",
                boxSizing: "border-box",
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: cardBorderRadius,
                padding: cardPadding,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                transition: "all 0.2s ease-in-out",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 12px -2px rgba(0, 0, 0, 0.08)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: isMobile ? 12 : 16,
                gap: isMobile ? 10 : 12,
                flexWrap: isMobile ? "wrap" : "nowrap"
              }}>
                <div style={{
                  display: "flex",
                  gap: isMobile ? 12 : 16,
                  minWidth: 0,
                  flex: 1
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 600,
                    color: "#64748b",
                    flexShrink: 0,
                  }}>
                    {getInitials(c.student.name)}
                  </div>

                  {/* Student Info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: nameFontSize,
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {c.student.name}
                    </div>
                    <div style={{
                      fontSize: gradeFontSize,
                      color: "#64748b",
                    }}>
                      {c.student.grade ? `${c.student.grade}` : "No Grade"}
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: isMobile ? "3px 8px" : "4px 10px",
                  borderRadius: 999,
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 600,
                  backgroundColor: c.unread > 0 ? "#fef2f2" : "#f8fafc",
                  color: c.unread > 0 ? "#ef4444" : "#94a3b8",
                  border: `1px solid ${c.unread > 0 ? "#fecaca" : "#e2e8f0"}`,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  {c.unread > 0 ? "●" : "✓"}
                  <span style={{ marginLeft: isMobile ? 4 : 6 }}>
                    {c.unread > 0 ? `${c.unread} New` : "All caught up"}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div style={{
                borderTop: "1px solid #f1f5f9",
                paddingTop: isMobile ? 12 : 16,
                marginTop: isMobile ? 8 : 8
              }}>
                <div style={{
                  fontSize: isMobile ? 12 : 13,
                  color: "#2563eb",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  View Details <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}