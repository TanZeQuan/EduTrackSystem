import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../auth/authContext";

// --- Icons ---
const IconEmail = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#94a3b8" }}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);
const IconLogo = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2563eb" }}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 0 6-1 6-1v-7"></path>
    </svg>
);
const IconLock = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#94a3b8" }}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

// --- Styles ---
const styles = {
    pageContainer: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f1f5f9", // Slate-100
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        padding: 32,
        margin: 20,
    },
    header: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center", // 水平居中
        marginBottom: 32,
    },
    // 新增：Logo 的容器样式
    logoBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: "#eff6ff", // Blue-50 (非常淡的蓝色背景)
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.02)", // 内部微阴影，增加质感
    },
    title: {
        fontSize: 26,
        fontWeight: 800, // 更粗的字体，强调品牌
        color: "#0f172a",
        margin: "0 0 8px 0",
        letterSpacing: "-0.5px", // 稍微收紧字间距，显得更精致
    },
    subtitle: {
        margin: 0,
        color: "#64748b",
        fontSize: 15,
        lineHeight: 1.5,
    },
    form: {
        display: "flex",
        flexDirection: "column" as const,
        gap: 16,
    },
    inputGroup: {
        position: "relative" as const,
    },
    iconWrapper: {
        position: "absolute" as const,
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none" as const,
    },
    input: {
        width: "100%",
        // 👇 加上 "as const"
        boxSizing: "border-box" as const,

        padding: "12px 12px 12px 40px",
        borderRadius: 8,
        border: "1px solid #cbd5e1",
        fontSize: 14,
        color: "#1e293b",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
    },
    primaryBtn: (loading: boolean) => ({
        padding: "12px",
        borderRadius: 8,
        backgroundColor: loading ? "#94a3b8" : "#2563eb", // Disabled vs Blue-600
        color: "#fff",
        border: "none",
        fontSize: 14,
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background-color 0.2s",
        marginTop: 8,
    }),
    secondaryBtn: {
        padding: "10px",
        backgroundColor: "transparent",
        color: "#475569", // Slate-600
        border: "none",
        fontSize: 13,
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: 4,
    },
    alert: (type: "error" | "success") => ({
        padding: 12,
        borderRadius: 8,
        fontSize: 13,
        backgroundColor: type === "error" ? "#fef2f2" : "#f0fdf4",
        color: type === "error" ? "#b91c1c" : "#15803d",
        border: `1px solid ${type === "error" ? "#fecaca" : "#bbf7d0"}`,
        marginTop: 16,
    }),
    devNote: {
        marginTop: 24,
        padding: 12,
        backgroundColor: "#fffbeb", // Amber-50
        border: "1px dashed #fcd34d", // Amber-300
        borderRadius: 8,
        fontSize: 12,
        color: "#92400e", // Amber-800
        lineHeight: 1.5,
    }
};

export default function LoginPage() {
    const nav = useNavigate();
    const { refreshProfile } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "signup">("login");

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error", text: string } | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);

        try {
            if (mode === "signup") {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMsg({ type: "success", text: "Signup success! Check your email for confirmation." });
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                await refreshProfile();
                nav("/");
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Authentication failed";
            setMsg({ type: "error", text: errorMsg });
        } finally {
            // ✅ 修复：无论成功失败，都停止 Loading 状态 (除非成功跳转了，但保留 false 也没副作用)
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMsg(null);
        setMode(mode === "login" ? "signup" : "login");
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.card}>

                {/* ✅ 优化后的 Header */}
                <div style={styles.header}>
                    {/* Logo 区域 */}
                    <div style={styles.logoBox}>
                        <IconLogo />
                    </div>

                    {/* 文字区域 */}
                    <h2 style={styles.title}>EduTrack</h2>
                    <p style={styles.subtitle}>
                        {mode === "login"
                            ? "Welcome back! Please enter your details."
                            : "Start your journey with us today."}
                    </p>
                </div>

                <form onSubmit={submit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <div style={styles.iconWrapper}><IconEmail /></div>
                        <input
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            style={styles.input}
                            // 简单的聚焦效果
                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <div style={styles.iconWrapper}><IconLock /></div>
                        <input
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            required
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                        />
                    </div>

                    <button disabled={loading} style={styles.primaryBtn(loading)}>
                        {loading ? "Processing..." : mode === "login" ? "Sign In" : "Sign Up"}
                    </button>

                    <button type="button" onClick={toggleMode} style={styles.secondaryBtn}>
                        {mode === "login"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Sign in"}
                    </button>
                </form>

                {msg && (
                    <div style={styles.alert(msg.type)}>
                        {msg.text}
                    </div>
                )}

                {/* 开发者提示：用特殊的样式包装，不影响主界面美观 */}
                <div style={styles.devNote}>
                    <strong>💡 Developer Note:</strong> Default role is <em>parent</em>. To become an <em>admin</em>, manually update the `role` column in the Supabase `profiles` table.
                </div>
            </div>
        </div>
    );
}