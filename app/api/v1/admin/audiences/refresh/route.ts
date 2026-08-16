import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { refreshAudiences } from "@/lib/telemetry/refresh";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();

  const cronSecret =
    request.headers.get("x-cron-secret") ??
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.slice(7)
      : null);
  const authorizedByCron =
    process.env.CRON_SECRET !== undefined &&
    process.env.CRON_SECRET !== "" &&
    cronSecret === process.env.CRON_SECRET;

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