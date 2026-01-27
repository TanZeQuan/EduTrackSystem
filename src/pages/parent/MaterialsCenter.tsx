import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listStudents, type Student } from "../../services/student";
import { listMaterialsByStudent, getMaterialSignedUrl, type MaterialRow } from "../../services/materials";

// --- Types ---
type Group = {
    student: Student;
    items: MaterialRow[];
};

// --- Icons (简单的 SVG 组件，避免引入庞大的图标库) ---
const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const IconFile = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#3b82f6" }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
);

const IconDownload = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

// --- Styles ---
const styles = {
    container: {
        padding: "40px 24px",
        maxWidth: 1024,
        margin: "0 auto",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#334155",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: "#0f172a",
        margin: 0,
    },
    backLink: {
        textDecoration: "none",
        color: "#64748b",
        fontSize: 14,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 4,
    },
    subtitle: {
        margin: "0 0 24px 0",
        color: "#64748b",
        fontSize: 15,
    },
    controls: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap" as const,
        alignItems: "center",
        marginBottom: 24,
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
    },
    searchInputWrapper: {
        flex: 1,
        minWidth: 280,
        position: "relative" as const,
        display: "flex",
        alignItems: "center",
    },
    searchInput: {
        width: "100%",
        padding: "10px 10px 10px 36px", // Space for icon
        borderRadius: 8,
        border: "1px solid #cbd5e1",
        fontSize: 14,
        outline: "none",
        transition: "border-color 0.2s",
    },
    searchIconPos: {
        position: "absolute" as const,
        left: 12,
        pointerEvents: "none" as const,
    },
    select: {
        padding: "10px 16px",
        borderRadius: 8,
        border: "1px solid #cbd5e1",
        fontSize: 14,
        backgroundColor: "#fff",
        cursor: "pointer",
    },
    card: {
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    cardHeader: {
        padding: "16px 24px",
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    studentName: {
        fontSize: 16,
        fontWeight: 600,
        color: "#1e293b",
    },
    listContainer: {
        display: "grid",
        gridTemplateColumns: "1fr",
    },
    countBadge: {
        padding: "4px 10px",
        backgroundColor: "#eff6ff", // 浅蓝色背景 (Blue-50)
        color: "#3b82f6",           // 蓝色文字 (Blue-500)
        borderRadius: 999,          // 圆角
        fontSize: 12,
        fontWeight: 600,
        border: "1px solid #dbeafe", // 浅蓝边框
        whiteSpace: "nowrap" as const, // 防止文字换行
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid #f1f5f9",
        gap: 16,
        transition: "background-color 0.1s",
    },
    rowContent: {
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        flex: 1,
    },
    fileTitle: {
        fontSize: 15,
        fontWeight: 600,
        color: "#334155",
        marginBottom: 4,
    },
    fileMeta: {
        fontSize: 13,
        color: "#94a3b8",
    },
    btnDownload: (disabled: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        backgroundColor: disabled ? "#f1f5f9" : "#fff",
        color: disabled ? "#94a3b8" : "#2563eb",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
    }),
};

