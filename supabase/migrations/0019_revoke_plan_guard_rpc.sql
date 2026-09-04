-- Defense-in-depth for 0018: the plan-guard trigger function was flagged by
-- the security advisor as a SECURITY DEFINER function callable via RPC by
-- anon/authenticated (public schema grants EXECUTE to PUBLIC by default).
-- Direct RPC calls already fail ("trigger functions can only be called as
-- triggers"), but revoking EXECUTE removes the surface entirely. Trigger
-- invocation is unaffected: Postgres does not check EXECUTE for trigger
-- execution.

revoke execute on function public.bloquea_cambio_plan_perfiles()
  from public, anon, authenticated;
