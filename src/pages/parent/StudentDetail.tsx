import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listStudents, type Student } from "../../services/student";
import { listAttendanceByStudent, type AttendanceRow } from "../../services/attendance";
import { listFeedback, type FeedbackRow, markFeedbackRead } from "../../services/feedback";
import { listProgressByStudent, type ProgressRow } from "../../services/progress";
import { ChevronLeft, Calendar, MessageSquare, TrendingUp } from "lucide-react";

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

// --- Helper: Status Badge ---
const getStatusBadge = (status: string, isMobile: boolean) => {
  const s = status.toLowerCase();
  const isPresent = s === "present" || s === "on time";
  const isLate = s.includes("late");
  const color = isPresent ? "#16a34a" : isLate ? "#d97706" : "#dc2626";
  const bg = isPresent ? "#dcfce7" : isLate ? "#fef3c7" : "#fee2e2";
  
  return {
    padding: isMobile ? "2px 6px" : "2px 8px",
    borderRadius: 999,
    fontSize: isMobile ? 11 : 12,
    fontWeight: 600,
    backgroundColor: bg,
    color: color,
    textTransform: "capitalize" as const,
    whiteSpace: "nowrap" as const,
  };
};

export default function ParentStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const studentId = id ?? "";

  const { isMobile, isTablet} = useDeviceType();

  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setMsg(null);
      setLoading(true);

      try {
        const students = await listStudents();
        if (!alive) return;

        const s = students.find((x) => x.id === studentId) ?? null;
        setStudent(s);

        if (!s) {
          setMsg("Student not found or not assigned to your account.");
          return;
        }

        const results = await Promise.allSettled([
          listAttendanceByStudent(studentId),
          listFeedback(studentId),
          listProgressByStudent(studentId),
        ]);

        if (!alive) return;

        const [resA, resF, resP] = results;

        const a = resA.status === "fulfilled" ? resA.value : [];
        const f = resF.status === "fulfilled" ? resF.value : [];
        const pr = resP.status === "fulfilled" ? resP.value : [];

        setAttendance(a);
        setProgress(pr);

        // Auto-mark unread feedback
        const unread = f.filter((x) => !x.is_read);
        if (unread.length > 0) {
          markFeedbackReadItems(unread);
          const patched = f.map((x) =>
            x.is_read ? x : { ...x, is_read: true, read_at: new Date().toISOString() }
          );
          setFeedback(patched);
        } else {
          setFeedback(f);
        }
      } catch (e: unknown) {
        if (!alive) return;
        setMsg(e instanceof Error ? e.message : "Failed to load student data");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [studentId]);

  const markFeedbackReadItems = async (items: FeedbackRow[]) => {
    await Promise.allSettled(items.map((x) => markFeedbackRead(x.id)));
  };

  // Responsive styling
  const containerPadding = isMobile ? "16px" : isTablet ? "20px 24px" : "32px 24px";
  const headerFontSize = isMobile ? 20 : isTablet ? 22 : 24;
  const avatarSize = isMobile ? 40 : 48;
  const cardBorderRadius = isMobile ? 12 : 16;
  const cardHeaderPadding = isMobile ? "12px 16px" : "16px 20px";
  const iconSize = isMobile ? 18 : 20;

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? 30 : 40,
        textAlign: "center",
        color: "#64748b",
        fontSize: isMobile ? 13 : 14
      }}>
        Loading student profile...
      </div>
    );
  }

  if (!student && msg) {
    return (
      <div style={{
        padding: isMobile ? 30 : 40,
        textAlign: "center",
        color: "#ef4444",
        fontSize: isMobile ? 13 : 14
      }}>
        {msg}
      </div>
    );
  }

  if (!student) return null;

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: containerPadding,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#334155",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 20 : 24 }}>
        <Link
          to="/parent/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#64748b",
            fontSize: isMobile ? 13 : 14,
            fontWeight: 500,
            marginBottom: isMobile ? 12 : 16,
            transition: "color 0.2s",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          <ChevronLeft size={isMobile ? 16 : 18} />
          Back to Dashboard
        </Link>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 12 : 16,
          flexWrap: "wrap"
        }}>
          <div style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            backgroundColor: "#e0e7ff",
            color: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile ? 16 : 20,
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {student.name.charAt(0)}
          </div>
          
          <div>
            <h2 style={{
              margin: 0,
              fontSize: headerFontSize,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.2
            }}>
              {student.name}
            </h2>
            <span style={{
              marginTop: 4,
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 6,
              backgroundColor: "#f1f5f9",
              color: "#64748b",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 500,
            }}>
              Grade: {student.grade ?? "N/A"}
            </span>
          </div>
        </div>
        
        {msg && (
          <div style={{
            marginTop: isMobile ? 12 : 16,
            color: "#dc2626",
            fontSize: isMobile ? 12 : 14,
            padding: isMobile ? 10 : 12,
            backgroundColor: "#fee2e2",
            borderRadius: isMobile ? 6 : 8
          }}>
            {msg}
          </div>
        )}
      </div>

      {/* Grid Dashboard */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))",
        gap: isMobile ? 16 : 24,
      }}>
        
        {/* 1. Attendance Card */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: cardBorderRadius,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          maxHeight: isMobile ? 400 : 500,
        }}>
          <div style={{
            padding: cardHeaderPadding,
            borderBottom: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "sticky",
            top: 0,
            zIndex: 10,
            flexShrink: 0
          }}>
            <Calendar size={iconSize} style={{ color: "#10b981" }} />
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? 14 : 16,
              fontWeight: 600,
              color: "#1e293b",
            }}>
              Attendance History
            </h3>
          </div>
          
          <div style={{
            padding: 0,
            overflowY: "auto",
            flex: 1,
          }}>
            {attendance.length === 0 ? (
              <div style={{
                padding: isMobile ? 24 : 32,
                textAlign: "center",
                color: "#94a3b8",
                fontSize: isMobile ? 12 : 14,
              }}>
                No attendance records.
              </div>
            ) : (
              <div>
                {attendance.slice(0, 50).map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: isMobile ? "10px 16px" : "12px 20px",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{
                      fontSize: isMobile ? 13 : 14,
                      color: "#334155"
                    }}>
                      {new Date(row.date).toLocaleDateString()}
                    </div>
                    <span style={getStatusBadge(row.status, isMobile)}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Progress Card */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: cardBorderRadius,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          maxHeight: isMobile ? 400 : 500,
        }}>
          <div style={{
            padding: cardHeaderPadding,
            borderBottom: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "sticky",
            top: 0,
            zIndex: 10,
            flexShrink: 0
          }}>
            <TrendingUp size={iconSize} style={{ color: "#8b5cf6" }} />
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? 14 : 16,
              fontWeight: 600,
              color: "#1e293b",
            }}>
              Student Progress
            </h3>
          </div>

          <div style={{
            padding: 0,
            overflowY: "auto",
            flex: 1,
          }}>
            {progress.length === 0 ? (
              <div style={{
                padding: isMobile ? 24 : 32,
                textAlign: "center",
                color: "#94a3b8",
                fontSize: isMobile ? 12 : 14,
              }}>
                No progress records.
              </div>
            ) : (
              <div>
                {progress
                  .slice()
                  .sort((a, b) =>
                    new Date(b.progress_date).getTime() - new Date(a.progress_date).getTime()
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: isMobile ? "12px 16px" : "14px 20px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? 6 : 8,
                      }}
                    >
                      {/* Date */}
                      <div style={{
                        fontSize: isMobile ? 11 : 12,
                        color: "#94a3b8",
                        fontFamily: "monospace",
                      }}>
                        {new Date(p.progress_date).toISOString().slice(0, 10)}
                      </div>

                      {/* Subject */}
                      <div style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "baseline",
                        flexWrap: "wrap"
                      }}>
                        <span style={{
                          fontSize: isMobile ? 11 : 12,
                          color: "#64748b",
                          minWidth: isMobile ? 36 : 44,
                          flexShrink: 0
                        }}>
                          科目：
                        </span>
                        <span style={{
                          fontSize: isMobile ? 12 : 13,
                          fontWeight: 700,
                          color: "#1e293b",
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}>
                          {p.subject || "-"}
                        </span>
                      </div>

                      {/* Title */}
                      <div style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "baseline"
                      }}>
                        <span style={{
                          fontSize: isMobile ? 11 : 12,
                          color: "#64748b",
                          minWidth: isMobile ? 36 : 44,
                          flexShrink: 0
                        }}>
                          课程：
                        </span>
                        <span style={{
                          fontSize: isMobile ? 12 : 13,
                          color: "#0f172a",
                          fontWeight: 600,
                          lineHeight: 1.4
                        }}>
                          {p.title || "-"}
                        </span>
                      </div>

                      {/* Note */}
                      {p.note && (
                        <div style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start"
                        }}>
                          <span style={{
                            fontSize: isMobile ? 11 : 12,
                            color: "#64748b",
                            minWidth: isMobile ? 36 : 44,
                            flexShrink: 0
                          }}>
                            Note：
                          </span>
                          <span style={{
                            fontSize: isMobile ? 12 : 13,
                            color: "#475569",
                            lineHeight: 1.5,
                            flex: 1
                          }}>
                            {p.note}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Feedback Card */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: cardBorderRadius,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          maxHeight: isMobile ? 400 : 500,
        }}>
          <div style={{
            padding: cardHeaderPadding,
            borderBottom: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "sticky",
            top: 0,
            zIndex: 10,
            flexShrink: 0
          }}>
            <MessageSquare size={iconSize} style={{ color: "#f59e0b" }} />
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? 14 : 16,
              fontWeight: 600,
              color: "#1e293b",
            }}>
              Teacher Feedback
            </h3>
          </div>
          
          <div style={{
            padding: 0,
            overflowY: "auto",
            flex: 1,
          }}>
            {feedback.length === 0 ? (
              <div style={{
                padding: isMobile ? 24 : 32,
                textAlign: "center",
                color: "#94a3b8",
                fontSize: isMobile ? 12 : 14,
              }}>
                No feedback messages.
              </div>
            ) : (
              <div>
                {feedback.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: isMobile ? "10px 16px" : "12px 20px",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      <span style={{
                        fontSize: isMobile ? 11 : 12,
                        color: "#94a3b8"
                      }}>
                        {new Date(row.created_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <span style={{
                        fontSize: isMobile ? 9 : 10,
                        color: "#cbd5e1",
                        border: "1px solid #e2e8f0",
                        padding: "1px 6px",
                        borderRadius: 4,
                        whiteSpace: "nowrap"
                      }}>
                        {row.is_read ? "Seen" : "New"}
                      </span>
                    </div>
                    <div style={{
                      fontSize: isMobile ? 13 : 14,
                      color: "#334155",
                      lineHeight: 1.5,
                      wordBreak: "break-word"
                    }}>
                      {row.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}