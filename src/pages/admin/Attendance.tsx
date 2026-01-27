import React, { useEffect, useMemo, useState } from "react";
import { listStudents, type Student } from "../../services/student";
import { listAttendanceByDate, upsertAttendance, type AttendanceStatus } from "../../services/attendance";
// ✅ 确保安装了 lucide-react: npm install lucide-react
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Loader2, Users, type LucideIcon } from "lucide-react";

// --- Helpers ---
function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

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

// 1. ✅ 修复：StatusBtn 组件 (删除了未使用的 colorClass)
type StatusBtnProps = {
  type: AttendanceStatus;
  label: string;
  icon: LucideIcon;
  activeColor: string;
  currentStatus: AttendanceStatus | null;
  onClick: (status: AttendanceStatus) => void;
  disabled: boolean;
  isMobile: boolean;
};

const StatusBtn = ({
  type,
  label,
  icon: Icon,
  activeColor,
  currentStatus,
  onClick,
  disabled,
  isMobile,
}: StatusBtnProps) => {
  const isActive = currentStatus === type;

  return (
    <button
      onClick={() => onClick(type)}
      disabled={disabled}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 8,
        border: isActive ? `1px solid ${activeColor}` : "1px solid #e2e8f0",
        backgroundColor: isActive ? activeColor : "#fff",
        color: isActive ? "#fff" : "#64748b",
        fontWeight: isActive ? 600 : 500,
        cursor: disabled ? "wait" : "pointer",
        transition: "all 0.2s",
        fontSize: 13,
        minWidth: isMobile ? "auto" : 100,
        opacity: disabled && !isActive ? 0.5 : 1,
      }}
      title={label}
    >
      <Icon size={16} />
      {!isMobile && <span>{label}</span>}
    </button>
  );
};

