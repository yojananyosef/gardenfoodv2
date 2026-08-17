import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import { getActiveSponsorships } from "@/lib/ads/sponsorships";
import { ESPECIES } from "@/lib/agronomy";
import { cn } from "@/lib/utils";

const GRUPO_ORDEN = [
  "Carozo",
  "Pomácea",
  "Cítrico",
  "Baya",
  "Fruto seco",
  "Subtropical",
  "Otros",
];

export default async function ExplorarPage() {
  const sponsorships = await getActiveSponsorships("explorar");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Explorar especies</h1>
        <p className="text-sm text-muted-foreground">
          {ESPECIES.length} frutales con ficha técnica y calendario agronómico.
        </p>
      </div>

      {GRUPO_ORDEN.map((grupo) => {
        const especies = ESPECIES.filter((e) => e.grupo === grupo);
        if (especies.length === 0) return null;
        return (
          <section key={grupo} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {grupo}
            </h2>
            <ul className="flex flex-col gap-2">
              {especies.map((especie) => (
                <li key={especie.slug}>
                  <a
                    href={`/especies/${especie.slug}`}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-lg border bg-card px-4 text-sm font-medium text-card-foreground"
                  >
                    <span>{especie.nombre}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px]",
                        especie.dificultad === "Fácil"
                          ? "bg-emerald-100 text-emerald-700"
                          : especie.dificultad === "Moderado"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-orange-100 text-orange-700",
                      )}
                    >
                      {especie.dificultad}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {sponsorships.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sponsorships.map((sponsorship) => (
            <NativeAdSlot key={sponsorship.id} sponsorship={sponsorship} />
          ))}
        </div>
      ) : null}
    </div>
  );
}