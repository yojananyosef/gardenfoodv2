"use client";

import { useAdTracking } from "@/hooks/useAdTracking";
import { Badge } from "@/components/ui/badge";
import type { Sponsorship } from "@/types";

export function NativeAdSlot({ sponsorship }: { sponsorship: Sponsorship }) {
  const { ref, trackClick } = useAdTracking<HTMLDivElement>({
    adUnitId: sponsorship.adUnitId,
    adPartnerId: sponsorship.adPartnerId,
  });

  return (
    <div
      ref={ref}
      className="rounded-xl border bg-card p-4 text-card-foreground shadow-xs"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
          Patrocinado
        </Badge>
        <span className="text-xs text-muted-foreground">{sponsorship.adPartnerId}</span>
      </div>
      <h3 className="text-base font-semibold">{sponsorship.title}</h3>
      {sponsorship.description ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {sponsorship.description}
        </p>
      ) : null}
      {sponsorship.ctaUrl ? (
        <a
          href={sponsorship.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackClick}
          className="mt-3 inline-flex min-h-12 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {sponsorship.ctaLabel ?? "Ver más"}
        </a>
      ) : null}
    </div>
  );
}