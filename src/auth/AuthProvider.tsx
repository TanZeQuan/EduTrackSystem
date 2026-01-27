import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { AuthContext } from "./authContext";
import type { Role } from "../auth/type"; // ✅ 建议把 Role 放在 auth/types.ts

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    // ✅ 用 getSession 比 getUser 更快、更稳定（不会一直等网络）
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    const session = sessionData.session;
    if (!session?.user) {
      setUserId(null);
      setEmail(null);
      setRole(null);
      return;
    }

    const u = session.user;
    setUserId(u.id);
    setEmail(u.email ?? null);

    // ✅ 先读 profile；用 maybeSingle，profile 不存在也不会 throw
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role,email")
      .eq("id", u.id)
      .maybeSingle();

    if (profileErr) throw profileErr;

    // ✅ profile 不存在 -> 自动创建（默认 parent）
    if (!profile) {
      const { error: insErr } = await supabase.from("profiles").insert({
        id: u.id,
        email: u.email ?? null,
        role: "parent",
      });
      if (insErr) throw insErr;

      setRole("parent");
      return;
    }

    setRole(profile.role);
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await refreshProfile();
      } catch (e: unknown) {
        console.error("Auth refreshProfile error:", e);
        // 如果这里报错，你至少不会一直卡死
        setUserId(null);
        setEmail(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      run();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({ userId, email, role, loading, signOut, refreshProfile }),
    [userId, email, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
