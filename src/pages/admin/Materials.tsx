import React, { useEffect, useState, useRef } from "react";
import { listStudents, type Student } from "../../services/student";
import { listMaterialsByStudent, uploadMaterial, getMaterialSignedUrl, type MaterialRow } from "../../services/materials";
// ✅ 引入图标
import { UploadCloud, FileText, Download, Loader2, Search, File, CheckCircle } from "lucide-react";

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

// 1. 文件项组件
function MaterialItem({ 
  item, 
  onDownload 
}: { 
  item: MaterialRow; 
  onDownload: (m: MaterialRow) => Promise<void>;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    await onDownload(item);
    setDownloading(false);
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px",
      borderBottom: "1px solid #f1f5f9",
      backgroundColor: "#fff",
      gap: 12
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, overflow: "hidden" }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: 8, 
          backgroundColor: "#eff6ff", color: "#3b82f6", 
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <FileText size={20} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.title}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            {item.file_name} · {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          backgroundColor: "#fff",
          color: downloading ? "#94a3b8" : "#2563eb",
          cursor: downloading ? "default" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 500,
          transition: "all 0.2s"
        }}
      >
        {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        <span>Download</span>
      </button>
    </div>
  );
}

export default function AdminMaterials() {
  const isMobile = useIsMobile();
  
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
      // 如果还没填标题，自动填充文件名
      if (!title) {
         // 去掉扩展名
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
      // Slight delay for UX
      setTimeout(() => window.open(url, "_blank"), 300);
    } catch (e: unknown) {
      console.error("Download failed:", e);
      setMsg({ type: 'error', text: "Download failed link" });
    }
  };

  return (
    <div style={{ 
      padding: isMobile ? "24px 16px" : "32px 40px", 
      maxWidth: 1000, 
      margin: "0 auto", 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: "#334155"
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>Course Materials</h2>
        <p style={{ margin: 0, color: "#64748b" }}>Upload and manage study resources for students.</p>
      </div>

      {/* Main Grid Layout */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "350px 1fr", // Desktop: Sidebar + Main
        gap: 32,
        alignItems: "start"
      }}>
        
        {/* Left Column: Upload Panel */}
        <div style={{ 
          backgroundColor: "#fff", 
          borderRadius: 16, 
          border: "1px solid #e2e8f0", 
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          position: isMobile ? "static" : "sticky",
          top: 24
        }}>
          <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 600, color: "#1e293b", marginBottom: 20 }}>Upload New</h3>
          
          {/* Student Select */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 6 }}>Target Student</label>
            <div style={{ position: "relative" }}>
               <select
                 value={studentId}
                 onChange={(e) => setStudentId(e.target.value)}
                 style={{ 
                   width: "100%", padding: "10px 12px", borderRadius: 8, 
                   border: "1px solid #cbd5e1", fontSize: 14, outline: "none", backgroundColor: "#fff"
                 }}
               >
                 {students.map((s) => (
                   <option key={s.id} value={s.id}>{s.name}</option>
                 ))}
               </select>
            </div>
          </div>

          {/* Title Input */}
          <div style={{ marginBottom: 16 }}>
             <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 6 }}>Material Title</label>
             <input
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="e.g. Math Homework Ch.5"
               style={{ 
                 width: "100%", padding: "10px 12px", borderRadius: 8, 
                 border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box"
               }}
             />
          </div>

          {/* File Picker */}
          <div style={{ marginBottom: 24 }}>
             <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 6 }}>File Attachment</label>
             <div 
               onClick={() => fileInputRef.current?.click()}
               style={{
                 border: "2px dashed #cbd5e1", borderRadius: 12, padding: "20px",
                 textAlign: "center", cursor: "pointer", backgroundColor: "#f8fafc",
                 transition: "border-color 0.2s"
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
                   <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#3b82f6" }}>
                      <File size={20} />
                      <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                        {file.name}
                      </span>
                   </div>
                ) : (
                   <div style={{ color: "#94a3b8" }}>
                      <UploadCloud size={24} style={{ marginBottom: 8 }} />
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Click to browse</div>
                      <div style={{ fontSize: 11 }}>PDF, DOCX, JPG...</div>
                   </div>
                )}
             </div>
          </div>

          {/* Submit Btn */}
          <button
            onClick={onUpload}
            disabled={uploading || !file || !title}
            style={{
              width: "100%", padding: "12px", borderRadius: 8,
              backgroundColor: "#2563eb", color: "#fff", border: "none",
              fontSize: 14, fontWeight: 600, cursor: (uploading || !file) ? "not-allowed" : "pointer",
              opacity: (uploading || !file) ? 0.7 : 1,
              display: "flex", justifyContent: "center", alignItems: "center", gap: 8
            }}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {uploading ? "Uploading..." : "Upload Material"}
          </button>
          
          {msg && (
            <div style={{ 
              marginTop: 16, padding: 12, borderRadius: 8, fontSize: 13, 
              backgroundColor: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
              color: msg.type === 'error' ? '#b91c1c' : '#15803d',
              display: "flex", alignItems: "center", gap: 8
            }}>
              {msg.type === 'success' && <CheckCircle size={16} />}
              {msg.text}
            </div>
          )}
        </div>

        {/* Right Column: List */}
        <div>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1e293b" }}>Library</h3>
              <span style={{ fontSize: 13, color: "#64748b", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: 99 }}>
                {items.length} items
              </span>
           </div>

           <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              {loadingList ? (
                 <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", display: "flex", justifyContent: "center", gap: 8 }}>
                    <Loader2 className="animate-spin" /> Loading...
                 </div>
              ) : items.length === 0 ? (
                 <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
                    <Search size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>No materials found for this student.</p>
                 </div>
              ) : (
                 <div>
                    {items.map((m) => (
                       <MaterialItem key={m.id} item={m} onDownload={onDownload} />
                    ))}
                 </div>
              )}
           </div>
        </div>

      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}