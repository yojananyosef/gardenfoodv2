"use client";

/**
 * Diagrama de la base de datos.
 *
 * Por que React Flow y no Mermaid: con 48 tablas, Mermaid ER las acomoda de
 * izquierda a derecha y el dibujo queda en 8.400 px con el texto en 4 px. Se
 * ve que "funciona" y no se lee. React Flow da pan y zoom, que es lo que hace
 * falta con este volumen, y el nodo se disena a mano para que la tabla se lea
 * de un vistazo.
 *
 * El modelo viene de `data/esquema.json`, que produce
 * `scripts/generar_esquema_json.mjs` leyendo la base.
 */
import { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type Columna = { nombre: string; tipo: string; pk: boolean; fk: string | null };
type Tabla = {
  tabla: string;
  familia: string;
  filas: number;
  descripcion: string | null;
  columnas: Columna[];
};

export type ModeloEsquema = { generado: string; tablas: Tabla[] };

/** Color de cabecera por familia. Es lo que muestra donde termina la normalizacion. */
const FAMILIAS: Record<string, { color: string; fondo: string; titulo: string }> = {
  dim: { color: "#2f6f4f", fondo: "#e8f3ec", titulo: "Dimensiones — el qué y el dónde" },
  fact: { color: "#1d5c8a", fondo: "#e5f0f8", titulo: "Hechos — el cuándo y el cuánto" },
  gf: { color: "#6a4b9c", fondo: "#eee9f7", titulo: "Del usuario" },
  especies: { color: "#9c5b2a", fondo: "#f8ede3", titulo: "Ficha amplia" },
  cat: { color: "#5a6270", fondo: "#eceef1", titulo: "Catálogos" },
};

/** Atajo del tipo para que la columna no sea un bloque de texto. */
function tipoCorto(t: string): string {
  if (t.startsWith("character varying")) return "text";
  if (t === "text") return "text";
  if (t.startsWith("timestamp")) return "fecha";
  if (t === "boolean") return "bool";
  if (t === "integer" || t === "bigint" || t === "smallint") return "int";
  if (t === "numeric" || t === "real" || t === "double precision") return "num";
  if (t === "json" || t === "jsonb") return "json";
  if (t === "ARRAY") return "array";
  return t.slice(0, 9);
}

function NodoTabla({ data }: NodeProps) {
  const t = data.tabla as Tabla;
  const fam = FAMILIAS[t.familia] ?? FAMILIAS.gf;
  return (
    <div
      style={{
        width: 268,
        background: "var(--panel, #fff)",
        border: `1px solid ${fam.color}33`,
        borderRadius: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,.10), 0 6px 18px rgba(0,0,0,.06)",
        overflow: "hidden",
        fontSize: 12,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none" }} />
      <div
        style={{
          background: fam.color,
          color: "#fff",
          padding: "7px 10px",
          fontWeight: 650,
          letterSpacing: "-.01em",
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.tabla}
        </span>
        <span style={{ opacity: .75, fontWeight: 500, flexShrink: 0 }}>{t.filas}</span>
      </div>
      <div style={{ maxHeight: 210, overflowY: "auto" }}>
        {t.columnas.map((c) => (
          <div
            key={c.nombre}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 6,
              alignItems: "center",
              padding: "3px 10px",
              borderBottom: "1px solid rgba(128,128,128,.10)",
              background: c.pk ? fam.fondo : "transparent",
            }}
          >
            <span
              style={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontWeight: c.pk ? 700 : 400,
                color: c.pk ? fam.color : "inherit",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.nombre}
            </span>
            <span />
            <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {c.pk && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".04em",
                    background: fam.color,
                    color: "#fff",
                    borderRadius: 3,
                    padding: "1px 4px",
                  }}
                >
                  PK
                </span>
              )}
              {c.fk && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".04em",
                    border: `1px solid ${fam.color}`,
                    color: fam.color,
                    borderRadius: 3,
                    padding: "0 3px",
                  }}
                >
                  FK
                </span>
              )}
              <span style={{ fontSize: 10, opacity: .5, fontFamily: "ui-monospace, Menlo, monospace" }}>
                {tipoCorto(c.tipo)}
              </span>
            </span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}

const TIPOS: NodeTypes = { tabla: NodoTabla };

