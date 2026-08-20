"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentModal } from "@/components/cmp/ConsentModal";
import { createClient } from "@/lib/supabase/client";
import { getDeviceId } from "@/lib/telemetry/device";
import { buscarComuna } from "@/lib/agronomy";

interface FormState {
  email: string;
  password: string;
  nombre: string;
  region: string;
  comuna: string;
}

const INITIAL: FormState = {
  email: "",
  password: "",
  nombre: "",
  region: "",
  comuna: "",
};

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const match = buscarComuna(form.comuna);
      if (!match) {
        setError("No encontramos tu comuna en el catálogo. Revisa la escritura (ej. 'La Florida', 'Concepción').");
        return;
      }
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { nombre: form.nombre },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user) {
        setUserId(data.user.id);
        await supabase.from("perfiles").insert({
          id: data.user.id,
          email: form.email,
          nombre: form.nombre,
          region: match.region,
          comuna: match.comuna,
          zona_agroclimatica: String(match.zonaId),
        });
      }
      setShowConsent(true);
    } catch {
      setError("No se pudo completar el registro. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleConsentDone() {
    router.push("/huerto");
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Crea tu huerto GardenFood y recibe recomendaciones a tu medida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="region">Región</Label>
                <Input
                  id="region"
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="comuna">Comuna</Label>
                <Input
                  id="comuna"
                  value={form.comuna}
                  onChange={(e) => set("comuna", e.target.value)}
                  required
                />
              </div>
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" className="min-h-12 w-full" disabled={submitting}>
              {submitting ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <ConsentModal
        open={showConsent}
        deviceId={getDeviceId()}
        userId={userId}
        onConsent={handleConsentDone}
      />
    </>
  );
}