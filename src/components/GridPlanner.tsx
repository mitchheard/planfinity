"use client";

import { useState } from "react";
import type { ContainerType, DrawerUnits, Placement } from "@/types/planfinity";
import { canPlaceContainer, doesPlacementCollide, isPlacementWithinBounds } from "@/lib/planner";

const CELL_SIZE_PX = 30;

type GridPlannerProps = {
  drawerUnits: DrawerUnits;
  containerTypes: ContainerType[];
  selectedContainerTypeId: string;
  placements: Placement[];
  onAddPlacement: (placement: Placement) => void;
  onRemovePlacement: (placementId: string) => void;
};

export function GridPlanner({
  drawerUnits,
  containerTypes,
  selectedContainerTypeId,
  placements,
  onAddPlacement,
  onRemovePlacement,
}: GridPlannerProps) {
  const [placementError, setPlacementError] = useState<string | null>(null);
  const containerTypeById = new Map(containerTypes.map((containerType) => [containerType.id, containerType]));
  const selectedContainerType = containerTypeById.get(selectedContainerTypeId) ?? containerTypes[0];

  const handleCellClick = (x: number, y: number) => {
    if (!selectedContainerType) {
      return;
    }

    const isValidPlacement = canPlaceContainer(
      drawerUnits,
      placements,
      containerTypeById,
      selectedContainerType,
      x,
      y,
    );
    if (!isValidPlacement) {
      const inBounds = isPlacementWithinBounds(drawerUnits, selectedContainerType, x, y);
      if (!inBounds) {
        setPlacementError("Placement is outside the grid bounds.");
        return;
      }

      if (doesPlacementCollide(placements, containerTypeById, selectedContainerType, x, y)) {
        setPlacementError("Placement overlaps an existing container.");
        return;
      }

      setPlacementError("Placement is invalid.");
      return;
    }

    setPlacementError(null);
    onAddPlacement({
      id: `${selectedContainerType.id}-${x}-${y}-${Date.now()}`,
      containerTypeId: selectedContainerType.id,
      x,
      y,
    });
  };

  if (drawerUnits.widthUnits <= 0 || drawerUnits.depthUnits <= 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Grid</h2>
        <p className="mt-2 text-sm text-gray-600">Enter valid dimensions to render a grid.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Grid</h2>
      <p className="mt-1 text-sm text-gray-600">
        Click a cell to place the selected container. Click a placed container to remove it.
      </p>
      {placementError ? <p className="mt-2 text-sm text-red-600">{placementError}</p> : null}

      <div className="mt-4 overflow-auto">
        <div
          className="relative border border-gray-300 bg-white"
          style={{
            width: drawerUnits.widthUnits * CELL_SIZE_PX,
            height: drawerUnits.depthUnits * CELL_SIZE_PX,
            display: "grid",
            gridTemplateColumns: `repeat(${drawerUnits.widthUnits}, ${CELL_SIZE_PX}px)`,
            gridTemplateRows: `repeat(${drawerUnits.depthUnits}, ${CELL_SIZE_PX}px)`,
          }}
        >
          {Array.from({ length: drawerUnits.widthUnits * drawerUnits.depthUnits }).map((_, index) => {
            const x = index % drawerUnits.widthUnits;
            const y = Math.floor(index / drawerUnits.widthUnits);

            return (
              <button
                key={`cell-${x}-${y}`}
                type="button"
                className="border border-gray-200 hover:bg-blue-50"
                onClick={() => handleCellClick(x, y)}
                aria-label={`Place at ${x},${y}`}
              />
            );
          })}

          {placements.map((placement) => {
            const containerType = containerTypeById.get(placement.containerTypeId);
            if (!containerType) {
              return null;
            }
            const placementId = placement.id ?? `${placement.containerTypeId}-${placement.x}-${placement.y}`;

            return (
              <button
                key={placementId}
                type="button"
                className="absolute rounded border-2 border-gray-700 text-xs font-medium text-gray-900 shadow-sm"
                style={{
                  left: placement.x * CELL_SIZE_PX,
                  top: placement.y * CELL_SIZE_PX,
                  width: containerType.widthUnits * CELL_SIZE_PX,
                  height: containerType.depthUnits * CELL_SIZE_PX,
                  backgroundColor: containerType.color,
                }}
                onClick={() => {
                  if (placement.id) {
                    onRemovePlacement(placement.id);
                  }
                }}
                title={`${containerType.label} (${containerType.widthUnits}x${containerType.depthUnits})`}
              >
                {containerType.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
