"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConsentPreferences, type ConsentDraft } from "@/components/cmp/ConsentPreferences";
import { buildLocalConsent, setLocalConsent } from "@/lib/consent/token";

const CMP_COPY = {
  title: "Tu privacidad, a tu medida",
  body: "Analizamos el uso de la app de forma agregada para mejorarla (interés legítimo; puedes oponerte abajo). Las funciones de publicidad personalizada, geolocalización precisa y compartición con socios comerciales solo se activan con tu consentimiento. Ninguna opción queda preseleccionada.",
  primary: "Aceptar todo",
  secondary: "Gestionar opciones",
  reject: "Rechazar todo",
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

  async function rejectAll() {
    const draft = {
      personalizedAds: false,
      preciseGeo: false,
      thirdPartySharing: false,
      deviceLinking: false,
      legitimateInterestOpposed: true,
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
          personalizedAds: false,
          preciseGeo: false,
          thirdPartySharing: false,
          deviceLinking: false,
          legitimateInterestOpposed: true,
          expiresAt: data.consent.expiresAt,
        });
        setLocalConsent(consent);
        onConsent(consent);
        return;
      }
    } catch {
      // fall through to local-only rejected consent
    }
    const consent = buildLocalConsent({
      userId,
      deviceId,
      personalizedAds: false,
      preciseGeo: false,
      thirdPartySharing: false,
      deviceLinking: false,
      legitimateInterestOpposed: true,
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

  function handleOpenChange(next: boolean) {
    if (!next) {
      void rejectAll();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      {manage ? (
        <ConsentPreferences
          title={CMP_COPY.title}
          deviceId={deviceId}
          onBack={() => setManage(false)}
          onConfirm={saveDraft}
        />
      ) : (
        <DialogContent
          className="max-w-sm"
          showCloseButton={true}
          role="alertdialog"
        >
          <DialogTitle className="text-lg font-semibold">
            {CMP_COPY.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {CMP_COPY.body}
          </DialogDescription>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="min-h-12 w-full text-base"
              onClick={grantAll}
            >
              {CMP_COPY.primary}
            </Button>
            <Button
              variant="ghost"
              className="h-auto min-h-11 w-full justify-center px-2 text-sm font-normal text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setManage(true)}
            >
              {CMP_COPY.secondary}
            </Button>
            <Button
              variant="ghost"
              className="h-auto min-h-11 w-full justify-center px-2 text-sm font-normal text-muted-foreground hover:underline"
              onClick={() => void rejectAll()}
            >
              {CMP_COPY.reject}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}