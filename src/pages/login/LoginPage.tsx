import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../auth/authContext";

// --- Icons ---
const IconEmail = ({ color = "#94a3b8" }: { color?: string }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

const IconLogo = () => (
    <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 0 6-1 6-1v-7"></path>
    </svg>
);

const IconLock = ({ color = "#94a3b8" }: { color?: string }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

// --- Base Styles ---
const styles = {
    pageContainer: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 20,
    },
    card: {
        width: "100%",
        maxWidth: 420,
        borderRadius: 16,
        padding: 32,
        margin: 20,
    },
    header: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        marginBottom: 24,
        textAlign: "center" as const,
    },
    logoBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    title: {
        fontSize: 26,
        fontWeight: 800,
        margin: "0 0 8px 0",
        letterSpacing: "-0.5px",
    },
    subtitle: {
        margin: 0,
        fontSize: 14,
        lineHeight: 1.55,
    },
    badge: {
        marginTop: 12,
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 999,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
    },
    form: {
        display: "flex",
        flexDirection: "column" as const,
        gap: 14,
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
        boxSizing: "border-box" as const,
        padding: "12px 12px 12px 40px",
        borderRadius: 10,
        fontSize: 14,
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
    },
    row: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 2,
    },
    hint: {
        fontSize: 12,
        margin: 0,
    },
    primaryBtn: (loading: boolean) => ({
        padding: "12px",
        borderRadius: 10,
        color: "#fff",
        border: "none",
        fontSize: 14,
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "transform 0.08s ease, background-color 0.2s",
        marginTop: 6,
    }),
    secondaryBtn: {
        padding: "10px",
        backgroundColor: "transparent",
        border: "none",
        fontSize: 13,
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: 4,
    },
    alert: () => ({
        padding: 12,
        borderRadius: 10,
        fontSize: 13,
        marginTop: 14,
        border: "1px solid transparent",
    }),
    divider: {
        height: 1,
        width: "100%",
        margin: "18px 0 10px 0",
        opacity: 0.25,
    },
    devNote: {
        marginTop: 18,
        padding: 12,
        borderRadius: 10,
        fontSize: 12,
        lineHeight: 1.5,
    },
};

// --- Theme helper (login vs signup) ---
function getTheme(mode: "login" | "signup") {
    const isSignup = mode === "signup";

    return {
        // page
        pageBg: "#f1f5f9",

        // card
        cardBg: "#ffffff",
        cardBorder: "1px solid #e2e8f0",
        cardShadow:
            "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.05)",

        // text
        title: "#0f172a",
        subtitle: "#64748b",
        hint: "#64748b",
        link: "#2563eb",

        // logo
        logoBg: "#eff6ff",
        logoColor: "#2563eb",

        // inputs
        inputBg: "#ffffff",
        inputBorder: "1px solid #cbd5e1",
        inputText: "#1e293b",
        inputPlaceholder: "#94a3b8",
        focusRing: "rgba(37,99,235,0.18)",

        // icons
        icon: "#94a3b8",

        // buttons（这里是 Login / Register 的主要区分）
        primary: isSignup ? "#16a34a" : "#2563eb", // Register = green
        primaryDisabled: "#94a3b8",

        // badge
        badgeBg: isSignup ? "#f0fdf4" : "#eff6ff",
        badgeBorder: isSignup
            ? "1px solid #bbf7d0"
            : "1px solid #bfdbfe",
        badgeText: isSignup ? "#166534" : "#1d4ed8",

        // alerts
        alertErrorBg: "#fef2f2",
        alertErrorText: "#b91c1c",
        alertErrorBorder: "#fecaca",

        alertOkBg: "#f0fdf4",
        alertOkText: "#15803d",
        alertOkBorder: "#bbf7d0",

        divider: "rgba(15,23,42,0.12)",

        devNoteBg: "#fffbeb",
        devNoteBorder: "1px dashed #fcd34d",
        devNoteText: "#92400e",
    };
}

