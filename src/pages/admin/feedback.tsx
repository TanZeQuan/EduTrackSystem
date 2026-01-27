import React, { useEffect, useState, useMemo, useRef } from "react";
import { listStudents, type Student } from "../../services/student";
import { createFeedback, listFeedback, type FeedbackRow } from "../../services/feedback";
// ✅ Lucide Icons
import { Send, MessageSquare, Lock, Globe, CheckCheck, Loader2, Search } from "lucide-react";

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

// 1. 消息气泡组件
function FeedbackBubble({ item }: { item: FeedbackRow }) {
    const isInternal = item.visibility === 'internal';

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end", // 管理员发的消息靠右
            marginBottom: 16
        }}>
            <div style={{
                maxWidth: "85%",
                backgroundColor: isInternal ? "#fff7ed" : "#eff6ff", // Orange-50 vs Blue-50
                border: `1px solid ${isInternal ? "#fed7aa" : "#bfdbfe"}`,
                borderRadius: "16px 16px 4px 16px",
                padding: "12px 16px",
                position: "relative",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}>
                {/* Header: Visibility & Time */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: isInternal ? "#ea580c" : "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {isInternal ? <Lock size={10} /> : <Globe size={10} />}
                        {isInternal ? "Internal Note" : "To Parent"}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(item.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Content */}
                <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {item.content}
                </div>

                {/* Status Footer */}
                {!isInternal && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                        {item.is_read ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#10b981" }}>
                                <CheckCheck size={14} /> Seen
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94a3b8" }}>
                                <CheckCheck size={14} /> Delivered
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminFeedback() {
    const isMobile = useIsMobile();

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
                // Scroll to bottom after loading
                setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 100);
            } else {
                setItems([]);
            }
        } catch (e: unknown) {
            setMsg({ type: 'error', text: e instanceof Error ? e.message : "Failed to load" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // When switching students explicitly
    const handleStudentChange = async (newId: string) => {
        setStudentId(newId);
        setLoading(true); // Local loading
        try {
            const fb = await listFeedback(newId);
            setItems(fb);
            setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 100);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const onCreate = async () => {
        if (!studentId || !content.trim()) return;
        setSending(true);
        setMsg(null);
        try {
            await createFeedback({ student_id: studentId, content: content.trim(), visibility });
            setContent("");
            // Refresh list without full reload
            const fb = await listFeedback(studentId);
            setItems(fb);
            setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 100);
        } catch (e: unknown) {
            console.error(e);
            setMsg({ type: 'error', text: "Failed to send message" });
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            style={{
                padding: isMobile ? "12px" : "20px 24px",
                maxWidth: 1500,          // 原本 1200，缩一点更像图
                margin: "0 auto",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: "#334155",
                height: "calc(100vh - 64px)",
                display: "flex",
                flexDirection: "column",
            }}
        >

            {/* Page Header */}
            <div style={{ marginBottom: 24, flexShrink: 0 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>Feedback & Messages</h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Send updates to parents or keep internal notes.</p>
            </div>

            {/* Main Layout: Split View */}
            <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "250px 1fr",
                gap: 24,
                flex: 1,
                minHeight: 0, // Crucial for nested scrolling
                backgroundColor: "#fff",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                overflow: "hidden"
            }}>

                {/* Left Sidebar: Student List */}
                {(!isMobile || !studentId) && (
                    <div style={{
                        borderRight: isMobile ? "none" : "1px solid #e2e8f0",
                        display: "flex", flexDirection: "column",
                        backgroundColor: "#f8fafc"
                    }}>
                        {/* Search */}
                        <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
                            <div style={{ position: "relative" }}>
                                <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                <input
                                    placeholder="Search student..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: "80%", padding: "8px 8px 8px 34px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none" }}
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            {filteredStudents.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => handleStudentChange(s.id)}
                                    style={{
                                        padding: "12px 16px",
                                        cursor: "pointer",
                                        backgroundColor: studentId === s.id ? "#fff" : "transparent",
                                        borderLeft: studentId === s.id ? "3px solid #2563eb" : "3px solid transparent",
                                        borderBottom: "1px solid #f1f5f9",
                                        display: "flex", alignItems: "center", gap: 12,
                                        transition: "all 0.1s"
                                    }}
                                >
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        backgroundColor: studentId === s.id ? "#eff6ff" : "#e2e8f0",
                                        color: studentId === s.id ? "#2563eb" : "#64748b",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13
                                    }}>
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: studentId === s.id ? 600 : 500, color: "#1e293b" }}>{s.name}</div>
                                        <div style={{ fontSize: 12, color: "#64748b" }}>Grade: {s.grade ?? "-"}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Right Panel: Chat Interface */}
                {(!isMobile || studentId) && (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

                        {/* Chat Header */}
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                {isMobile && <button onClick={() => setStudentId("")} style={{ border: "none", background: "none", fontSize: 20 }}>←</button>}
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>{selectedStudent?.name ?? "Select a student"}</h3>
                                    <span style={{ fontSize: 12, color: "#64748b" }}>Feedback History</span>
                                </div>
                            </div>
                        </div>

                        {/* Message List (Scrollable) */}
                        <div
                            ref={scrollRef}
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: "20px 24px",
                                backgroundColor: "#fcfcfc",
                                display: "flex",
                                flexDirection: "column"
                            }}
                        >
                            {loading ? (
                                <div style={{ margin: "auto", color: "#94a3b8", display: "flex", gap: 8 }}><Loader2 className="animate-spin" /> Loading history...</div>
                            ) : items.length === 0 ? (
                                <div style={{ margin: "auto", textAlign: "center", color: "#94a3b8" }}>
                                    <MessageSquare size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                                    <p>No feedback records yet.</p>
                                    <p style={{ fontSize: 12 }}>Start by sending a message below.</p>
                                </div>
                            ) : (
                                items.map(item => <FeedbackBubble key={item.id} item={item} />)
                            )}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: 24, borderTop: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
                            <div style={{ marginBottom: 12, display: "flex", gap: 16 }}>
                                {/* Visibility Toggles */}
                                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: visibility === 'parents' ? "#2563eb" : "#64748b" }}>
                                    <input
                                        type="radio" name="vis" value="parents"
                                        checked={visibility === 'parents'} onChange={() => setVisibility('parents')}
                                        style={{ accentColor: "#2563eb" }}
                                    />
                                    <Globe size={14} /> Visible to Parents
                                </label>

                                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: visibility === 'internal' ? "#ea580c" : "#64748b" }}>
                                    <input
                                        type="radio" name="vis" value="internal"
                                        checked={visibility === 'internal'} onChange={() => setVisibility('internal')}
                                        style={{ accentColor: "#ea580c" }}
                                    />
                                    <Lock size={14} /> Internal Note
                                </label>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={visibility === 'parents' ? "Write feedback for the parent..." : "Write a private internal note..."}
                                    rows={isMobile ? 2 : 3}
                                    style={{
                                        flex: 1, padding: 12, borderRadius: 12, border: "1px solid #cbd5e1",
                                        fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit"
                                    }}
                                />
                                <button
                                    onClick={onCreate}
                                    disabled={sending || !content.trim()}
                                    style={{
                                        padding: "0 20px", borderRadius: 12, border: "none",
                                        backgroundColor: "#2563eb", color: "#fff", cursor: sending ? "wait" : "pointer",
                                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                                        opacity: !content.trim() ? 0.5 : 1
                                    }}
                                >
                                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                    <span style={{ fontSize: 11, fontWeight: 600 }}>SEND</span>
                                </button>
                            </div>
                            {msg && msg.type === 'error' && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 8 }}>{msg.text}</div>}
                        </div>

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