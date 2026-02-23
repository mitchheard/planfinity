import { describe, expect, it } from "vitest";

import {
  ACTIVE_LAYOUT_STORAGE_KEY,
  clearActiveLayout,
  loadActiveLayout,
  saveActiveLayout,
} from "./persistence";

function createStorageMock(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem(key: string) {
      return key in data ? data[key] : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
    removeItem(key: string) {
      delete data[key];
    },
    snapshot() {
      return { ...data };
    },
  };
}

describe("persistence", () => {
  it("saves and reloads a valid layout", () => {
    const storage = createStorageMock();
    const layout = {
      drawer: { widthMm: 500, depthMm: 300, gridPitchMm: 42 },
      containerTypes: [
        {
          id: "small",
          label: "Small",
          color: "#00aaff",
          widthUnits: 2,
          depthUnits: 2,
        },
      ],
      placements: [{ id: "p1", containerTypeId: "small", x: 0, y: 0 }],
    };

    saveActiveLayout(layout, storage);
    const loaded = loadActiveLayout(storage);

    expect(loaded).toEqual(layout);
  });

  it("returns null for invalid stored JSON", () => {
    const storage = createStorageMock({
      [ACTIVE_LAYOUT_STORAGE_KEY]: "{not-valid-json",
    });

    expect(loadActiveLayout(storage)).toBeNull();
  });

  it("returns null for invalid layout shape", () => {
    const storage = createStorageMock({
      [ACTIVE_LAYOUT_STORAGE_KEY]: JSON.stringify({ drawer: null }),
    });

    expect(loadActiveLayout(storage)).toBeNull();
  });

  it("clears saved layout", () => {
    const storage = createStorageMock({
      [ACTIVE_LAYOUT_STORAGE_KEY]: JSON.stringify({
        drawer: { widthMm: 100, depthMm: 100, gridPitchMm: 10 },
        containerTypes: [],
        placements: [],
      }),
    });

    clearActiveLayout(storage);

    expect(storage.snapshot()[ACTIVE_LAYOUT_STORAGE_KEY]).toBeUndefined();
  });
});
