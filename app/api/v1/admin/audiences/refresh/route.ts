import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { refreshAudiences } from "@/lib/telemetry/refresh";

export const dynamic = "force-dynamic";

function esCronSecretValido(entregado: string | null): boolean {
  const esperado = process.env.CRON_SECRET;
  if (!esperado || !entregado) return false;
  const a = Buffer.from(entregado);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const cronSecret =
    request.headers.get("x-cron-secret") ??
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.slice(7)
      : null);
  const authorizedByCron = esCronSecretValido(cronSecret);

  if (!authorizedByCron && !(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await refreshAudiences();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refresh failed" },
      { status: 500 },
    );
  }
}