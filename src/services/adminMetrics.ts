import { supabase } from "./supabase";

export async function getAdminMetrics() {
  // 1) total students
  const { count: studentCount, error: e1 } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });
  if (e1) throw e1;

  // today in yyyy-mm-dd (match your attendance.date)
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // 2) today attendance present/absent
  const { data: todayAttendance, error: e2 } = await supabase
    .from("attendance")
    .select("status")
    .eq("date", today);
  if (e2) throw e2;

  const present = (todayAttendance ?? []).filter((x) => x.status === "present").length;
  const absent = (todayAttendance ?? []).filter((x) => x.status === "absent").length;

  // 3) this week progress count (simple: last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const weekAgoISO = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, "0")}-${String(weekAgo.getDate()).padStart(2, "0")}`;

  const { count: progressCount, error: e3 } = await supabase
    .from("progress")
    .select("*", { count: "exact", head: true })
    .gte("progress_date", weekAgoISO);
  if (e3) throw e3;

  // 4) latest feedback
  const { data: latestFeedback, error: e4 } = await supabase
    .from("feedback")
    .select("id, student_id, content, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (e4) throw e4;

  return {
    studentCount: studentCount ?? 0,
    today,
    present,
    absent,
    progressCount: progressCount ?? 0,
    latestFeedback: latestFeedback ?? [],
  };
}
