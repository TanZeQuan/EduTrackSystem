import { supabase } from "./supabase";

export type AttendanceStatus = "present" | "absent" | "late";

export type AttendanceRow = {
  id: string;
  student_id: string;
  date: string; 
  status: AttendanceStatus;
  note: string | null;
  marked_by: string | null;
};

export async function listAttendanceByDate(date: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("id,student_id,date,status,note,marked_by")
    .eq("date", date);

  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export async function upsertAttendance(input: {
  student_id: string;
  date: string; 
  status: AttendanceStatus;
  note?: string | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        student_id: input.student_id,
        date: input.date,
        status: input.status,
        note: input.note ?? null,
        marked_by: user?.id ?? null,
      },
      { onConflict: "student_id,date" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as AttendanceRow;
}

export async function listAttendanceByStudent(studentId: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("id,student_id,date,status,note,marked_by")
    .eq("student_id", studentId)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export async function getLatestAttendance(studentId: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0] ?? null) as AttendanceRow | null;
}
