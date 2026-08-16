import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAdmin(
  supabase: SupabaseClient,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("perfiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.plan === "admin";
}