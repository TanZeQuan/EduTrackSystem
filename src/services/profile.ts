import { supabase } from "./supabase";

export type Profile = {
  id: string;
  email: string | null;
  role: "admin" | "parent";
};

export async function listParents() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("role", "parent")
    .order("email", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Profile[];
}
