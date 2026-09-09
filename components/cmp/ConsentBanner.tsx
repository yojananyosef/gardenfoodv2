"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConsentPreferences, type ConsentDraft } from "@/components/cmp/ConsentPreferences";
import { Dialog } from "@/components/ui/dialog";
import {
  buildLocalConsent,
  debeMostrarBanner,
  getLocalConsent,
  setLocalConsent,
  type LocalConsent,
} from "@/lib/consent/token";
import { getDeviceId } from "@/lib/telemetry/device";

type Eleccion = {
  personalizedAds: boolean;
  preciseGeo: boolean;
  thirdPartySharing: boolean;
  deviceLinking: boolean;
  legitimateInterestOpposed: boolean;
};

const TODO_SI: Eleccion = {
  personalizedAds: true,
  preciseGeo: true,
  thirdPartySharing: true,
  deviceLinking: true,
  legitimateInterestOpposed: false,
};

const TODO_NO: Eleccion = {
  personalizedAds: false,
  preciseGeo: false,
  thirdPartySharing: false,
  deviceLinking: false,
  legitimateInterestOpposed: true,
};

async function persistir(draft: Eleccion, deviceId: string, userId: string | null): Promise<LocalConsent> {
  try {
    const response = await fetch("/api/v1/cmp/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, ...draft }),
    });
    if (response.ok) {
      const data = (await response.json()) as { consent: { expiresAt: string } };
      return buildLocalConsent({
        userId,
        deviceId,
        ...draft,
        expiresAt: data.consent.expiresAt,
      });
    }
  } catch {
    // sin respaldo server-side: la elección local sigue siendo válida
  }
  return buildLocalConsent({ userId, deviceId, ...draft });
}

export function ConsentBanner({ userId }: { userId?: string | null }) {
  const [deviceId, setDeviceId] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);

  useEffect(() => {
    const id = getDeviceId();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- estado inicial de cliente: localStorage no existe en SSR
    setDeviceId(id);
    setVisible(debeMostrarBanner(getLocalConsent()));
  }, []);

  async function elegir(draft: Eleccion) {
    const consent = await persistir(draft, deviceId, userId ?? null);
    setLocalConsent(consent);
    setVisible(false);
  }

  async function gestionar(draft: ConsentDraft) {
    const consent = await persistir(draft, deviceId, userId ?? null);
    setLocalConsent(consent);
    setManage(false);
    setVisible(false);
  }

  if (!visible) {
    return manage ? (
      <Dialog open={manage} onOpenChange={setManage}>
        <ConsentPreferences
          title="Gestionar opciones"
          deviceId={deviceId}
          onConfirm={gestionar}
        />
      </Dialog>
    ) : null;
  }

  return (
    <>
      <div
        role="region"
        aria-label="Privacidad y consentimiento"
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-xs leading-relaxed text-muted-foreground sm:flex-1">
            La analítica de producto corre de forma agregada bajo interés legítimo — puedes{" "}
            <strong>oponerte</strong> rechazando. Publicidad personalizada, geolocalización precisa,
            compartición con socios y vinculación de dispositivos requieren tu consentimiento.{" "}
            <a href="/legal/privacidad" className="underline underline-offset-4 hover:text-foreground">
              Política de privacidad
            </a>{" "}
            ·{" "}
            <a href="/legal/cookies" className="underline underline-offset-4 hover:text-foreground">
              Cookies
            </a>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button size="sm" className="h-10 rounded-full px-4" onClick={() => void elegir(TODO_SI)}>
              Aceptar todo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-10 rounded-full px-4"
              onClick={() => void elegir(TODO_NO)}
            >
              Rechazar todo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-10 rounded-full px-4"
              onClick={() => setManage(true)}
            >
              Gestionar
            </Button>
          </div>
        </div>
      </div>
      {manage ? (
        <Dialog open={manage} onOpenChange={setManage}>
          <ConsentPreferences
            title="Gestionar opciones"
            deviceId={deviceId}
            onConfirm={gestionar}
          />
        </Dialog>
      ) : null}
    </>
  );
}
