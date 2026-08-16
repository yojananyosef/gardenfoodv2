import { SponsoredBanner } from "@/components/ads/SponsoredBanner";
import { getActiveSponsorships } from "@/lib/ads/sponsorships";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HuertoPage() {
  const sponsorships = await getActiveSponsorships("huerto");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Mi huerto</h1>
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aún no tienes cultivos registrados. Agrega tus primeras especies
            para recibir recomendaciones de riego, poda y fertilización.
          </p>
        </CardContent>
      </Card>
      {sponsorships.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sponsorships.map((sponsorship) => (
            <SponsoredBanner key={sponsorship.id} sponsorship={sponsorship} />
          ))}
        </div>
      ) : null}
    </div>
  );
}