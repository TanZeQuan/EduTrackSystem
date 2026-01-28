import { useEffect, useMemo, useState } from "react";
import { listStudents, type Student } from "../../services/student";
import {
  listProgressAll,
  createProgress,
  deleteProgress,
  type ProgressRow,
  updateProgress,
} from "../../services/progress";
import { supabase } from "../../services/supabase";
import { Edit2, Trash2, X, Plus } from "lucide-react";

// --- Hooks: Device Detection ---
function useDeviceType() {
  const [deviceType, setDeviceType] = useState({
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDeviceType({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}

// Badge Component
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
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

// Mobile Card Component
function MobileProgressCard({
  row,
  student,
  canEdit,
  onEdit,
  onDelete,
}: {
  row: ProgressRow;
  student: Student | undefined;
  canEdit: boolean;
  onEdit: (row: ProgressRow) => void;
  onDelete: (id: string) => void;
}) {
  const isFuture = new Date(row.progress_date).getTime() > new Date().getTime();

  return (
    <div
      style={{
        padding: 16,
        borderBottom: "1px solid #f1f5f9",
        backgroundColor: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "#1e293b",
              marginBottom: 4,
            }}
          >
            {student?.name ?? row.student_id}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                background: "#f3f4f6",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
                color: "#374151",
                fontWeight: 500,
              }}
            >
              {row.subject}
            </span>

            <Badge isFuture={isFuture} />

            {/* Teacher */}
            <span
              style={{
                fontSize: 11,
                color: "#64748b",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "2px 6px",
                borderRadius: 999,
              }}
              title={row.teacher?.email ?? ""}
            >
              {row.teacher?.email ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 13,
            color: "#1e293b",
            lineHeight: 1.4,
            marginBottom: 4,
          }}
        >
          {row.title || <span style={{ color: "#94a3b8" }}>No topic</span>}
        </div>

        {row.note && (
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 4,
              padding: 8,
              backgroundColor: "#f8fafc",
              borderRadius: 6,
              lineHeight: 1.4,
            }}
          >
            Note: {row.note}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            fontFamily: "monospace",
          }}
        >
          {new Date(row.progress_date).toLocaleDateString()}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => canEdit && onEdit(row)}
            disabled={!canEdit}
            title={!canEdit ? "Only the creator can edit" : "Edit"}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              cursor: canEdit ? "pointer" : "not-allowed",
              border: "1px solid #e2e8f0",
              background: "#fff",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: canEdit ? "#2563eb" : "#94a3b8",
              opacity: canEdit ? 1 : 0.6,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Edit2 size={14} />
            <span>Edit</span>
          </button>

          <button
            onClick={() => canEdit && onDelete(row.id)}
            disabled={!canEdit}
            title={!canEdit ? "Only the creator can delete" : "Delete"}
            style={{
              padding: "6px",
              borderRadius: 6,
              cursor: canEdit ? "pointer" : "not-allowed",
              border: "1px solid #fee2e2",
              background: "#fff5f5",
              color: canEdit ? "#dc2626" : "#fca5a5",
              display: "flex",
              alignItems: "center",
              opacity: canEdit ? 1 : 0.6,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLessonLog() {
  const { isMobile, isTablet, isDesktop } = useDeviceType();

  const [myUid, setMyUid] = useState<string>("");

  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Filter state
  const [qStudent, setQStudent] = useState("");
  const [qSubject, setQSubject] = useState("");

  // Sort state
  const [sortBy, setSortBy] = useState<"progress_date" | "created_at">("progress_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Modal state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
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

  // ✅ get current user id (for edit permission)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMyUid(data.user?.id ?? "");
    })();
  }, []);

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

  const onAdd = () => {
    if (students.length === 0) {
      setMsg("No students yet. Create students first.");
      return;
    }

    let targetStudent = students[0];
    if (qStudent) {
      const found = students.find((s) => s.name.toLowerCase().includes(qStudent.toLowerCase()));
      if (found) targetStudent = found;
    }

    setMode("create");
    setEditingRow(null);
    setFormErr(null);
    setStudentSearch("");
    setForm({
      ...emptyForm,
      student_id: targetStudent.id,
      subject: qSubject.trim() ? qSubject.trim() : "",
    });
    setOpen(true);
  };

  const onEdit = (row: ProgressRow) => {
    // ✅ Guard: only creator can edit
    if (!myUid || row.created_by !== myUid) {
      setMsg("You can only edit records you created.");
      return;
    }

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

  const onSubmit = async () => {
    setFormErr(null);

    if (!form.student_id) return setFormErr("Please select a student.");
    if (!form.subject.trim()) return setFormErr("Subject is required.");
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

        // ✅ Guard: only creator can update
        if (!myUid || editingRow.created_by !== myUid) {
          throw new Error("You can only update records you created.");
        }

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
    const row = rows.find((x) => x.id === id);

    // ✅ Guard: only creator can delete
    if (!row || !myUid || row.created_by !== myUid) {
      setMsg("You can only delete records you created.");
      return;
    }

    if (!window.confirm("Delete this record?")) return;

    setMsg(null);
    try {
      await deleteProgress(id);
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  // Responsive styling
  const containerPadding = isMobile ? "16px" : isTablet ? "20px 24px" : "24px 32px";
  const headerFontSize = isMobile ? 16 : 18;
  const cardBorderRadius = isMobile ? 12 : 14;

  return (
    <div
      style={{
        display: "grid",
        gap: isMobile ? 12 : 16,
        padding: containerPadding,
        maxWidth: 1400,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          letterSpacing: 0.5,
          fontSize: headerFontSize,
          color: "#0f172a",
        }}
      >
        STUDENT PROGRESS
      </div>

      {/* Filter Bar */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: cardBorderRadius,
          padding: isMobile ? 12 : 16,
          backgroundColor: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: isMobile ? 13 : 14 }}>
          Filter Logs
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1.2fr 1.5fr 1fr",
            gap: isMobile ? 8 : 12,
            alignItems: "center",
          }}
        >
          <input
            value={qStudent}
            onChange={(e) => setQStudent(e.target.value)}
            placeholder="Search Student..."
            style={{
              padding: isMobile ? 8 : 10,
              borderRadius: isMobile ? 8 : 10,
              border: "1px solid #cbd5e1",
              fontSize: isMobile ? 13 : 14,
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          />

          <input
            value={qSubject}
            onChange={(e) => setQSubject(e.target.value)}
            placeholder="Search Subject or Topic..."
            style={{
              padding: isMobile ? 8 : 10,
              borderRadius: isMobile ? 8 : 10,
              border: "1px solid #cbd5e1",
              fontSize: isMobile ? 13 : 14,
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          />

          <button
            onClick={onReset}
            style={{
              padding: isMobile ? 8 : 10,
              borderRadius: isMobile ? 8 : 10,
              cursor: "pointer",
              border: "1px solid #cbd5e1",
              background: "#fff",
              fontSize: isMobile ? 13 : 14,
              fontWeight: 500,
              WebkitTapHighlightColor: "transparent",
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
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onAdd}
          style={{
            padding: isMobile ? "8px 14px" : "10px 16px",
            borderRadius: isMobile ? 8 : 10,
            cursor: "pointer",
            background: "#2563eb",
            color: "white",
            border: "none",
            fontWeight: 600,
            fontSize: isMobile ? 13 : 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Plus size={isMobile ? 16 : 18} />
          Record Lesson
        </button>

        {!isMobile && (
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Sorted by: <b>{sortBy === "progress_date" ? "Lesson Date" : "Created Time"}</b>
          </div>
        )}
      </div>

      {/* Error Message */}
      {msg && (
        <div
          style={{
            color: "#dc2626",
            fontWeight: 600,
            fontSize: isMobile ? 13 : 14,
            padding: isMobile ? 10 : 12,
            backgroundColor: "#fee2e2",
            borderRadius: isMobile ? 6 : 8,
          }}
        >
          {msg}
        </div>
      )}

      {/* Table / Cards */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: cardBorderRadius,
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        {/* Desktop Table Header */}
        {isDesktop && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 2.2fr 1.2fr 1fr 0.8fr 1.2fr",
              padding: "12px",
              background: "#fafafa",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              borderBottom: "1px solid #e2e8f0",
              color: "#64748b",
            }}
          >
            <div>STUDENT</div>
            <div>SUBJECT</div>
            <div>TOPIC / CHAPTER</div>
            <div style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("progress_date")}>
              DATE {sortBy === "progress_date" ? (sortDir === "desc" ? "▼" : "▲") : ""}
            </div>
            <div>TEACHER</div>
            <div>STATUS</div>
            <div>ACTIONS</div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div
            style={{
              padding: isMobile ? 30 : 40,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: isMobile ? 13 : 14,
            }}
          >
            Loading records...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: isMobile ? 30 : 40,
              textAlign: "center",
              opacity: 0.75,
              color: "#94a3b8",
              fontSize: isMobile ? 13 : 14,
            }}
          >
            No lesson records found.
          </div>
        ) : isMobile || isTablet ? (
          filtered.map((r) => {
            const canEdit = !!myUid && r.created_by === myUid;
            return (
              <MobileProgressCard
                key={r.id}
                row={r}
                student={studentMap.get(r.student_id)}
                canEdit={canEdit}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })
        ) : (
          filtered.map((r) => {
            const stu = studentMap.get(r.student_id);
            const isFuture = new Date(r.progress_date).getTime() > new Date().getTime();
            const canEdit = !!myUid && r.created_by === myUid;

            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 2.2fr 1.2fr 1fr 0.8fr 1.2fr",
                  padding: "12px",
                  borderTop: "1px solid #f1f5f9",
                  alignItems: "center",
                  fontSize: 13,
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{stu?.name ?? r.student_id}</div>

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

                <div style={{ color: "#1e293b", lineHeight: 1.4 }}>
                  {r.title || <span style={{ color: "#cbd5e1" }}>-</span>}
                  {r.note && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Note: {r.note}</div>}
                </div>

                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
                  {new Date(r.progress_date).toISOString().slice(0, 10)}
                </div>

                <div style={{ fontSize: 12, color: "#64748b" }}>{r.teacher?.email ?? "—"}</div>

                <div>
                  <Badge isFuture={isFuture} />
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => canEdit && onEdit(r)}
                    disabled={!canEdit}
                    title={!canEdit ? "Only the creator can edit" : "Edit"}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      cursor: canEdit ? "pointer" : "not-allowed",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      fontSize: 11,
                      color: canEdit ? "#2563eb" : "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      opacity: canEdit ? 1 : 0.6,
                    }}
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>

                  <button
                    onClick={() => canEdit && onDelete(r.id)}
                    disabled={!canEdit}
                    title={!canEdit ? "Only the creator can delete" : "Delete"}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      cursor: canEdit ? "pointer" : "not-allowed",
                      border: "1px solid #fee2e2",
                      background: "#fff5f5",
                      color: canEdit ? "#dc2626" : "#fca5a5",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      opacity: canEdit ? 1 : 0.6,
                    }}
                  >
                    <Trash2 size={12} />
                    Del
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
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
              width: isMobile ? "100%" : "min(720px, 90%)",
              background: "#fff",
              borderRadius: isMobile ? 12 : 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
              maxHeight: isMobile ? "90vh" : "none",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: isMobile ? 12 : 16,
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: isMobile ? 15 : 16, color: "#0f172a" }}>
                {mode === "create" ? "Log Lesson" : "Edit Lesson"}
              </div>

              <button
                disabled={saving}
                onClick={closeModal}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  borderRadius: isMobile ? 6 : 8,
                  padding: isMobile ? 6 : "6px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <X size={isMobile ? 16 : 18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: isMobile ? 12 : 16, display: "grid", gap: isMobile ? 10 : 12, overflowY: "auto", flex: 1 }}>
              {/* Student */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>Student</div>

                <select
                  value={form.student_id}
                  onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                  style={{
                    padding: isMobile ? 8 : 10,
                    borderRadius: isMobile ? 8 : 10,
                    border: "1px solid #cbd5e1",
                    fontSize: isMobile ? 13 : 14,
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {students
                    .filter((s) => s.name.toLowerCase().includes(studentSearch.trim().toLowerCase()))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 12 }}>
                {/* Subject */}
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>Subject</div>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Math / BM"
                    style={{
                      padding: isMobile ? 8 : 10,
                      borderRadius: isMobile ? 8 : 10,
                      border: "1px solid #cbd5e1",
                      fontSize: isMobile ? 13 : 14,
                      outline: "none",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  />
                </div>

                {/* Date */}
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>Date</div>
                  <input
                    type="date"
                    value={form.progress_date}
                    onChange={(e) => setForm((f) => ({ ...f, progress_date: e.target.value }))}
                    style={{
                      padding: isMobile ? 8 : 10,
                      borderRadius: isMobile ? 8 : 10,
                      border: "1px solid #cbd5e1",
                      fontSize: isMobile ? 13 : 14,
                      outline: "none",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  />
                </div>
              </div>

              {/* Topic */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>Topic / Chapter</div>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Bab 1.1"
                  style={{
                    padding: isMobile ? 8 : 10,
                    borderRadius: isMobile ? 8 : 10,
                    border: "1px solid #cbd5e1",
                    fontSize: isMobile ? 13 : 14,
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                />
              </div>

              {/* Note */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#64748b" }}>Note (optional)</div>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Homework / remark..."
                  rows={isMobile ? 2 : 3}
                  style={{
                    padding: isMobile ? 8 : 10,
                    borderRadius: isMobile ? 8 : 10,
                    border: "1px solid #cbd5e1",
                    resize: "vertical",
                    fontSize: isMobile ? 13 : 14,
                    fontFamily: "inherit",
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                />
              </div>

              {formErr && (
                <div
                  style={{
                    color: "#dc2626",
                    fontWeight: 600,
                    fontSize: isMobile ? 12 : 13,
                    padding: isMobile ? 8 : 10,
                    backgroundColor: "#fee2e2",
                    borderRadius: isMobile ? 6 : 8,
                  }}
                >
                  {formErr}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: isMobile ? 12 : 16,
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <button
                disabled={saving}
                onClick={closeModal}
                style={{
                  padding: isMobile ? "8px 12px" : "10px 14px",
                  borderRadius: isMobile ? 8 : 10,
                  cursor: "pointer",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: isMobile ? 13 : 14,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={onSubmit}
                style={{
                  padding: isMobile ? "8px 12px" : "10px 14px",
                  borderRadius: isMobile ? 8 : 10,
                  cursor: "pointer",
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: isMobile ? 13 : 14,
                  opacity: saving ? 0.7 : 1,
                  WebkitTapHighlightColor: "transparent",
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
