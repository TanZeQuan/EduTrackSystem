import { supabase } from "./supabase";

export type ProgressRow = {
  id: string;
  student_id: string;
  subject: string;
  title: string | null;
  score: number | null;
  note: string | null;
  progress_date: string;
  created_by: string | null;
  created_at: string;
  // 关联出来的老师信息
  teacher?: { full_name: string | null; email: string | null } | null;
};

// 1. List progress for a single student (Parent/Public view)
export async function listProgressByStudent(studentId: string) {
  const { data, error } = await supabase
    .from("progress")
    .select(`
      *,
      teacher:profiles!created_by (
        full_name,
        email
      )
    `)
    .eq("student_id", studentId)
    .order("progress_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProgressRow[];
}

// 2. Create new progress record (Admin)
export async function createProgress(input: {
  student_id: string;
  subject: string;
  title: string;
  score: number | null;
  note: string | null;
  progress_date: string;
}) {
  const { data, error } = await supabase
    // ❌ 移除 .schema("private")，直接用默认 public
    .from("progress")
    .insert([{
      student_id: input.student_id,
      subject: input.subject,
      title: input.title,
      score: input.score,
      note: input.note,
      progress_date: input.progress_date,
    }])
    .select("*"); // 确保返回创建的数据

  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Create failed, no data returned");
  return data[0] as ProgressRow;
}

// 3. Delete progress record (Admin)
export async function deleteProgress(id: string) {
  const { error } = await supabase
    .from("progress")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// 4. List all progress records (Admin)
export async function listProgressAll() {
  const { data, error } = await supabase
    .from("progress")
    .select(`
      *,
      teacher:profiles!created_by (
        full_name,
        email
      )
    `)
    .order("progress_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProgressRow[];
}

// 5. Update progress record (Admin)
export async function updateProgress(
  id: string,
  patch: Partial<Pick<ProgressRow, "subject" | "title" | "score" | "note" | "progress_date">>
) {
  const { data, error } = await supabase
    .from("progress")
    .update(patch)
    .eq("id", id)
    .select(`
      *,
      teacher:profiles!created_by (
        full_name,
        email
      )
    `)
    .single();

  if (error) throw error;
  return data as ProgressRow;
}
