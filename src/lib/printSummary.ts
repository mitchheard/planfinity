import type {
  BaseplateSizeCount,
  BaseplateSummary,
  BaseplateTile,
  ContainerCountSummary,
  ContainerType,
  DrawerUnits,
  Placement,
  PrintSummary,
} from "../types/planfinity";

const DEFAULT_MAX_BASEPLATE_TILE_UNITS = 5;

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function makeSizeKey(widthUnits: number, depthUnits: number): string {
  return `${widthUnits}x${depthUnits}`;
}

/**
 * Aggregates placed containers by type for print/pick summary output.
 */
export function aggregateContainerCounts(
  placements: Placement[],
  containerTypes: ContainerType[],
): ContainerCountSummary[] {
  const containerTypeById = new Map(containerTypes.map((type) => [type.id, type]));
  const countsById = new Map<string, number>();

  for (const placement of placements) {
    if (!containerTypeById.has(placement.containerTypeId)) {
      throw new Error(`Unknown container type id: ${placement.containerTypeId}`);
    }
    countsById.set(
      placement.containerTypeId,
      (countsById.get(placement.containerTypeId) ?? 0) + 1,
    );
  }

  const summary: ContainerCountSummary[] = [];
  for (const [containerTypeId, count] of countsById) {
    const containerType = containerTypeById.get(containerTypeId);
    if (!containerType) {
      continue;
    }

    summary.push({
      containerTypeId,
      label: containerType.label,
      widthUnits: containerType.widthUnits,
      depthUnits: containerType.depthUnits,
      count,
    });
  }

  return summary.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.label.localeCompare(b.label);
  });
}

/**
 * Splits a drawer grid into baseplate rectangles where each rectangle
 * is constrained to maxTileUnits x maxTileUnits.
 */
export function sliceBaseplatesLeq(
  drawer: DrawerUnits,
  maxTileUnits = DEFAULT_MAX_BASEPLATE_TILE_UNITS,
): BaseplateSummary {
  assertPositiveInteger(drawer.widthUnits, "drawer.widthUnits");
  assertPositiveInteger(drawer.depthUnits, "drawer.depthUnits");
  assertPositiveInteger(maxTileUnits, "maxTileUnits");

  const tiles: BaseplateTile[] = [];
  const sizeCountsByKey = new Map<string, BaseplateSizeCount>();

  for (let y = 0; y < drawer.depthUnits; y += maxTileUnits) {
    const depthUnits = Math.min(maxTileUnits, drawer.depthUnits - y);
    for (let x = 0; x < drawer.widthUnits; x += maxTileUnits) {
      const widthUnits = Math.min(maxTileUnits, drawer.widthUnits - x);
      const tile: BaseplateTile = { x, y, widthUnits, depthUnits };
      tiles.push(tile);

      const key = makeSizeKey(widthUnits, depthUnits);
      const existing = sizeCountsByKey.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        sizeCountsByKey.set(key, {
          widthUnits,
          depthUnits,
          count: 1,
        });
      }
    }
  }

  const sizeCounts = Array.from(sizeCountsByKey.values()).sort((a, b) => {
    const areaDiff = b.widthUnits * b.depthUnits - a.widthUnits * a.depthUnits;
    if (areaDiff !== 0) {
      return areaDiff;
    }
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    if (b.widthUnits !== a.widthUnits) {
      return b.widthUnits - a.widthUnits;
    }
    return b.depthUnits - a.depthUnits;
  });

  const coveredAreaUnits = tiles.reduce(
    (total, tile) => total + tile.widthUnits * tile.depthUnits,
    0,
  );

  return {
    maxTileUnits,
    tiles,
    sizeCounts,
    totalTiles: tiles.length,
    coveredAreaUnits,
  };
}

export function buildPrintSummary(
  drawer: DrawerUnits,
  placements: Placement[],
  containerTypes: ContainerType[],
  maxTileUnits = DEFAULT_MAX_BASEPLATE_TILE_UNITS,
): PrintSummary {
  return {
    containerCounts: aggregateContainerCounts(placements, containerTypes),
    baseplates: sliceBaseplatesLeq(drawer, maxTileUnits),
  };
}