// 2. AttendanceRow 组件
function AttendanceRow({ 
  student, 
  status, 
  onSetStatus, 
  isSaving,
  isMobile 
}: { 
  student: Student; 
  status: AttendanceStatus | null; 
  onSetStatus: (id: string, s: AttendanceStatus) => void;
  isSaving: boolean;
  isMobile: boolean;
}) {
  return (
    <div style={{
      display: isMobile ? "flex" : "grid",
      flexDirection: isMobile ? "column" : undefined,
      gridTemplateColumns: "1fr auto",
      gap: isMobile ? 12 : 24,
      padding: "16px 20px",
      borderBottom: "1px solid #f1f5f9",
      alignItems: "center",
      backgroundColor: "#fff"
    }}>
      {/* 学生信息 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: "50%", 
          backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 600, color: "#64748b", fontSize: 16 
        }}>
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 16 }}>{student.name}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Grade: {student.grade || "N/A"}</div>
        </div>
      </div>

      {/* 按钮组 */}
      <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
        <StatusBtn 
          type="present" 
          label="Present" 
          icon={CheckCircle2} 
          activeColor="#16a34a" 
          currentStatus={status} 
          onClick={(t) => onSetStatus(student.id, t)} 
          disabled={isSaving} 
          isMobile={isMobile}
        />
        <StatusBtn 
          type="late" 
          label="Late" 
          icon={Clock} 
          activeColor="#d97706" 
          currentStatus={status} 
          onClick={(t) => onSetStatus(student.id, t)} 
          disabled={isSaving} 
          isMobile={isMobile}
        />
        <StatusBtn 
          type="absent" 
          label="Absent" 
          icon={XCircle} 
          activeColor="#dc2626" 
          currentStatus={status} 
          onClick={(t) => onSetStatus(student.id, t)} 
          disabled={isSaving} 
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

// 3. 主页面组件
export default function AdminAttendance() {
  const isMobile = useIsMobile();
  const [date, setDate] = useState(todayYYYYMMDD());
  const [students, setStudents] = useState<Student[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const [stu, records] = await Promise.all([listStudents(), listAttendanceByDate(date)]);
      setStudents(stu);

      const map: Record<string, AttendanceStatus> = {};
      for (const r of records) map[r.student_id] = r.status;
      setStatusMap(map);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // 按名字排序
  const rows = useMemo(() => [...students].sort((a,b) => a.name.localeCompare(b.name)), [students]);

  const setStatus = async (studentId: string, status: AttendanceStatus) => {
    setMsg(null);
    setSavingId(studentId);
    
    // 乐观更新 (Optimistic Update)
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));

    try {
      await upsertAttendance({ student_id: studentId, date, status });
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  // --- 日期切换 ---
  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  // --- 批量标记全勤 ---
  const markAllPresent = async () => {
    if(!confirm(`Mark all ${students.length} students as Present for ${date}?`)) return;
    setLoading(true);
    try {
      await Promise.all(students.map(s => upsertAttendance({ student_id: s.id, date, status: "present" })));
      await load();
    } catch (e) {
      console.error(e); // ✅ 新增这一行：使用了 'e'，报错消失
      setMsg("Failed to mark all present");
      setLoading(false);
    }
  };

  // 统计
  const presentCount = Object.values(statusMap).filter(s => s === 'present').length;
  const absentCount = Object.values(statusMap).filter(s => s === 'absent').length;

  return (
    <div style={{ 
      padding: isMobile ? "24px 16px" : "32px 40px", 
      maxWidth: 1000, 
      margin: "0 auto",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: "#334155"
    }}>
      
      {/* 头部区域 */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>Daily Attendance</h2>
          <p style={{ margin: 0, color: "#64748b" }}>Manage student presence records.</p>
        </div>

        {!loading && (
          <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
             <div style={{ color: "#16a34a", fontWeight: 600 }}>{presentCount} Present</div>
             <div style={{ color: "#dc2626", fontWeight: 600 }}>{absentCount} Absent</div>
          </div>
        )}
      </div>

      {/* 控制栏 (日期 + 批量操作) */}
      <div style={{ 
        backgroundColor: "#fff", 
        padding: 16, 
        borderRadius: 16, 
        border: "1px solid #e2e8f0", 
        marginBottom: 24,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        
        {/* 日期选择器 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-start" }}>
          <button onClick={() => changeDate(-1)} style={navBtnStyle}><ChevronLeft size={20} /></button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#1e293b", position: "relative" }}>
            <Calendar size={18} color="#64748b" />
            <span style={{ fontSize: 15 }}>{formatDateDisplay(date)}</span>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
            />
          </div>

          <button onClick={() => changeDate(1)} style={navBtnStyle}><ChevronRight size={20} /></button>
        </div>

        {/* 批量操作按钮 */}
        <div style={{ display: "flex", gap: 12, width: isMobile ? "100%" : "auto" }}>
          <button 
            onClick={markAllPresent} 
            disabled={loading || students.length === 0}
            style={{ 
              padding: "8px 16px", borderRadius: 8, 
              backgroundColor: "#f1f5f9", color: "#334155", 
              border: "1px solid #cbd5e1", fontWeight: 600, fontSize: 13,
              cursor: "pointer", flex: 1, whiteSpace: "nowrap"
            }}
          >
            Mark All Present
          </button>
        </div>
      </div>

      {msg && <div style={{ padding: 12, marginBottom: 20, backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: 8 }}>{msg}</div>}

      {/* 列表区域 */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
           <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
             <Loader2 className="animate-spin" /> Loading records...
           </div>
        ) : rows.length === 0 ? (
           <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
             <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
             <p>No students found in the system.</p>
           </div>
        ) : (
          <div>
            {rows.map((s) => (
              <AttendanceRow 
                key={s.id} 
                student={s} 
                status={statusMap[s.id] || null} 
                onSetStatus={setStatus} 
                isSaving={savingId === s.id}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", 
  backgroundColor: "#fff", color: "#64748b", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center"
};