import type { SueloId } from "@/lib/riego/datos";

/**
 * Ilustraciones del test de la cinta para gente sin experiencia: cada paso
 * muestra QUÉ hacer (no solo texto) y cada resultado muestra la cinta a
 * escala con regla. SVG inline, sin assets externos, paleta tierra.
 */

function Gota({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d={`M ${x} ${y} q ${7 * s} ${11 * s} 0 ${17 * s} q ${-7 * s} ${-6 * s} 0 ${-17 * s} Z`}
      fill="#2563eb"
      opacity={0.85}
    />
  );
}

function PasoMuestra() {
  return (
    <g>
      <rect x={30} y={46} width={140} height={6} rx={3} fill="#3F6B3A" />
      <rect x={40} y={52} width={120} height={30} fill="#BE8A50" />
      <rect x={40} y={82} width={120} height={23} fill="#8A5A33" />
      <ellipse cx={100} cy={66} rx={14} ry={7} fill="#5E3A2A" opacity={0.6} />
      <line x1={100} y1={48} x2={100} y2={26} stroke="#3F6B3A" strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={88} cy={30} rx={11} ry={6} fill="#3F6B3A" transform="rotate(-25 88 30)" />
      <ellipse cx={112} cy={30} rx={11} ry={6} fill="#4d9240" transform="rotate(25 112 30)" />
      <line x1={176} y1={52} x2={176} y2={105} stroke="#525252" strokeWidth={2} />
      <polygon points="176,48 172,56 180,56" fill="#525252" />
      <polygon points="176,109 172,101 180,101" fill="#525252" />
      <text x={182} y={82} fontSize={11} fontWeight={700} fill="#525252">20 cm</text>
    </g>
  );
}

function PasoLimpiar() {
  return (
    <g>
      <ellipse cx={95} cy={82} rx={58} ry={22} fill="#8A5A33" />
      <ellipse cx={95} cy={72} rx={42} ry={14} fill="#BE8A50" />
      <circle cx={70} cy={70} r={7} fill="#9ca3af" />
      <circle cx={118} cy={66} r={5} fill="#a8a29e" />
      <ellipse cx={95} cy={62} rx={9} ry={4} fill="#4d9240" transform="rotate(-15 95 62)" />
      <circle cx={70} cy={70} r={11} fill="none" stroke="#525252" strokeWidth={1.5} strokeDasharray="4 3" />
      <line x1={78} y1={60} x2={100} y2={34} stroke="#525252" strokeWidth={2} strokeDasharray="4 3" />
      <polygon points="100,30 94,40 106,38" fill="#525252" />
    </g>
  );
}

function PasoMojar() {
  return (
    <g>
      <line x1={60} y1={18} x2={60} y2={30} stroke="#93c5fd" strokeWidth={2} />
      <line x1={140} y1={14} x2={140} y2={26} stroke="#93c5fd" strokeWidth={2} />
      <Gota x={80} y={22} />
      <Gota x={105} y={14} s={1.15} />
      <Gota x={128} y={24} s={0.9} />
      <circle cx={100} cy={80} r={27} fill="#8A5A33" />
      <circle cx={91} cy={71} r={8} fill="#BE8A50" opacity={0.8} />
    </g>
  );
}

function PasoAmasar() {
  return (
    <g>
      <circle cx={100} cy={66} r={25} fill="#8A5A33" />
      <ellipse cx={92} cy={58} rx={9} ry={6} fill="#BE8A50" opacity={0.8} />
      <path d="M 52 66 A 48 48 0 0 1 76 30" fill="none" stroke="#525252" strokeWidth={2.5} strokeLinecap="round" />
      <polygon points="76,24 70,36 82,34" fill="#525252" />
      <path d="M 148 66 A 48 48 0 0 0 124 102" fill="none" stroke="#525252" strokeWidth={2.5} strokeLinecap="round" />
      <polygon points="124,108 130,96 118,98" fill="#525252" />
    </g>
  );
}

function PasoCinta() {
  return (
    <g>
      {/* Índice: dedo horizontal abajo, con uña en la punta */}
      <rect x={8} y={56} width={88} height={22} rx={11} fill="#E8C39E" />
      <ellipse cx={86} cy={62} rx={7} ry={4.5} fill="#F9E8D2" />
      {/* Pulgar: baja en diagonal presionando sobre la cinta, con uña */}
      <g transform="rotate(28 52 40)">
        <rect x={10} y={28} width={72} height={22} rx={11} fill="#D9A97E" />
        <ellipse cx={72} cy={34} rx={7} ry={4.5} fill="#F9E8D2" />
      </g>
      {/* Flecha del empuje suave hacia abajo */}
      <line x1={52} y1={10} x2={62} y2={26} stroke="#525252" strokeWidth={2} strokeLinecap="round" />
      <polygon points="64,30 54,28 59,38" fill="#525252" />
      {/* Cinta de tierra saliendo entre los dos dedos */}
      <rect x={92} y={64} width={90} height={14} rx={7} fill="#8A5A33" />
      <rect x={92} y={64} width={90} height={5.5} rx={2.75} fill="#BE8A50" opacity={0.9} />
      {/* Etiquetas para no adivinar */}
      <text x={22} y={16} fontSize={9.5} fontWeight={700} fill="#57534e">pulgar</text>
      <line x1={38} y1={19} x2={48} y2={32} stroke="#a8a29e" strokeWidth={1} />
      <text x={10} y={104} fontSize={9.5} fontWeight={700} fill="#57534e">índice</text>
      <line x1={30} y1={100} x2={44} y2={80} stroke="#a8a29e" strokeWidth={1} />
      <text x={128} y={104} fontSize={9.5} fontWeight={700} fill="#57534e">cinta</text>
      <line x1={136} y1={100} x2={136} y2={82} stroke="#a8a29e" strokeWidth={1} />
    </g>
  );
}

