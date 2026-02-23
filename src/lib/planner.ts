import type { ContainerType, DrawerInput, DrawerUnits, Placement } from "../types/planfinity";

type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function getPlacementDimensions(placement: Placement, containerType: ContainerType): { width: number; height: number } {
  if (placement.isRotated) {
    return {
      width: containerType.depthUnits,
      height: containerType.widthUnits,
    };
  }

  return {
    width: containerType.widthUnits,
    height: containerType.depthUnits,
  };
}

export function deriveDrawerUnits(input: DrawerInput): DrawerUnits {
  if (input.gridPitchMm <= 0) {
    return { widthUnits: 0, depthUnits: 0 };
  }

  return {
    widthUnits: Math.floor(input.widthMm / input.gridPitchMm),
    depthUnits: Math.floor(input.depthMm / input.gridPitchMm),
  };
}

export function isPlacementWithinBounds(
  drawerUnits: DrawerUnits,
  containerType: ContainerType,
  x: number,
  y: number,
): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    x + containerType.widthUnits <= drawerUnits.widthUnits &&
    y + containerType.depthUnits <= drawerUnits.depthUnits
  );
}

export function doRectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

export function doesPlacementCollide(
  placements: Placement[],
  containerTypeById: Map<string, ContainerType>,
  candidateType: ContainerType,
  x: number,
  y: number,
): boolean {
  const candidate: Rectangle = { x, y, width: candidateType.widthUnits, height: candidateType.depthUnits };

  return placements.some((placement) => {
    const placedType = containerTypeById.get(placement.containerTypeId);
    if (!placedType) {
      return false;
    }
    const placedDimensions = getPlacementDimensions(placement, placedType);

    const existing: Rectangle = {
      x: placement.x,
      y: placement.y,
      width: placedDimensions.width,
      height: placedDimensions.height,
    };

    return doRectanglesOverlap(existing, candidate);
  });
}

export function canPlaceContainer(
  drawerUnits: DrawerUnits,
  placements: Placement[],
  containerTypeById: Map<string, ContainerType>,
  containerType: ContainerType,
  x: number,
  y: number,
): boolean {
  if (!isPlacementWithinBounds(drawerUnits, containerType, x, y)) {
    return false;
  }

  return !doesPlacementCollide(placements, containerTypeById, containerType, x, y);
}
