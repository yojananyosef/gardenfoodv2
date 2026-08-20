"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, type BillingInterval } from "@/lib/payments/plans";

function formatCLP(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

export default function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function subscribe(tier: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=/pricing`);
        return;
      }
      if (!res.ok || data.error || !data.url) {
        setError(data.error ?? "No se pudo iniciar la suscripción");
        setSubmitting(false);
        return;
      }
      // Redirect to Mercado Pago's hosted checkout where the card is entered.
      // eslint-disable-next-line react-hooks/immutability -- external redirect to Mercado Pago
      window.location.href = data.url;
    } catch {
      setError("Error de red. Intenta nuevamente.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Planes GardenFood</h1>
        <p className="mt-2 text-muted-foreground">
          Lleva tu huerto al siguiente nivel. Cancela cuando quieras.
        </p>
        <div className="mt-4 inline-flex gap-1 rounded-full border p-1">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={`rounded-full px-4 py-1 text-sm ${interval === "monthly" ? "bg-primary text-primary-foreground" : ""}`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={`rounded-full px-4 py-1 text-sm ${interval === "yearly" ? "bg-primary text-primary-foreground" : ""}`}
          >
            Anual (2 meses gratis)
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = interval === "yearly" ? plan.yearly : plan.monthly;
          const active = selectedTier === plan.tier;
          return (
            <Card
              key={plan.tier}
              className={`flex flex-col ${active ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.tier === "full" && <Badge>Equipo</Badge>}
                </div>
                <CardDescription>{plan.tagline}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold">{formatCLP(price)}</span>
                  <span className="text-muted-foreground">/{interval === "yearly" ? "año" : "mes"}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-primary">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button
                  className="w-full"
                  disabled={submitting}
                  onClick={() => {
                    setSelectedTier(plan.tier);
                    subscribe(plan.tier);
                  }}
                >
                  {submitting && active
                    ? "Redirigiendo a Mercado Pago…"
                    : "Suscribirse"}
                </Button>
                {error && active && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* TEST mode helper — visible only when using TEST token (sandbox) */}
      <details className="mx-auto mt-8 max-w-2xl rounded-lg border bg-muted/30 p-4 text-sm">
        <summary className="cursor-pointer font-medium">¿Cómo probar en sandbox? (solo TEST)</summary>
        <div className="mt-3 flex flex-col gap-2 text-muted-foreground">
          <p>En el checkout de Mercado Pago usa <b>exactamente</b>:</p>
          <ul className="list-disc pl-5">
            <li>Tarjeta crédito <b>Mastercard 5416 7526 0258 2580</b> — CVV 123 — Vence 11/30</li>
            <li>Nombre titular: <b>APRO</b> Apellido: <b>APRO</b> (mayúsculas)</li>
            <li>Documento: Tipo <b>Otro</b> · Número <b>123456789</b></li>
            <li>Email distinto al vendedor (`johangutierrez@outlook.cl` es el collector — no lo uses como payer)</li>
          </ul>
          <p>Desactiva AdBlock/Brave Shield y permite cookies de terceros para `mercadopago.cl` y `gstatic.com/recaptcha`, o el `matt.mercadopago.cl` y `api.mercadolibre.com/tracks` bloqueados (`ERR_BLOCKED_BY_CLIENT`) harán que el pago aparezca como <i>Tu pago fue rechazado → Pagar con otro medio</i> aunque la tarjeta sea correcta.</p>
          <p>Si ves <code>preference-id</code> y `rejected` en la URL, es que el titular no fue `APRO` o usaste débito (`4023...4373` es débito — suscripciones requieren crédito).</p>
          <p className="text-xs">Prueba directa (sin pasar por tu app): <a className="underline" href="https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=8ba5e1478a934b21983797727d4cf3bc&activation=true" target="_blank" rel="noopener">init_point de prueba huertero 9990</a> (payer `gardenfood.tester.1787264643@example.com`).</p>
        </div>
      </details>
    </main>
  );
}
