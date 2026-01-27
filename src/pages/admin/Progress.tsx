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
    <span
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${bd}`,
        color,
        fontWeight: 600,
      }}
    >
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
  const [sortBy, setSortBy] = useState<"progress_date" | "created_at">(
    "progress_date"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ===== Modal 状态（Create + Edit 共用）=====
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  // 你之前有 studentSearch，但没放 input，我这里补上（更好用）
  const [studentSearch, setStudentSearch] = useState("");

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingRow, setEditingRow] = useState<ProgressRow | null>(null);

  type ProgressUpdate = {
    student_id?: string;
    subject?: string;
    title?: string | null;
    progress_date?: string;
    score?: number | null;
    note?: string | null;
  };

  type FormState = {
    student_id: string;
    subject: string;
    title: string;
    progress_date: string;
    note: string;
  };

  const emptyForm: FormState = {
    student_id: "",
    subject: "",
    title: "",
    progress_date: new Date().toISOString().slice(0, 10),
    note: "",
  };

  const [form, setForm] = useState<FormState>(emptyForm);

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

      if (ns && !stuName.includes(ns)) return false;
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

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
    setFormErr(null);
    setStudentSearch("");
    setEditingRow(null);
    setMode("create");
    setForm(emptyForm);
  };

  // --- Add New Record (Open Modal) ---
  const onAdd = () => {
    if (students.length === 0) {
      setMsg("No students yet. Create students first.");
      return;
    }

    let targetStudent = students[0];
    if (qStudent) {
      const found = students.find((s) =>
        s.name.toLowerCase().includes(qStudent.toLowerCase())
      );
      if (found) targetStudent = found;
    }

    setMode("create");
    setEditingRow(null);
    setFormErr(null);
    setStudentSearch("");
    setForm({
      ...emptyForm,
      student_id: targetStudent.id,
      // 你也可以让 subject 自动填 qSubject（可选）
      subject: qSubject.trim() ? qSubject.trim() : "",
    });
    setOpen(true);
  };

  // ✅ Edit：打开同一个 Modal，并把 row 数据塞进 form
  const onEdit = (row: ProgressRow) => {
    setMode("edit");
    setEditingRow(row);
    setFormErr(null);
    setStudentSearch("");

    setForm({
      student_id: row.student_id,
      subject: row.subject ?? "",
      title: row.title ?? "",
      progress_date: row.progress_date,
      note: row.note ?? "",
    });

    setOpen(true);
  };

  // ✅ Create + Edit 共用一个 submit
  const onSubmit = async () => {
    setFormErr(null);

    if (!form.student_id) return setFormErr("Please select a student.");
    if (!form.subject.trim()) return setFormErr("Subject is required.");
    // 你原本强制 Topic 必填；如果你想 Topic 可空，把下面一行删掉
    if (!form.title.trim()) return setFormErr("Topic/Chapter is required.");
    if (!form.progress_date) return setFormErr("Date is required.");

    setSaving(true);
    try {
      if (mode === "create") {
        await createProgress({
          student_id: form.student_id,
          subject: form.subject.trim(),
          title: form.title.trim(),
          progress_date: form.progress_date,
          score: null,
          note: form.note.trim() || null,
        });
      } else {
        if (!editingRow) throw new Error("No record selected.");
        const patch = {
          student_id: form.student_id,
          subject: form.subject.trim(),
          title: form.title.trim() || null,
          progress_date: form.progress_date,
          score: null,
          note: form.note.trim() || null,
        } satisfies ProgressUpdate;

        await updateProgress(editingRow.id, patch);
      }

      setOpen(false);
      await load();
      closeModal();
    } catch (e: unknown) {
      setFormErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
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

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        padding: "24px 32px", // 👈 重点：左右内缩
      }}
    >
      <div style={{ fontWeight: 800, letterSpacing: 0.5, fontSize: 18 }}>
        STUDENT PROGRESS
      </div>

      {/* Filter Bar */}
      <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Filter Logs</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.5fr 1fr",
            gap: 12,
            alignItems: "center",
          }}
        >
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
          <button
            onClick={onReset}
            style={{
              padding: "10px",
              borderRadius: 10,
              cursor: "pointer",
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={onAdd}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            cursor: "pointer",
            background: "#2563eb",
            color: "white",
            border: "none",
            fontWeight: 600,
          }}
        >
          + Record Lesson
        </button>
        <div style={{ fontSize: 12, color: "#666" }}>
          Sorted by:{" "}
          <b>{sortBy === "progress_date" ? "Lesson Date" : "Created Time"}</b>
        </div>
      </div>

      {/* Error Msg */}
      {msg && <div style={{ color: "#b00020", fontWeight: 600 }}>{msg}</div>}

      {/* Table */}
      <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 2.2fr 1.2fr 1fr 0.8fr 1.2fr",
            padding: "12px 12px",
            background: "#fafafa",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
            borderBottom: "1px solid #eee",
            color: "#555",
          }}
        >
          <div>STUDENT</div>
          <div>SUBJECT</div>
          <div>TOPIC / CHAPTER</div>
          <div style={{ cursor: "pointer" }} onClick={() => toggleSort("progress_date")}>
            DATE {sortBy === "progress_date" ? (sortDir === "desc" ? "▼" : "▲") : ""}
          </div>
          <div>TEACHER</div>
          <div>STATUS</div>
          <div>ACTIONS</div>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
            Loading records...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", opacity: 0.75 }}>
            No lesson records found.
          </div>
        ) : (
          filtered.map((r) => {
            const stu = studentMap.get(r.student_id);
            const isFuture =
              new Date(r.progress_date).getTime() > new Date().getTime();

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
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 600 }}>{stu?.name ?? r.student_id}</div>

                <div>
                  <span
                    style={{
                      background: "#f3f4f6",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 11,
                      color: "#374151",
                    }}
                  >
                    {r.subject}
                  </span>
                </div>

                <div style={{ color: "#111", lineHeight: 1.4 }}>
                  {r.title || <span style={{ color: "#ccc" }}>-</span>}
                  {r.note && (
                    <div style={{ fontSize: 11, color: "#888" }}>
                      Note: {r.note}
                    </div>
                  )}
                </div>

                <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {new Date(r.progress_date).toISOString().slice(0, 10)}
                </div>

                <div style={{ fontSize: 12, color: "#666" }}>
                  {r.teacher?.full_name?.split(" ")[0] ?? "Teacher"}
                </div>

                <div>
                  <Badge isFuture={isFuture} />
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => onEdit(r)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                      border: "1px solid #ccc",
                      background: "#fff",
                      fontSize: 11,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                      border: "1px solid #fee2e2",
                      background: "#fff5f5",
                      color: "#c53030",
                      fontSize: 11,
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== Modal (Create + Edit) ===== */}
      {open && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #eee",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                {mode === "create" ? "Log Lesson" : "Edit Lesson"}
              </div>
              <button
                disabled={saving}
                onClick={closeModal}
                style={{
                  border: "1px solid #ddd",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 16, display: "grid", gap: 12 }}>
              {/* Student search + select */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>
                  Student
                </div>

                <select
                  value={form.student_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, student_id: e.target.value }))
                  }
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #ccc",
                  }}
                >
                  {students
                    .filter((s) =>
                      s.name
                        .toLowerCase()
                        .includes(studentSearch.trim().toLowerCase())
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {/* Subject */}
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>
                    Subject
                  </div>
                  <input
                    value={form.subject}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subject: e.target.value }))
                    }
                    placeholder="e.g. Math / BM"
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #ccc",
                    }}
                  />
                </div>

                {/* Date */}
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>
                    Date
                  </div>
                  <input
                    type="date"
                    value={form.progress_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, progress_date: e.target.value }))
                    }
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              </div>

              {/* Topic */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>
                  Topic / Chapter
                </div>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Bab 1.1"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              {/* Note (optional) */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>
                  Note (optional)
                </div>
                <textarea
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="Homework / remark..."
                  rows={3}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #ccc",
                    resize: "vertical",
                  }}
                />
              </div>

              {formErr && (
                <div style={{ color: "#b00020", fontWeight: 600 }}>{formErr}</div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: 16,
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                disabled={saving}
                onClick={closeModal}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  background: "#fff",
                }}
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={onSubmit}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {saving ? "Saving..." : mode === "create" ? "Save" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
