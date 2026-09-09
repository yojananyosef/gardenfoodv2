"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Result =
  | { status: "loading" }
  | { status: "ok"; grantsAccess: boolean; message: string; plan?: string; interval?: string; monto?: number }
  | { status: "error"; message: string };

function formatCLP(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

const NOMBRE_PLAN: Record<string, string> = {
  huertero: "Huertero",
  cosecha: "Cosecha",
  full: "Full",
};

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
        plan: data.plan,
        interval: data.interval,
        monto: data.monto,
        message:
          data.status === "active"
            ? "¡Suscripción activada!"
            : data.grantsAccess
              ? "¡Suscripción confirmada! Tu plan ya está activo."
              : "Pago pendiente de confirmación. Re-verifica en unos segundos.",
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
              {result.plan ? (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <h3 className="mb-2 font-semibold">Resumen de condiciones del contrato</h3>
                  <ul className="flex flex-col gap-1 text-muted-foreground">
                    <li>Plan contratado: <strong className="text-foreground">{NOMBRE_PLAN[result.plan] ?? result.plan}</strong></li>
                    <li>
                      Monto e intervalo:{" "}
                      <strong className="text-foreground">
                        {result.monto ? formatCLP(result.monto) : "—"} / {result.interval === "yearly" ? "año" : "mes"}
                      </strong>
                    </li>
                    <li>Cobro: <strong className="text-foreground">débito automático recurrente</strong> vía Mercado Pago</li>
                    <li>Cancelación: cuando quieras, desde tu perfil</li>
                    <li>
                      Derecho de retracto: <strong className="text-foreground">10 días corridos</strong> desde la
                      contratación (art. 3 bis, Ley 19.496), escribiendo a{" "}
                      <a className="underline" href="mailto:pichilemugardenfood@gmail.com">pichilemugardenfood@gmail.com</a>
                    </li>
                    <li>Soporte: pichilemugardenfood@gmail.com</li>
                  </ul>
                </div>
              ) : null}
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
