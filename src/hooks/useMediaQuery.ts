"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the viewport matches the given media query.
 * Uses 768px as the mobile breakpoint: mobile when (max-width: 768px).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export const MOBILE_BREAKPOINT = 768;

/** True when viewport width is ≤768px (mobile layout). */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
}
