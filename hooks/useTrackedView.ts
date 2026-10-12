"use client";

import { useEffect, useRef } from "react";
import type { TelemetryEventCategory, TelemetryEventName } from "@/types";
import { trackEvent } from "@/lib/telemetry/tracker";
import { useDwellTime } from "@/hooks/useDwellTime";
import { useScrollDepth } from "@/hooks/useScrollDepth";

export interface TrackedViewOptions {
  /**
   * El nombre del evento, del vocabulario cerrado de `TELEMETRY_EVENT_NAMES`.
   *
   * Antes era `string`, que dejaba pasar cualquier cosa. Por eso se
   * acumularon nombres que no existen en el dominio (ver la Fase 10.2). Con el enum
   * en `gf_analytics_events.event_name`, un nombre invalido no puede llegar ni al
   * cliente ni a la base: rompe al compilar.
   */
  name: TelemetryEventName;
  category?: TelemetryEventCategory;
  especieId?: string;
  payload?: Record<string, unknown>;
}

export function useTrackedView<T extends HTMLElement>(options: TrackedViewOptions) {
  const dwell = useDwellTime<T>();
  const scroll = useScrollDepth<T>();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    return () => {
      trackEvent({
        category: optionsRef.current.category ?? "PRODUCT_USAGE",
        name: optionsRef.current.name,
        especieId: optionsRef.current.especieId,
        dwellTimeMs: dwell.dwellTimeMs,
        scrollDepthPercent: scroll.scrollDepthPercent,
        payload: optionsRef.current.payload,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return dwell.ref;
}
