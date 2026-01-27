import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listStudents, type Student } from "../../services/student";
import { listAttendanceByStudent, type AttendanceRow } from "../../services/attendance";
import { listFeedback, type FeedbackRow, markFeedbackRead } from "../../services/feedback";
import { listProgressByStudent, type ProgressRow } from "../../services/progress";

// --- 1. Responsive Hook ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

// --- 2. Icons ---
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconAttendance = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#10b981" }}>
    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconFeedback = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#f59e0b" }}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconProgress = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#8b5cf6" }}>
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

// --- 3. Styles & Helpers ---
const styles = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#334155",
  },
  header: {
    marginBottom: 24,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    textDecoration: "none",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 16,
    transition: "color 0.2s",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    flexShrink: 0,
  },
  studentName: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
  },
  gradeBadge: {
    marginTop: 4,
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 500,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 24,
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column" as const,
    maxHeight: 500,
  },
  cardHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    gap: 10,
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#1e293b",
  },
  cardBody: {
    padding: 0,
    overflowY: "auto" as const,
    flex: 1,
  },
  emptyState: {
    padding: 32,
    textAlign: "center" as const,
    color: "#94a3b8",
    fontSize: 14,
  },
  listItem: {
    padding: "12px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: (status: string) => {
    const s = status.toLowerCase();
    const isPresent = s === "present" || s === "on time";
    const isLate = s.includes("late");
    const color = isPresent ? "#16a34a" : isLate ? "#d97706" : "#dc2626";
    const bg = isPresent ? "#dcfce7" : isLate ? "#fef3c7" : "#fee2e2";
    return {
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: bg,
      color: color,
      textTransform: "capitalize" as const,
    };
  },
};

// --- 4. Main Component ---
export default function ParentStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const studentId = id ?? "";

  const isMobile = useIsMobile();

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
          markFeedbackReadItems(unread); // fire & forget
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

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading student profile...
      </div>
    );
  }

  if (!student && msg) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
        {msg}
      </div>
    );
  }

  if (!student) return null;

  return (
    <div
      style={{
        ...styles.container,
        padding: isMobile ? "20px 16px" : "32px 24px",
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <Link to="/parent/dashboard" style={styles.backLink}>
          <IconBack /> Back to Dashboard
        </Link>
        <div style={styles.titleRow}>
          <div style={styles.avatar}>{student.name.charAt(0)}</div>
          <div>
            <h2 style={styles.studentName}>{student.name}</h2>
            <span style={styles.gradeBadge}>
              Grade: {student.grade ?? "N/A"}
            </span>
          </div>
        </div>
        {msg && (
          <div style={{ marginTop: 16, color: "#dc2626", fontSize: 14 }}>
            {msg}
          </div>
        )}
      </div>

      {/* Grid Dashboard */}
      <div style={styles.grid}>
        {/* 1. Attendance */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <IconAttendance />
            <h3 style={styles.cardTitle}>Attendance History</h3>
          </div>
          <div style={styles.cardBody}>
            {attendance.length === 0 ? (
              <div style={styles.emptyState}>No attendance records.</div>
            ) : (
              <div>
                {attendance.slice(0, 50).map((row) => (
                  <div key={row.id} style={styles.listItem}>
                    <div style={{ fontSize: 14, color: "#334155" }}>
                      {new Date(row.date).toLocaleDateString()}
                    </div>
                    <span style={styles.statusBadge(row.status)}>{row.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Progress */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <IconProgress />
            <h3 style={styles.cardTitle}>Student Progress</h3>
          </div>

          <div style={styles.cardBody}>
            {progress.length === 0 ? (
              <div style={styles.emptyState}>No progress records.</div>
            ) : (
              <div>
                {progress
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.progress_date).getTime() - new Date(a.progress_date).getTime()
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {/* Header row: Title + Date */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >

                        <div
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            fontFamily: "monospace",
                          }}
                        >
                          {new Date(p.progress_date).toISOString().slice(0, 10)}
                        </div>
                      </div>

                      {/* 科目 */}
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ fontSize: 12, color: "#64748b", minWidth: 44 }}>
                          科目：
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#1e293b",
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            padding: "2px 8px",
                            borderRadius: 999,
                          }}
                        >
                          {p.subject || "-"}
                        </span>
                      </div>

                      {/* 课程 */}
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ fontSize: 12, color: "#64748b", minWidth: 44 }}>
                          课程：
                        </span>
                        <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
                          {p.title || "-"}
                        </span>
                      </div>

                      {/* Note（有才显示） */}
                      {p.note && (
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <span style={{ fontSize: 12, color: "#64748b", minWidth: 44 }}>
                            Note：
                          </span>
                          <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
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

        {/* 3. Feedback */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <IconFeedback />
            <h3 style={styles.cardTitle}>Teacher Feedback</h3>
          </div>
          <div style={styles.cardBody}>
            {feedback.length === 0 ? (
              <div style={styles.emptyState}>No feedback messages.</div>
            ) : (
              <div>
                {feedback.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      ...styles.listItem,
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        {new Date(row.created_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#cbd5e1",
                          border: "1px solid #e2e8f0",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {row.is_read ? "Seen" : "New"}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.5 }}>
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
