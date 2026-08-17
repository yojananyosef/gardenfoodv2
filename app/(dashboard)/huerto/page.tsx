import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import { SponsoredBanner } from "@/components/ads/SponsoredBanner";
import { AgregarCultivo } from "@/components/huerto/AgregarCultivo";
import { AlertasClimaticas } from "@/components/huerto/AlertasClimaticas";
import { ListaCultivos } from "@/components/huerto/ListaCultivos";
import { prepararCultivos } from "@/lib/huerto/nombres";
import { TareasDelDia } from "@/components/huerto/TareasDelDia";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveSponsorships } from "@/lib/ads/sponsorships";
import { ESPECIES, MESES } from "@/lib/agronomy";
import { climateAlertsProvider } from "@/lib/climate";
import { getCultivos, getPerfil, getTareasDelDia } from "@/lib/huerto/data";
import { getZonaDeComuna } from "@/lib/agronomy";
import { createClient } from "@/lib/supabase/server";

function hoyISO(): string {
  const now = new Date();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const dia = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mes}-${dia}`;
}

export default async function HuertoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [cultivos, tareas, perfil, sponsorships] = await Promise.all([
    getCultivos(user.id),
    getTareasDelDia(user.id, hoyISO()),
    getPerfil(user.id),
    getActiveSponsorships("huerto"),
  ]);

  const zona = getZonaDeComuna(perfil?.comuna);
  const mesActual = new Date().getMonth(); // 0-11
  const alertas = zona
    ? climateAlertsProvider.getAlertas(zona, mesActual + 1)
    : [];

  const cultivosConNombre = prepararCultivos(cultivos);
  const especiesDisponibles = ESPECIES.filter(
    (e) => !cultivos.some((c) => c.especie === e.dbKey),
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Mi huerto</h1>
        <p className="text-sm text-muted-foreground">
          {zona
            ? `Tu zona: ${zona.nombre} — ${MESES[mesActual]}`
            : "Actualiza tu comuna en tu perfil para mejores recomendaciones."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cultivos activos</CardDescription>
            <CardTitle className="font-fraunces text-3xl">{cultivos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tareas de hoy</CardDescription>
            <CardTitle className="font-fraunces text-3xl">{tareas.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alertas de {MESES[mesActual]}</CardDescription>
            <CardTitle className="font-fraunces text-3xl">{alertas.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar cultivo</CardTitle>
          <CardDescription>
            Elige una especie del catálogo y cuántas plantas tienes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgregarCultivo especies={especiesDisponibles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus cultivos</CardTitle>
        </CardHeader>
        <CardContent>
          <ListaCultivos cultivos={cultivosConNombre} />
        </CardContent>
      </Card>

      {sponsorships.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sponsorships.map((s) => (
            <NativeAdSlot key={s.id} sponsorship={s} />
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tareas de hoy</CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TareasDelDia tareas={tareas} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas estacionales</CardTitle>
          <CardDescription>
            Basadas en tu zona agroclimática para este mes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertasClimaticas alertas={alertas} />
        </CardContent>
      </Card>

      {sponsorships.length > 1 ? (
        <div className="flex flex-col gap-3">
          {sponsorships.slice(1).map((s) => (
            <SponsoredBanner key={s.id} sponsorship={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}