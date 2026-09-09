"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";

export default function RestablecerPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user && !cancelado) {
        router.replace("/recuperar");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push("/huerto");
      router.refresh();
    } catch {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasError = !!error;

  return (
    <Card className="overflow-hidden rounded-[1.25rem] border-foreground/10 shadow-lg">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-emerald-500 to-amber-400" aria-hidden />
      <CardHeader className="gap-3 pb-4">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <CardTitle className="text-xl leading-none">Nueva contraseña</CardTitle>
        <CardDescription className="text-[13px] leading-relaxed">
          Crea una clave nueva para tu cuenta. Usa 8 caracteres o más.
        </CardDescription>
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
              <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
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
            <Field data-invalid={hasError && password !== confirmacion ? true : undefined}>
              <FieldLabel htmlFor="confirmacion">Confirmar contraseña</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Lock aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
                  id="confirmacion"
                  type="password"
                  placeholder="Repite la clave"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </InputGroup>
              {password.length > 0 && password !== confirmacion ? (
                <FieldError>Las contraseñas no coinciden.</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          <Button type="submit" className="h-11 w-full rounded-full text-[15px]" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar nueva contraseña"}
            <Lock data-icon="inline-end" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