/**
 * Las dimensiones van en columnas a la izquierda y los hechos a la derecha.
 * No es decorativo: es la forma en que se lee la normalizacion, porque las
 * lineas de todas las tablas de hechos convergen hacia pocas dimensiones.
 */
function ubicar(tablas: Tabla[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const COL = 320;
  const FILA = 132;

  const columnas: Record<string, Tabla[]> = {};
  for (const t of tablas) (columnas[t.familia] ??= []).push(t);

  // Cada familia es una columna, y dentro se ordenan por nombre para que sea
  // estable entre regeneraciones.
  const orden = ["gf", "dim", "fact", "especies", "cat"];
  let x = 0;
  for (const fam of orden) {
    const ts = columnas[fam] ?? [];
    if (!ts.length) continue;
    const center = Math.max(
      ...ts.map((t) => Math.ceil((36 + t.columnas.length * 22) / FILA)),
    );
    ts.sort((a, b) => a.tabla.localeCompare(b.tabla)).forEach((t, i) => {
      pos.set(t.tabla, { x, y: i * FILA });
    });
    x += COL * center;
  }
  return pos;
}

export function DiagramaEsquema({ modelo }: { modelo: ModeloEsquema }) {
  const [soloFamilia, setSoloFamilia] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const visibles =
      soloFamilia === null ? modelo.tablas : modelo.tablas.filter((t) => t.familia === soloFamilia);
    const set = new Set(visibles.map((t) => t.tabla));
    const pos = ubicar(visibles);

    const ns: Node[] = visibles.map((t) => ({
      id: t.tabla,
      type: "tabla",
      position: pos.get(t.tabla) ?? { x: 0, y: 0 },
      data: { tabla: t },
      draggable: true,
    }));

    const es: Edge[] = [];
    for (const t of visibles) {
      for (const c of t.columnas) {
        if (!c.fk || !set.has(c.fk)) continue;
        es.push({
          id: `${t.tabla}.${c.nombre}`,
          source: t.tabla,
          target: c.fk,
          label: c.nombre,
          animated: false,
          style: { stroke: FAMILIAS[t.familia]?.color ?? "#888", strokeWidth: 1.1, opacity: 0.55 },
          labelStyle: { fontSize: 9, fill: "#777" },
          labelBgStyle: { fill: "transparent" },
        });
      }
    }
    return { nodes: ns, edges: es };
  }, [modelo, soloFamilia]);

  const onConnect = useCallback(() => {}, []);

  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of modelo.tablas) c[t.familia] = (c[t.familia] ?? 0) + 1;
    return c;
  }, [modelo]);

  return (
    <div style={{ height: "100vh", width: "100%", background: "var(--fondo, #fbfbfa)" }}>
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 10,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          maxWidth: "70%",
        }}
      >
        <Filtro activo={soloFamilia === null} onClick={() => setSoloFamilia(null)}>
          Todas ({modelo.tablas.length})
        </Filtro>
        {Object.keys(FAMILIAS)
          .filter((f) => conteo[f])
          .map((f) => (
            <Filtro key={f} activo={soloFamilia === f} color={FAMILIAS[f].color} onClick={() => setSoloFamilia(soloFamilia === f ? null : f)}>
              {FAMILIAS[f].titulo.split(" — ")[0]} ({conteo[f]})
            </Filtro>
          ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={TIPOS}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
      >
        <Background gap={22} size={1} color="rgba(128,128,128,.22)" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => FAMILIAS[(n.data as { tabla: Tabla }).tabla.familia]?.color ?? "#888"}
          maskColor="rgba(128,128,128,.12)"
          style={{ borderRadius: 8, border: "1px solid rgba(128,128,128,.2)" }}
        />
      </ReactFlow>
    </div>
  );
}

function Filtro({
  children,
  activo,
  color,
  onClick,
}: {
  children: React.ReactNode;
  activo: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        font: "inherit",
        fontSize: 12,
        cursor: "pointer",
        padding: "5px 11px",
        borderRadius: 999,
        border: `1px solid ${activo && color ? color : "rgba(128,128,128,.3)"}`,
        background: activo ? (color ?? "#333") : "var(--panel, #fff)",
        color: activo ? "#fff" : "inherit",
        fontWeight: activo ? 650 : 400,
      }}
    >
      {children}
    </button>
  );
}