"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, type BillingInterval, planAmount } from "@/lib/payments/plans";

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
    </main>
  );
}
