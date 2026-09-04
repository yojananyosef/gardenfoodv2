"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CANTIDAD_MIN = 1;
const CANTIDAD_MAX = 1000;

export function ControlCantidad({
  valor,
  onCambio,
  etiqueta,
}: {
  valor: number;
  onCambio: (nueva: number) => void;
  etiqueta: string;
}) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");

  function confirmarBorrador() {
    setEditando(false);
    const parsed = Number(borrador);
    if (!Number.isFinite(parsed)) return;
    const nueva = Math.max(CANTIDAD_MIN, Math.min(CANTIDAD_MAX, Math.round(parsed)));
    if (nueva !== valor) onCambio(nueva);
  }

  function cambiar(delta: number) {
    const nueva = Math.max(CANTIDAD_MIN, Math.min(CANTIDAD_MAX, valor + delta));
    if (nueva !== valor) onCambio(nueva);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="min-h-9 min-w-9"
        aria-label={`Quitar una planta a ${etiqueta}`}
        disabled={valor <= CANTIDAD_MIN}
        onClick={() => cambiar(-1)}
      >
        <Minus className="size-4" />
      </Button>
      {editando ? (
        <Input
          type="number"
          min={CANTIDAD_MIN}
          max={CANTIDAD_MAX}
          autoFocus
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onBlur={confirmarBorrador}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmarBorrador();
            if (e.key === "Escape") setEditando(false);
          }}
          className="h-9 w-16 text-center text-sm"
          aria-label={`Cantidad de plantas de ${etiqueta}`}
        />
      ) : (
        <button
          type="button"
          className="min-h-9 min-w-12 rounded-md border px-1 font-mono text-sm hover:bg-muted"
          aria-label={`Editar cantidad de plantas de ${etiqueta}`}
          onClick={() => {
            setBorrador(String(valor));
            setEditando(true);
          }}
        >
          {valor}
        </button>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="min-h-9 min-w-9"
        aria-label={`Agregar una planta a ${etiqueta}`}
        disabled={valor >= CANTIDAD_MAX}
        onClick={() => cambiar(1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
