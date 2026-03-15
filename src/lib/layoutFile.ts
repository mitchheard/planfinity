import type { ContainerType, DrawerInput, Placement } from "@/types/planfinity";

/**
 * Schema for Planfinity layout JSON files (client-side save/load).
 * version: reserved for future migrations.
 */
export type LayoutFileSchema = {
  version: number;
  drawer: {
    width: number;
    depth: number;
    pitch: number;
  };
  containers: Array<{
    type: string;
    col: number;
    row: number;
    rotated: boolean;
  }>;
};

const SUPPORTED_VERSION = 1;
const FILENAME = "planfinity-layout.json";

function effectiveDimensions(
  containerType: ContainerType,
  rotated: boolean,
): { widthUnits: number; depthUnits: number } {
  if (rotated) {
    return { widthUnits: containerType.depthUnits, depthUnits: containerType.widthUnits };
  }
  return { widthUnits: containerType.widthUnits, depthUnits: containerType.depthUnits };
}

function isWithinBounds(
  col: number,
  row: number,
  widthUnits: number,
  depthUnits: number,
  gridWidthUnits: number,
  gridDepthUnits: number,
): boolean {
  return (
    col >= 0 &&
    row >= 0 &&
    col + widthUnits <= gridWidthUnits &&
    row + depthUnits <= gridDepthUnits
  );
}

/**
 * Serialize current drawer + placements into the file schema and trigger a browser download.
 * Uses client-side APIs only (no backend). Allows saving with an empty containers array.
 */
export function downloadLayoutFile(drawerInput: DrawerInput, placements: Placement[]): void {
  const layout: LayoutFileSchema = {
    version: SUPPORTED_VERSION,
    drawer: {
      width: drawerInput.widthMm,
      depth: drawerInput.depthMm,
      pitch: drawerInput.gridPitchMm,
    },
    containers: placements.map((p) => ({
      type: p.containerTypeId,
      col: p.x,
      row: p.y,
      rotated: p.isRotated ?? false,
    })),
  };

  const blob = new Blob([JSON.stringify(layout, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = FILENAME;
  a.click();
  URL.revokeObjectURL(url);
}

export type LoadLayoutResult =
  | { ok: true; drawerInput: DrawerInput; placements: Placement[]; skippedCount: number }
  | { ok: false; error: string };

/**
 * Parse and validate a layout file string. Returns either loaded state (with optional skipped count)
 * or an error message. Does not apply state — caller applies to React state.
 * Validates: version === 1, drawer fields present and numeric, containers array; skips
 * out-of-bounds containers and counts them in skippedCount.
 */
export function parseLayoutFile(
  jsonString: string,
  containerTypes: ContainerType[],
): LoadLayoutResult {
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    return { ok: false, error: "Invalid layout file" };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, error: "Invalid layout file" };
  }

  const obj = data as Record<string, unknown>;
  if (obj.version !== SUPPORTED_VERSION) {
    return { ok: false, error: "Invalid layout file" };
  }

  const drawer = obj.drawer;
  if (!drawer || typeof drawer !== "object") {
    return { ok: false, error: "Invalid layout file" };
  }

  const d = drawer as Record<string, unknown>;
  const width = d.width;
  const depth = d.depth;
  const pitch = d.pitch;
  if (
    typeof width !== "number" ||
    !Number.isFinite(width) ||
    width <= 0 ||
    typeof depth !== "number" ||
    !Number.isFinite(depth) ||
    depth <= 0 ||
    typeof pitch !== "number" ||
    !Number.isFinite(pitch) ||
    pitch <= 0
  ) {
    return { ok: false, error: "Invalid layout file" };
  }

  const drawerInput: DrawerInput = {
    widthMm: width,
    depthMm: depth,
    gridPitchMm: pitch,
  };
  const gridWidthUnits = Math.floor(width / pitch);
  const gridDepthUnits = Math.floor(depth / pitch);

  const containerTypeById = new Map(containerTypes.map((c) => [c.id, c]));

  const containers = obj.containers;
  if (!Array.isArray(containers)) {
    return { ok: false, error: "Invalid layout file" };
  }

  const placements: Placement[] = [];
  let skippedCount = 0;

  for (const item of containers) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const type = c.type;
    const col = c.col;
    const row = c.row;
    const rotated = c.rotated;

    if (typeof type !== "string") continue;
    const containerType = containerTypeById.get(type);
    if (!containerType) continue;
    const colNum = typeof col === "number" && Number.isInteger(col) ? col : NaN;
    const rowNum = typeof row === "number" && Number.isInteger(row) ? row : NaN;
    if (!Number.isFinite(colNum) || !Number.isFinite(rowNum)) continue;

    const rot = typeof rotated === "boolean" ? rotated : false;
    const { widthUnits, depthUnits } = effectiveDimensions(containerType, rot);
    if (
      !isWithinBounds(colNum, rowNum, widthUnits, depthUnits, gridWidthUnits, gridDepthUnits)
    ) {
      skippedCount += 1;
      continue;
    }

    placements.push({
      containerTypeId: type,
      x: colNum,
      y: rowNum,
      isRotated: rot,
    });
  }

  return {
    ok: true,
    drawerInput,
    placements,
    skippedCount,
  };
}
