"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/telemetry/tracker";
import { hasValidLocalConsent } from "@/lib/consent/token";

export interface AdTrackingTarget {
  adUnitId: string;
  adPartnerId: string;
}

export function useAdTracking<T extends HTMLElement>(target: AdTrackingTarget) {
  const ref = useRef<T | null>(null);
  const impressed = useRef(false);

  useEffect(() => {
    if (!hasValidLocalConsent()) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressed.current) {
            impressed.current = true;
            trackEvent({
              category: "AD_INTERACTION",
              name: "AD_IMPRESSION",
              adUnitId: target.adUnitId,
              adPartnerId: target.adPartnerId,
            });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target.adUnitId, target.adPartnerId]);

  function trackClick() {
    if (!hasValidLocalConsent()) return;
    trackEvent({
      category: "AD_INTERACTION",
      name: "AD_CLICK",
      adUnitId: target.adUnitId,
      adPartnerId: target.adPartnerId,
    });
  }

  return { ref, trackClick };
}