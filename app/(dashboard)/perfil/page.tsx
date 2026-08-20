"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentPreferences } from "@/components/cmp/ConsentPreferences";
import { UbicacionForm } from "@/components/perfil/UbicacionForm";
import { getDeviceId } from "@/lib/telemetry/device";

export default function PerfilPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Tu cuenta, tu ubicación y tus preferencias de privacidad.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Tu comuna</p>
            <p className="text-xs text-muted-foreground">
              Usamos tu comuna para calcular alertas agroclimáticas y
              recomendaciones de cultivo.
            </p>
            <UbicacionForm />
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Ajustes de privacidad</p>
              <p className="text-xs text-muted-foreground">
                Revisa o cambia tus consentimientos de datos. Los cambios se
                aplican de inmediato.
              </p>
            </div>
            <Button variant="outline" className="min-h-11" onClick={() => setOpen(true)}>
              Gestionar
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <ConsentPreferences
          title="Ajustes de privacidad"
          deviceId={getDeviceId()}
          onConfirm={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}