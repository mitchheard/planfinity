import { describe, expect, it } from "vitest";

import {
  aggregateContainerCounts,
  buildPrintSummary,
  sliceBaseplatesLeq,
} from "./printSummary";
import type { ContainerType, Placement } from "../types/planfinity";

const containerTypes: ContainerType[] = [
  {
    id: "ct-1x1",
    label: "1x1 Bin",
    widthUnits: 1,
    depthUnits: 1,
  },
  {
    id: "ct-2x2",
    label: "2x2 Bin",
    widthUnits: 2,
    depthUnits: 2,
  },
  {
    id: "ct-2x3",
    label: "2x3 Bin",
    widthUnits: 2,
    depthUnits: 3,
  },
];

describe("printSummary", () => {
it("aggregateContainerCounts aggregates and sorts by count desc", () => {
  const placements: Placement[] = [
    { containerTypeId: "ct-1x1", x: 0, y: 0 },
    { containerTypeId: "ct-2x2", x: 1, y: 0 },
    { containerTypeId: "ct-1x1", x: 2, y: 0 },
    { containerTypeId: "ct-2x3", x: 3, y: 0 },
    { containerTypeId: "ct-1x1", x: 4, y: 0 },
    { containerTypeId: "ct-2x2", x: 0, y: 2 },
  ];

  const result = aggregateContainerCounts(placements, containerTypes);

  expect(result).toEqual([
    {
      containerTypeId: "ct-1x1",
      label: "1x1 Bin",
      widthUnits: 1,
      depthUnits: 1,
      count: 3,
    },
    {
      containerTypeId: "ct-2x2",
      label: "2x2 Bin",
      widthUnits: 2,
      depthUnits: 2,
      count: 2,
    },
    {
      containerTypeId: "ct-2x3",
      label: "2x3 Bin",
      widthUnits: 2,
      depthUnits: 3,
      count: 1,
    },
  ]);
});

it("aggregateContainerCounts throws for unknown container type id", () => {
  const placements: Placement[] = [{ containerTypeId: "missing", x: 0, y: 0 }];

  expect(() => aggregateContainerCounts(placements, containerTypes)).toThrow(
    /Unknown container type id/,
  );
});

it("sliceBaseplatesLeq splits into <=5x5 tiles and tracks size counts", () => {
  const result = sliceBaseplatesLeq({ widthUnits: 12, depthUnits: 11 }, 5);

  expect(result.totalTiles).toBe(9);
  expect(result.coveredAreaUnits).toBe(132);

  expect(result.sizeCounts).toEqual([
    { widthUnits: 5, depthUnits: 5, count: 4 },
    { widthUnits: 2, depthUnits: 5, count: 2 },
    { widthUnits: 5, depthUnits: 1, count: 2 },
    { widthUnits: 2, depthUnits: 1, count: 1 },
  ]);

  for (const tile of result.tiles) {
    expect(tile.widthUnits).toBeLessThanOrEqual(5);
    expect(tile.depthUnits).toBeLessThanOrEqual(5);
  }
});

it("buildPrintSummary returns both container and baseplate summaries", () => {
  const placements: Placement[] = [
    { containerTypeId: "ct-1x1", x: 0, y: 0 },
    { containerTypeId: "ct-1x1", x: 1, y: 0 },
    { containerTypeId: "ct-2x2", x: 2, y: 0 },
  ];

  const result = buildPrintSummary(
    { widthUnits: 6, depthUnits: 6 },
    placements,
    containerTypes,
  );

  expect(result.containerCounts).toEqual([
    {
      containerTypeId: "ct-1x1",
      label: "1x1 Bin",
      widthUnits: 1,
      depthUnits: 1,
      count: 2,
    },
    {
      containerTypeId: "ct-2x2",
      label: "2x2 Bin",
      widthUnits: 2,
      depthUnits: 2,
      count: 1,
    },
  ]);
  expect(result.baseplates.totalTiles).toBe(4);
  expect(result.baseplates.coveredAreaUnits).toBe(36);
});
});
