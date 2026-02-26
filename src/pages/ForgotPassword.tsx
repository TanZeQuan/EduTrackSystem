import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsResetMode(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (isResetMode) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMsg({ type: "success", text: "Password updated! Redirecting..." });
        setTimeout(() => nav("/login"), 1500);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/forgot-password`,
        });
        if (error) throw error;
        setMsg({ type: "success", text: "Reset link sent to your email." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Icon Header */}
        <div style={styles.iconWrapper}>
          <span style={{ fontSize: 24 }}>{isResetMode ? "🔑" : "✉️"}</span>
        </div>

        <h2 style={styles.title}>{isResetMode ? "New Password" : "Reset Password"}</h2>
        <p style={styles.subtitle}>
          {isResetMode 
            ? "Please enter a strong password to secure your account." 
            : "Enter your email address to receive a recovery link."}
        </p>

        <form onSubmit={handleAction} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{isResetMode ? "New Password" : "Email Address"}</label>
            <input
              type={isResetMode ? "password" : "email"}
              value={isResetMode ? password : email}
              onChange={(e) => (isResetMode ? setPassword(e.target.value) : setEmail(e.target.value))}
              required
              style={styles.input}
            />
          </div>

          <button disabled={loading} style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}>
            {loading ? "Please wait..." : isResetMode ? "Update Password" : "Send Reset Link"}
          </button>
        </form>

        {msg && (
          <div style={{ ...styles.alert, ...(msg.type === "error" ? styles.alertError : styles.alertSuccess) }}>
            {msg.text}
          </div>
        )}

        <button onClick={() => nav("/login")} style={styles.backButton}>
          ← Back to login
        </button>
      </div>
    </div>
  );
}

// --- 样式对象 (保持代码整洁) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: "20px",
    fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f1f5f9",
    textAlign: "center",
  },
  iconWrapper: {
    width: "56px",
    height: "56px",
    backgroundColor: "#eff6ff",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    color: "#3b82f6",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.5",
    marginBottom: "30px",
  },
  form: {
    textAlign: "left",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  alert: {
    marginTop: "20px",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
  },
  alertSuccess: {
    backgroundColor: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #dcfce7",
  },
  alertError: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fee2e2",
  },
  backButton: {
    marginTop: "24px",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 500,
  }
};