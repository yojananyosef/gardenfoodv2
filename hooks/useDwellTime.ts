"use client";

import { useEffect, useRef, useState } from "react";

export function useDwellTime<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [dwellTimeMs, setDwellTimeMs] = useState(0);
  const visibleSince = useRef<number | null>(null);
  const accumulated = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSince.current = Date.now();
          } else if (visibleSince.current !== null) {
            accumulated.current += Date.now() - visibleSince.current;
            visibleSince.current = null;
            setDwellTimeMs(accumulated.current);
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (visibleSince.current !== null) {
        accumulated.current += Date.now() - visibleSince.current;
      }
    };
  }, []);

  return { ref, dwellTimeMs };
}