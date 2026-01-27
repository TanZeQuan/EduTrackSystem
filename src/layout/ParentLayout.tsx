import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import {
  LayoutDashboard,
  BookOpen,
  LogOut,
  Menu,
  X,
  Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";

// --- Hook: Mobile Detection ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// --- Styles Helper: 统一风格 ---
const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "flex",
  alignItems: "center",
  gap: 14,                // 加大间距
  padding: "12px 16px",   // 加大点击区域
  borderRadius: 12,       // 统一圆角
  textDecoration: "none",
  color: isActive ? "#2563eb" : "#475569", 
  background: isActive ? "#eff6ff" : "transparent",
  fontSize: 15,           // ✨ 统一字体大小
  fontWeight: isActive ? 600 : 500,
  transition: "all 0.2s ease-in-out",
  marginBottom: 4
});

// --- Component: SidebarContent ---
const SidebarContent = ({ isMobile, onClose }: { isMobile: boolean, onClose: () => void }) => {
  const { email, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  const handleNavClick = () => {
    if (isMobile) onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      
      {/* --- Brand Header --- */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, paddingLeft: 8 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          color: "white", display: "grid", placeItems: "center",
          fontWeight: 800, fontSize: 20, 
          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
        }}>
          E
        </div>
        <div>
          <b style={{ display: "block", fontSize: 18, color: "#0f172a", letterSpacing: "-0.5px" }}>EduTrack</b>
          <div style={{ 
            fontSize: 12, color: "#64748b", fontWeight: 500, 
            background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 2 
          }}>
            {t("parent.portal")}
          </div>
        </div>
        {isMobile && (
          <button 
            onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 8 }}
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* --- Profile Summary --- */}
      <div style={{ 
        display: "flex", alignItems: "center", gap: 14,
        padding: "20px 0", marginBottom: 20, 
        borderBottom: "1px solid #f1f5f9", borderTop: "1px solid #f1f5f9" 
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "#eff6ff", color: "#2563eb",
          display: "grid", placeItems: "center",
          fontSize: 20, fontWeight: 700,
          border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          {(email?.[0] ?? "P").toUpperCase()}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>
            {email?.split('@')[0]}
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Parent Account</div>
        </div>
      </div>

      {/* --- Navigation --- */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <NavLink to="/parent/dashboard" style={linkStyle} onClick={handleNavClick}>
          <LayoutDashboard size={20} /> {t("common.dashboard")}
        </NavLink>

        <NavLink to="/parent/materials" style={linkStyle} onClick={handleNavClick}>
          <BookOpen size={20} /> {t("common.materials")}
        </NavLink>
      </nav>

      {/* --- Footer Actions --- */}
      <div style={{ marginTop: 28, borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "grid", gap: 12 }}>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === "en" ? "zh" : "en")}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0",
            cursor: "pointer", background: "white", fontSize: 14, color: "#334155",
            fontWeight: 500, transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={(e) => e.currentTarget.style.background = "white"}
        >
          <Globe size={18} />
          {i18n.language === "en" ? "中文" : "English"}
        </button>

        <button
          onClick={signOut}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10, border: "1px solid #fee2e2",
            cursor: "pointer", background: "#fef2f2", color: "#dc2626", 
            fontSize: 14, fontWeight: 600, transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#fef2f2"}
        >
          <LogOut size={18} />
          {t("common.logout")}
        </button>
      </div>
    </div>
  );
};

export default function ParentLayout() {
  const { email } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      backgroundColor: "#f8fafc",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* --- Desktop Sidebar --- */}
      {!isMobile && (
        <aside style={{ 
          width: 270, 
          height: "100vh", 
          position: "sticky", 
          top: 0,
          borderRight: "1px solid #e2e8f0", 
          padding: "24px 20px", 
          background: "#fff",
          zIndex: 10
        }}>
          <SidebarContent isMobile={false} onClose={() => {}} />
        </aside>
      )}

      {/* --- Mobile Sidebar Overlay --- */}
      {isMobile && (
        <>
          {sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} 
            />
          )}
          
          <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: "80%", maxWidth: 280,
            background: "white", zIndex: 50, padding: 24,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)"
          }}>
            <SidebarContent isMobile={true} onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* --- Main Content Area --- */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Topbar */}
        <header style={{ 
          height: 64, 
          background: "white", borderBottom: "1px solid #e2e8f0", 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          padding: "0 32px", position: "sticky", top: 0, zIndex: 30
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ border: "none", background: "none", padding: 4, cursor: "pointer" }}>
                <Menu size={24} color="#334155" />
              </button>
            )}
            {!isMobile && <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>{t("common.welcome")}</div>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right", lineHeight: 1.3 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{email}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Parent Account</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: isMobile ? 16 : 32, flex: 1, maxWidth: 1600, margin: "0 auto", width: "100%" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}