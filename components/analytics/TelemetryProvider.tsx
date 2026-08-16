"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { GeoContext } from "@/types";
import { trackEvent, setTrackedGeo } from "@/lib/telemetry/tracker";
import { getGeoContext } from "@/lib/telemetry/geo";
import { hasValidLocalConsent } from "@/lib/consent/token";
import { createClient } from "@/lib/supabase/client";

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const geoRef = useRef<GeoContext | null>(null);

  useEffect(() => {
    let active = true;
    async function loadGeo() {
      const supabase = createClient();
      let declared: { comuna?: string | null; region?: string | null; zona_agroclimatica?: string | null } | null = null;
      try {
        const { data: profile } = await supabase
          .from("perfiles")
          .select("comuna, region, zona_agroclimatica")
          .maybeSingle();
        declared = profile ?? null;
      } catch {
        declared = null;
      }
      const context = await getGeoContext(declared);
      if (active) {
        geoRef.current = context;
        setTrackedGeo(context);
      }
    }
    void loadGeo();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasValidLocalConsent()) return;
    trackEvent({
      category: "PRODUCT_USAGE",
      name: "PAGE_VIEW",
      payload: { path: pathname },
      geo: geoRef.current,
    });
  }, [pathname]);

  return children;
}