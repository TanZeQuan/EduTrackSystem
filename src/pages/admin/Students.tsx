import React, { useEffect, useState } from "react";
import {
  createStudent,
  deleteStudent,
  listStudents,
  updateStudentParent,
  type Student,
} from "../../services/student";
import { listParents, type Profile } from "../../services/profile";
import { Search, Plus, Trash2, User, Loader2, ChevronDown } from "lucide-react";

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

// --- Components ---

function StudentRow({ 
  student, 
  parents, 
  onDelete, 
  onUpdateParent,
  isMobile,
  isTablet
}: { 
  student: Student; 
  parents: Profile[]; 
  onDelete: (id: string) => Promise<void>; 
  onUpdateParent: (id: string, parentId: string | null) => Promise<void>;
  isMobile: boolean;
  isTablet: boolean;
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
  } : isTablet ? {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 20,
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

  const avatarSize = isMobile ? 36 : 40;
  const iconSize = isMobile ? 18 : 20;

  return (
    <div style={containerStyle}>
      {/* 1. Student Info */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12 }}>
        <div style={{ 
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%", 
          backgroundColor: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          flexShrink: 0
        }}>
          {student.name ? (
            <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>
              {student.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User size={iconSize} />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ 
            fontWeight: 600,
            color: "#1e293b",
            fontSize: isMobile ? 14 : 16,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {student.name}
          </div>
          <div style={{ 
            fontSize: isMobile ? 12 : 13,
            color: "#64748b" 
          }}>
            Grade: {student.grade || "N/A"}
          </div>
        </div>
      </div>

      {/* 2. Parent Assignment */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(isMobile || isTablet) && (
          <label style={{ 
            fontSize: isMobile ? 11 : 12,
            color: "#94a3b8",
            fontWeight: 500 
          }}>
            Assigned Parent
          </label>
        )}
        <div style={{ position: "relative" }}>
          <select
            value={student.parent_id ?? ""}
            onChange={handleParentChange}
            disabled={updating}
            style={{
              width: "100%",
              padding: isMobile ? "8px 32px 8px 10px" : "8px 36px 8px 12px",
              borderRadius: isMobile ? 6 : 8,
              border: "1px solid #cbd5e1",
              fontSize: isMobile ? 13 : 14,
              backgroundColor: updating ? "#f1f5f9" : "#fff",
              color: "#334155",
              cursor: updating ? "wait" : "pointer",
              appearance: "none",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <option value="">Select Parent...</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.email ?? "Unknown Email"}
              </option>
            ))}
          </select>
          
          {/* Status Indicator / Arrow */}
          <div style={{ 
            position: "absolute",
            right: isMobile ? 8 : 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#94a3b8",
            display: "flex" 
          }}>
            {updating ? (
              <Loader2 size={isMobile ? 12 : 14} className="animate-spin" />
            ) : (
              <ChevronDown size={isMobile ? 12 : 14} />
            )}
          </div>
        </div>
        {!isMobile && !isTablet && student.parent_id && !parentEmail && (
          <span style={{ fontSize: 12, color: "#dc2626" }}>
            Unknown Parent ID
          </span>
        )}
      </div>

      {/* 3. Actions */}
      <div style={{ 
        display: "flex",
        justifyContent: (isMobile || isTablet) ? "flex-end" : "flex-end" 
      }}>
        <button 
          onClick={handleDelete} 
          disabled={deleting}
          style={{
            padding: isMobile ? "6px" : "8px",
            borderRadius: isMobile ? 6 : 8,
            border: "1px solid #fee2e2",
            backgroundColor: "#fff",
            color: "#dc2626",
            cursor: deleting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: deleting ? 0.5 : 1,
            transition: "all 0.2s",
            WebkitTapHighlightColor: "transparent"
          }}
          title="Delete Student"
        >
          {deleting ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <Trash2 size={iconSize} />
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminStudents() {
  const { isMobile, isTablet, isDesktop } = useDeviceType();
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
      const [studentsData, parentsData] = await Promise.all([
        listStudents(),
        listParents()
      ]);
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
      await createStudent({ 
        name: name.trim(),
        grade: grade.trim() || undefined,
        parent_id: null 
      });
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

  // Responsive styling
  const containerPadding = isMobile ? "16px" : isTablet ? "24px" : "32px 40px";
  const headerFontSize = isMobile ? 22 : isTablet ? 24 : 28;
  const formPadding = isMobile ? 16 : 20;
  const formBorderRadius = isMobile ? 12 : 16;
  const cardBorderRadius = isMobile ? 12 : 16;
  const inputPadding = isMobile ? "8px 12px" : "10px 14px";
  const buttonPadding = isMobile ? "8px 16px" : "10px 20px";

  return (
    <div style={{ 
      padding: containerPadding,
      maxWidth: 1000, 
      margin: "0 auto",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: "#334155",
      width: "100%",
      boxSizing: "border-box"
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 20 : isTablet ? 24 : 32 }}>
        <h2 style={{ 
          fontSize: headerFontSize,
          fontWeight: 700,
          color: "#0f172a",
          margin: "0 0 8px 0",
          lineHeight: 1.2
        }}>
          Manage Students
        </h2>
        <p style={{ 
          margin: 0,
          color: "#64748b",
          fontSize: isMobile ? 14 : 15,
          lineHeight: 1.5
        }}>
          Add students and link them to parent accounts.
        </p>
      </div>

      {/* Add Student Form */}
      <div style={{ 
        backgroundColor: "#f8fafc", 
        border: "1px dashed #cbd5e1", 
        borderRadius: formBorderRadius,
        padding: formPadding,
        marginBottom: isMobile ? 20 : isTablet ? 24 : 32
      }}>
        <form 
          onSubmit={onAdd} 
          style={{ 
            display: "flex",
            flexDirection: isMobile ? "column" : isTablet ? "column" : "row",
            gap: isMobile ? 10 : 12 
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student Name (e.g. Alice)"
            required
            style={{ 
              flex: 2,
              padding: inputPadding,
              borderRadius: isMobile ? 6 : 8,
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: isMobile ? 14 : 15,
              WebkitTapHighlightColor: "transparent"
            }}
          />
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Grade / Class (e.g. 5A)"
            style={{ 
              flex: 1,
              padding: inputPadding,
              borderRadius: isMobile ? 6 : 8,
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: isMobile ? 14 : 15,
              WebkitTapHighlightColor: "transparent"
            }}
          />
          <button 
            type="submit" 
            disabled={creating}
            style={{ 
              padding: buttonPadding,
              borderRadius: isMobile ? 6 : 8,
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: isMobile ? 14 : 15,
              cursor: creating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: creating ? 0.7 : 1,
              transition: "opacity 0.2s",
              WebkitTapHighlightColor: "transparent",
              whiteSpace: "nowrap"
            }}
          >
            {creating ? (
              <Loader2 size={isMobile ? 16 : 18} className="animate-spin" />
            ) : (
              <Plus size={isMobile ? 16 : 18} />
            )}
            {creating ? "Adding..." : "Add Student"}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {msg && (
        <div style={{ 
          padding: isMobile ? 10 : 12,
          marginBottom: isMobile ? 16 : 20,
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderRadius: isMobile ? 6 : 8,
          fontSize: isMobile ? 13 : 14
        }}>
          {msg}
        </div>
      )}

      {/* List Section */}
      <div style={{ 
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: cardBorderRadius,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
      }}>
        
        {/* Toolbar */}
        <div style={{ 
          padding: isMobile ? "12px 16px" : "16px 20px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fcfcfc",
          gap: 12,
          flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
          <div style={{ 
            fontWeight: 600,
            color: "#1e293b",
            fontSize: isMobile ? 14 : 15
          }}>
            All Students ({items.length})
          </div>
          
          <div style={{ position: "relative" }}>
            <div style={{ 
              position: "absolute",
              left: isMobile ? 8 : 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8" 
            }}>
              <Search size={isMobile ? 14 : 16} />
            </div>
            <input 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                padding: isMobile ? "6px 6px 6px 32px" : "8px 8px 8px 36px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: isMobile ? 12 : 13,
                width: isMobile ? 140 : isTablet ? 180 : 200,
                outline: "none",
                WebkitTapHighlightColor: "transparent"
              }}
            />
          </div>
        </div>

        {/* Header Row (Desktop Only) */}
        {isDesktop && (
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "2fr 2fr 80px",
            gap: 16,
            padding: "12px 24px",
            borderBottom: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            fontSize: 12,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.5px" 
          }}>
            <div>Student Details</div>
            <div>Parent Assignment</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>
        )}

        {/* Rows */}
        {loading ? (
          <div style={{ 
            padding: isMobile ? 30 : 40,
            textAlign: "center",
            color: "#94a3b8",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            fontSize: isMobile ? 13 : 14
          }}>
            <Loader2 size={isMobile ? 18 : 20} className="animate-spin" />
            Loading students...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ 
            padding: isMobile ? 30 : 40,
            textAlign: "center",
            color: "#94a3b8",
            fontSize: isMobile ? 13 : 14
          }}>
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
                isTablet={isTablet}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS Animation */}
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