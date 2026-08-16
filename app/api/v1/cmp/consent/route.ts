import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consentUpdateSchema } from "@/lib/consent/schemas";
import { CONSENT_COOKIE_NAME, CONSENT_TTL_MS } from "@/lib/consent/token";

export const dynamic = "force-dynamic";

interface ConsentRow {
  id: string;
  user_id: string | null;
  device_id: string;
  consent_string: string | null;
  consent_personalized_ads: boolean;
  consent_precise_geo: boolean;
  consent_third_party_sharing: boolean;
  consent_device_linking: boolean;
  legitimate_interest_opposed: boolean;
  consent_timestamp: string;
  expires_at: string;
}

interface CanonicalConsent {
  userId: string | null;
  deviceId: string;
  consentString: string | null;
  personalizedAds: boolean;
  preciseGeo: boolean;
  thirdPartySharing: boolean;
  deviceLinking: boolean;
  legitimateInterestOpposed: boolean;
  consentTimestamp: string;
  expiresAt: string;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = consentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid consent payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { deviceId, ...purposes } = parsed.data;
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");
  const consentTimestamp = new Date();
  const expiresAt = new Date(consentTimestamp.getTime() + CONSENT_TTL_MS);

  const existing = await (async () => {
    const query = supabase
      .from("gf_user_consents")
      .select("*")
      .eq("device_id", deviceId);
    if (user) {
      query.eq("user_id", user.id);
    } else {
      query.is("user_id", null);
    }
    const { data } = await query.maybeSingle();
    return data as ConsentRow | null;
  })();

  const row = {
    user_id: user?.id ?? null,
    device_id: deviceId,
    consent_string: purposes.consentString ?? null,
    consent_personalized_ads: purposes.consentPersonalizedAds,
    consent_precise_geo: purposes.consentPreciseGeo,
    consent_third_party_sharing: purposes.consentThirdPartySharing,
    consent_device_linking: purposes.consentDeviceLinking,
    legitimate_interest_opposed: purposes.legitimateInterestOpposed,
    consent_timestamp: consentTimestamp.toISOString(),
    expires_at: expiresAt.toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
  };

  const { error } = existing
    ? await supabase
        .from("gf_user_consents")
        .update(row)
        .eq("id", existing.id)
    : await supabase.from("gf_user_consents").insert(row);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({
    consent: {
      userId: user?.id ?? null,
      deviceId,
      consentString: purposes.consentString ?? null,
      personalizedAds: purposes.consentPersonalizedAds,
      preciseGeo: purposes.consentPreciseGeo,
      thirdPartySharing: purposes.consentThirdPartySharing,
      deviceLinking: purposes.consentDeviceLinking,
      legitimateInterestOpposed: purposes.legitimateInterestOpposed,
      consentTimestamp: consentTimestamp.toISOString(),
      expiresAt: expiresAt.toISOString(),
    } satisfies CanonicalConsent,
  });

  response.cookies.set({
    name: CONSENT_COOKIE_NAME,
    value: expiresAt.toISOString(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(CONSENT_TTL_MS / 1000),
  });

  return response;
}