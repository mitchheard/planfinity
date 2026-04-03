/**
 * Umami bootstrap — Linear AVIDX-84.
 * Instance URL and website ID are hardcoded (no env vars) for reliable production builds.
 */

export const UMAMI_INSTANCE_URL = "https://umami-avidx.onrender.com";
export const UMAMI_WEBSITE_ID = "b263c07e-cfff-4e08-ba6f-7b84866492ee";

/** Custom event names — must match AVIDX-84 exactly. */
export const UMAMI_CUSTOM_EVENT_NAMES = [
  "drawer_created",
  "export_triggered",
  "container_placed",
  "layout_saved",
  "layout_loaded",
  "print_summary_viewed",
] as const;

export type UmamiCustomEventName = (typeof UMAMI_CUSTOM_EVENT_NAMES)[number];

type UmamiEventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: UmamiEventData) => void;
    };
  }
}

export function trackUmamiEvent(name: UmamiCustomEventName, data?: UmamiEventData): void {
  if (typeof window === "undefined") return;
  window.umami?.track(name, data);
}
