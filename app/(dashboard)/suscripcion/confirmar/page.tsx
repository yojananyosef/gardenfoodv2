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

  useEffect(() => {
    (async () => {
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
              ? "¡Suscripción en periodo de prueba activada!"
              : "¡Suscripción activada!",
        });
      } catch {
        setResult({ status: "error", message: "Error de red." });
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Confirmando tu suscripción</CardTitle>
        </CardHeader>
        <CardContent>
          {result.status === "loading" && <p>Procesando…</p>}
          {result.status === "ok" && (
            <div className="space-y-4">
              <p className="text-lg font-medium">{result.message}</p>
              <Button className="w-full" onClick={() => router.push("/huerto")}>
                Ir a mi huerto
              </Button>
            </div>
          )}
          {result.status === "error" && (
            <div className="space-y-4">
              <p className="text-destructive">{result.message}</p>
              <Button className="w-full" onClick={() => router.push("/pricing")}>
                Volver a planes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
