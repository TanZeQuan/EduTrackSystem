import { supabase } from "../services/supabase";
import type { Role } from "../auth/type";

export async function upsertProfile(userId: string, email: string | null) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, email: email ?? undefined }, { onConflict: "id" });
  if (error) throw error;
}

export async function fetchRole(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as { role: Role; email: string | null };
}
