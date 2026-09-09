"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const router = useRouter();

  async function subscribe(tier: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval, aceptoTerminos: terminosAceptados }),
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
    <div className="mx-auto max-w-5xl py-10">
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

      {/* Aviso Ley del Consumidor: retracto, débito automático, cancelación */}
      <div className="mx-auto mb-8 max-w-3xl rounded-xl border bg-muted/40 p-5">
        <h2 className="mb-2 text-sm font-semibold">Condiciones de la contratación electrónica</h2>
        <p className="text-sm text-muted-foreground">
          Al suscribirte contratas un servicio digital con <strong>débito automático
          recurrente</strong> vía Mercado Pago, con el monto e intervalo del plan elegido. Tienes{" "}
          <strong>derecho de retracto dentro de los 10 días corridos</strong> siguientes a la
          contratación (art. 3 bis, Ley 19.496): escríbenos a{" "}
          <a className="underline" href="mailto:pichilemugardenfood@gmail.com">pichilemugardenfood@gmail.com</a>{" "}
          para ejercerlo. Además puedes <strong>cancelar la suscripción cuando quieras</strong>{" "}
          desde tu perfil. Revisa los{" "}
          <Link className="underline" href="/legal/terminos">Términos y Condiciones</Link> y la{" "}
          <Link className="underline" href="/legal/privacidad">Política de privacidad</Link>.
        </p>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={terminosAceptados}
            onChange={(e) => setTerminosAceptados(e.target.checked)}
            className="mt-0.5 size-4 shrink-0"
          />
          <span>
            He leído y acepto los{" "}
            <Link className="underline" href="/legal/terminos">Términos y Condiciones</Link> y la{" "}
            <Link className="underline" href="/legal/privacidad">Política de privacidad</Link>.
          </span>
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="flex flex-col border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gratis</CardTitle>
              <Badge variant="secondary">Para empezar</Badge>
            </div>
            <CardDescription>Prueba el huerto sin pagar nada.</CardDescription>
            <div className="mt-3">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground">/para siempre</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm">
              {[
                "Hasta 3 cultivos y 1 árbol",
                "Calendario y tareas",
                "Registro de cosechas",
                "Fichas técnicas completas",
                "Calculadoras y diagnóstico",
                "Con anuncios patrocinados",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-2 border-t pt-4 text-sm text-muted-foreground">
              {["Sin logros", "Sin analítica de producción"].map((f) => (
                <li key={f} className="flex gap-2">
                  <span>✕</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/registro?next=/huerto" />}
            >
              Crear cuenta gratis
            </Button>
          </CardFooter>
        </Card>

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
                  disabled={submitting || !terminosAceptados}
                  title={terminosAceptados ? undefined : "Acepta los Términos y Condiciones para continuar"}
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
    </div>
  );
}
