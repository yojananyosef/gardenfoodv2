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

interface SponsorshipForm {
  adUnitId: string;
  adPartnerId: string;
  screen: SponsorshipScreen;
  title: string;
  description: string;
  ctaUrl: string;
  ctaLabel: string;
}

const EMPTY_FORM: SponsorshipForm = {
  adUnitId: "",
  adPartnerId: "gardenfood-ads",
  screen: "explorar",
  title: "",
  description: "",
  ctaUrl: "",
  ctaLabel: "",
};

export default function AdminSponsorshipsPage() {
  const router = useRouter();
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [form, setForm] = useState<SponsorshipForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void load();
  }, []);

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
        body: JSON.stringify(form),
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
                  </div>
                  <div className="flex items-center gap-2">
                    {sponsorship.active ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      onClick={() => toggle(sponsorship)}
                    >
                      {sponsorship.active ? "Desactivar" : "Activar"}
                    </Button>
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
            <Button type="submit" className="min-h-12 w-full" disabled={creating}>
              {creating ? "Creando…" : "Crear patrocinio"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}