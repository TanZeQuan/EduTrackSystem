import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 增强 UX：切换显示密码
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMsg({ type: "success", text: "密码更新成功！正在跳转..." });
      setTimeout(() => nav("/login"), 1500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "重置失败";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* 顶部图标或装饰 */}
        <div style={styles.iconBox}>🔑</div>

        <h2 style={styles.title}>重置密码</h2>
        <p style={styles.subtitle}>请为您的账户设置一个新的安全密码</p>

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="输入新密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            {/* 切换显示密码的小按钮 */}
            <span 
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button 
            disabled={loading} 
            style={{ 
              ...styles.button, 
              backgroundColor: loading ? "#94a3b8" : "#2563eb",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "更新中..." : "确定更新"}
          </button>
        </form>

        {msg && (
          <div style={{
            ...styles.alert,
            backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: msg.type === "error" ? "#dc2626" : "#16a34a",
            borderColor: msg.type === "error" ? "#fecaca" : "#bbf7d0",
          }}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

// 采用 CSS-in-JS 对象形式，方便整齐管理
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc", // 浅灰背景，更有质感
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "40px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
  },
  iconBox: {
    fontSize: "32px",
    marginBottom: "16px",
    display: "inline-block",
    padding: "12px",
    backgroundColor: "#eff6ff",
    borderRadius: "12px",
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
    marginBottom: "32px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },
  eyeIcon: {
    position: "absolute",
    right: "12px",
    cursor: "pointer",
    userSelect: "none",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    transition: "all 0.2s",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
  },
  alert: {
    marginTop: "24px",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid",
    textAlign: "left",
  }
};