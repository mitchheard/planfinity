import { describe, expect, it } from "vitest";

import {
  canPlaceContainer,
  deriveDrawerUnits,
  doesPlacementCollide,
  doRectanglesOverlap,
  isPlacementWithinBounds,
} from "./planner";
import type { ContainerType, Placement } from "../types/planfinity";

const containerTypesById: Record<string, ContainerType> = {
  small: {
    id: "small",
    label: "Small",
    color: "#00aaff",
    widthUnits: 2,
    depthUnits: 2,
  },
  wide: {
    id: "wide",
    label: "Wide",
    color: "#ee8844",
    widthUnits: 3,
    depthUnits: 1,
  },
};

describe("deriveDrawerUnits", () => {
  it("converts mm dimensions to floored unit counts", () => {
    expect(
      deriveDrawerUnits({
        widthMm: 103,
        depthMm: 77,
        gridPitchMm: 20,
      }),
    ).toEqual({
      widthUnits: 5,
      depthUnits: 3,
    });
  });
});

describe("isPlacementWithinBounds", () => {
  it("returns true when container fits fully inside grid", () => {
    const result = isPlacementWithinBounds(
      { widthUnits: 6, depthUnits: 6 },
      { id: "fit", label: "Fit", widthUnits: 2, depthUnits: 3 },
      4,
      3,
    );
    expect(result).toBe(true);
  });

  it("returns false when container exceeds grid bounds", () => {
    const result = isPlacementWithinBounds(
      { widthUnits: 6, depthUnits: 6 },
      { id: "fit", label: "Fit", widthUnits: 2, depthUnits: 3 },
      5,
      3,
    );
    expect(result).toBe(false);
  });
});

describe("doesPlacementCollide", () => {
  it("detects collision against existing placements", () => {
    const placements: Placement[] = [{ containerTypeId: "small", x: 0, y: 0 }];
    const typeMap = new Map(Object.values(containerTypesById).map((t) => [t.id, t]));

    const result = doesPlacementCollide(
      placements,
      typeMap,
      { id: "candidate", label: "Candidate", widthUnits: 2, depthUnits: 3 },
      1,
      1,
    );
    expect(result).toBe(true);
  });
});

describe("doRectanglesOverlap", () => {
  it("returns false when rectangles only touch edges", () => {
    const result = doRectanglesOverlap(
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 2, height: 2 },
    );
    expect(result).toBe(false);
  });

  it("returns true when rectangles share occupied cells", () => {
    const result = doRectanglesOverlap(
      { x: 1, y: 1, width: 3, height: 2 },
      { x: 3, y: 2, width: 2, height: 2 },
    );
    expect(result).toBe(true);
  });
});

describe("canPlaceContainer", () => {
  const drawer = { widthUnits: 8, depthUnits: 6 };

  it("allows a valid non-overlapping placement", () => {
    const placements: Placement[] = [{ containerTypeId: "small", x: 0, y: 0 }];
    const typeMap = new Map(Object.values(containerTypesById).map((t) => [t.id, t]));

    const result = canPlaceContainer(
      drawer,
      placements,
      typeMap,
      containerTypesById.wide,
      2,
      0,
    );

    expect(result).toBe(true);
  });

  it("rejects overlaps with an existing placement", () => {
    const placements: Placement[] = [{ containerTypeId: "small", x: 1, y: 1 }];
    const typeMap = new Map(Object.values(containerTypesById).map((t) => [t.id, t]));

    const result = canPlaceContainer(
      drawer,
      placements,
      typeMap,
      containerTypesById.wide,
      2,
      1,
    );

    expect(result).toBe(false);
  });

  it("rejects out-of-bounds placement attempts", () => {
    const typeMap = new Map(Object.values(containerTypesById).map((t) => [t.id, t]));
    const result = canPlaceContainer(
      drawer,
      [],
      typeMap,
      containerTypesById.small,
      7,
      5,
    );

    expect(result).toBe(false);
  });
});
