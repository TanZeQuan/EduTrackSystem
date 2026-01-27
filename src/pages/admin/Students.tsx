import React, { useEffect, useState } from "react";
import {
  createStudent,
  deleteStudent,
  listStudents,
  updateStudentParent,
  type Student,
} from "../../services/student";
import { listParents, type Profile } from "../../services/profile";
// ✅ 引入 Lucide Icons
import { Search, Plus, Trash2, User, Loader2, ChevronDown } from "lucide-react";

// --- Hooks ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// --- Components ---

function StudentRow({ 
  student, 
  parents, 
  onDelete, 
  onUpdateParent,
  isMobile 
}: { 
  student: Student; 
  parents: Profile[]; 
  onDelete: (id: string) => Promise<void>; 
  onUpdateParent: (id: string, parentId: string | null) => Promise<void>;
  isMobile: boolean;
}) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleParentChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "" ? null : e.target.value;
    setUpdating(true);
    await onUpdateParent(student.id, val);
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete student "${student.name}"?`)) return;
    setDeleting(true);
    await onDelete(student.id);
  };

  const parentEmail = parents.find(p => p.id === student.parent_id)?.email;

  const containerStyle: React.CSSProperties = isMobile ? {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#fff"
  } : {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 80px", 
    gap: 16,
    padding: "16px 24px",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "center",
    backgroundColor: "#fff"
  };

  return (
    <div style={containerStyle}>
      {/* 1. Student Info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: "50%", 
          backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#64748b"
        }}>
          {/* 如果没有名字，显示默认 User 图标 */}
          {student.name ? (
             <span style={{ fontWeight: 600 }}>{student.name.charAt(0).toUpperCase()}</span>
          ) : (
             <User size={20} />
          )}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 16 }}>{student.name}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Grade: {student.grade || "N/A"}</div>
        </div>
      </div>

      {/* 2. Parent Assignment */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {isMobile && <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Assigned Parent</label>}
        <div style={{ position: "relative" }}>
          <select
            value={student.parent_id ?? ""}
            onChange={handleParentChange}
            disabled={updating}
            style={{
              width: "100%",
              padding: "8px 36px 8px 12px", // Right padding for icon
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              backgroundColor: updating ? "#f1f5f9" : "#fff",
              color: "#334155",
              cursor: updating ? "wait" : "pointer",
              appearance: "none" 
            }}
          >
            <option value="">Select Parent...</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.email ?? "Unknown Email"}</option>
            ))}
          </select>
          
          {/* Status Indicator / Arrow */}
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", display: "flex" }}>
             {updating ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
          </div>
        </div>
        {!isMobile && student.parent_id && !parentEmail && (
           <span style={{fontSize: 12, color: "#dc2626"}}>Unknown Parent ID</span>
        )}
      </div>

      {/* 3. Actions */}
      <div style={{ display: "flex", justifyContent: isMobile ? "flex-end" : "flex-end" }}>
        <button 
          onClick={handleDelete} 
          disabled={deleting}
          style={{
            padding: "8px",
            borderRadius: 8,
            border: "1px solid #fee2e2",
            backgroundColor: "#fff",
            color: "#dc2626", // Red text/icon
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: deleting ? 0.5 : 1,
            transition: "all 0.2s"
          }}
          title="Delete Student"
        >
          {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminStudents() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<Student[]>([]);
  const [parents, setParents] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const [studentsData, parentsData] = await Promise.all([listStudents(), listParents()]);
      setItems(studentsData);
      setParents(parentsData);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setMsg(null);
    setCreating(true);
    try {
      await createStudent({ name: name.trim(), grade: grade.trim() || undefined, parent_id: null });
      setName("");
      setGrade("");
      await load(); 
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const doDelete = async (id: string) => {
    try {
      await deleteStudent(id);
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const doUpdateParent = async (sid: string, pid: string | null) => {
    try {
      await updateStudentParent(sid, pid);
      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to assign parent");
    }
  };

  const filteredItems = items.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.grade && s.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ 
      padding: isMobile ? "24px 16px" : "32px 40px", 
      maxWidth: 1000, 
      margin: "0 auto",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: "#334155"
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>Manage Students</h2>
        <p style={{ margin: 0, color: "#64748b" }}>Add students and link them to parent accounts.</p>
      </div>

      {/* Add Student Form */}
      <div style={{ 
        backgroundColor: "#f8fafc", 
        border: "1px dashed #cbd5e1", 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 32 
      }}>
        <form onSubmit={onAdd} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student Name (e.g. Alice)"
            required
            style={{ flex: 2, padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
          />
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Grade (e.g. 5A)"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
          />
          <button 
            type="submit" 
            disabled={creating}
            style={{ 
              padding: "10px 20px", borderRadius: 8, 
              backgroundColor: "#2563eb", color: "#fff", border: "none", fontWeight: 600,
              cursor: creating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {creating ? "Adding..." : "Add Student"}
          </button>
        </form>
      </div>

      {msg && <div style={{ padding: 12, marginBottom: 20, backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: 8 }}>{msg}</div>}

      {/* List Section */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        
        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fcfcfc" }}>
          <div style={{ fontWeight: 600, color: "#1e293b" }}>All Students ({items.length})</div>
          
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
              <Search size={16} />
            </div>
            <input 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 8px 8px 36px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, width: isMobile ? 120 : 200, outline: "none" }}
            />
          </div>
        </div>

        {/* Header Row (Desktop) */}
        {!isMobile && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 80px", gap: 16, padding: "12px 24px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <div>Student Details</div>
            <div>Parent Assignment</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>
        )}

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <Loader2 size={20} className="animate-spin" /> Loading students...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            {searchTerm ? "No students match your search." : "No students added yet."}
          </div>
        ) : (
          <div>
            {filteredItems.map((s) => (
              <StudentRow 
                key={s.id} 
                student={s} 
                parents={parents} 
                onDelete={doDelete} 
                onUpdateParent={doUpdateParent}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS 动画 (仅需定义一次，或者放在全局 CSS 文件中) */}
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}