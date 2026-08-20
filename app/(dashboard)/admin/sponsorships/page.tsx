"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sponsorship, SponsorshipScreen } from "@/types";
import { SEGMENT_OPTIONS, POWER_TIER_OPTIONS } from "@/lib/ads/targeting";

interface SponsorshipForm {
  adUnitId: string;
  adPartnerId: string;
  screen: SponsorshipScreen;
  title: string;
  description: string;
  ctaUrl: string;
  ctaLabel: string;
  amount: string;
  targetingSegments: string[];
  targetingTiers: string[];
  targetingCrop: string;
  targetingRegion: string;
  targetingComuna: string;
}

const EMPTY_FORM: SponsorshipForm = {
  adUnitId: "",
  adPartnerId: "gardenfood-ads",
  screen: "explorar",
  title: "",
  description: "",
  ctaUrl: "",
  ctaLabel: "",
  amount: "0",
  targetingSegments: [],
  targetingTiers: [],
  targetingCrop: "",
  targetingRegion: "",
  targetingComuna: "",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildTargeting(form: SponsorshipForm) {
  const targeting: Record<string, string[]> = {};
  if (form.targetingSegments.length) targeting.segments = form.targetingSegments;
  if (form.targetingTiers.length) targeting.purchasingPowerTier = form.targetingTiers;
  const crop = splitList(form.targetingCrop);
  if (crop.length) targeting.primaryInterestCrop = crop;
  const region = splitList(form.targetingRegion);
  if (region.length) targeting.region = region;
  const comuna = splitList(form.targetingComuna);
  if (comuna.length) targeting.comuna = comuna;
  return Object.keys(targeting).length ? targeting : undefined;
}

function toggleInArray(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function AdminSponsorshipsPage() {
  const router = useRouter();
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [form, setForm] = useState<SponsorshipForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function pay(sponsorship: Sponsorship) {
    setPayingId(sponsorship.id);
    try {
      const response = await fetch("/api/v1/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorshipId: sponsorship.id }),
      });
      if (!response.ok) {
        setError("No se pudo iniciar el pago.");
        return;
      }
      const data = (await response.json()) as { redirectUrl: string };
      window.location.href = data.redirectUrl;
    } catch {
      setError("No se pudo iniciar el pago.");
      setPayingId(null);
    }
  }

  async function load() {
    try {
      const response = await fetch("/api/v1/admin/sponsorships", {
        cache: "no-store",
      });
      if (response.status === 403) {
        setError("Acceso denegado: se requiere plan admin.");
        return;
      }
      const data = (await response.json()) as { sponsorships: Sponsorship[] };
      setSponsorships(data.sponsorships);
    } catch {
      setError("No se pudieron cargar los patrocinios.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(sponsorship: Sponsorship) {
    await fetch(`/api/v1/admin/sponsorships/${sponsorship.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !sponsorship.active }),
    });
    router.refresh();
    await load();
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/v1/admin/sponsorships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount) || 0,
          targeting: buildTargeting(form),
        }),
      });
      if (!response.ok) {
        setError("No se pudo crear el patrocinio.");
        return;
      }
      setForm(EMPTY_FORM);
      await load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Patrocinios</CardTitle>
          <CardDescription>
            Administra los espacios publicitarios nativos del app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sponsorships.map((sponsorship) => (
                <li
                  key={sponsorship.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{sponsorship.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {sponsorship.adUnitId} · {sponsorship.screen} ·{" "}
                      {sponsorship.adPartnerId}
                    </span>
                    {sponsorship.targeting ? (
                      <span className="text-xs text-muted-foreground">
                        Target:{" "}
                        {[
                          ...(sponsorship.targeting.segments ?? []),
                          ...(sponsorship.targeting.purchasingPowerTier ?? []),
                          ...(sponsorship.targeting.primaryInterestCrop ?? []),
                          ...(sponsorship.targeting.region ?? []),
                          ...(sponsorship.targeting.comuna ?? []),
                        ].join(", ")}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {sponsorship.active ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                    <Badge variant="outline">
                      {sponsorship.paymentStatus === "paid"
                        ? "Pagado"
                        : sponsorship.paymentStatus === "pending"
                          ? "Pendiente"
                          : sponsorship.paymentStatus === "failed"
                            ? "Fallido"
                            : "Sin pagar"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      onClick={() => toggle(sponsorship)}
                    >
                      {sponsorship.active ? "Desactivar" : "Activar"}
                    </Button>
                    {sponsorship.paymentStatus !== "paid" &&
                    Number(sponsorship.amount) > 0 ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="min-h-9"
                        disabled={payingId === sponsorship.id}
                        onClick={() => pay(sponsorship)}
                      >
                        {payingId === sponsorship.id
                          ? "Redirigiendo…"
                          : "Pagar"}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo patrocinio</CardTitle>
          <CardDescription>Asigna el espacio y el partner.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ad-unit">Ad unit ID</Label>
                <Input
                  id="ad-unit"
                  value={form.adUnitId}
                  onChange={(e) => setForm({ ...form, adUnitId: e.target.value })}
                  placeholder="explorar-featured-01"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ad-partner">Ad partner ID</Label>
                <Input
                  id="ad-partner"
                  value={form.adPartnerId}
                  onChange={(e) => setForm({ ...form, adPartnerId: e.target.value })}
                  required
                />
              </div>
            </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Precio (CLP)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step={100}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cta-url">URL de destino</Label>
                <Input
                  id="cta-url"
                  type="url"
                  value={form.ctaUrl}
                  onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cta-label">Texto del CTA</Label>
                <Input
                  id="cta-label"
                  value={form.ctaLabel}
                  onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                  placeholder="Ver más"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="screen">Pantalla</Label>
              <Select
                value={form.screen}
                onValueChange={(value) =>
                  setForm({ ...form, screen: value as SponsorshipScreen })
                }
              >
                <SelectTrigger id="screen" className="w-full">
                  <SelectValue placeholder="Pantalla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="explorar">Explorar</SelectItem>
                    <SelectItem value="huerto">Huerto</SelectItem>
                    <SelectItem value="ficha">Ficha de especie</SelectItem>
                    <SelectItem value="calendario">Calendario</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="flex flex-col gap-1">
                <Label>Targeting (opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Dejar vacío = inventario genérico para todos. El filtro usa la
                  audiencia del usuario (segmentos, poder adquisitivo, cultivo,
                  región, comuna) y respeta su consentimiento.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Segmentos
                </span>
                <div className="flex flex-wrap gap-2">
                  {SEGMENT_OPTIONS.map((opt) => {
                    const checked = form.targetingSegments.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              targetingSegments: toggleInArray(
                                form.targetingSegments,
                                opt.value,
                              ),
                            })
                          }
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Poder adquisitivo
                </span>
                <div className="flex flex-wrap gap-2">
                  {POWER_TIER_OPTIONS.map((tier) => {
                    const checked = form.targetingTiers.includes(tier);
                    return (
                      <label
                        key={tier}
                        className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              targetingTiers: toggleInArray(form.targetingTiers, tier),
                            })
                          }
                        />
                        {tier}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="target-crop">Cultivo (coma)</Label>
                  <Input
                    id="target-crop"
                    value={form.targetingCrop}
                    onChange={(e) =>
                      setForm({ ...form, targetingCrop: e.target.value })
                    }
                    placeholder="citron, limon"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="target-region">Región (coma)</Label>
                  <Input
                    id="target-region"
                    value={form.targetingRegion}
                    onChange={(e) =>
                      setForm({ ...form, targetingRegion: e.target.value })
                    }
                    placeholder="Metropolitana"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="target-comuna">Comuna (coma)</Label>
                  <Input
                    id="target-comuna"
                    value={form.targetingComuna}
                    onChange={(e) =>
                      setForm({ ...form, targetingComuna: e.target.value })
                    }
                    placeholder="Santiago"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="min-h-12 w-full" disabled={creating}>
              {creating ? "Creando…" : "Crear patrocinio"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}