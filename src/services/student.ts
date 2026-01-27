import { supabase } from "./supabase";

export type Student = {
  id: string;
  name: string;
  grade: string | null;
  parent_id: string | null;
  created_at: string;
};

export async function listStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Student[];
}

export async function createStudent(input: { name: string; grade?: string; parent_id?: string | null }) {
  const { data, error } = await supabase
    .from("students")
    .insert({
      name: input.name,
      grade: input.grade ?? null,
      parent_id: input.parent_id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Student;
}

export async function deleteStudent(id: string) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}

export async function updateStudentParent(studentId: string, parentId: string | null) {
  const { data, error } = await supabase
    .from("students")
    .update({ parent_id: parentId })
    .eq("id", studentId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Student;
}
