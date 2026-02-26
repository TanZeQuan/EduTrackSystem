import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listMaterialsByStudent, getMaterialSignedUrl, type MaterialRow } from "../../services/materials";
import { FileText, Download, Search, BookOpen, Clock, Loader2, ChevronRight } from "lucide-react";

// --- Internal Hook: Device Detection ---
function useDeviceType() {
  const [deviceType, setDeviceType] = useState({
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceType({
        isMobile: window.innerWidth < 640,
        isTablet: window.innerWidth >= 640 && window.innerWidth < 1024
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}

export default function ParentMaterialView() {
  const { studentId } = useParams<{ studentId: string }>();
  const { isMobile } = useDeviceType();
  
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let alive = true;
    
    (async () => {
      setLoading(true);
      try {
        const data = await listMaterialsByStudent(studentId);
        if (alive) setMaterials(data);
      } catch (e) {
        console.error("Failed to load materials", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [studentId]);

  const handleDownload = async (m: MaterialRow) => {
    if (downloadingId) return;
    setDownloadingId(m.id);
    try {
      const url = await getMaterialSignedUrl(m.file_path);
      // Brief timeout to show the loading state to the user before the tab opens
      setTimeout(() => {
        window.open(url, "_blank");
        setDownloadingId(null);
      }, 400);
    } catch (e) {
      console.error(e);
      setDownloadingId(null);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      padding: isMobile ? "16px" : "24px 32px",
      maxWidth: "900px",
      margin: "0 auto",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: "#334155",
      minHeight: "100vh"
    }}>
      {/* Header Section */}
      <header style={{ marginBottom: 24 }}>
        <h2 style={{ 
          fontSize: isMobile ? 22 : 28, 
          fontWeight: 700, 
          color: "#0f172a", 
          margin: 0 
        }}>
          Courses Materials
        </h2>
        <p style={{ color: "#64748b", fontSize: isMobile ? 14 : 15, marginTop: 4 }}>
          Access and download resources shared by the teacher.
        </p>
      </header>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search 
          size={18} 
          style={{ 
            position: "absolute", 
            left: 14, 
            top: "50%", 
            transform: "translateY(-50%)", 
            color: "#94a3b8" 
          }} 
        />
        <input 
          type="text"
          placeholder="Find a specific file..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 14px 14px 44px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
            backgroundColor: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            transition: "border-color 0.2s"
          }}
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />
      </div>

      {/* List Container */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Loader2 className="animate-spin" style={{ margin: "0 auto", color: "#3b82f6" }} />
          <p style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>Fetching resources...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: 60, 
          backgroundColor: "#f8fafc", 
          borderRadius: 20,
          border: "2px dashed #e2e8f0"
        }}>
          <BookOpen size={48} style={{ color: "#cbd5e1", marginBottom: 16 }} />
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: 18 }}>No items found</h3>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
            Check back later for new materials or adjust your search.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredMaterials.map((m) => (
            <div 
              key={m.id}
              onClick={() => handleDownload(m)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: isMobile ? "14px" : "18px 20px",
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: "#eff6ff", color: "#2563eb",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  {downloadingId === m.id ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <FileText size={24} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 600, color: "#1e293b", fontSize: 16,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    marginBottom: 2
                  }}>
                    {m.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13 }}>
                    <Clock size={14} />
                    <span>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ color: "#94a3b8", display: "flex", alignItems: "center" }}>
                {isMobile ? <ChevronRight size={20} /> : <Download size={20} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global CSS for spinner animation */}
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}