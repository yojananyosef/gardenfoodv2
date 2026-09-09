import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { nextSeguro } from "@/lib/auth/next";

type PerfilMetadata = {
  nombre?: string;
  region?: string;
  comuna?: string;
  zona_agroclimatica?: string;
};

async function asegurarPerfil(user: User): Promise<void> {
  const meta = (user.user_metadata ?? {}) as PerfilMetadata;
  if (!user.email || !meta.region || !meta.comuna || !meta.zona_agroclimatica) return;

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existente) return;

  const { error } = await supabase.from("perfiles").insert({
    id: user.id,
    email: user.email,
    nombre: meta.nombre ?? "",
    region: meta.region,
    comuna: meta.comuna,
    zona_agroclimatica: meta.zona_agroclimatica,
  });
  if (error) console.error("[auth/confirm] perfiles insert:", error.message);
}

async function continuar(request: NextRequest, destino: string): Promise<NextResponse | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    await asegurarPerfil(user);
    return NextResponse.redirect(new URL(destino, request.url));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const destino = nextSeguro(url.searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const siguiente = await continuar(request, destino);
        if (siguiente) return siguiente;
      }
    } catch {
      // cae al fallback de sesión previa / error
    }
  }

  // Idempotencia: link re-usado o confirmado en otra pestaña — con sesión activa seguimos al destino.
  const conSesion = await continuar(request, destino);
  if (conSesion) return conSesion;

  const errorUrl = new URL("/auth/confirm/error", request.url);
  if (destino !== "/huerto") {
    errorUrl.searchParams.set("next", destino);
  }
  return NextResponse.redirect(errorUrl);
}