function PasoMedir() {
  return (
    <g>
      <rect x={25} y={34} width={110} height={16} rx={8} fill="#8A5A33" />
      <rect x={25} y={34} width={110} height={6} rx={3} fill="#BE8A50" opacity={0.9} />
      <rect x={20} y={62} width={160} height={22} rx={4} fill="#f5f5f4" stroke="#d6d3d1" strokeWidth={1.5} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line
          key={i}
          x1={32 + i * 18}
          y1={62}
          x2={32 + i * 18}
          y2={i % 2 === 0 ? 72 : 68}
          stroke="#78716c"
          strokeWidth={1.5}
        />
      ))}
      <text x={28} y={80} fontSize={9} fill="#57534e">0</text>
      <text x={82} y={80} fontSize={9} fill="#57534e">2,5 cm</text>
      <text x={148} y={80} fontSize={9} fill="#57534e">5 cm</text>
    </g>
  );
}

const PASOS = [PasoMuestra, PasoLimpiar, PasoMojar, PasoAmasar, PasoCinta, PasoMedir];

export function IlustracionPaso({ paso }: { paso: number }) {
  const Dibujo = PASOS[Math.min(Math.max(paso, 0), PASOS.length - 1)];
  return (
    <svg viewBox="0 0 200 120" className="h-32 w-full" role="img" aria-hidden="true">
      <Dibujo />
    </svg>
  );
}

const CINTA_ANCHO: Record<SueloId, number> = {
  G: 0,
  MG: 48,
  M: 95,
  F: 150,
};

const CINTA_COLOR: Record<SueloId, string> = {
  G: "#D9B382",
  MG: "#BE8A50",
  M: "#8A5A33",
  F: "#5E3A2A",
};

const CINTA_LEYENDA: Record<SueloId, string> = {
  G: "no forma cinta",
  MG: "menos de 2,5 cm",
  M: "2,5 a 5 cm",
  F: "más de 5 cm",
};

/** La cinta que sale de los dedos, dibujada a escala con regla. */
export function IlustracionCinta({ suelo }: { suelo: SueloId }) {
  const ancho = CINTA_ANCHO[suelo];
  return (
    <svg viewBox="0 0 200 84" className="h-20 w-full" role="img" aria-label={`Cinta: ${CINTA_LEYENDA[suelo]}`}>
      <line x1={10} y1={70} x2={190} y2={70} stroke="#d6d3d1" strokeWidth={2} />
      {suelo === "G" ? (
        <g>
          {[30, 48, 66, 84, 102, 120, 58, 92].map((x, i) => (
            <circle key={i} cx={x} cy={34 + (i % 3) * 9} r={4} fill={CINTA_COLOR.G} />
          ))}
          <rect x={20} y={22} width={60} height={26} rx={8} fill="none" stroke="#a8a29e" strokeWidth={1.5} strokeDasharray="5 4" />
        </g>
      ) : (
        <g>
          <rect x={20} y={28} width={ancho} height={15} rx={7.5} fill={CINTA_COLOR[suelo]} />
          <rect x={20} y={28} width={ancho} height={6} rx={3} fill="#fff" opacity={0.25} />
          {suelo === "MG" ? (
            <g>
              <circle cx={76} cy={40} r={3.5} fill={CINTA_COLOR[suelo]} />
              <circle cx={86} cy={34} r={2.5} fill={CINTA_COLOR[suelo]} />
            </g>
          ) : null}
        </g>
      )}
      <line x1={20} y1={62} x2={20} y2={70} stroke="#78716c" strokeWidth={1.5} />
      <line x1={95} y1={62} x2={95} y2={70} stroke="#78716c" strokeWidth={1.5} />
      <line x1={170} y1={62} x2={170} y2={70} stroke="#78716c" strokeWidth={1.5} />
      <text x={14} y={80} fontSize={8} fill="#57534e">0</text>
      <text x={84} y={80} fontSize={8} fill="#57534e">2,5 cm</text>
      <text x={160} y={80} fontSize={8} fill="#57534e">5 cm</text>
    </svg>
  );
}
