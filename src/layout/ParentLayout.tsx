import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";

// --- Hook: Device Detection ---
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

// --- Responsive Styles Helper ---
const getLinkStyle = (isActive: boolean, isMobile: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: isMobile ? 10 : 14,
  padding: isMobile ? "10px 12px" : "12px 16px",
  borderRadius: isMobile ? 8 : 12,
  textDecoration: "none",
  color: isActive ? "#2563eb" : "#475569", 
  background: isActive ? "#eff6ff" : "transparent",
  fontSize: isMobile ? 14 : 15,
  fontWeight: isActive ? 600 : 500,
  transition: "all 0.2s ease-in-out",
  marginBottom: 4,
  WebkitTapHighlightColor: "transparent"
});

// --- Component: SidebarContent ---
const SidebarContent = ({ 
  isMobile,
  isTablet,
  onClose 
}: { 
  isMobile: boolean;
  isTablet: boolean;
  onClose: () => void;
}) => {
  const { email, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  const handleNavClick = () => {
    if (isMobile || isTablet) onClose();
  };

  // Responsive sizing
  const logoSize = isMobile ? 36 : 42;
  const avatarSize = isMobile ? 44 : 52;
  const iconSize = isMobile ? 18 : 20;
  const brandFontSize = isMobile ? 16 : 18;

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100%",
      height: "100%"
    }}>
      
      {/* --- Brand Header --- */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: isMobile ? 10 : 14, 
        marginBottom: isMobile ? 20 : 28, 
        paddingLeft: isMobile ? 4 : 8,
        flexShrink: 0
      }}>
        <div style={{
          width: logoSize,
          height: logoSize,
          borderRadius: isMobile ? 8 : 12,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          color: "white",
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: isMobile ? 16 : 20,
          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
          flexShrink: 0
        }}>
          E
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <b style={{ 
            display: "block", 
            fontSize: brandFontSize, 
            color: "#0f172a", 
            letterSpacing: "-0.5px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            EduTrack
          </b>
          <div style={{ 
            fontSize: isMobile ? 11 : 12,
            color: "#64748b",
            fontWeight: 500,
            background: "#f1f5f9",
            padding: "2px 6px",
            borderRadius: 4,
            display: "inline-block",
            marginTop: 2
          }}>
            {t("parent.portal")}
          </div>
        </div>
        {/* Close Button for Mobile/Tablet */}
        {(isMobile || isTablet) && (
          <button 
            onClick={onClose}
            style={{ 
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              transition: "background 0.2s",
              flexShrink: 0,
              WebkitTapHighlightColor: "transparent"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <X size={isMobile ? 20 : 24} />
          </button>
        )}
      </div>

      {/* --- Profile Summary --- */}
      <div style={{ 
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 10 : 14,
        padding: isMobile ? "16px 0" : "20px 0",
        marginBottom: isMobile ? 16 : 20,
        borderBottom: "1px solid #f1f5f9",
        borderTop: "1px solid #f1f5f9",
        flexShrink: 0
      }}>
        <div style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%",
          background: "#eff6ff",
          color: "#2563eb",
          display: "grid",
          placeItems: "center",
          fontSize: isMobile ? 16 : 20,
          fontWeight: 700,
          border: "3px solid #fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          flexShrink: 0
        }}>
          {(email?.[0] ?? "P").toUpperCase()}
        </div>
        <div style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
          <div style={{ 
            fontSize: isMobile ? 14 : 16,
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {email?.split('@')[0]}
          </div>
          <div style={{ 
            fontSize: isMobile ? 12 : 13,
            color: "#64748b",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            Parent Account
          </div>
        </div>
      </div>

      {/* --- Navigation --- */}
      <nav style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 4,
        overflowY: "auto",
        overflowX: "hidden",
        paddingBottom: 8
      }}>
        <NavLink 
          to="/parent/dashboard" 
          style={({ isActive }) => getLinkStyle(isActive, isMobile)} 
          onClick={handleNavClick}
        >
          <LayoutDashboard size={iconSize} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap" }}>{t("common.dashboard")}</span>
        </NavLink>
      </nav>

      {/* --- Footer Actions --- */}
      <div style={{ 
        marginTop: isMobile ? 12 : 16,
        borderTop: "1px solid #f1f5f9",
        paddingTop: isMobile ? 12 : 16,
        display: "grid",
        gap: isMobile ? 8 : 12,
        flexShrink: 0
      }}>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === "en" ? "zh" : "en")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 12,
            padding: isMobile ? "8px 12px" : "10px 14px",
            borderRadius: isMobile ? 8 : 10,
            border: "1px solid #e2e8f0",
            cursor: "pointer",
            background: "white",
            fontSize: isMobile ? 13 : 14,
            color: "#334155",
            fontWeight: 500,
            transition: "background 0.2s",
            WebkitTapHighlightColor: "transparent"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={(e) => e.currentTarget.style.background = "white"}
        >
          <Globe size={isMobile ? 16 : 18} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap" }}>
            {i18n.language === "en" ? "中文" : "English"}
          </span>
        </button>

        <button
          onClick={signOut}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 8 : 10,
            padding: isMobile ? "8px 12px" : "10px 14px",
            borderRadius: isMobile ? 8 : 10,
            border: "1px solid #fee2e2",
            cursor: "pointer",
            background: "#fef2f2",
            color: "#dc2626",
            fontSize: isMobile ? 13 : 14,
            fontWeight: 600,
            transition: "background 0.2s",
            WebkitTapHighlightColor: "transparent"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#fef2f2"}
        >
          <LogOut size={isMobile ? 16 : 18} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap" }}>{t("common.logout")}</span>
        </button>
      </div>
    </div>
  );
};

export default function ParentLayout() {
  const { email } = useAuth();
  const { t } = useTranslation();
  const { isMobile, isTablet, isDesktop } = useDeviceType();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && (isMobile || isTablet)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen, isMobile, isTablet]);

  // Responsive sidebar width
  const sidebarWidth = isMobile ? "85%" : isTablet ? "320px" : "270px";
  const maxSidebarWidth = isMobile ? "280px" : "320px";

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh",
      height: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: "hidden"
    }}>
      
      {/* --- Desktop Sidebar --- */}
      {isDesktop && (
        <aside style={{ 
          width: 270,
          height: "100vh", 
          position: "sticky", 
          top: 0,
          borderRight: "1px solid #e2e8f0", 
          padding: "24px 20px",
          background: "#fff",
          zIndex: 10,
          overflowY: "auto",
          overflowX: "hidden",
          flexShrink: 0
        }}>
          <SidebarContent isMobile={false} isTablet={false} onClose={() => {}} />
        </aside>
      )}

      {/* --- Mobile/Tablet Sidebar Overlay --- */}
      {(isMobile || isTablet) && (
        <>
          {/* Backdrop */}
          {sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)}
              style={{ 
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                zIndex: 40,
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                transition: "opacity 0.3s"
              }} 
            />
          )}
          
          {/* Sidebar Drawer */}
          <aside style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: sidebarWidth,
            maxWidth: maxSidebarWidth,
            background: "white",
            zIndex: 50,
            padding: isMobile ? "20px 16px" : "24px 20px",
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            <SidebarContent 
              isMobile={isMobile} 
              isTablet={isTablet}
              onClose={() => setSidebarOpen(false)} 
            />
          </aside>
        </>
      )}

      {/* --- Main Content Area --- */}
      <main style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        minWidth: 0,
        height: "100vh",
        overflow: "hidden"
      }}>
        
        {/* Topbar */}
        <header style={{ 
          height: isMobile ? 56 : 64,
          background: "white",
          borderBottom: "1px solid #e2e8f0", 
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", 
          padding: isMobile ? "0 16px" : isTablet ? "0 24px" : "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 30,
          flexShrink: 0
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? 12 : 16,
            minWidth: 0,
            flex: 1
          }}>
            {/* Menu button for mobile/tablet */}
            {(isMobile || isTablet) && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                style={{ 
                  border: "none",
                  background: "none",
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  transition: "background 0.2s",
                  WebkitTapHighlightColor: "transparent",
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Menu size={isMobile ? 22 : 24} color="#334155" />
              </button>
            )}
            
            {/* Welcome text - hide on very small mobile */}
            {!isMobile && (
              <div style={{ 
                fontSize: isTablet ? 15 : 16,
                fontWeight: 600,
                color: "#334155",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {t("common.welcome")}
              </div>
            )}
          </div>

          {/* User info */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? 8 : 12,
            minWidth: 0,
            flexShrink: 0
          }}>
            <div style={{ 
              textAlign: "right", 
              lineHeight: 1.3,
              minWidth: 0,
              maxWidth: isMobile ? "150px" : "none"
            }}>
              <div style={{ 
                fontSize: isMobile ? 12 : 14,
                fontWeight: 600,
                color: "#1e293b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {email}
              </div>
              <div style={{ 
                fontSize: isMobile ? 11 : 12,
                color: "#64748b",
                whiteSpace: "nowrap"
              }}>
                Parent Account
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <div style={{ 
          padding: isMobile ? 12 : isTablet ? 20 : 32,
          flex: 1,
          maxWidth: 1600,
          margin: "0 auto",
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}