"use client";

import { useEffect, useRef } from "react";
import type { TelemetryEventCategory } from "@/types";
import { trackEvent } from "@/lib/telemetry/tracker";
import { useDwellTime } from "@/hooks/useDwellTime";
import { useScrollDepth } from "@/hooks/useScrollDepth";

export interface TrackedViewOptions {
  name: string;
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