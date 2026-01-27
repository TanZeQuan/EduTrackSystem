import { supabase } from "./supabase";

export type FeedbackRow = {
  is_read: boolean | null;
  id: string;
  student_id: string;
  content: string;
  visibility: "parents" | "internal";
  created_by: string | null;
  created_at: string;
};

export async function listFeedback(studentId: string) {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as FeedbackRow[];
}

export async function createFeedback(input: {
  student_id: string;
  content: string;
  visibility?: "parents" | "internal";
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      student_id: input.student_id,
      content: input.content,
      visibility: input.visibility ?? "parents",
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as FeedbackRow;
}

export async function markFeedbackRead(feedbackId: string) {
  const { error } = await supabase.rpc("mark_feedback_read", { p_feedback_id: feedbackId });
  if (error) throw error;
}

export async function getUnreadFeedbackCountByStudent(studentId: string) {
  const { count, error } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}