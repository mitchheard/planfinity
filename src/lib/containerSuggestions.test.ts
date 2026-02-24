import { describe, expect, it } from "vitest";

import { suggestContainerFits } from "./containerSuggestions";
import type { ContainerType } from "../types/planfinity";

const containerTypes: ContainerType[] = [
  { id: "2x2", label: "2x2", widthUnits: 2, depthUnits: 2 },
  { id: "2x3", label: "2x3", widthUnits: 2, depthUnits: 3 },
  { id: "3x3", label: "3x3", widthUnits: 3, depthUnits: 3 },
];

describe("suggestContainerFits", () => {
  it("calculates required footprint with clearance and suggests matching containers", () => {
    const result = suggestContainerFits(containerTypes, 10, 17, 13, 2);

    expect(result.requiredWidthMm).toBe(21);
    expect(result.requiredDepthMm).toBe(17);
    expect(result.requiredWidthUnits).toBe(3);
    expect(result.requiredDepthUnits).toBe(2);
    expect(result.suggestions.map((suggestion) => suggestion.label)).toEqual(["2x3", "3x3"]);
  });

  it("marks suggestions that only fit when the object is rotated", () => {
    const result = suggestContainerFits(containerTypes, 10, 26, 16, 2);

    expect(result.requiredWidthUnits).toBe(3);
    expect(result.requiredDepthUnits).toBe(2);
    expect(result.suggestions).toEqual([
      expect.objectContaining({
        label: "2x3",
        usesRotatedFit: true,
      }),
      expect.objectContaining({
        label: "3x3",
        usesRotatedFit: false,
      }),
    ]);
  });

  it("returns no suggestions when nothing fits", () => {
    const result = suggestContainerFits(containerTypes, 10, 40, 30, 2);
    expect(result.suggestions).toEqual([]);
  });

  it("throws for invalid values", () => {
    expect(() => suggestContainerFits(containerTypes, 0, 10, 10, 2)).toThrow(
      /gridPitchMm must be greater than 0/,
    );
    expect(() => suggestContainerFits(containerTypes, 10, 10, 10, -1)).toThrow(
      /clearanceMm must be greater than or equal to 0/,
    );
  });
});
