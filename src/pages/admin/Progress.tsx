import React, { useEffect, useMemo, useState } from "react";
import { listStudents, type Student } from "../../services/student";
import {
  listProgressAll,
  createProgress,
  deleteProgress,
  type ProgressRow,
  updateProgress,
} from "../../services/progress";

// 简单的 Badge 组件：根据日期判断是 "Planned" (未来) 还是 "Done" (已完成)
function Badge({ isFuture }: { isFuture: boolean }) {
  const text = isFuture ? "Planned" : "Done";
  const bg = isFuture ? "#fff6e5" : "#e9f9ef";
  const bd = isFuture ? "#ffd59a" : "#bfeccc";
  const color = isFuture ? "#8a5a00" : "#137a3a";
  
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: bg, border: `1px solid ${bd}`, color, fontWeight: 600 }}>
      {text}
    </span>
  );
}

export default function AdminLessonLog() {
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // 筛选状态
  const [qStudent, setQStudent] = useState("");
  const [qSubject, setQSubject] = useState("");

  // 排序状态: 默认按 "上课日期" 倒序
  const [sortBy, setSortBy] = useState<"progress_date" | "created_at">("progress_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const studentMap = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const load = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const [stu, pr] = await Promise.all([listStudents(), listProgressAll()]);
      setStudents(stu);
      setRows(pr);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const ns = qStudent.trim().toLowerCase();
    const nq = qSubject.trim().toLowerCase();

    const list = rows.filter((r) => {
      const s = studentMap.get(r.student_id);
      const stuName = (s?.name ?? "").toLowerCase();
      
      const subj = (r.subject ?? "").toLowerCase();
      const topic = (r.title ?? "").toLowerCase();

      // 搜索逻辑
      if (ns && !stuName.includes(ns)) return false;
      // 在 Subject 或 Topic 中搜索
      if (nq && !subj.includes(nq) && !topic.includes(nq)) return false;

      return true;
    });

    list.sort((a, b) => {
      const dateStrA = sortBy === "progress_date" ? a.progress_date : a.created_at;
      const dateStrB = sortBy === "progress_date" ? b.progress_date : b.created_at;

      const ta = new Date(dateStrA).getTime();
      const tb = new Date(dateStrB).getTime();
      return sortDir === "desc" ? tb - ta : ta - tb;
    });

    return list;
  }, [rows, qStudent, qSubject, sortBy, sortDir, studentMap]);

  const onReset = () => {
    setQStudent("");
    setQSubject("");
  };

  const toggleSort = (key: "progress_date" | "created_at") => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir("desc");
      return;
    }
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  };

  // --- Add New Record ---
  const onAdd = async () => {
    if (students.length === 0) {
      setMsg("No students yet. Create students first.");
      return;
    }

    // 智能选择：如果搜索框有值，默认选中搜索结果的第一个学生
    let targetStudent = students[0];
    if (qStudent) {
        const found = students.find(s => s.name.toLowerCase().includes(qStudent.toLowerCase()));
        if (found) targetStudent = found;
    }

    const sid = targetStudent.id; 
    const studentName = targetStudent.name;

    // 1. Subject
    const subject = window.prompt(`[Student: ${studentName}]\nSubject? (e.g. Math, BM)`, "BM")?.trim();
    if (!subject) return;

    // 2. Topic
    const title = window.prompt(`[Subject: ${subject}]\nWhat was taught? (e.g. Bab 1.1)`, "")?.trim() ?? "";

    // 3. Date
    const date = window.prompt("Date? (yyyy-mm-dd)", new Date().toISOString().slice(0, 10))?.trim();
    if (!date) return;

    // 4. Score
    const scoreStr = window.prompt("Score? (Optional)", "") ?? "";
    const score = scoreStr.trim() ? Number(scoreStr.trim()) : null;

    // 5. Note
    const note = window.prompt("Note/Homework? (Optional)", "") ?? "";

    setMsg(null);
    try {
      await createProgress({
        student_id: sid,
        subject,
        title,
        progress_date: date,
        score,
        note,
      });
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this record?")) return;
    setMsg(null);
    try {
      await deleteProgress(id);
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const onEdit = async (row: ProgressRow) => {
    const subject = window.prompt("Edit Subject", row.subject)?.trim();
    if (!subject) return;

    const title = window.prompt("Edit Topic", row.title ?? "")?.trim() ?? "";

    const date = window.prompt("Edit Date (yyyy-mm-dd)", row.progress_date)?.trim();
    if (!date) return;

    const scoreStr = window.prompt("Edit Score (optional)", row.score?.toString() ?? "") ?? "";
    const score = scoreStr.trim() ? Number(scoreStr.trim()) : null;

    const note = window.prompt("Edit Note (optional)", row.note ?? "") ?? "";

    setMsg(null);
    try {
      await updateProgress(row.id, { subject, title, progress_date: date, score, note });
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ fontWeight: 800, letterSpacing: 0.5, fontSize: 18 }}>STUDENT LESSON LOGS</div>

      {/* Filter Bar */}
      <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Filter Logs</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr", gap: 12, alignItems: "center" }}>
          <input
            value={qStudent}
            onChange={(e) => setQStudent(e.target.value)}
            placeholder="Search Student..."
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
          <input
            value={qSubject}
            onChange={(e) => setQSubject(e.target.value)}
            placeholder="Search Subject or Topic..."
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
          <button onClick={onReset} style={{ padding: "10px", borderRadius: 10, cursor: "pointer", border: "1px solid #ccc", background: "#fff" }}>
            Reset
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onAdd} style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", background: "#2563eb", color: "white", border: "none", fontWeight: 600 }}>
          + Log Today's Lesson
        </button>
        <div style={{ fontSize: 12, color: "#666" }}>
           Sorted by: <b>{sortBy === "progress_date" ? "Lesson Date" : "Created Time"}</b>
        </div>
      </div>

      {/* Error Msg */}
      {msg && <div style={{ color: "#b00020", fontWeight: 600 }}>{msg}</div>}

      {/* Table */}
      <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            // 调整了 grid 比例：加入 Teacher 列
            gridTemplateColumns: "1.2fr 1fr 2.2fr 1.2fr 1fr 0.8fr 1.2fr",
            padding: "12px 12px",
            background: "#fafafa",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
            borderBottom: "1px solid #eee",
            color: "#555"
          }}
        >
          <div>STUDENT</div>
          <div>SUBJECT</div>
          <div>TOPIC / CHAPTER</div>
          <div style={{ cursor: "pointer" }} onClick={() => toggleSort("progress_date")}>
            DATE {sortBy === "progress_date" ? (sortDir === "desc" ? "▼" : "▲") : ""}
          </div>
          {/* 新增 Teacher 列 */}
          <div>TEACHER</div>
          <div>STATUS</div>
          <div>ACTIONS</div>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "#666" }}>Loading records...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", opacity: 0.75 }}>No lesson records found.</div>
        ) : (
          filtered.map((r) => {
            const stu = studentMap.get(r.student_id);
            // 判断是否是未来课程
            const isFuture = new Date(r.progress_date).getTime() > new Date().getTime();
            
            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 2.2fr 1.2fr 1fr 0.8fr 1.2fr",
                  padding: "12px 12px",
                  borderTop: "1px solid #eee",
                  alignItems: "center",
                  fontSize: 13,
                  background: "#fff"
                }}
              >
                <div style={{ fontWeight: 600 }}>{stu?.name ?? r.student_id}</div>
                
                {/* Subject */}
                <div>
                  <span style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontSize: 11, color: "#374151" }}>
                    {r.subject}
                  </span>
                </div>
                
                {/* Topic (Bab) */}
                <div style={{ color: "#111", lineHeight: 1.4 }}>
                  {r.title || <span style={{color:"#ccc"}}>-</span>}
                  {r.note && <div style={{ fontSize: 11, color: "#888" }}>Note: {r.note}</div>}
                </div>
                
                {/* Date */}
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {new Date(r.progress_date).toISOString().slice(0, 10)}
                </div>

                {/* Teacher - 显示老师名字 */}
                <div style={{ fontSize: 12, color: "#666" }}>
                   {r.teacher?.full_name?.split(" ")[0] ?? "Teacher"}
                </div>
                
                {/* Status Badge */}
                <div>
                  <Badge isFuture={isFuture} />
                </div>
                
                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(r)} style={{ padding: "4px 8px", borderRadius: 6, cursor: "pointer", border: "1px solid #ccc", background: "#fff", fontSize: 11 }}>
                    Edit
                  </button>
                  <button onClick={() => onDelete(r.id)} style={{ padding: "4px 8px", borderRadius: 6, cursor: "pointer", border: "1px solid #fee2e2", background: "#fff5f5", color: "#c53030", fontSize: 11 }}>
                    Del
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}