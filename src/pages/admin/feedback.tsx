import React, { useEffect, useState, useMemo, useRef } from "react";
import { listStudents, type Student } from "../../services/student";
import { createFeedback, listFeedback, type FeedbackRow } from "../../services/feedback";
import { Send, MessageSquare, Lock, Globe, CheckCheck, Loader2, Search, ChevronLeft } from "lucide-react";

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

// 1. Feedback Bubble Component
function FeedbackBubble({ 
  item,
  isMobile 
}: { 
  item: FeedbackRow;
  isMobile: boolean;
}) {
  const isInternal = item.visibility === 'internal';

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      marginBottom: isMobile ? 12 : 16
    }}>
      <div style={{
        maxWidth: isMobile ? "90%" : "85%",
        backgroundColor: isInternal ? "#fff7ed" : "#eff6ff",
        border: `1px solid ${isInternal ? "#fed7aa" : "#bfdbfe"}`,
        borderRadius: "16px 16px 4px 16px",
        padding: isMobile ? "10px 12px" : "12px 16px",
        position: "relative",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        {/* Header: Visibility & Time */}
        <div style={{ 
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
          gap: isMobile ? 8 : 12,
          flexWrap: "wrap"
        }}>
          <div style={{ 
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: isMobile ? 10 : 11,
            fontWeight: 600,
            color: isInternal ? "#ea580c" : "#2563eb",
            textTransform: "uppercase",
            letterSpacing: "0.5px" 
          }}>
            {isInternal ? <Lock size={10} /> : <Globe size={10} />}
            {isInternal ? "Internal Note" : "To Parent"}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11, color: "#94a3b8" }}>
            {new Date(item.created_at).toLocaleString([], { 
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          fontSize: isMobile ? 13 : 14,
          color: "#1e293b",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {item.content}
        </div>

        {/* Status Footer */}
        {!isInternal && (
          <div style={{ 
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 4 
          }}>
            {item.is_read ? (
              <div style={{ 
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: isMobile ? 10 : 11,
                color: "#10b981" 
              }}>
                <CheckCheck size={isMobile ? 12 : 14} /> Seen
              </div>
            ) : (
              <div style={{ 
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: isMobile ? 10 : 11,
                color: "#94a3b8" 
              }}>
                <CheckCheck size={isMobile ? 12 : 14} /> Delivered
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminFeedback() {
  const { isMobile, isTablet } = useDeviceType();

  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<string>("");
  const [items, setItems] = useState<FeedbackRow[]>([]);

  // Form State
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"parents" | "internal">("parents");

  // UI State
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Derived
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId]
  );

  const filteredStudents = useMemo(() =>
    students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [students, searchTerm]
  );

  // Load logic
  const load = async (sid?: string) => {
    setMsg(null);
    setLoading(true);
    try {
      // 1. Load students if not loaded
      let currentStudents = students;
      if (currentStudents.length === 0) {
        currentStudents = await listStudents();
        setStudents(currentStudents);
      }

      // 2. Determine target student
      const targetId = sid ?? studentId ?? (currentStudents[0]?.id ?? "");
      setStudentId(targetId);

      // 3. Load feedback
      if (targetId) {
        const fb = await listFeedback(targetId);
        setItems(fb);
        setTimeout(() => scrollRef.current?.scrollTo({ 
          top: 99999, 
          behavior: 'smooth' 
        }), 100);
      } else {
        setItems([]);
      }
    } catch (e: unknown) {
      setMsg({ 
        type: 'error',
        text: e instanceof Error ? e.message : "Failed to load" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // When switching students explicitly
  const handleStudentChange = async (newId: string) => {
    setStudentId(newId);
    setLoading(true);
    try {
      const fb = await listFeedback(newId);
      setItems(fb);
      setTimeout(() => scrollRef.current?.scrollTo({ 
        top: 99999,
        behavior: 'smooth' 
      }), 100);
    } catch (e) { 
      console.error(e);
    }
    setLoading(false);
  };

  const onCreate = async () => {
    if (!studentId || !content.trim()) return;
    setSending(true);
    setMsg(null);
    try {
      await createFeedback({ 
        student_id: studentId,
        content: content.trim(),
        visibility 
      });
      setContent("");
      const fb = await listFeedback(studentId);
      setItems(fb);
      setTimeout(() => scrollRef.current?.scrollTo({ 
        top: 99999,
        behavior: 'smooth' 
      }), 100);
    } catch (e: unknown) {
      console.error(e);
      setMsg({ type: 'error', text: "Failed to send message" });
    } finally {
      setSending(false);
    }
  };

  // Responsive styling
  const containerPadding = isMobile ? "12px" : isTablet ? "16px 20px" : "20px 24px";
  const headerFontSize = isMobile ? 20 : isTablet ? 22 : 24;
  const sidebarWidth = isMobile ? "1fr" : isTablet ? "220px" : "250px";
  const cardBorderRadius = isMobile ? 12 : 16;

  return (
    <div
      style={{
        padding: containerPadding,
        maxWidth: 1500,
        margin: "0 auto",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#334155",
        height: isMobile ? "calc(100vh - 56px)" : "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        boxSizing: "border-box"
      }}
    >

      {/* Page Header */}
      <div style={{ 
        marginBottom: isMobile ? 16 : isTablet ? 20 : 24,
        flexShrink: 0 
      }}>
        <h2 style={{ 
          fontSize: headerFontSize,
          fontWeight: 700,
          color: "#0f172a",
          margin: "0 0 4px 0",
          lineHeight: 1.2
        }}>
          Feedback & Messages
        </h2>
        <p style={{ 
          margin: 0,
          color: "#64748b",
          fontSize: isMobile ? 13 : 14,
          lineHeight: 1.5
        }}>
          Send updates to parents or keep internal notes.
        </p>
      </div>

      {/* Main Layout: Split View */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : `${sidebarWidth} 1fr`,
        gap: isMobile ? 0 : isTablet ? 20 : 24,
        flex: 1,
        minHeight: 0,
        backgroundColor: "#fff",
        borderRadius: cardBorderRadius,
        border: "1px solid #e2e8f0",
        overflow: "hidden"
      }}>

        {/* Left Sidebar: Student List */}
        {(!isMobile || !studentId) && (
          <div style={{
            borderRight: isMobile ? "none" : "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f8fafc",
            height: "100%"
          }}>
            {/* Search */}
            <div style={{ 
              padding: isMobile ? 12 : 16,
              borderBottom: "1px solid #e2e8f0",
              flexShrink: 0
            }}>
              <div style={{ position: "relative" }}>
                <Search 
                  size={isMobile ? 14 : 16} 
                  style={{ 
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8" 
                  }} 
                />
                <input
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: "100%",
                    padding: isMobile ? "7px 7px 7px 32px" : "8px 8px 8px 34px",
                    borderRadius: isMobile ? 6 : 8,
                    border: "1px solid #cbd5e1",
                    fontSize: isMobile ? 12 : 13,
                    outline: "none",
                    boxSizing: "border-box",
                    WebkitTapHighlightColor: "transparent"
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ 
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden"
            }}>
              {filteredStudents.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleStudentChange(s.id)}
                  style={{
                    padding: isMobile ? "10px 12px" : "12px 16px",
                    cursor: "pointer",
                    backgroundColor: studentId === s.id ? "#fff" : "transparent",
                    borderLeft: studentId === s.id ? "3px solid #2563eb" : "3px solid transparent",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 10 : 12,
                    transition: "all 0.1s",
                    WebkitTapHighlightColor: "transparent"
                  }}
                >
                  <div style={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    borderRadius: "50%",
                    backgroundColor: studentId === s.id ? "#eff6ff" : "#e2e8f0",
                    color: studentId === s.id ? "#2563eb" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: isMobile ? 12 : 13,
                    flexShrink: 0
                  }}>
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ 
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: studentId === s.id ? 600 : 500,
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {s.name}
                    </div>
                    <div style={{ 
                      fontSize: isMobile ? 11 : 12,
                      color: "#64748b" 
                    }}>
                      Grade: {s.grade ?? "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Panel: Chat Interface */}
        {(!isMobile || studentId) && (
          <div style={{ 
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0
          }}>

            {/* Chat Header */}
            <div style={{ 
              padding: isMobile ? "12px 16px" : "16px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              flexShrink: 0
            }}>
              <div style={{ 
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 8 : 12,
                minWidth: 0,
                flex: 1
              }}>
                {isMobile && (
                  <button 
                    onClick={() => setStudentId("")} 
                    style={{ 
                      border: "none",
                      background: "none",
                      fontSize: 20,
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      color: "#64748b",
                      WebkitTapHighlightColor: "transparent"
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ 
                    margin: 0,
                    fontSize: isMobile ? 14 : 16,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {selectedStudent?.name ?? "Select a student"}
                  </h3>
                  <span style={{ 
                    fontSize: isMobile ? 11 : 12,
                    color: "#64748b" 
                  }}>
                    Feedback History
                  </span>
                </div>
              </div>
            </div>

            {/* Message List (Scrollable) */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: isMobile ? "16px 12px" : "20px 24px",
                backgroundColor: "#fcfcfc",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {loading ? (
                <div style={{ 
                  margin: "auto",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: isMobile ? 13 : 14
                }}>
                  <Loader2 size={isMobile ? 18 : 20} className="animate-spin" />
                  Loading history...
                </div>
              ) : items.length === 0 ? (
                <div style={{ 
                  margin: "auto",
                  textAlign: "center",
                  color: "#94a3b8" 
                }}>
                  <MessageSquare 
                    size={isMobile ? 40 : 48} 
                    style={{ opacity: 0.1, marginBottom: 16 }} 
                  />
                  <p style={{ 
                    margin: 0,
                    fontSize: isMobile ? 13 : 14 
                  }}>
                    No feedback records yet.
                  </p>
                  <p style={{ 
                    fontSize: isMobile ? 11 : 12,
                    margin: "4px 0 0 0" 
                  }}>
                    Start by sending a message below.
                  </p>
                </div>
              ) : (
                items.map(item => (
                  <FeedbackBubble 
                    key={item.id} 
                    item={item}
                    isMobile={isMobile}
                  />
                ))
              )}
            </div>

            {/* Input Area */}
            <div style={{ 
              padding: isMobile ? "12px 16px" : isTablet ? "16px 20px" : "20px 24px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#fff",
              flexShrink: 0
            }}>
              <div style={{ 
                marginBottom: isMobile ? 10 : 12,
                display: "flex",
                gap: isMobile ? 12 : 16,
                flexWrap: "wrap"
              }}>
                {/* Visibility Toggles */}
                <label style={{ 
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: isMobile ? 12 : 13,
                  cursor: "pointer",
                  color: visibility === 'parents' ? "#2563eb" : "#64748b",
                  WebkitTapHighlightColor: "transparent"
                }}>
                  <input
                    type="radio"
                    name="vis"
                    value="parents"
                    checked={visibility === 'parents'}
                    onChange={() => setVisibility('parents')}
                    style={{ accentColor: "#2563eb" }}
                  />
                  <Globe size={isMobile ? 12 : 14} />
                  <span>Visible to Parents</span>
                </label>

                <label style={{ 
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: isMobile ? 12 : 13,
                  cursor: "pointer",
                  color: visibility === 'internal' ? "#ea580c" : "#64748b",
                  WebkitTapHighlightColor: "transparent"
                }}>
                  <input
                    type="radio"
                    name="vis"
                    value="internal"
                    checked={visibility === 'internal'}
                    onChange={() => setVisibility('internal')}
                    style={{ accentColor: "#ea580c" }}
                  />
                  <Lock size={isMobile ? 12 : 14} />
                  <span>Internal Note</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: isMobile ? 8 : 12 }}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    visibility === 'parents' 
                      ? "Write feedback for the parent..." 
                      : "Write a private internal note..."
                  }
                  rows={isMobile ? 2 : 3}
                  style={{
                    flex: 1,
                    padding: isMobile ? 10 : 12,
                    borderRadius: isMobile ? 8 : 12,
                    border: "1px solid #cbd5e1",
                    fontSize: isMobile ? 13 : 14,
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                    WebkitTapHighlightColor: "transparent"
                  }}
                />
                <button
                  onClick={onCreate}
                  disabled={sending || !content.trim()}
                  style={{
                    padding: isMobile ? "0 14px" : "0 20px",
                    borderRadius: isMobile ? 8 : 12,
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    cursor: sending ? "wait" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    opacity: !content.trim() ? 0.5 : 1,
                    WebkitTapHighlightColor: "transparent",
                    minWidth: isMobile ? 50 : 60
                  }}
                >
                  {sending ? (
                    <Loader2 size={isMobile ? 18 : 20} className="animate-spin" />
                  ) : (
                    <Send size={isMobile ? 18 : 20} />
                  )}
                  <span style={{ 
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 600 
                  }}>
                    SEND
                  </span>
                </button>
              </div>
              {msg && msg.type === 'error' && (
                <div style={{ 
                  color: "#dc2626",
                  fontSize: isMobile ? 11 : 12,
                  marginTop: 8 
                }}>
                  {msg.text}
                </div>
              )}
            </div>

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