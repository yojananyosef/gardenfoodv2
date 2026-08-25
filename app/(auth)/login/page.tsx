"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Leaf, Lock, LogIn, Mail, ShieldCheck, Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

const ERRORES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
  "Invalid email": "El formato del correo no es válido.",
  "Password should be at least 8 characters": "La contraseña debe tener al menos 8 caracteres.",
};

function mensajeError(raw: string): string {
  return ERRORES[raw] ?? "No pudimos iniciar sesión. Intenta de nuevo.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(mensajeError(signInError.message));
        return;
      }
      const next = searchParams.get("next");
      router.push(next?.startsWith("/") ? next : "/huerto");
      router.refresh();
    } catch {
      setError("No pudimos iniciar sesión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasError = !!error;

  return (
    <Card className="overflow-hidden rounded-[1.25rem] border-foreground/10 shadow-lg">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-emerald-500 to-amber-400" aria-hidden />
      <CardHeader className="gap-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary" className="gap-1.5 rounded-full">
            <Leaf className="size-3" /> Bienvenido de vuelta
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Seguro
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="hidden size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:inline-flex">
            <Sprout className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl leading-none">Iniciar sesión</CardTitle>
            <CardDescription className="text-[13px] leading-relaxed">
              Entra a tu huerto para ver tus tareas y alertas de hoy.
            </CardDescription>
          </div>
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
            <Field data-invalid={hasError || undefined}>
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
                  aria-invalid={hasError}
                />
              </InputGroup>
              <FieldDescription>Usaremos el mismo correo de tu registro.</FieldDescription>
            </Field>

            <Field data-invalid={hasError || undefined}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Link href="#" className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                  ¿Olvidaste tu clave?
                </Link>
              </div>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Lock aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-invalid={hasError}
                />
              </InputGroup>
              <FieldError>{hasError ? error : null}</FieldError>
            </Field>
          </FieldGroup>

          <Button type="submit" className="h-11 w-full rounded-full text-[15px]" disabled={submitting}>
            {submitting ? (
              "Ingresando…"
            ) : (
              <>
                <LogIn data-icon="inline-start" />
                Iniciar sesión
              </>
            )}
          </Button>

          <FieldDescription className="text-center">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
              Crea tu huerto gratis
            </Link>
          </FieldDescription>
        </form>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">o continúa con</span>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-full" type="button" disabled>
              Google
            </Button>
            <Button variant="outline" className="rounded-full" type="button" disabled>
              Apple
            </Button>
          </div>
          <p className="text-center font-mono text-[11px] text-muted-foreground">Próximamente · Por ahora usa correo y clave</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0" />
          <span>Cifrado y protegido · Tus datos de comuna solo personalizan tu calendario.</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="rounded-[1.25rem]">
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Cargando…</p>
          </CardContent>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
