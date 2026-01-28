import React, { useEffect, useMemo, useState } from "react";
import { listStudents, type Student } from "../../services/student";
import { listAttendanceByDate, upsertAttendance, type AttendanceStatus } from "../../services/attendance";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Loader2, Users, type LucideIcon } from "lucide-react";

// --- Helpers ---
function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(dateStr: string, isMobile: boolean) {
  const date = new Date(dateStr);
  if (isMobile) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

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

// 1. StatusBtn Component
type StatusBtnProps = {
  type: AttendanceStatus;
  label: string;
  icon: LucideIcon;
  activeColor: string;
  currentStatus: AttendanceStatus | null;
  onClick: (status: AttendanceStatus) => void;
  disabled: boolean;
  isMobile: boolean;
  isTablet: boolean;
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
  isTablet,
}: StatusBtnProps) => {
  const isActive = currentStatus === type;
  const iconSize = isMobile ? 14 : 16;
  const fontSize = isMobile ? 12 : 13;

  return (
    <button
      onClick={() => onClick(type)}
      disabled={disabled}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 4 : 6,
        padding: isMobile ? "6px 8px" : isTablet ? "7px 10px" : "8px 12px",
        borderRadius: isMobile ? 6 : 8,
        border: isActive ? `1px solid ${activeColor}` : "1px solid #e2e8f0",
        backgroundColor: isActive ? activeColor : "#fff",
        color: isActive ? "#fff" : "#64748b",
        fontWeight: isActive ? 600 : 500,
        cursor: disabled ? "wait" : "pointer",
        transition: "all 0.2s",
        fontSize: fontSize,
        minWidth: isMobile ? "auto" : isTablet ? 90 : 100,
        opacity: disabled && !isActive ? 0.5 : 1,
        WebkitTapHighlightColor: "transparent",
      }}
      title={label}
    >
      <Icon size={iconSize} />
      {!isMobile && <span>{label}</span>}
    </button>
  );
};

// 2. AttendanceRow Component
function AttendanceRow({ 
  student, 
  status, 
  onSetStatus, 
  isSaving,
  isMobile,
  isTablet
}: { 
  student: Student; 
  status: AttendanceStatus | null; 
  onSetStatus: (id: string, s: AttendanceStatus) => void;
  isSaving: boolean;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const avatarSize = isMobile ? 36 : 40;
  const nameFontSize = isMobile ? 14 : 16;
  const gradeFontSize = isMobile ? 12 : 13;

  return (
    <div style={{
      display: isMobile || isTablet ? "flex" : "grid",
      flexDirection: isMobile || isTablet ? "column" : undefined,
      gridTemplateColumns: "1fr auto",
      gap: isMobile ? 10 : isTablet ? 14 : 24,
      padding: isMobile ? "12px 16px" : "16px 20px",
      borderBottom: "1px solid #f1f5f9",
      alignItems: "center",
      backgroundColor: "#fff"
    }}>
      {/* Student Info */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12 }}>
        <div style={{ 
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%", 
          backgroundColor: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          color: "#64748b",
          fontSize: isMobile ? 14 : 16,
          flexShrink: 0
        }}>
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ 
            fontWeight: 600,
            color: "#1e293b",
            fontSize: nameFontSize,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {student.name}
          </div>
          <div style={{ 
            fontSize: gradeFontSize,
            color: "#64748b" 
          }}>
            Grade: {student.grade || "N/A"}
          </div>
        </div>
      </div>

      {/* Button Group */}
      <div style={{ 
        display: "flex",
        gap: isMobile ? 6 : 8,
        width: isMobile || isTablet ? "100%" : "auto" 
      }}>
        <StatusBtn 
          type="present" 
          label="Present" 
          icon={CheckCircle2} 
          activeColor="#16a34a" 
          currentStatus={status} 
          onClick={(t) => onSetStatus(student.id, t)} 
          disabled={isSaving} 
          isMobile={isMobile}
          isTablet={isTablet}
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
          isTablet={isTablet}
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
          isTablet={isTablet}
        />
      </div>
    </div>
  );
}

