"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Result =
  | { status: "loading" }
  | { status: "ok"; grantsAccess: boolean; message: string }
  | { status: "error"; message: string };

export default function ConfirmPage() {
  const router = useRouter();
  const [result, setResult] = useState<Result>({ status: "loading" });
  const [rechecking, setRechecking] = useState(false);

  async function checkStatus() {
    try {
      const res = await fetch("/api/v1/payments/subscribe/status", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ status: "error", message: data.error ?? "Error al confirmar" });
        return;
      }
      setResult({
        status: "ok",
        grantsAccess: data.grantsAccess,
        message:
          data.status === "trialing"
            ? "¡Suscripción confirmada! Tu plan ya está activo."
            : data.status === "active"
              ? "¡Suscripción activada!"
              : `Estado: ${data.status}`,
      });
    } catch {
      setResult({ status: "error", message: "Error de red." });
    }
  }

  useEffect(() => {
    // Initial verification after landing from Mercado Pago — webhook may still be pending
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial fetch that sets state via async callback
    void checkStatus();
  }, []);

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Confirmando tu suscripción</CardTitle>
        </CardHeader>
        <CardContent>
          {result.status === "loading" && <p>Procesando… El pago puede tardar unos segundos en confirmarse.</p>}
          {result.status === "ok" && (
            <div className="space-y-4">
              <p className="text-lg font-medium">{result.message}</p>
              {!result.grantsAccess ? (
                <p className="text-sm text-muted-foreground">
                  Tu suscripción aún no está activa. Espera unos minutos o re-verifica. Si persiste, contacta soporte.
                </p>
              ) : null}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={rechecking}
                  onClick={async () => {
                    setRechecking(true);
                    await checkStatus();
                    setRechecking(false);
                  }}
                >
                  {rechecking ? "Verificando…" : "Re-verificar"}
                </Button>
                <Button className="w-full" onClick={() => router.push("/huerto")}>
                  Ir a mi huerto
                </Button>
              </div>
            </div>
          )}
          {result.status === "error" && (
            <div className="space-y-4">
              <p className="text-destructive">{result.message}</p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={rechecking}
                  onClick={async () => {
                    setRechecking(true);
                    await checkStatus();
                    setRechecking(false);
                  }}
                >
                  {rechecking ? "Verificando…" : "Reintentar verificación"}
                </Button>
                <Button className="w-full" onClick={() => router.push("/pricing")}>
                  Volver a planes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
