"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollDepth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [scrollDepthPercent, setScrollDepthPercent] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function update() {
      const current = ref.current;
      if (!current) return;
      const { scrollTop, scrollHeight, clientHeight } = current;
      const max = scrollHeight - clientHeight;
      if (max <= 0) return;
      const depth = Math.min(100, Math.round((scrollTop / max) * 100));
      setScrollDepthPercent((prev) => Math.max(prev, depth));
    }

    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => element.removeEventListener("scroll", update);
  }, []);

  return { ref, scrollDepthPercent };
}