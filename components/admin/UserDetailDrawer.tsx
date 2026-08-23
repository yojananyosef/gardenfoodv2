"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Detail {
  cultivos: { especie: string; cantidad: number }[];
  tareas: { estado: string }[];
  registros: { produccion_kg: number | null }[];
  arboles: { especie: string }[];
  subs: { plan: string; interval: string; status: string; provider_subscription_id: string | null }[];
  perfil: { plan: string; subscription_status: string | null };
}

export function UserDetail({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`);
      const j = await res.json();
      if (res.ok) setDetail(j);
    } finally {
      setLoading(false);
    }
  }

  async function patch() {
    if (!plan) return;
    const res = await fetch(`/api/v1/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, subscription_status: status || undefined }),
    });
    const j = await res.json();
    setMsg(res.ok ? `Actualizado a ${plan}` : j.error ?? "Error");
    if (res.ok) await load();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" size="sm" className="w-fit" onClick={() => { const n=!open; setOpen(n); if(n && !detail) load(); }}>
        {open ? "Cerrar" : "Ver huerto"}
      </Button>
      {open ? (
        <Card>
          <CardContent className="pt-4 flex flex-col gap-3 text-sm">
            {loading ? <span>Cargando...</span> : detail ? (
              <>
                <div>Cultivos: {detail.cultivos.length} {detail.cultivos.map((c) => c.especie).join(", ") || "—"}</div>
                <div>Tareas: {detail.tareas.length} ({detail.tareas.filter((t)=>t.estado==="pendiente").length} pend)</div>
                <div>Registros: {detail.registros.length} (kg {detail.registros.reduce((s,r)=>s+(r.produccion_kg??0),0)})</div>
                <div>Árboles: {detail.arboles.length}</div>
                <div>Subs: {detail.subs.map((s)=> `${s.plan} ${s.interval} ${s.status} ${s.provider_subscription_id ? `[${s.provider_subscription_id.slice(0,8)}]` : ""}`).join(" | ") || "—"}</div>
                <div className="flex items-center gap-2">
                  <Badge>{detail.perfil.plan}</Badge>
                  <span>{detail.perfil.subscription_status ?? "—"}</span>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="plan huertero" value={plan} onChange={(e)=>setPlan(e.target.value)} className="h-9 w-32" />
                  <Input placeholder="status active" value={status} onChange={(e)=>setStatus(e.target.value)} className="h-9 w-32" />
                  <Button size="sm" onClick={patch}>Cambiar plan</Button>
                </div>
                {msg ? <span className="text-xs text-muted-foreground">{msg}</span> : null}
                <span className="text-xs text-muted-foreground">{email}</span>
              </>
            ) : <span>Sin datos</span>}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