// 3. Main Component
export default function AdminAttendance() {
  const { isMobile, isTablet } = useDeviceType();
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
      const [stu, records] = await Promise.all([
        listStudents(),
        listAttendanceByDate(date)
      ]);
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

  // Sort by name
  const rows = useMemo(
    () => [...students].sort((a, b) => a.name.localeCompare(b.name)),
    [students]
  );

  const setStatus = async (studentId: string, status: AttendanceStatus) => {
    setMsg(null);
    setSavingId(studentId);
    
    // Optimistic Update
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));

    try {
      await upsertAttendance({ student_id: studentId, date, status });
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  // Date Navigation
  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  // Mark All Present
  const markAllPresent = async () => {
    if (!confirm(`Mark all ${students.length} students as Present for ${date}?`)) return;
    setLoading(true);
    try {
      await Promise.all(
        students.map(s => 
          upsertAttendance({ student_id: s.id, date, status: "present" })
        )
      );
      await load();
    } catch (e) {
      console.error(e);
      setMsg("Failed to mark all present");
      setLoading(false);
    }
  };

  // Statistics
  const presentCount = Object.values(statusMap).filter(s => s === 'present').length;
  const absentCount = Object.values(statusMap).filter(s => s === 'absent').length;

  // Responsive Styling
  const containerPadding = isMobile ? "16px" : isTablet ? "24px" : "32px 40px";
  const headerFontSize = isMobile ? 22 : isTablet ? 24 : 28;
  const cardPadding = isMobile ? 12 : 16;
  const cardBorderRadius = isMobile ? 12 : 16;

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
      
      {/* Header Area */}
      <div style={{ 
        marginBottom: isMobile ? 16 : isTablet ? 20 : 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: isMobile ? 12 : 16 
      }}>
        <div>
          <h2 style={{ 
            fontSize: headerFontSize,
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 8px 0",
            lineHeight: 1.2
          }}>
            Daily Attendance
          </h2>
          <p style={{ 
            margin: 0,
            color: "#64748b",
            fontSize: isMobile ? 14 : 15,
            lineHeight: 1.5
          }}>
            Manage student presence records.
          </p>
        </div>

        {!loading && (
          <div style={{ 
            display: "flex",
            gap: isMobile ? 12 : 16,
            fontSize: isMobile ? 13 : 14 
          }}>
            <div style={{ color: "#16a34a", fontWeight: 600 }}>
              {presentCount} Present
            </div>
            <div style={{ color: "#dc2626", fontWeight: 600 }}>
              {absentCount} Absent
            </div>
          </div>
        )}
      </div>

      {/* Control Bar (Date + Batch Actions) */}
      <div style={{ 
        backgroundColor: "#fff", 
        padding: cardPadding,
        borderRadius: cardBorderRadius,
        border: "1px solid #e2e8f0", 
        marginBottom: isMobile ? 16 : isTablet ? 20 : 24,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: isMobile ? 12 : 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        
        {/* Date Picker */}
        <div style={{ 
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 10 : 12,
          width: isMobile ? "100%" : "auto",
          justifyContent: isMobile ? "space-between" : "flex-start" 
        }}>
          <button 
            onClick={() => changeDate(-1)} 
            style={{
              ...navBtnStyle,
              padding: isMobile ? 6 : 8,
              borderRadius: isMobile ? 6 : 8
            }}
          >
            <ChevronLeft size={isMobile ? 18 : 20} />
          </button>
          
          <div style={{ 
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 6 : 8,
            fontWeight: 600,
            color: "#1e293b",
            position: "relative" 
          }}>
            <Calendar size={isMobile ? 16 : 18} color="#64748b" />
            <span style={{ fontSize: isMobile ? 14 : 15 }}>
              {formatDateDisplay(date, isMobile)}
            </span>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{ 
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer" 
              }} 
            />
          </div>

          <button 
            onClick={() => changeDate(1)} 
            style={{
              ...navBtnStyle,
              padding: isMobile ? 6 : 8,
              borderRadius: isMobile ? 6 : 8
            }}
          >
            <ChevronRight size={isMobile ? 18 : 20} />
          </button>
        </div>

        {/* Batch Action Button */}
        <div style={{ 
          display: "flex",
          gap: 12,
          width: isMobile ? "100%" : "auto" 
        }}>
          <button 
            onClick={markAllPresent} 
            disabled={loading || students.length === 0}
            style={{ 
              padding: isMobile ? "7px 14px" : "8px 16px",
              borderRadius: isMobile ? 6 : 8,
              backgroundColor: "#f1f5f9",
              color: "#334155", 
              border: "1px solid #cbd5e1",
              fontWeight: 600,
              fontSize: isMobile ? 12 : 13,
              cursor: loading || students.length === 0 ? "not-allowed" : "pointer",
              flex: 1,
              whiteSpace: "nowrap",
              opacity: loading || students.length === 0 ? 0.5 : 1,
              WebkitTapHighlightColor: "transparent"
            }}
          >
            Mark All Present
          </button>
        </div>
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

      {/* List Area */}
      <div style={{ 
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: cardBorderRadius,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
      }}>
        {loading ? (
          <div style={{ 
            padding: isMobile ? 40 : 60,
            textAlign: "center",
            color: "#94a3b8",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            fontSize: isMobile ? 13 : 14
          }}>
            <Loader2 size={isMobile ? 18 : 20} className="animate-spin" />
            Loading records...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ 
            padding: isMobile ? 40 : 60,
            textAlign: "center",
            color: "#94a3b8" 
          }}>
            <Users 
              size={isMobile ? 40 : 48} 
              style={{ opacity: 0.2, marginBottom: 16 }} 
            />
            <p style={{ fontSize: isMobile ? 13 : 14, margin: 0 }}>
              No students found in the system.
            </p>
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

const navBtnStyle: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid #e2e8f0", 
  backgroundColor: "#fff",
  color: "#64748b",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  WebkitTapHighlightColor: "transparent",
  transition: "background 0.2s"
};