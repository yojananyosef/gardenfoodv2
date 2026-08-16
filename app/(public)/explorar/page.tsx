import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import { getActiveSponsorships } from "@/lib/ads/sponsorships";

const ESPECIES = [
  { slug: "durazno", nombre: "Duraznero" },
  { slug: "frutilla", nombre: "Frutilla" },
  { slug: "tomate", nombre: "Tomate" },
  { slug: "palto", nombre: "Palto" },
];

export default async function ExplorarPage() {
  const sponsorships = await getActiveSponsorships("explorar");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Explorar especies</h1>
      <ul className="flex flex-col gap-2">
        {ESPECIES.map((especie) => (
          <li key={especie.slug}>
            <a
              href={`/especies/${especie.slug}`}
              className="flex min-h-12 items-center rounded-lg border bg-card px-4 text-sm font-medium text-card-foreground"
            >
              {especie.nombre}
            </a>
          </li>
        ))}
      </ul>
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