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

/* Cuántas se dibujan antes de resumir con «+N».
   El tope posible de la guía son 10 cucharadas (medidaCasera corta en 10), así
   que con MAX_CUCHARAS = 10 el resumen NUNCA aparece para cucharadas: antes el
   tope era 6 y salía «+N» en el 6% de las dosis (145 de 2406). La taza sí
   puede llegar a 8 y es mucho más ancha, así que ahí se resume antes. */
const MAX_CUCHARAS = 10;
const MAX_TAZAS = 6;

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
 * «+1» para cuando la cantidad excede lo que se dibuja. El número va SIN
 * redondear (nunca Math.round): con «6,5» y tope 6 el redondeo producía «+1»
 * y el dibujo sumaba 7 mientras el texto decía 6,5. Con la resta exacta no
 * hay forma de que el dibujo sobre más de lo que dice el número.
 */
function Sobras({ n }: { n: number }) {
  return (
    <span className="shrink-0 text-sm font-bold text-muted-foreground">
      +{String(n).replace(".", ",")}
    </span>
  );
}

type Icono = (p: { className?: string }) => React.ReactElement | null;

/**
 * Dibuja `valor` fullness-icons, sin pasarse ni quedarse corto.
 * Invariante: las fullness-icons dibujadas + lo del badge = `valor` exacto.
 */
function Secuencia({
  valor,
  max,
  Lleno,
  Media,
  className,
}: {
  valor: number;
  max: number;
  Lleno: Icono;
  Media: Icono;
  className?: string;
}) {
  const enteras = Math.min(max, Math.floor(valor));
  const resto = valor - enteras;
  const excedente = Math.max(0, valor - max);

  return (
    <>
      {Array.from({ length: enteras }, (_, i) => (
        <Lleno key={i} className={className} />
      ))}
      {/* Media solo si el resto cabe antes del tope: si no, su lugar lo ocupa
          el badge, que ya lleva la cuenta. */}
      {resto > 0 && resto < 1 && enteras < max && <Media className={className} />}
      {excedente > 0 && <Sobras n={excedente} />}
    </>
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
    return <Secuencia valor={medida.valor} max={MAX_CUCHARAS} Lleno={CucharaLlena} Media={CucharaMedia} className={className} />;
  }

  return (
    <Secuencia
      valor={medida.valor}
      max={MAX_TAZAS}
      Lleno={Taza}
      Media={(p) => <Taza {...p} className={cn("opacity-45", p.className)} />}
      className={className}
    />
  );
}
