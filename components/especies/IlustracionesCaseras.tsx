/**
 * Ilustraciones de la medida casera: cucharadas y tazas dibujadas.
 *
 * Es el material que hace didáctica la dosis. «388 g de superfosfato» no le
 * dice nada a quien nunca midió en gramos; «2 tazas y media» sí. Los dibujos
 * vienen del prototipo del socio (gardenfood-nutricion-simple.html),
 * recalentados a `currentColor` para que el color lo ponga el momento del año
 * al que pertenece cada aplicación y no el propio SVG.
 *
 * Todos son decorativos (aria-hidden): el texto que los acompaña ya dice la
 * cantidad exacta, así que el lector de pantalla no necesita una descripción
 * del dibujo.
 */
import type { MedidaCasera } from "@/lib/agronomy/fertilizacion";
import { cn } from "@/lib/utils";

/* Cuántas se dibujan como máximo antes de resumir con «×N». Pasado ese punto
   el dibujo es un muro de iconos y deja de comunicar la cantidad. */
const MAX_CUCHARAS = 6;
const MAX_TAZAS = 5;

function CucharaLlena({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 44" width="15" height="28" aria-hidden className={cn("shrink-0", className)}>
      <ellipse cx="12" cy="11" rx="9" ry="11" fill="currentColor" />
      <rect x="10" y="20" width="4" height="21" rx="2" fill="var(--caseras-mango, #9aa694)" />
    </svg>
  );
}

function CucharaMedia({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 44" width="15" height="28" aria-hidden className={cn("shrink-0", className)}>
      {/* Mitad vacía primero, luego la mitad llena encima: así se ve la
          media cucharada sin tener que recortar el SVG. */}
      <ellipse cx="12" cy="11" rx="9" ry="11" fill="currentColor" opacity="0.25" />
      <path d="M12 0 a9 11 0 0 1 0 22z" fill="currentColor" />
      <rect x="10" y="20" width="4" height="21" rx="2" fill="var(--caseras-mango, #9aa694)" />
    </svg>
  );
}

function Taza({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 34" width="26" height="26" aria-hidden className={cn("shrink-0", className)}>
      <path d="M4 8 h20 v13 a10 10 0 0 1 -20 0z" fill="currentColor" />
      <path d="M24 11 h4 a5 5 0 0 1 0 10 h-4" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M2 29 h26" stroke="var(--caseras-mango, #9aa694)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * «+3» para cuando la cantidad excede lo que se dibuja. Se usa «+» y no «×»
 * a propósito: con «×» al lado de seis cucharadas el uno parece un factor
 * («7 × 1») en vez de «una cucharada más».
 */
function Sobras({ n }: { n: number }) {
  return (
    <span className="shrink-0 text-sm font-bold text-muted-foreground">
      +{String(n).replace(".", ",")}
    </span>
  );
}

/**
 * Dibuja la medida. El color lo hereda el contenedor (`currentColor`), así que
 * quien lo usa lo pinta con la clase del momento del año correspondiente.
 */
export function CaserasVisual({
  medida,
  className,
}: {
  medida: MedidaCasera;
  className?: string;
}) {
  if (medida.unidad === "pesa") return null;

  if (medida.unidad === "pizca") {
    return <CucharaMedia className={cn("opacity-70", className)} />;
  }

  if (medida.unidad === "cuchara") {
    const enteras = Math.min(MAX_CUCHARAS, Math.floor(medida.valor));
    const sobra = Math.round((medida.valor - enteras) * 10) / 10;
    const dibujaMedia = sobra > 0 && enteras < MAX_CUCHARAS;
    return (
      <>
        {Array.from({ length: enteras }, (_, i) => (
          <CucharaLlena key={i} className={className} />
        ))}
        {dibujaMedia && <CucharaMedia className={className} />}
        {medida.valor > MAX_CUCHARAS && <Sobras n={Math.round(medida.valor - MAX_CUCHARAS)} />}
      </>
    );
  }

  const enteras = Math.min(MAX_TAZAS, Math.floor(medida.valor));
  const sobra = Math.round((medida.valor - enteras) * 10) / 10;
  const dibujaMedia = sobra > 0 && enteras < MAX_TAZAS;
  return (
    <>
      {Array.from({ length: enteras }, (_, i) => (
        <Taza key={i} className={className} />
      ))}
      {dibujaMedia && <Taza key="media" className={cn("opacity-45", className)} />}
      {medida.valor > MAX_TAZAS && <Sobras n={Math.round(medida.valor - MAX_TAZAS)} />}
    </>
  );
}
