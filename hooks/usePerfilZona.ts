"use client";

import { useEffect, useState } from "react";

import { resolverZonaDeComuna } from "@/lib/agronomy";
import type { SueloId } from "@/lib/riego/datos";
import { createClient } from "@/lib/supabase/client";

/**
 * Comuna y suelo del perfil, resueltos UNA vez para toda la ficha de especie.
 *
 * Va en `hooks/` y no en `lib/huerto/data.ts` porque ese módulo es server-only
 * (usa el cliente de servidor de Supabase) y esto corre en el navegador.
 *
 * Antes de este hook la ficha leía el perfil en tres lugares: un `useEffect`
 * acá mismo, otro dentro de `TabFenologia`, y un `useState` inicializado con el
 * valor recibido en `NutricionGuia` — que congela lo que le llegó en el
 * montaje, antes de que la query llegara. Con una sola lectura y props hacia
 * abajo, las tres quedan mirando lo mismo.
 */

export interface PerfilZona {
  /** Zona agroclimática, con fallback a la zona neutra si no hay comuna. */
  zonaId: number;
  /** Tipo de suelo del perfil, o null si no lo tiene definido. */
  sueloId: SueloId | null;
  comuna: string | null;
  /** `true` mientras no se ha resuelto la consulta todavía. */
  cargando: boolean;
  /**
   * `true` cuando la zona no salió de la comuna del usuario. Permite decir
   * «no tienes comuna configurada» en vez de mostrar datos de la zona neutra
   * como si fueran de esa persona.
   */
  esDefault: boolean;
}

const SUELO_VALIDOS: readonly string[] = ["G", "MG", "M", "F"];

/** El perfil guarda el tipo de suelo como string suelto en la DB. */
export function sueloDesdeValor(valor: string | null | undefined): SueloId | null {
  if (!valor) return null;
  return SUELO_VALIDOS.includes(valor) ? (valor as SueloId) : null;
}

/** Zona neutra mientras la consulta no ha resuelto, para no romper el render. */
const INICIAL: PerfilZona = {
  zonaId: resolverZonaDeComuna(null).zonaId,
  sueloId: null,
  comuna: null,
  cargando: true,
  esDefault: true,
};

export function usePerfilZona(): PerfilZona {
  const [estado, setEstado] = useState<PerfilZona>(INICIAL);

  useEffect(() => {
    let active = true;
    const cargar = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user || !active) {
        // Sin sesión no hay perfil que leer. La ficha es pública, así que esto
        // es el caso normal de un visitante, no un error.
        if (active) setEstado({ ...INICIAL, cargando: false });
        return;
      }
      const { data: fila } = await supabase
        .from("perfiles")
        .select("comuna, tipo_suelo")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      const comuna = (fila?.comuna as string | null) ?? null;
      setEstado({
        ...resolverZonaDeComuna(comuna),
        sueloId: sueloDesdeValor(fila?.tipo_suelo as string | null),
        cargando: false,
      });
    };

    void cargar();

    // Se relee al volver a la pestaña o a la ventana: si el usuario cambió su
    // comuna o su suelo en /perfil y regresa con "atrás", el componente sigue
    // montado y el dato viejo quedaría pegado.
    const alVolverVisible = () => {
      if (document.visibilityState === "visible") void cargar();
    };
    window.addEventListener("focus", cargar);
    document.addEventListener("visibilitychange", alVolverVisible);
    return () => {
      active = false;
      window.removeEventListener("focus", cargar);
      document.removeEventListener("visibilitychange", alVolverVisible);
    };
  }, []);

  return estado;
}