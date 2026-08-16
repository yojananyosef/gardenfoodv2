"use client";

import { useState } from "react";
import type { ConsentDraft } from "@/components/cmp/ConsentPreferences";
import { buildLocalConsent, setLocalConsent } from "@/lib/consent/token";
import type { LocalConsent } from "@/lib/consent/token";

export function useConsentSave(deviceId: string) {
  const [saving, setSaving] = useState(false);

  async function save(draft: ConsentDraft): Promise<LocalConsent | null> {
    setSaving(true);
    try {
      const response = await fetch("/api/v1/cmp/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, ...draft }),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as {
        consent: {
          userId: string | null;
          consentString: string | null;
          expiresAt: string;
        };
      };
      const consent = buildLocalConsent({
        userId: data.consent.userId,
        deviceId,
        consentString: data.consent.consentString,
        personalizedAds: draft.personalizedAds,
        preciseGeo: draft.preciseGeo,
        thirdPartySharing: draft.thirdPartySharing,
        deviceLinking: draft.deviceLinking,
        legitimateInterestOpposed: draft.legitimateInterestOpposed,
      });
      setLocalConsent(consent);
      return consent;
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  }

  return { saving, save };
}