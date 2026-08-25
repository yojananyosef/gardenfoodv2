"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Leaf, Mail, Lock, User, MapPinned, Sprout, ShieldCheck, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxCollection,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import { ConsentModal } from "@/components/cmp/ConsentModal";
import { createClient } from "@/lib/supabase/client";
import { getDeviceId } from "@/lib/telemetry/device";
import { buscarComuna } from "@/lib/agronomy";
import { COMUNAS } from "@/lib/agronomy/comunas";

type GrupoComuna = {
  value: string;
  label: string;
  items: string[];
};

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [comuna, setComuna] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const grupos: GrupoComuna[] = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of COMUNAS) {
      if (!map.has(c.region)) map.set(c.region, []);
      map.get(c.region)!.push(c.comuna);
    }
    return Array.from(map.entries()).map(([region, comunas]) => ({
      value: region,
      label: region,
      items: comunas.sort((a, b) => a.localeCompare(b, "es-CL")),
    }));
  }, []);

  const comunaMeta = comuna ? buscarComuna(comuna) : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!comuna) {
      setError("Elige una comuna del listado.");
      return;
    }
    const match = buscarComuna(comuna);
    if (!match) {
      setError("No encontramos tu comuna en el catálogo. Elige una del listado.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre },
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
          email,
          nombre,
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

  const hasError = !!error;

  return (
    <>
      <Card className="overflow-hidden rounded-[1.25rem] border-foreground/10 shadow-lg">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-emerald-500 to-amber-400" aria-hidden />
        <CardHeader className="gap-3 pb-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="gap-1.5 rounded-full">
              <Leaf className="size-3" /> Gratis · 2 minutos
            </Badge>
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Paso 1 de 2</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="hidden size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:inline-flex">
              <Sprout className="size-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl leading-none">Crear cuenta</CardTitle>
              <CardDescription className="text-[13px] leading-relaxed">
                Tu huerto a la medida de tu comuna. Sin tarjeta, cancela cuando quieras.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
              1
            </span>
            <span className="font-medium text-foreground">Cuenta</span>
            <Separator className="mx-1 w-8" />
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
              2
            </span>
            <span className="text-muted-foreground">Huerto</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {hasError ? (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTitle>Revisa tus datos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <User aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="nombre"
                    placeholder="Ej. Camila Rojas"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </InputGroup>
                <FieldDescription>Como aparecerá en tu huerto.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Correo</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Mail aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    placeholder="tu@correo.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Lock aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </InputGroup>
                <FieldDescription>Mínimo 8 caracteres. Usa una clave segura.</FieldDescription>
              </Field>

              <Field data-invalid={hasError && !comuna ? true : undefined}>
                <FieldLabel htmlFor="comuna">Comuna</FieldLabel>
                <Combobox items={grupos} value={comuna} onValueChange={(v) => setComuna(v as string | null)} autoHighlight>
                  <ComboboxInput id="comuna" placeholder="Busca tu comuna… ej. La Florida" aria-label="Comuna" />
                  <ComboboxContent>
                    <ComboboxEmpty>No se encontró. Prueba sin tilde.</ComboboxEmpty>
                    <ComboboxList>
                      {(group: GrupoComuna) => (
                        <ComboboxGroup key={group.value} items={group.items}>
                          <ComboboxLabel className="flex items-center gap-1.5">
                            <MapPinned className="size-3" /> {group.label}
                          </ComboboxLabel>
                          <ComboboxCollection>
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {item}
                              </ComboboxItem>
                            )}
                          </ComboboxCollection>
                        </ComboboxGroup>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldDescription className="text-xs">
                  254 comunas — escribe y elige. Región y zona se asignan solas.
                </FieldDescription>
                {comunaMeta ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                      <MapPinned className="size-3" /> {comunaMeta.region}
                    </Badge>
                    <Badge variant="outline" className="rounded-full text-xs">
                      Zona {comunaMeta.zonaId}
                    </Badge>
                  </div>
                ) : null}
              </Field>

              {hasError ? <FieldError>{error}</FieldError> : null}
            </FieldGroup>

            <Button type="submit" className="h-11 w-full rounded-full text-[15px]" disabled={submitting}>
              {submitting ? (
                "Creando cuenta…"
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>

            <FieldDescription className="text-center text-xs leading-relaxed">
              Al crear tu cuenta aceptas los{" "}
              <Link href="#" className="font-medium text-primary underline-offset-4 hover:underline">
                términos
              </Link>{" "}
              y la{" "}
              <Link href="#" className="font-medium text-primary underline-offset-4 hover:underline">
                privacidad
              </Link>
              . Usamos tu comuna solo para personalizar tu calendario.
            </FieldDescription>
          </form>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">¿ya tienes cuenta?</span>
              <Separator className="flex-1" />
            </div>
            <Button variant="outline" className="h-11 w-full rounded-full" render={<Link href="/login" />}>
              Iniciar sesión
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
              <Check className="size-3 text-primary" /> 245 comunas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
              <Check className="size-3 text-primary" /> 20 zonas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
              <ShieldCheck className="size-3 text-primary" /> Datos chilenos
            </span>
          </div>
        </CardContent>
      </Card>
      <ConsentModal open={showConsent} deviceId={getDeviceId()} userId={userId} onConsent={handleConsentDone} />
    </>
  );
}
