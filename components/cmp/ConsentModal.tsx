"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConsentPreferences, type ConsentDraft } from "@/components/cmp/ConsentPreferences";
import { buildLocalConsent, setLocalConsent } from "@/lib/consent/token";

const MOTIVATIONAL_COPY = {
  title: "¡Únete al huerto GardenFood!",
  body: "Permítenos crear una experiencia a tu medida donde sepamos exactamente cuándo podar, regar y qué fertilizante necesita tu tierra.",
  primary: "Consentir y Comenzar",
  secondary: "Gestionar opciones",
};

export interface ConsentModalProps {
  open: boolean;
  deviceId: string;
  userId?: string | null;
  onConsent: (consent: ReturnType<typeof buildLocalConsent> | null) => void;
}

export function ConsentModal({ open, deviceId, userId, onConsent }: ConsentModalProps) {
  const [manage, setManage] = useState(false);

  async function grantAll() {
    const draft = {
      personalizedAds: true,
      preciseGeo: true,
      thirdPartySharing: true,
      deviceLinking: true,
      legitimateInterestOpposed: false,
    };
    try {
      const response = await fetch("/api/v1/cmp/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, ...draft }),
      });
      if (response.ok) {
        const data = (await response.json()) as {
          consent: { expiresAt: string };
        };
        const consent = buildLocalConsent({
          userId,
          deviceId,
          personalizedAds: true,
          preciseGeo: true,
          thirdPartySharing: true,
          deviceLinking: true,
          legitimateInterestOpposed: false,
          expiresAt: data.consent.expiresAt,
        });
        setLocalConsent(consent);
        onConsent(consent);
        return;
      }
    } catch {
      // fall through to local-only consent
    }
    const consent = buildLocalConsent({
      userId,
      deviceId,
      personalizedAds: true,
      preciseGeo: true,
      thirdPartySharing: true,
      deviceLinking: true,
      legitimateInterestOpposed: false,
    });
    setLocalConsent(consent);
    onConsent(consent);
  }

  function saveDraft(draft: ConsentDraft) {
    const consent = buildLocalConsent({
      userId,
      deviceId,
      consentString: draft.consentString,
      personalizedAds: draft.personalizedAds,
      preciseGeo: draft.preciseGeo,
      thirdPartySharing: draft.thirdPartySharing,
      deviceLinking: draft.deviceLinking,
      legitimateInterestOpposed: draft.legitimateInterestOpposed,
    });
    setLocalConsent(consent);
    onConsent(consent);
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      {manage ? (
        <ConsentPreferences
          title={MOTIVATIONAL_COPY.title}
          deviceId={deviceId}
          onBack={() => setManage(false)}
          onConfirm={saveDraft}
        />
      ) : (
        <DialogContent
          className="max-w-sm"
          showCloseButton={false}
          role="alertdialog"
        >
          <DialogTitle className="text-lg font-semibold">
            {MOTIVATIONAL_COPY.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {MOTIVATIONAL_COPY.body}
          </DialogDescription>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="min-h-12 w-full text-base"
              onClick={grantAll}
            >
              {MOTIVATIONAL_COPY.primary}
            </Button>
            <Button
              variant="ghost"
              className="h-auto min-h-11 w-full justify-center px-2 text-sm font-normal text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setManage(true)}
            >
              {MOTIVATIONAL_COPY.secondary}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}