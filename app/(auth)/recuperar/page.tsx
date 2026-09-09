"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/restablecer`,
      });
    } catch {
      // respuesta genérica: no revelamos el resultado real
    } finally {
      setSubmitting(false);
      setEnviado(true);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[1.25rem] border-foreground/10 shadow-lg">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-emerald-500 to-amber-400" aria-hidden />
      <CardHeader className="gap-3 pb-4">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <CardTitle className="text-xl leading-none">Recuperar contraseña</CardTitle>
        <CardDescription className="text-[13px] leading-relaxed">
          Te enviamos un enlace para crear una clave nueva. Los enlaces valen por un tiempo limitado.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {enviado ? (
          <>
            <Alert className="rounded-xl">
              <Mail className="size-4" aria-hidden />
              <AlertTitle>Revisa tu correo</AlertTitle>
              <AlertDescription>
                Si <strong>{email}</strong> tiene una cuenta en GardenFood, recibirás el enlace de
                restablecimiento en unos minutos. Revisa también spam o promociones.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="h-11 w-full rounded-full" render={<Link href="/login" />}>
              Volver a iniciar sesión
              <ArrowRight data-icon="inline-end" />
            </Button>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FieldGroup>
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
                  <FieldDescription>Usa el correo con el que creaste tu cuenta.</FieldDescription>
                </Field>
              </FieldGroup>
              <Button type="submit" className="h-11 w-full rounded-full text-[15px]" disabled={submitting}>
                {submitting ? "Enviando…" : "Enviar enlace de recuperación"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </form>

            <Button variant="outline" className="h-11 w-full rounded-full" render={<Link href="/login" />}>
              Volver a iniciar sesión
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
