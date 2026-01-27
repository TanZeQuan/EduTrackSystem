import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStudents, type Student } from "../../services/student";
import { getUnreadFeedbackCountByStudent } from "../../services/feedback";

// --- Types ---
type Card = {
  student: Student;
  unread: number;
};

// --- Styles ---
const styles = {
  container: {
    // CHANGE 1: Ensure container doesn't overflow mobile screens
    width: "100%",
    maxWidth: "100vw", // Ensure it never exceeds viewport width
    boxSizing: "border-box" as const, // Crucial: Includes padding in width calculation

    // 2. Reduce padding on mobile (16px is standard for phones)
    padding: "20px 16px",
    margin: "0 auto",

    // 3. Prevent the whole page from scrolling sideways
    overflowX: "hidden" as const,

    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#334155",
  },
  header: {
   display: "flex",
    flexDirection: "column" as const, // Stack items vertically on mobile
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  // (Optional: If you had a button here, flexWrap in header handles it)

  grid: {
    display: "grid",
    // CHANGE 3: Reduced min-width from 320px to 280px.
    // 320px causes horizontal scrolling on many Android phones (360px width)
    // when you account for the container padding.
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 24,
  },
  card: {
   width: "100%", // Force card to fit container
    boxSizing: "border-box" as const, // Prevent padding from breaking layout
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 16, // Reduced padding inside cards for mobile
    marginBottom: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 600,
    color: "#64748b",
    // Prevent avatar from shrinking in flex container
    flexShrink: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: 4,
  },
  grade: {
    fontSize: 14,
    color: "#64748b",
  },
  badge: (count: number) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: count > 0 ? "#fef2f2" : "#f8fafc",
    color: count > 0 ? "#ef4444" : "#94a3b8",
    border: `1px solid ${count > 0 ? "#fecaca" : "#e2e8f0"}`,
    // Prevent badge from shrinking
    whiteSpace: "nowrap" as const,
  }),
  arrow: {
    marginTop: 16,
    fontSize: 13,
    color: "#2563eb",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  skeleton: {
    height: 140,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },
};

export default function ParentDashboard() {
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Dashboard</h2>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Overview of your children's progress
          </p>
        </div>
      </header>

      {/* Error Message */}
      {msg && (
        <div style={{ padding: 16, backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 24 }}>
          {msg}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={styles.grid}>
          {[1, 2].map((i) => (
            <div key={i} style={styles.skeleton} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", backgroundColor: "#f8fafc", borderRadius: 16 }}>
          <p>No students linked to your account.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {cards.map((c) => (
            <Link
              key={c.student.id}
              to={`/parent/students/${c.student.id}`}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
              }}
            >
              <div style={styles.cardHeader}>
                <div style={{ display: "flex", gap: 16 }}>
                  {/* Avatar */}
                  <div style={styles.avatar}>
                    {getInitials(c.student.name)}
                  </div>

                  {/* Student Info */}
                  <div>
                    <div style={styles.name}>{c.student.name}</div>
                    <div style={styles.grade}>
                      {c.student.grade ? `${c.student.grade}` : "No Grade"}
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <div style={styles.badge(c.unread)}>
                  {c.unread > 0 ? "●" : "✓"}
                  <span style={{ marginLeft: 6 }}>
                    {c.unread > 0 ? `${c.unread} New` : "All caught up"}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: 8 }}>
                <div style={styles.arrow}>
                  View Details <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}