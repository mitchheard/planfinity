import { afterEach, describe, expect, it, vi } from "vitest";
import { trackUmamiEvent, UMAMI_INSTANCE_URL, UMAMI_WEBSITE_ID } from "./umamiBootstrap";

describe("umamiBootstrap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes hardcoded instance URL and website id", () => {
    expect(UMAMI_INSTANCE_URL).toBe("https://umami-avidx.onrender.com");
    expect(UMAMI_WEBSITE_ID).toBe("b263c07e-cfff-4e08-ba6f-7b84866492ee");
  });

  it("invokes window.umami.track when present", () => {
    const track = vi.fn();
    vi.stubGlobal("window", { umami: { track } });
    trackUmamiEvent("drawer_created");
    expect(track).toHaveBeenCalledWith("drawer_created", undefined);
  });

  it("passes event payload to track", () => {
    const track = vi.fn();
    vi.stubGlobal("window", { umami: { track } });
    trackUmamiEvent("container_placed", { container_type_id: "2x3", rotated: true });
    expect(track).toHaveBeenCalledWith("container_placed", { container_type_id: "2x3", rotated: true });
  });

  it("no-ops when umami is missing", () => {
    vi.stubGlobal("window", {});
    expect(() => trackUmamiEvent("layout_saved")).not.toThrow();
  });
});