export default function LoginPage() {
    const nav = useNavigate();
    const { refreshProfile } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // same component, two “pages”
    const [mode, setMode] = useState<"login" | "signup">("login");

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(
        null
    );

    const t = useMemo(() => getTheme(mode), [mode]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);

        try {
            if (mode === "signup") {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                setMsg({
                    type: "success",
                    text: "Signup success! Check your email for confirmation.",
                });
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
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        nav("/forgot-password");
    };

    const toggleMode = () => {
        setMsg(null);
        setMode((m) => (m === "login" ? "signup" : "login"));
    };

    const onInputFocus =
        (focusColor: string, ringColor: string) =>
            (e: React.FocusEvent<HTMLInputElement>) => {
                e.currentTarget.style.borderColor = focusColor;
                e.currentTarget.style.boxShadow = `0 0 0 4px ${ringColor}`;
            };

    const onInputBlur =
        (borderReset: string) => (e: React.FocusEvent<HTMLInputElement>) => {
            e.currentTarget.style.borderColor = borderReset;
            e.currentTarget.style.boxShadow = "none";
        };

    const alertStyle =
        msg?.type === "error"
            ? {
                ...styles.alert(),
                backgroundColor: t.alertErrorBg,
                color: t.alertErrorText,
                border: t.alertErrorBorder,
            }
            : msg?.type === "success"
                ? {
                    ...styles.alert(),
                    backgroundColor: t.alertOkBg,
                    color: t.alertOkText,
                    border: t.alertOkBorder,
                }
                : null;

    return (
        <div
            style={{
                ...styles.pageContainer,
                background: t.pageBg,
            }}
        >
            <div
                style={{
                    ...styles.card,
                    backgroundColor: t.cardBg,
                    border: t.cardBorder,
                    boxShadow: t.cardShadow,
                    backdropFilter: mode === "signup" ? "blur(10px)" : undefined,
                }}
            >
                {/* Header */}
                <div style={styles.header}>
                    <div
                        style={{
                            ...styles.logoBox,
                            backgroundColor: t.logoBg,
                            color: t.logoColor,
                            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.12), inset 0 2px 4px rgba(0,0,0,0.02)",
                        }}
                    >
                        <IconLogo />
                    </div>

                    <h2 style={{ ...styles.title, color: t.title }}>
                        {mode === "login" ? "Welcome back" : "Create your account"}
                    </h2>

                    <p style={{ ...styles.subtitle, color: t.subtitle }}>
                        {mode === "login"
                            ? "Sign in to continue to EduTrack."
                            : "Join EduTrack — track progress, attendance, and feedback."}
                    </p>

                    <div
                        style={{
                            ...styles.badge,
                            background: t.badgeBg,
                            border: t.badgeBorder,
                            color: t.badgeText,
                        }}
                    >
                        <span style={{ fontWeight: 700 }}>
                            {mode === "login" ? "LOGIN" : "REGISTER"}
                        </span>
                        <span style={{ opacity: 0.9 }}>
                            {mode === "login" ? "Secure access" : "Takes 30 seconds"}
                        </span>
                    </div>
                </div>

                <form onSubmit={submit} style={styles.form}>
                    {/* Email */}
                    <div style={styles.inputGroup}>
                        <div style={styles.iconWrapper}>
                            <IconEmail color={t.icon} />
                        </div>
                        <input
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            style={{
                                ...styles.input,
                                background: t.inputBg,
                                border: t.inputBorder,
                                color: t.inputText,
                            }}
                            onFocus={onInputFocus(t.primary, t.focusRing)}
                            onBlur={onInputBlur(
                                mode === "signup" ? "rgba(148,163,184,0.25)" : "#cbd5e1"
                            )}
                        />
                    </div>

                    {/* Password */}
                    <div style={styles.inputGroup}>
                        <div style={styles.iconWrapper}>
                            <IconLock color={t.icon} />
                        </div>
                        <input
                            placeholder={mode === "signup" ? "Create a password" : "Password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            required
                            style={{
                                ...styles.input,
                                background: t.inputBg,
                                border: t.inputBorder,
                                color: t.inputText,
                            }}
                            onFocus={onInputFocus(t.primary, t.focusRing)}
                            onBlur={onInputBlur(
                                mode === "signup" ? "rgba(148,163,184,0.25)" : "#cbd5e1"
                            )}
                        />
                    </div>

                    {/* Small row hint */}
                    <div style={styles.row}>
                        <p style={{ ...styles.hint, color: t.hint }}>
                            {mode === "login"
                                ? "Use your email & password to sign in."
                                : "Tip: After register verify your email to continue."}
                        </p>

                        {mode === "login" && (
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    fontSize: 12,
                                    color: t.link,
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    textUnderlineOffset: 4,
                                }}
                            >
                                Forgot password?
                            </button>
                        )}
                    </div>

                    <button
                        disabled={loading}
                        style={{
                            ...styles.primaryBtn(loading),
                            backgroundColor: loading ? t.primaryDisabled : t.primary,
                        }}
                        onMouseDown={(e) => {
                            if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.99)";
                        }}
                        onMouseUp={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                        }}
                    >
                        {loading
                            ? "Processing..."
                            : mode === "login"
                                ? "Sign In"
                                : "Create Account"}
                    </button>

                    {/* Mode switch */}
                    <button type="button" onClick={toggleMode} style={{ ...styles.secondaryBtn, color: t.link }}>
                        {mode === "login"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Sign in"}
                    </button>
                </form>

                {/* Message */}
                {msg && <div style={alertStyle as React.CSSProperties}>{msg.text}</div>}

                <div style={{ ...styles.divider, backgroundColor: t.divider }} />

                {/* Developer Note */}
                <div
                    style={{
                        ...styles.devNote,
                        backgroundColor: t.devNoteBg,
                        border: t.devNoteBorder,
                        color: t.devNoteText,
                    }}
                >
                    <strong>💡 Developer Note:</strong> Default role is <em>parent</em>. To become an{" "}
                    <em>admin</em>, manually update the <code>role</code> column in the Supabase{" "}
                    <code>profiles</code> table.
                </div>
            </div>

            {/* placeholder color for input */}
            <style>
                {`
          input::placeholder { color: ${t.inputPlaceholder}; }
        `}
            </style>
        </div>
    );
}
