"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { ConsentPreferences } from "@/components/cmp/ConsentPreferences";
import { TerrenoSection } from "@/components/perfil/TerrenoSection";
import { UbicacionForm } from "@/components/perfil/UbicacionForm";
import { eliminarMiCuenta } from "@/lib/privacy/actions";
import { clearLocalConsent } from "@/lib/consent/token";
import { getDeviceId } from "@/lib/telemetry/device";
import { createClient } from "@/lib/supabase/client";

export default function PerfilPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [borrarOpen, setBorrarOpen] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  function revocarEleccion() {
    clearLocalConsent();
    setOpen(false);
  }

  async function confirmarSupresion() {
    setBorrando(true);
    setErrorBorrado(null);
    const resultado = await eliminarMiCuenta(confirmacion.trim());
    setBorrando(false);
    if (!resultado.ok) {
      setErrorBorrado(resultado.error);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    clearLocalConsent();
    router.push("/");
    router.refresh();
  }

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
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-sm font-medium">Tu terreno</p>
            <p className="text-xs text-muted-foreground">
              Ubícate en el mapa y dibuja los bordes de cada huerto (puedes
              tener varios) para ver su superficie y coordenadas.
            </p>
            <TerrenoSection />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Ajustes de privacidad</p>
              <p className="text-xs text-muted-foreground">
                Revisa o cambia tus consentimientos de datos. Los cambios se
                aplican de inmediato.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => setOpen(true)}>
                Gestionar
              </Button>
              <Button variant="ghost" className="min-h-11 text-muted-foreground" onClick={revocarEleccion}>
                Restablecer elección
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Tus derechos sobre tus datos</p>
              <p className="text-xs text-muted-foreground">
                Descarga una copia de todo lo que guardamos de ti o elimina tu
                cuenta definitivamente.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-11" render={<a href="/api/v1/privacy/export" download />}>
                Descargar mis datos
              </Button>
              <Button variant="ghost" className="min-h-11 text-destructive" onClick={() => setBorrarOpen(true)}>
                Eliminar mi cuenta
              </Button>
            </div>
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
      <Dialog open={borrarOpen} onOpenChange={setBorrarOpen}>
        <Card className="w-[min(92vw,420px)] rounded-2xl p-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Eliminar mi cuenta</CardTitle>
            <CardDescription>
              Se borrarán tu huerto, cultivos, tareas, cosechas, historial de
              telemetría y tu cuenta, de forma definitiva. Esta acción no se
              puede deshacer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-2">
            {errorBorrado ? (
              <Alert variant="destructive" className="rounded-xl">
                <AlertTitle>No se pudo eliminar</AlertTitle>
                <AlertDescription>{errorBorrado}</AlertDescription>
              </Alert>
            ) : null}
            <Input
              placeholder="Escribe ELIMINAR para confirmar"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              aria-label="Confirmación de eliminación"
            />
            <div className="flex gap-2">
              <Button variant="ghost" className="min-h-11 flex-1" onClick={() => setBorrarOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="min-h-11 flex-1"
                disabled={borrando || confirmacion.trim() !== "ELIMINAR"}
                onClick={() => void confirmarSupresion()}
              >
                {borrando ? "Eliminando…" : "Eliminar definitivamente"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Dialog>
    </>
  );
}
