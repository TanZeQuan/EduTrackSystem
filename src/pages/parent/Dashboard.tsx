import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStudents, type Student } from "../../services/student";
import { getUnreadFeedbackCountByStudent } from "../../services/feedback";

// --- Types ---
type Card = {
  student: Student;
  unread: number;
};

// --- Styles (可以使用 CSS Modules 或 Tailwind，这里为了方便演示使用了对象样式) ---
const styles = {
  container: {
    padding: "40px 24px",
    maxWidth: 1024,
    margin: "0 auto",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#334155", // Slate-700
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a", // Slate-900
    margin: 0,
  },
  linkBtn: {
    textDecoration: "none",
    color: "#2563eb", // Blue-600
    fontWeight: 500,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "8px 16px",
    borderRadius: 8,
    backgroundColor: "#eff6ff", // Blue-50
    transition: "all 0.2s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", // 响应式网格
    gap: 24,
  },
  card: {
    display: "block",
    textDecoration: "none",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0", // Slate-200
    borderRadius: 16,
    padding: 24,
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    cursor: "pointer",
    position: "relative" as const,
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
    backgroundColor: "#f1f5f9", // Slate-100
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 600,
    color: "#64748b",
  },
  name: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: 4,
  },
  grade: {
    fontSize: 14,
    color: "#64748b", // Slate-500
  },
  badge: (count: number) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: count > 0 ? "#fef2f2" : "#f8fafc", // Red-50 vs Slate-50
    color: count > 0 ? "#ef4444" : "#94a3b8", // Red-500 vs Slate-400
    border: `1px solid ${count > 0 ? "#fecaca" : "#e2e8f0"}`,
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

  // 简单的首字母提取函数
  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div style={styles.container}>
      {/* 头部区域 */}
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Dashboard</h2>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Overview of your children's progress
          </p>
        </div>
        <Link to="/parent/materials" style={styles.linkBtn}>
          <span>Materials Center</span>
          <span>→</span>
        </Link>
      </header>

      {/* 错误提示 */}
      {msg && (
        <div style={{ padding: 16, backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 24 }}>
          {msg}
        </div>
      )}

      {/* 内容区域 */}
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
              // 添加简单的 Hover 效果模拟 (实际项目中建议用 CSS 类)
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
                  {/* 头像 */}
                  <div style={styles.avatar}>
                    {getInitials(c.student.name)}
                  </div>
                  
                  {/* 学生信息 */}
                  <div>
                    <div style={styles.name}>{c.student.name}</div>
                    <div style={styles.grade}>
                      {c.student.grade ? `${c.student.grade}` : "No Grade"}
                    </div>
                  </div>
                </div>

                {/* 未读标记 (右上角) */}
                <div style={styles.badge(c.unread)}>
                   {c.unread > 0 ? "●" : "✓"} 
                   <span style={{ marginLeft: 6 }}>
                     {c.unread > 0 ? `${c.unread} New` : "All caught up"}
                   </span>
                </div>
              </div>

              {/* 卡片底部行动点 */}
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