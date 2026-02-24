import type {
  BaseplateStrategy,
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
const DEFAULT_BASEPLATE_STRATEGY: BaseplateStrategy = "max-first";

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function makeSizeKey(widthUnits: number, depthUnits: number): string {
  return `${widthUnits}x${depthUnits}`;
}

function summarizeBaseplateTiles(tiles: BaseplateTile[], maxTileUnits: number): BaseplateSummary {
  const sizeCountsByKey = new Map<string, BaseplateSizeCount>();

  for (const tile of tiles) {
    const key = makeSizeKey(tile.widthUnits, tile.depthUnits);
    const existing = sizeCountsByKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      sizeCountsByKey.set(key, {
        widthUnits: tile.widthUnits,
        depthUnits: tile.depthUnits,
        count: 1,
      });
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

function splitDimensionMaxFirst(totalUnits: number, maxTileUnits: number): number[] {
  const result: number[] = [];
  let remaining = totalUnits;

  while (remaining > 0) {
    const size = Math.min(maxTileUnits, remaining);
    result.push(size);
    remaining -= size;
  }

  return result;
}

function splitDimensionBalanced(totalUnits: number, maxTileUnits: number): number[] {
  const pieceCount = Math.ceil(totalUnits / maxTileUnits);
  const basePieceSize = Math.floor(totalUnits / pieceCount);
  const remainder = totalUnits % pieceCount;

  return Array.from({ length: pieceCount }, (_, index) =>
    index < remainder ? basePieceSize + 1 : basePieceSize,
  );
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
  strategy: BaseplateStrategy = DEFAULT_BASEPLATE_STRATEGY,
): BaseplateSummary {
  assertPositiveInteger(drawer.widthUnits, "drawer.widthUnits");
  assertPositiveInteger(drawer.depthUnits, "drawer.depthUnits");
  assertPositiveInteger(maxTileUnits, "maxTileUnits");

  const tiles: BaseplateTile[] = [];
  const splitDimension =
    strategy === "balanced" ? splitDimensionBalanced : splitDimensionMaxFirst;
  const rowHeights = splitDimension(drawer.depthUnits, maxTileUnits);
  const colWidths = splitDimension(drawer.widthUnits, maxTileUnits);

  let yOffset = 0;
  for (const depthUnits of rowHeights) {
    let xOffset = 0;
    for (const widthUnits of colWidths) {
      const tile: BaseplateTile = { x: xOffset, y: yOffset, widthUnits, depthUnits };
      tiles.push(tile);
      xOffset += widthUnits;
    }
    yOffset += depthUnits;
  }

  return summarizeBaseplateTiles(tiles, maxTileUnits);
}

export function buildPrintSummary(
  drawer: DrawerUnits,
  placements: Placement[],
  containerTypes: ContainerType[],
  maxTileUnits = DEFAULT_MAX_BASEPLATE_TILE_UNITS,
  strategy: BaseplateStrategy = DEFAULT_BASEPLATE_STRATEGY,
): PrintSummary {
  return {
    containerCounts: aggregateContainerCounts(placements, containerTypes),
    baseplates: sliceBaseplatesLeq(drawer, maxTileUnits, strategy),
  };
}
