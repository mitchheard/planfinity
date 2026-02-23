import { describe, expect, it } from "vitest";

import { decomposeBaseplates } from "./baseplates";

describe("decomposeBaseplates", () => {
  it("returns empty list for non-positive dimensions", () => {
    expect(decomposeBaseplates(0, 10)).toEqual([]);
    expect(decomposeBaseplates(10, 0)).toEqual([]);
  });

  it("returns one piece when both dimensions are <= 5", () => {
    expect(decomposeBaseplates(5, 4)).toEqual([
      { x: 0, y: 0, widthUnits: 5, depthUnits: 4 },
    ]);
  });

  it("splits larger footprints into <= 5x5 tiles covering full area", () => {
    const pieces = decomposeBaseplates(12, 9);

    expect(pieces).toEqual([
      { x: 0, y: 0, widthUnits: 5, depthUnits: 5 },
      { x: 5, y: 0, widthUnits: 5, depthUnits: 5 },
      { x: 10, y: 0, widthUnits: 2, depthUnits: 5 },
      { x: 0, y: 5, widthUnits: 5, depthUnits: 4 },
      { x: 5, y: 5, widthUnits: 5, depthUnits: 4 },
      { x: 10, y: 5, widthUnits: 2, depthUnits: 4 },
    ]);

    for (const piece of pieces) {
      expect(piece.widthUnits).toBeLessThanOrEqual(5);
      expect(piece.depthUnits).toBeLessThanOrEqual(5);
    }
  });
});
