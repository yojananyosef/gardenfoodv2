import Link from "next/link";
import {
  Box,
  CheckCircle2,
  MapPinned,
  Sprout,
} from "lucide-react";

import type { PasoAsistente } from "@/components/huerto/AsistenteHuerto";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAreaM2, formatCoordenadas } from "@/lib/huerto/terreno";
import type { Arbol, HuertoResumen } from "@/types";

interface PasosAsistenteProps {
  huertos: HuertoResumen[];
  arboles: Arbol[];
  sinUbicar: Arbol[];
  planoSlot: React.ReactNode;
  altaSlot: React.ReactNode;
  plan?: string;
}

/**
 * Los 4 pasos del asistente guiado (Propuesta C/E): Terreno → Árboles →
 * Posicionar → Listo. Los slots de alta (AgregarCultivo/AgregarArbol) y de
 * plano (PlanoHuerto) los entrega el server para no duplicar lógica.
 */
export function pasosAsistente({
  huertos,
  arboles,
  sinUbicar,
  planoSlot,
  altaSlot,
}: PasosAsistenteProps): PasoAsistente[] {
  return [
    {
      id: "terreno",
      titulo: "Terreno",
      subtitulo:
        "Dibuja el borde de tu huerto sobre el satélite; superficie y coordenadas quedan guardadas.",
      hecho: huertos.length > 0,
      contenido: (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPinned className="size-4 text-primary" /> Paso 1 · Dibuja tu terreno
            </CardTitle>
            <CardDescription className="text-xs">
              El mapa vive dentro de Mi huerto: delimita superficie y zona agronómica. Puedes recrearlo después.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {huertos.length === 0 ? (
              <>
                <Button className="w-fit rounded-full" render={<Link href="/perfil?mapa=1" />}>
                  Ir al mapa satelital
                </Button>
                <p className="text-xs text-muted-foreground">
                  Al volver, tu terreno aparece listado aquí y puedes avanzar.
                </p>
              </>
            ) : (
              <ul className="flex flex-col gap-2">
                {huertos.map((h) => (
                  <li
                    key={h.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium">{h.nombre}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {h.centro ? formatCoordenadas(h.centro) : "—"} · {formatAreaM2(h.superficieM2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: "arboles",
      titulo: "Árboles",
      subtitulo:
        "Un solo formulario: elige especie y cantidad; la ficha individual nace al posicionar.",
      hecho: arboles.length > 0 || huertos.length > 0,
      contenido: (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sprout className="size-4 text-primary" /> Paso 2 · ¿Qué tienes plantado?
            </CardTitle>
            <CardDescription className="text-xs">
              Agrega cada especie con su cantidad; no hay que repetir el dato en cultivos ni inventario.
            </CardDescription>
          </CardHeader>
          <CardContent>{altaSlot}</CardContent>
        </Card>
      ),
    },
    {
      id: "posicionar",
      titulo: "Posicionar",
      subtitulo:
        "Reparto automático en matriz y ajuste fino arrastrando cada ejemplar sobre el plano.",
      hecho: sinUbicar.length === 0 && arboles.length > 0,
      contenido: (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Box className="size-4 text-primary" /> Paso 3 · Posicionar árboles
            </CardTitle>
            <CardDescription className="text-xs">
              {sinUbicar.length > 0
                ? `${sinUbicar.length} ejemplares esperan una posición; puedes saltar el paso y arreglarlo después.`
                : "Tu inventario está marcado en el plano."}
            </CardDescription>
          </CardHeader>
          <CardContent>{planoSlot}</CardContent>
        </Card>
      ),
    },
    {
      id: "listo",
      titulo: "Listo",
      subtitulo: "Visualización 3D y calendario de tareas activos para tu zona.",
      hecho: arboles.length > 0 && sinUbicar.length === 0,
      contenido: (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-primary" /> Paso 4 · Tu huerto está listo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" /> Terreno:{" "}
                {huertos.length} {huertos.length === 1 ? "huerto delimitado" : "huertos delimitados"}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" /> Registrados: {arboles.length} árboles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" /> Calendario de tareas activo
              </li>
            </ul>
          </CardContent>
        </Card>
      ),
    },
  ];
}