export default function ParentMaterialsCenter() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<string | null>(null);

    // 状态优化：专门跟踪正在下载的那个文件 ID，实现局部 Loading
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const [q, setQ] = useState("");
    const [sort, setSort] = useState<"newest" | "oldest">("newest");

    const onDownload = async (mat: MaterialRow) => {
        if (downloadingId) return; // Prevent double click
        setMsg(null);
        setDownloadingId(mat.id);

        try {
            const url = await getMaterialSignedUrl(mat.file_path);
            // 稍微延迟一下，让用户感觉到交互发生，避免闪烁
            setTimeout(() => {
                window.open(url, "_blank");
                setDownloadingId(null);
            }, 500);
        } catch (e: unknown) {
            setMsg(e instanceof Error ? e.message : "Download failed");
            setDownloadingId(null);
        }
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            setMsg(null);
            setLoading(true);
            try {
                const students = await listStudents();
                if (!alive) return;

                const results = await Promise.allSettled(
                    students.map(async (s) => {
                        const mats = await listMaterialsByStudent(s.id);
                        return { student: s, items: mats } as Group;
                    })
                );
                if (!alive) return;

                const ok = results
                    .filter((r): r is PromiseFulfilledResult<Group> => r.status === "fulfilled")
                    .map((r) => r.value);
                setGroups(ok);
            } catch (e: unknown) {
                if (!alive) return;
                setMsg(e instanceof Error ? e.message : "Failed to load materials");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        const sortFn = (a: MaterialRow, b: MaterialRow) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            return sort === "newest" ? tb - ta : ta - tb;
        };

        return groups
            .map((g) => {
                const items = [...g.items]
                    .filter((m) => {
                        if (!query) return true;
                        return (
                            (m.title ?? "").toLowerCase().includes(query) ||
                            (m.file_name ?? "").toLowerCase().includes(query)
                        );
                    })
                    .sort(sortFn);
                return { ...g, items };
            })
            .filter((g) => g.items.length > 0 || !query);
    }, [groups, q, sort]);

    return (
        <div style={styles.container}>
            {/* 顶部区域 */}
            <div style={styles.headerRow}>
                <h2 style={styles.title}>Materials Center</h2>
                <Link to="/parent/dashboard" style={styles.backLink}>
                    ← Back to Dashboard
                </Link>
            </div>
            <p style={styles.subtitle}>
                Access and download course materials, homework, and resources for your children.
            </p>

            {/* 控制栏 (搜索 & 排序) */}
            <div style={styles.controls}>
                <div style={styles.searchInputWrapper}>
                    <div style={styles.searchIconPos}><IconSearch /></div>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search materials by title or filename..."
                        style={styles.searchInput}
                    />
                </div>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
                    style={styles.select}
                >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                </select>
            </div>

            {msg && (
                <div style={{ padding: 12, marginBottom: 20, backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: 8, fontSize: 14 }}>
                    {msg}
                </div>
            )}

            {/* 列表内容 */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading library...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, backgroundColor: "#f8fafc", borderRadius: 16, border: "1px dashed #e2e8f0" }}>
                    <p style={{ color: "#64748b" }}>No materials found matching your criteria.</p>
                </div>
            ) : (
                <div>
                    {filtered.map((g) => (
                        <div key={g.student.id} style={styles.card}>
                            {/* 学生卡片头部 */}
                            <div style={styles.cardHeader}>
                                {/* 左侧：头像 + 名字/年级 */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>
                                        {g.student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={styles.studentName}>{g.student.name}</div>
                                        <div style={{ fontSize: 12, color: "#64748b" }}>Grade: {g.student.grade ?? "N/A"}</div>
                                    </div>
                                </div>

                                {/* 右侧：资料计数 Badge + Profile 链接 */}
                                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                    {/* ✅ 新增：资料计数 Badge */}
                                    <span style={styles.countBadge}>
                                        Materials: {g.items.length}
                                    </span>

                                    <Link
                                        to={`/parent/students/${g.student.id}`}
                                        style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}
                                    >
                                        Profile →
                                    </Link>
                                </div>
                            </div>

                            {/* 资料列表 */}
                            <div style={styles.listContainer}>
                                {g.items.length === 0 ? (
                                    <div style={{ padding: 24, textAlign: "center", color: "#cbd5e1", fontSize: 14 }}>
                                        No materials available yet.
                                    </div>
                                ) : (
                                    g.items.map((m) => {
                                        const isDownloading = downloadingId === m.id;
                                        return (
                                            <div key={m.id} style={styles.row}>
                                                <div style={styles.rowContent}>
                                                    <div style={{ marginTop: 2 }}><IconFile /></div>
                                                    <div>
                                                        <div style={styles.fileTitle}>{m.title}</div>
                                                        <div style={styles.fileMeta}>
                                                            {m.file_name} • {new Date(m.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => onDownload(m)}
                                                    disabled={isDownloading}
                                                    style={styles.btnDownload(isDownloading)}
                                                    // 简单的 Hover 变色 (仅在非 disabled 时生效，React内联样式模拟hover较麻烦，这里建议用CSS Class)
                                                    onMouseEnter={(e) => !isDownloading && (e.currentTarget.style.backgroundColor = "#f8fafc")}
                                                    onMouseLeave={(e) => !isDownloading && (e.currentTarget.style.backgroundColor = "#fff")}
                                                >
                                                    {isDownloading ? (
                                                        <span>Preparing...</span>
                                                    ) : (
                                                        <>
                                                            <IconDownload />
                                                            <span>Download</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}