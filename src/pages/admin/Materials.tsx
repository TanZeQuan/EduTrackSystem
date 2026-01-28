import React, { useEffect, useState, useRef } from "react";
import { listStudents, type Student } from "../../services/student";
import { listMaterialsByStudent, uploadMaterial, getMaterialSignedUrl, type MaterialRow } from "../../services/materials";
import { UploadCloud, FileText, Download, Loader2, Search, File, CheckCircle } from "lucide-react";

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

// 1. Material Item Component
function MaterialItem({ 
  item, 
  onDownload,
  isMobile,
}: { 
  item: MaterialRow; 
  onDownload: (m: MaterialRow) => Promise<void>;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    await onDownload(item);
    setDownloading(false);
  };

  const iconSize = isMobile ? 36 : 40;
  const titleFontSize = isMobile ? 14 : 15;
  const metaFontSize = isMobile ? 12 : 13;
  const buttonPadding = isMobile ? "6px 10px" : "8px 12px";

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: isMobile ? "12px 16px" : "16px 20px",
      borderBottom: "1px solid #f1f5f9",
      backgroundColor: "#fff",
      gap: isMobile ? 10 : 12,
      flexWrap: isMobile ? "wrap" : "nowrap"
    }}>
      <div style={{ 
        display: "flex",
        alignItems: "flex-start",
        gap: isMobile ? 10 : 12,
        overflow: "hidden",
        minWidth: 0,
        flex: 1
      }}>
        <div style={{ 
          width: iconSize,
          height: iconSize,
          borderRadius: isMobile ? 6 : 8,
          backgroundColor: "#eff6ff",
          color: "#3b82f6", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <FileText size={isMobile ? 18 : 20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ 
            fontWeight: 600,
            color: "#1e293b",
            fontSize: titleFontSize,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {item.title}
          </div>
          <div style={{ 
            fontSize: metaFontSize,
            color: "#64748b",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {item.file_name} · {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          padding: buttonPadding,
          borderRadius: isMobile ? 6 : 8,
          border: "1px solid #e2e8f0",
          backgroundColor: "#fff",
          color: downloading ? "#94a3b8" : "#2563eb",
          cursor: downloading ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 4 : 6,
          fontSize: isMobile ? 12 : 13,
          fontWeight: 500,
          transition: "all 0.2s",
          WebkitTapHighlightColor: "transparent",
          flexShrink: 0,
          whiteSpace: "nowrap"
        }}
      >
        {downloading ? (
          <Loader2 size={isMobile ? 14 : 16} className="animate-spin" />
        ) : (
          <Download size={isMobile ? 14 : 16} />
        )}
        {!isMobile && <span>Download</span>}
      </button>
    </div>
  );
}

export default function AdminMaterials() {
  const { isMobile, isTablet, isDesktop } = useDeviceType();
  
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [items, setItems] = useState<MaterialRow[]>([]);
  
  // Upload State
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Status
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Load students initially
  useEffect(() => {
    (async () => {
      try {
        const stu = await listStudents();
        setStudents(stu);
        if (stu.length > 0) setStudentId(stu[0].id);
      } catch (e: unknown) {
        console.error("ListStudent:", e);
        setMsg({ type: 'error', text: "Failed to load students" });
      }
    })();
  }, []);

  // Load materials when student changes
  useEffect(() => {
    if (!studentId) return;
    
    let alive = true;
    (async () => {
      setLoadingList(true);
      setMsg(null);
      try {
        const mats = await listMaterialsByStudent(studentId);
        if (alive) {
          setItems(mats);
          setLoadingList(false);
        }
      } catch (e: unknown) {
        console.error("Material load failed:", e);
        if (alive) {
          setMsg({ type: 'error', text: "Failed to load materials" });
          setLoadingList(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [studentId]);

  // Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      // Auto-fill title if empty
      if (!title) {
        const name = e.target.files[0].name.replace(/\.[^/.]+$/, "");
        setTitle(name);
      }
    }
  };

  const onUpload = async () => {
    if (!studentId) return alert("Select a student first");
    if (!title.trim()) return alert("Enter a title");
    if (!file) return alert("Select a file");

    setUploading(true);
    setMsg(null);
    try {
      await uploadMaterial({ student_id: studentId, title: title.trim(), file });
      setMsg({ type: 'success', text: "Uploaded successfully!" });
      
      // Reset form
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Reload list
      const mats = await listMaterialsByStudent(studentId);
      setItems(mats);
    } catch (e: unknown) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (m: MaterialRow) => {
    try {
      const url = await getMaterialSignedUrl(m.file_path);
      setTimeout(() => window.open(url, "_blank"), 300);
    } catch (e: unknown) {
      console.error("Download failed:", e);
      setMsg({ type: 'error', text: "Download failed link" });
    }
  };

  // Responsive styling
  const containerPadding = isMobile ? "16px" : isTablet ? "24px" : "32px 40px";
  const headerFontSize = isMobile ? 22 : isTablet ? 24 : 28;
  const cardBorderRadius = isMobile ? 12 : 16;
  const cardPadding = isMobile ? 16 : isTablet ? 20 : 24;
  const inputPadding = isMobile ? "8px 10px" : "10px 12px";
  const buttonPadding = isMobile ? "10px" : "12px";

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
      
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 20 : isTablet ? 24 : 32 }}>
        <h2 style={{ 
          fontSize: headerFontSize,
          fontWeight: 700,
          color: "#0f172a",
          margin: "0 0 8px 0",
          lineHeight: 1.2
        }}>
          Course Materials
        </h2>
        <p style={{ 
          margin: 0,
          color: "#64748b",
          fontSize: isMobile ? 14 : 15,
          lineHeight: 1.5
        }}>
          Upload and manage study resources for students.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile || isTablet ? "1fr" : "350px 1fr",
        gap: isMobile ? 20 : isTablet ? 24 : 32,
        alignItems: "start"
      }}>
        
        {/* Left Column: Upload Panel */}
        <div style={{ 
          backgroundColor: "#fff", 
          borderRadius: cardBorderRadius,
          border: "1px solid #e2e8f0", 
          padding: cardPadding,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          position: isDesktop ? "sticky" : "static",
          top: isDesktop ? 24 : 0
        }}>
          <h3 style={{ 
            marginTop: 0,
            fontSize: isMobile ? 16 : 18,
            fontWeight: 600,
            color: "#1e293b",
            marginBottom: isMobile ? 16 : 20 
          }}>
            Upload New
          </h3>
          
          {/* Student Select */}
          <div style={{ marginBottom: isMobile ? 12 : 16 }}>
            <label style={{ 
              display: "block",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 500,
              color: "#64748b",
              marginBottom: 6 
            }}>
              Target Student
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={{ 
                  width: "100%",
                  padding: inputPadding,
                  borderRadius: isMobile ? 6 : 8,
                  border: "1px solid #cbd5e1",
                  fontSize: isMobile ? 13 : 14,
                  outline: "none",
                  backgroundColor: "#fff",
                  WebkitTapHighlightColor: "transparent"
                }}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title Input */}
          <div style={{ marginBottom: isMobile ? 12 : 16 }}>
            <label style={{ 
              display: "block",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 500,
              color: "#64748b",
              marginBottom: 6 
            }}>
              Material Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Math Homework Ch.5"
              style={{ 
                width: "100%",
                padding: inputPadding,
                borderRadius: isMobile ? 6 : 8,
                border: "1px solid #cbd5e1",
                fontSize: isMobile ? 13 : 14,
                outline: "none",
                boxSizing: "border-box",
                WebkitTapHighlightColor: "transparent"
              }}
            />
          </div>

          {/* File Picker */}
          <div style={{ marginBottom: isMobile ? 16 : 24 }}>
            <label style={{ 
              display: "block",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 500,
              color: "#64748b",
              marginBottom: 6 
            }}>
              File Attachment
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: isMobile ? 10 : 12,
                padding: isMobile ? 16 : 20,
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#f8fafc",
                transition: "border-color 0.2s",
                WebkitTapHighlightColor: "transparent"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#cbd5e1"}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                style={{ display: "none" }} 
              />
              
              {file ? (
                <div style={{ 
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "#3b82f6" 
                }}>
                  <File size={isMobile ? 18 : 20} />
                  <span style={{ 
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: isMobile ? 150 : 180 
                  }}>
                    {file.name}
                  </span>
                </div>
              ) : (
                <div style={{ color: "#94a3b8" }}>
                  <UploadCloud 
                    size={isMobile ? 20 : 24} 
                    style={{ marginBottom: 8 }} 
                  />
                  <div style={{ 
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: 500 
                  }}>
                    Click to browse
                  </div>
                  <div style={{ fontSize: isMobile ? 10 : 11 }}>
                    PDF, DOCX, JPG...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={onUpload}
            disabled={uploading || !file || !title}
            style={{
              width: "100%",
              padding: buttonPadding,
              borderRadius: isMobile ? 6 : 8,
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              fontSize: isMobile ? 13 : 14,
              fontWeight: 600,
              cursor: (uploading || !file) ? "not-allowed" : "pointer",
              opacity: (uploading || !file) ? 0.7 : 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              WebkitTapHighlightColor: "transparent"
            }}
          >
            {uploading ? (
              <Loader2 size={isMobile ? 16 : 18} className="animate-spin" />
            ) : (
              <UploadCloud size={isMobile ? 16 : 18} />
            )}
            {uploading ? "Uploading..." : "Upload Material"}
          </button>
          
          {/* Message */}
          {msg && (
            <div style={{ 
              marginTop: isMobile ? 12 : 16,
              padding: isMobile ? 10 : 12,
              borderRadius: isMobile ? 6 : 8,
              fontSize: isMobile ? 12 : 13,
              backgroundColor: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
              color: msg.type === 'error' ? '#b91c1c' : '#15803d',
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              {msg.type === 'success' && <CheckCircle size={isMobile ? 14 : 16} />}
              {msg.text}
            </div>
          )}
        </div>

        {/* Right Column: List */}
        <div>
          <div style={{ 
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isMobile ? 12 : 16 
          }}>
            <h3 style={{ 
              margin: 0,
              fontSize: isMobile ? 16 : 18,
              fontWeight: 600,
              color: "#1e293b" 
            }}>
              Library
            </h3>
            <span style={{ 
              fontSize: isMobile ? 12 : 13,
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              padding: isMobile ? "3px 7px" : "4px 8px",
              borderRadius: 99 
            }}>
              {items.length} items
            </span>
          </div>

          <div style={{ 
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: cardBorderRadius,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
          }}>
            {loadingList ? (
              <div style={{ 
                padding: isMobile ? 30 : 40,
                textAlign: "center",
                color: "#94a3b8",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                fontSize: isMobile ? 13 : 14
              }}>
                <Loader2 size={isMobile ? 18 : 20} className="animate-spin" />
                Loading...
              </div>
            ) : items.length === 0 ? (
              <div style={{ 
                padding: isMobile ? 40 : 60,
                textAlign: "center",
                color: "#94a3b8" 
              }}>
                <Search 
                  size={isMobile ? 32 : 40} 
                  style={{ opacity: 0.2, marginBottom: 12 }} 
                />
                <p style={{ 
                  margin: 0,
                  fontSize: isMobile ? 13 : 14 
                }}>
                  No materials found for this student.
                </p>
              </div>
            ) : (
              <div>
                {items.map((m) => (
                  <MaterialItem 
                    key={m.id} 
                    item={m} 
                    onDownload={onDownload}
                    isMobile={isMobile}
                    isTablet={isTablet}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

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