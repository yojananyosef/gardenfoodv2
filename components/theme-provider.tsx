"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Modo claro/oscuro. next-themes ya estaba en las dependencias pero nunca se
 * conectó: globals.css define el bloque `.dark` completo y
 * `@custom-variant dark (&:is(.dark *))`, pero no había nada que añadiera esa
 * clase al <html>, así que el tema oscuro era inalcanzable.
 *
 * attribute="class" para calzar con ese bloque de globals.css (y no con
 * data-theme). defaultTheme="light" porque el diseño de marca es papel
 * crema: entra claro y el usuario cambia en /perfil.
 * disableTransitionOnChange evita que las transiciones de color/layout se
 * disparen al cambiar de tema y dejen media pantalla a medio pintar.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
