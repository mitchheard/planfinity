import { canPlaceContainer } from "@/lib/planner";
import type { ContainerType, DrawerUnits, Placement } from "@/types/planfinity";

/** Size buckets for weighted selection: small 40%, medium 25%, large 20%, extra-large 15% */
const BUCKET_WEIGHTS: Record<SizeBucket, number> = {
  small: 0.4,
  medium: 0.25,
  large: 0.2,
  "extra-large": 0.15,
};

type SizeBucket = "small" | "medium" | "large" | "extra-large";

function getSizeBucket(ct: ContainerType): SizeBucket {
  const area = ct.widthUnits * ct.depthUnits;
  const w = ct.widthUnits;
  const d = ct.depthUnits;
  if (area <= 2 || (w === 1 && d <= 2)) return "small";
  if (area <= 4 || (w <= 2 && d <= 3)) return "medium";
  if (area <= 9 || (w <= 3 && d <= 3)) return "large";
  return "extra-large";
}

function groupByBucket(containerTypes: ContainerType[]): Map<SizeBucket, ContainerType[]> {
  const map = new Map<SizeBucket, ContainerType[]>();
  for (const ct of containerTypes) {
    const bucket = getSizeBucket(ct);
    const list = map.get(bucket) ?? [];
    list.push(ct);
    map.set(bucket, list);
  }
  return map;
}

/** Pick a random container type using weighted bucket selection. */
function pickWeightedContainer(
  containerTypes: ContainerType[],
  buckets: Map<SizeBucket, ContainerType[]>,
): ContainerType | null {
  if (containerTypes.length === 0) return null;
  const r = Math.random();
  let acc = 0;
  const bucketOrder: SizeBucket[] = ["small", "medium", "large", "extra-large"];
  for (const bucket of bucketOrder) {
    acc += BUCKET_WEIGHTS[bucket];
    if (r < acc) {
      const list = buckets.get(bucket);
      if (list && list.length > 0) return list[Math.floor(Math.random() * list.length)];
      break;
    }
  }
  return containerTypes[Math.floor(Math.random() * containerTypes.length)];
}

/** Try up to maxAttempts random positions; return { x, y } or null. */
function tryRandomPosition(
  drawerUnits: DrawerUnits,
  currentPlacements: Placement[],
  containerTypeById: Map<string, ContainerType>,
  placeWidth: number,
  placeDepth: number,
  containerTypeId: string,
  maxAttempts: number,
): { x: number; y: number } | null {
  const maxX = Math.max(0, drawerUnits.widthUnits - placeWidth);
  const maxY = Math.max(0, drawerUnits.depthUnits - placeDepth);
  if (maxX < 0 || maxY < 0) return null;
  const virtualType: ContainerType = {
    id: containerTypeId,
    label: "",
    widthUnits: placeWidth,
    depthUnits: placeDepth,
  };
  for (let i = 0; i < maxAttempts; i++) {
    const x = Math.floor(Math.random() * (maxX + 1));
    const y = Math.floor(Math.random() * (maxY + 1));
    if (canPlaceContainer(drawerUnits, currentPlacements, containerTypeById, virtualType, x, y)) {
      return { x, y };
    }
  }
  return null;
}

/** Systematic left-to-right, top-to-bottom placement. */
function trySystematicPosition(
  drawerUnits: DrawerUnits,
  currentPlacements: Placement[],
  containerTypeById: Map<string, ContainerType>,
  placeWidth: number,
  placeDepth: number,
  containerTypeId: string,
): { x: number; y: number } | null {
  const virtualType: ContainerType = {
    id: containerTypeId,
    label: "",
    widthUnits: placeWidth,
    depthUnits: placeDepth,
  };
  for (let y = 0; y <= drawerUnits.depthUnits - placeDepth; y++) {
    for (let x = 0; x <= drawerUnits.widthUnits - placeWidth; x++) {
      if (canPlaceContainer(drawerUnits, currentPlacements, containerTypeById, virtualType, x, y)) {
        return { x, y };
      }
    }
  }
  return null;
}

const TARGET_COVERAGE_MIN = 0.7;
const TARGET_COVERAGE_MAX = 0.85;
const RANDOM_PLACEMENT_ATTEMPTS = 10;
const ROTATION_CHANCE = 0.3;
const MAX_ITERATIONS = 2000;

/**
 * Fill the grid randomly to 70–85% coverage with weighted container selection,
 * collision detection, and random + systematic placement fallback.
 * Does not modify existing placements.
 */
export function fillGridRandomly(
  drawerUnits: DrawerUnits,
  existingPlacements: Placement[],
  containerTypes: ContainerType[],
  containerTypeById: Map<string, ContainerType>,
): Placement[] {
  if (drawerUnits.widthUnits <= 0 || drawerUnits.depthUnits <= 0) return existingPlacements;
  if (containerTypes.length === 0) return existingPlacements;

  const totalCells = drawerUnits.widthUnits * drawerUnits.depthUnits;
  let usedCells = 0;
  for (const p of existingPlacements) {
    const ct = containerTypeById.get(p.containerTypeId);
    if (!ct) continue;
    const w = p.isRotated ? ct.depthUnits : ct.widthUnits;
    const h = p.isRotated ? ct.widthUnits : ct.depthUnits;
    usedCells += w * h;
  }

  const targetMinCells = Math.floor(totalCells * TARGET_COVERAGE_MIN);
  const targetMaxCells = Math.floor(totalCells * TARGET_COVERAGE_MAX);
  if (usedCells >= targetMaxCells) return existingPlacements;

  const buckets = groupByBucket(containerTypes);
  const currentPlacements: Placement[] = [...existingPlacements];

  let iterations = 0;
  let consecutiveSkips = 0;
  const maxConsecutiveSkips = 20;

  while (iterations < MAX_ITERATIONS && consecutiveSkips < maxConsecutiveSkips) {
    if (usedCells >= targetMinCells && usedCells <= targetMaxCells) break;
    if (usedCells > targetMaxCells) break;

    const ct = pickWeightedContainer(containerTypes, buckets);
    if (!ct) break;

    const isRotated = Math.random() < ROTATION_CHANCE;
    const placeWidth = isRotated ? ct.depthUnits : ct.widthUnits;
    const placeDepth = isRotated ? ct.widthUnits : ct.depthUnits;

    let pos = tryRandomPosition(
      drawerUnits,
      currentPlacements,
      containerTypeById,
      placeWidth,
      placeDepth,
      ct.id,
      RANDOM_PLACEMENT_ATTEMPTS,
    );
    if (!pos) {
      pos = trySystematicPosition(
        drawerUnits,
        currentPlacements,
        containerTypeById,
        placeWidth,
        placeDepth,
        ct.id,
      );
    }

    if (pos) {
      currentPlacements.push({
        id: `${ct.id}-${pos.x}-${pos.y}-${Date.now()}-${iterations}`,
        containerTypeId: ct.id,
        x: pos.x,
        y: pos.y,
        isRotated: isRotated || undefined,
      });
      usedCells += placeWidth * placeDepth;
      consecutiveSkips = 0;
    } else {
      consecutiveSkips++;
    }
    iterations++;
  }

  return currentPlacements;
}
