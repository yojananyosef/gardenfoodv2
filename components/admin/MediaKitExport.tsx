"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaKitData } from "@/lib/admin/mediakit";

interface Props {
  data: MediaKitData;
  disabled?: boolean;
}

const ENCABEZADO = "Estadísticas agregadas — no incluye datos personales";

function aCsv(data: MediaKitData): string {
  const lineas: string[] = [
    `# ${ENCABEZADO}`,
    `# generado: ${new Date().toISOString()}`,
    `# k-anonymity: minimo ${data.kMinimo} usuarios por segmento`,
    "# fuente: telemetria con consentimiento de GardenFood",
    "dimension,etiqueta,usuarios",
  ];
  const secciones: Array<[string, Array<{ etiqueta: string; total: number }>]> = [
    ["segmento_comercial", data.porSegmento],
    ["poder_adquisitivo", data.porTier],
    ["especie_interes", data.porEspecie],
    ["region", data.porRegion],
  ];
  for (const [dimension, segmentos] of secciones) {
    for (const s of segmentos) {
      lineas.push(`${dimension},"${s.etiqueta.replaceAll('"', '""')}",${s.total}`);
    }
  }
  return lineas.join("\n");
}

function descargar(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function MediaKitExport({ data, disabled }: Props) {
  const total = data.porSegmento.length + data.porTier.length + data.porEspecie.length + data.porRegion.length;
  const vacio = disabled || total === 0;
  const fecha = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={vacio}
        onClick={() => descargar(`gardenfood-media-kit-${fecha}.csv`, aCsv(data), "text/csv")}
      >
        <Download data-icon="inline-start" />
        Exportar CSV
      </Button>
      <Button
        variant="outline"
        disabled={vacio}
        onClick={() =>
          descargar(
            `gardenfood-media-kit-${fecha}.json`,
            JSON.stringify(
              {
                fuente: "GardenFood",
                generado: new Date().toISOString(),
                kAnonymity: { minimo: data.kMinimo, segmentosBajoUmbral: data.bajoUmbral },
                nota: ENCABEZADO,
                segmentos: {
                  comerciales: data.porSegmento,
                  poderAdquisitivo: data.porTier,
                  especieInteres: data.porEspecie,
                  region: data.porRegion,
                },
              },
              null,
              2,
            ),
            "application/json",
          )
        }
      >
        <Download data-icon="inline-start" />
        Exportar JSON
      </Button>
    </div>
  );
}
