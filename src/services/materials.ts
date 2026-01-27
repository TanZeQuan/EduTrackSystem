import { supabase } from "./supabase";

export type MaterialRow = {
  id: string;
  student_id: string;
  title: string;
  file_path: string;
  file_name: string;
  content_type: string | null;
  size: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export async function listMaterialsByStudent(studentId: string) {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MaterialRow[];
}

export async function uploadMaterial(params: {
  student_id: string;
  title: string;
  file: File;
}) {
  const { student_id, title, file } = params;

  // 生成 storage 路径：materials/<studentId>/<timestamp>-filename
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${student_id}/${Date.now()}-${safeName}`;

  // 上传到 bucket
  const up = await supabase.storage.from("materials").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (up.error) throw up.error;

  // 写入 materials 表
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("materials")
    .insert({
      student_id,
      title,
      file_path: path,
      file_name: file.name,
      content_type: file.type || null,
      size: file.size,
      uploaded_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as MaterialRow;
}

export async function getMaterialSignedUrl(file_path: string) {
  const { data, error } = await supabase.storage
    .from("materials")
    .createSignedUrl(file_path, 60 * 10); // 10 minutes

  if (error) throw error;
  return data.signedUrl;
}
