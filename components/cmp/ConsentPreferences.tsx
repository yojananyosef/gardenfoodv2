"use client";

import { useState } from "react";
import { DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useConsentSave } from "@/lib/consent/useConsentSave";
import { getLocalConsent, isConsentValid } from "@/lib/consent/token";

export interface ConsentDraft {
  consentString?: string | null;
  personalizedAds: boolean;
  preciseGeo: boolean;
  thirdPartySharing: boolean;
  deviceLinking: boolean;
  legitimateInterestOpposed: boolean;
}

const PURPOSES: Array<{
  key: keyof Omit<ConsentDraft, "consentString">;
  title: string;
  description: string;
}> = [
  {
    key: "personalizedAds",
    title: "Publicidad personalizada",
    description: "Anuncios de insumos y viveros relevantes para tu huerto.",
  },
  {
    key: "preciseGeo",
    title: "Geolocalización precisa",
    description: "Recomendaciones de tiendas agrícolas cercanas a tu ubicación.",
  },
  {
    key: "thirdPartySharing",
    title: "Compartir con socios comerciales",
    description:
      "Participar en estadísticas agregadas de segmentos y en la entrega de publicidad de marcas contra esos segmentos. No vendemos ni entregamos tus datos: la marca nunca recibe datos personales.",
  },
  {
    key: "deviceLinking",
    title: "Vincular mis dispositivos",
    description: "Reconocerte en este y otros dispositivos para una experiencia continua.",
  },
];

export interface ConsentPreferencesProps {
  title: string;
  deviceId: string;
  onBack?: () => void;
  onConfirm: (draft: ConsentDraft) => void;
}

function draftInicial(): ConsentDraft {
  if (typeof window === "undefined") {
    return {
      personalizedAds: false,
      preciseGeo: false,
      thirdPartySharing: false,
      deviceLinking: false,
      legitimateInterestOpposed: false,
    };
  }
  const guardado = getLocalConsent();
  if (guardado && isConsentValid(guardado)) {
    return {
      personalizedAds: guardado.personalizedAds,
      preciseGeo: guardado.preciseGeo,
      thirdPartySharing: guardado.thirdPartySharing,
      deviceLinking: guardado.deviceLinking,
      legitimateInterestOpposed: guardado.legitimateInterestOpposed,
    };
  }
  return {
    personalizedAds: false,
    preciseGeo: false,
    thirdPartySharing: false,
    deviceLinking: false,
    legitimateInterestOpposed: false,
  };
}

export function ConsentPreferences({
  title,
  deviceId,
  onBack,
  onConfirm,
}: ConsentPreferencesProps) {
  const [draft, setDraft] = useState<ConsentDraft>(draftInicial);
  const [error, setError] = useState<string | null>(null);
  const { saving, save } = useConsentSave(deviceId);

  function toggle(key: keyof ConsentDraft) {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleConfirm() {
    setError(null);
    const result = await save(draft);
    if (!result) {
      setError("No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    onConfirm(result);
  }

  return (
    <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl" showCloseButton={false}>
      <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        Gestiona qué datos nos permites usar. Puedes cambiar estas opciones
        cuando quieras desde tu perfil.
      </DialogDescription>
      <div className="flex flex-col gap-4">
        {PURPOSES.map((purpose) => (
          <div key={purpose.key} className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`purpose-${purpose.key}`} className="text-sm font-medium">
                {purpose.title}
              </Label>
              <span className="text-xs text-muted-foreground">
                {purpose.description}
              </span>
            </div>
            <Switch
              id={`purpose-${purpose.key}`}
              checked={draft[purpose.key]}
              onCheckedChange={() => toggle(purpose.key)}
            />
          </div>
        ))}
        <div className="flex items-start justify-between gap-4 border-t pt-3">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="purpose-legitimate-interest"
              className="text-sm font-medium"
            >
              Oponerse al interés legítimo
            </Label>
            <span className="text-xs text-muted-foreground">
              No usaremos tus datos bajo base de interés legítimo.
            </span>
          </div>
          <Switch
            id="purpose-legitimate-interest"
            checked={draft.legitimateInterestOpposed}
            onCheckedChange={() => toggle("legitimateInterestOpposed")}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-2">
        {error ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
        {onBack ? (
          <Button variant="ghost" className="min-h-11" onClick={onBack}>
            Volver
          </Button>
        ) : null}
        <Button className="min-h-12 w-full text-base" onClick={handleConfirm} disabled={saving}>
          {saving ? "Guardando…" : "Guardar y continuar"}
        </Button>
      </div>
    </DialogContent>
  );
}