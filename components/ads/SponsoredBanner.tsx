"use client";

import { useAdTracking } from "@/hooks/useAdTracking";
import type { Sponsorship } from "@/types";

export function SponsoredBanner({ sponsorship }: { sponsorship: Sponsorship }) {
  const { ref, trackClick } = useAdTracking<HTMLAnchorElement>({
    adUnitId: sponsorship.adUnitId,
    adPartnerId: sponsorship.adPartnerId,
  });

  return (
    <a
      ref={ref}
      href={sponsorship.ctaUrl ?? "#"}
      target={sponsorship.ctaUrl ? "_blank" : undefined}
      rel="noopener noreferrer"
      onClick={trackClick}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-card p-3 text-card-foreground shadow-xs"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Patrocinado · {sponsorship.adPartnerId}
        </span>
        <span className="text-sm font-medium">{sponsorship.title}</span>
      </div>
      <span className="text-sm font-semibold text-primary">
        {sponsorship.ctaLabel ?? "Ver más"}
      </span>
    </a>
  );
}