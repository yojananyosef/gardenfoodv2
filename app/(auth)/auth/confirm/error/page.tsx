import Link from "next/link";
import { AlertTriangle, KeyRound, Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nextSeguro } from "@/lib/auth/next";

export default async function ConfirmErrorPage({
  searchParams,
}: PageProps<"/auth/confirm/error">) {
  const params = await searchParams;
  const next = nextSeguro(typeof params.next === "string" ? params.next : null, "/huerto");
  const esReset = next === "/restablecer";

  return (
    <Card className="overflow-hidden rounded-[1.25rem] border-foreground/10 shadow-lg">
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" aria-hidden />
      <CardHeader className="gap-3 pb-4">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <CardTitle className="text-xl leading-none">
          {esReset ? "El enlace de recuperación no sirve" : "El enlace de confirmación no sirve"}
        </CardTitle>
        <CardDescription className="text-[13px] leading-relaxed">
          {esReset
            ? "El enlace de restablecimiento expiró o ya fue usado. Los enlaces valen por un tiempo limitado y una sola vez."
            : "El enlace de confirmación expiró o ya fue usado. Si ya creaste tu cuenta, solo inicia sesión."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button className="h-11 w-full rounded-full text-[15px]" render={<Link href={esReset ? "/recuperar" : "/registro"} />}>
          <Sprout data-icon="inline-start" />
          {esReset ? "Pedir un enlace nuevo" : "Volver a registrarme"}
        </Button>
        {esReset ? null : (
          <Button variant="outline" className="h-11 w-full rounded-full" render={<Link href="/login" />}>
            Iniciar sesión
          </Button>
        )}
        <Button variant="ghost" className="h-auto min-h-11 w-full justify-center px-2 text-sm font-normal text-muted-foreground underline-offset-4 hover:underline" render={<Link href="/recuperar" />}>
          <KeyRound data-icon="inline-start" />
          Recuperar contraseña
        </Button>
      </CardContent>
    </Card>
  );
}
