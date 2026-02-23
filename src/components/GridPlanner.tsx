"use client";

import { useEffect, useState } from "react";
import type { ContainerType, DrawerInput, DrawerUnits, Placement } from "@/types/planfinity";
import { canPlaceContainer, doesPlacementCollide, isPlacementWithinBounds } from "@/lib/planner";

const CELL_SIZE_PX = 30;
const ROTATE_TIP_DISMISSED_STORAGE_KEY = "planfinity.rotateTipDismissed";

type GridPlannerProps = {
  drawerInput: DrawerInput;
  drawerUnits: DrawerUnits;
  containerTypes: ContainerType[];
  selectedContainerTypeId: string;
  placements: Placement[];
  onAddPlacement: (placement: Placement) => void;
  onRemovePlacement: (placementId: string) => void;
};

export function GridPlanner({
  drawerInput,
  drawerUnits,
  containerTypes,
  selectedContainerTypeId,
  placements,
  onAddPlacement,
  onRemovePlacement,
}: GridPlannerProps) {
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPlacementId, setHoveredPlacementId] = useState<string | null>(null);
  const [isRotateHeld, setIsRotateHeld] = useState(false);
  const [showRotateTip, setShowRotateTip] = useState(false);
  const containerTypeById = new Map(containerTypes.map((containerType) => [containerType.id, containerType]));
  const selectedContainerType = containerTypeById.get(selectedContainerTypeId) ?? containerTypes[0];
  const selectedPlacementType = selectedContainerType
    ? {
        ...selectedContainerType,
        widthUnits: isRotateHeld ? selectedContainerType.depthUnits : selectedContainerType.widthUnits,
        depthUnits: isRotateHeld ? selectedContainerType.widthUnits : selectedContainerType.depthUnits,
      }
    : null;
  const usedWidthMm = drawerUnits.widthUnits * drawerInput.gridPitchMm;
  const usedDepthMm = drawerUnits.depthUnits * drawerInput.gridPitchMm;
  const extraWidthMm = Math.max(0, drawerInput.widthMm - usedWidthMm);
  const extraDepthMm = Math.max(0, drawerInput.depthMm - usedDepthMm);
  const extraWidthPx = (extraWidthMm / drawerInput.gridPitchMm) * CELL_SIZE_PX;
  const extraDepthPx = (extraDepthMm / drawerInput.gridPitchMm) * CELL_SIZE_PX;
  const gridWidthPx = drawerUnits.widthUnits * CELL_SIZE_PX;
  const gridDepthPx = drawerUnits.depthUnits * CELL_SIZE_PX;

  const getAdjustedPlacementPosition = (x: number, y: number, containerType: ContainerType) => {
    const maxStartX = Math.max(0, drawerUnits.widthUnits - containerType.widthUnits);
    const maxStartY = Math.max(0, drawerUnits.depthUnits - containerType.depthUnits);

    return {
      x: Math.min(x, maxStartX),
      y: Math.min(y, maxStartY),
    };
  };

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(ROTATE_TIP_DISMISSED_STORAGE_KEY) === "1";
      setShowRotateTip(!dismissed);
    } catch {
      setShowRotateTip(true);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") {
        setIsRotateHeld(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") {
        setIsRotateHeld(false);
      }
    };
    const handleWindowBlur = () => {
      setIsRotateHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  const dismissRotateTip = () => {
    setShowRotateTip(false);
    try {
      window.localStorage.setItem(ROTATE_TIP_DISMISSED_STORAGE_KEY, "1");
    } catch {
      // Keep dismissal ephemeral when storage is unavailable.
    }
  };

  const placeAtCell = (x: number, y: number, shouldRotate: boolean) => {
    if (!selectedContainerType) {
      return;
    }

    const placementType = shouldRotate
      ? {
          ...selectedContainerType,
          widthUnits: selectedContainerType.depthUnits,
          depthUnits: selectedContainerType.widthUnits,
        }
      : selectedContainerType;

    const adjustedPosition = getAdjustedPlacementPosition(x, y, placementType);
    const adjustedX = adjustedPosition.x;
    const adjustedY = adjustedPosition.y;

    const isValidPlacement = canPlaceContainer(
      drawerUnits,
      placements,
      containerTypeById,
      placementType,
      adjustedX,
      adjustedY,
    );
    if (!isValidPlacement) {
      const inBounds = isPlacementWithinBounds(drawerUnits, placementType, adjustedX, adjustedY);
      if (!inBounds) {
        setPlacementError("Placement is outside the grid bounds.");
        return;
      }

      if (doesPlacementCollide(placements, containerTypeById, placementType, adjustedX, adjustedY)) {
        setPlacementError("Placement overlaps an existing container.");
        return;
      }

      setPlacementError("Placement is invalid.");
      return;
    }

    setPlacementError(null);
    onAddPlacement({
      id: `${placementType.id}-${adjustedX}-${adjustedY}-${Date.now()}`,
      containerTypeId: placementType.id,
      x: adjustedX,
      y: adjustedY,
      isRotated: shouldRotate,
    });
  };

  const hoveredPlacementPreview =
    selectedPlacementType && hoverCell
      ? (() => {
          const adjustedPosition = getAdjustedPlacementPosition(hoverCell.x, hoverCell.y, selectedPlacementType);
          const inBounds = isPlacementWithinBounds(
            drawerUnits,
            selectedPlacementType,
            adjustedPosition.x,
            adjustedPosition.y,
          );
          const collides =
            inBounds &&
            doesPlacementCollide(
              placements,
              containerTypeById,
              selectedPlacementType,
              adjustedPosition.x,
              adjustedPosition.y,
            );

          return {
            x: adjustedPosition.x,
            y: adjustedPosition.y,
            isValid: inBounds && !collides,
          };
        })()
      : null;
  const hoveredPlacedContainer =
    hoveredPlacementId !== null
      ? placements.find((placement) => (placement.id ?? `${placement.containerTypeId}-${placement.x}-${placement.y}`) === hoveredPlacementId) ??
        null
      : null;
  const hoveredPlacedContainerType = hoveredPlacedContainer
    ? containerTypeById.get(hoveredPlacedContainer.containerTypeId) ?? null
    : null;

  if (drawerUnits.widthUnits <= 0 || drawerUnits.depthUnits <= 0) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-200/60 backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900">Grid</h2>
        <p className="mt-2 text-sm text-slate-600">Enter valid dimensions to render a grid.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-200/60 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Grid</h2>
      <p className="mt-1 text-sm text-slate-600">
        Click a cell to place the selected container. Hold R to rotate while hovering/clicking. Right-click to place
        rotated. Near edges, placement auto-shifts to stay in bounds.
      </p>
      {showRotateTip ? (
        <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Tip:</span>
            <span>
              Hold <kbd className="rounded border border-blue-300 bg-white px-1.5 py-0.5 font-mono text-[11px]">R</kbd>{" "}
              to rotate the ghost preview before placing.
            </span>
            <span>
              Or use{" "}
              <kbd className="rounded border border-blue-300 bg-white px-1.5 py-0.5 font-mono text-[11px]">
                Right Click
              </kbd>{" "}
              (or Control-click on Mac) to place a rotated bin directly.
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={`rounded border px-2 py-0.5 font-medium whitespace-nowrap ${
                isRotateHeld ? "border-blue-600 bg-blue-100 text-blue-700" : "border-blue-300 bg-white text-blue-800"
              }`}
            >
              Rotation: {isRotateHeld ? "Active (R held)" : "Normal"}
            </span>
            <button
              type="button"
              onClick={dismissRotateTip}
              className="rounded border border-blue-300 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-900 hover:bg-blue-100"
            >
              Got it
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-600">
          Hold <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px]">R</kbd>{" "}
          to rotate before placing.
        </p>
      )}
      <p className="mt-1 text-sm text-slate-700">
        Input: {drawerInput.widthMm}mm x {drawerInput.depthMm}mm
      </p>
      <p className="mt-1 text-sm text-slate-700">
        Grid coverage: {usedWidthMm}mm x {usedDepthMm}mm
        {(extraWidthMm > 0 || extraDepthMm > 0) && (
          <>
            {" "}
            (extra: +{extraWidthMm}mm width, +{extraDepthMm}mm depth)
          </>
        )}
      </p>
      {hoveredPlacedContainer && hoveredPlacedContainerType ? (
        <p className="mt-1 text-sm text-slate-700">
          Hovered container: {hoveredPlacedContainerType.label} (
          {hoveredPlacedContainer.isRotated ? hoveredPlacedContainerType.depthUnits : hoveredPlacedContainerType.widthUnits}
          x
          {hoveredPlacedContainer.isRotated ? hoveredPlacedContainerType.widthUnits : hoveredPlacedContainerType.depthUnits}
          {" "}units)
        </p>
      ) : null}
      {placementError ? <p className="mt-2 text-sm text-rose-600">{placementError}</p> : null}

      <div className="mt-4 overflow-auto">
        <div
          className="relative border border-gray-300 bg-white"
          style={{
            width: gridWidthPx + extraWidthPx,
            height: gridDepthPx + extraDepthPx,
          }}
        >
          <div
            className="absolute left-0 top-0 border-r border-b border-gray-300 bg-white"
            style={{
              width: gridWidthPx,
              height: gridDepthPx,
              display: "grid",
              gridTemplateColumns: `repeat(${drawerUnits.widthUnits}, ${CELL_SIZE_PX}px)`,
              gridTemplateRows: `repeat(${drawerUnits.depthUnits}, ${CELL_SIZE_PX}px)`,
            }}
            onMouseLeave={() => setHoverCell(null)}
          >
            {Array.from({ length: drawerUnits.widthUnits * drawerUnits.depthUnits }).map((_, index) => {
              const x = index % drawerUnits.widthUnits;
              const y = Math.floor(index / drawerUnits.widthUnits);

              return (
                <button
                  key={`cell-${x}-${y}`}
                  type="button"
                  className="border border-gray-200 hover:bg-blue-50"
                  onClick={() => placeAtCell(x, y, isRotateHeld)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    placeAtCell(x, y, true);
                  }}
                  onMouseEnter={() => setHoverCell({ x, y })}
                  onFocus={() => setHoverCell({ x, y })}
                  aria-label={`Place at ${x},${y}`}
                />
              );
            })}

            {selectedPlacementType && hoveredPlacementPreview ? (
              <div
                className={`pointer-events-none absolute rounded border-2 ${
                  hoveredPlacementPreview.isValid
                    ? "border-blue-600 bg-blue-300/40"
                    : "border-red-500 bg-red-300/40"
                }`}
                style={{
                  left: hoveredPlacementPreview.x * CELL_SIZE_PX,
                  top: hoveredPlacementPreview.y * CELL_SIZE_PX,
                  width: selectedPlacementType.widthUnits * CELL_SIZE_PX,
                  height: selectedPlacementType.depthUnits * CELL_SIZE_PX,
                }}
              />
            ) : null}

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
                    width:
                      (placement.isRotated ? containerType.depthUnits : containerType.widthUnits) * CELL_SIZE_PX,
                    height:
                      (placement.isRotated ? containerType.widthUnits : containerType.depthUnits) * CELL_SIZE_PX,
                    backgroundColor: containerType.color,
                  }}
                  onClick={() => {
                    if (placement.id) {
                      onRemovePlacement(placement.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredPlacementId(placementId)}
                  onMouseLeave={() => setHoveredPlacementId(null)}
                  onFocus={() => setHoveredPlacementId(placementId)}
                  onBlur={() => setHoveredPlacementId(null)}
                  title={`${containerType.label} (${placement.isRotated ? containerType.depthUnits : containerType.widthUnits}x${placement.isRotated ? containerType.widthUnits : containerType.depthUnits})`}
                >
                  {containerType.label}
                </button>
              );
            })}
          </div>
          {extraWidthMm > 0 && (
            <div
              className="absolute right-0 top-0 flex items-start justify-center border-l border-gray-300 bg-amber-100/80 p-1 text-[11px] text-amber-900"
              style={{
                width: extraWidthPx,
                height: gridDepthPx,
              }}
              title={`Unusable width remainder: ${extraWidthMm}mm`}
            >
              +{extraWidthMm}mm
            </div>
          )}
          {extraDepthMm > 0 && (
            <div
              className="absolute bottom-0 left-0 flex items-center justify-center border-t border-gray-300 bg-amber-100/80 px-1 text-[11px] text-amber-900"
              style={{
                width: gridWidthPx,
                height: extraDepthPx,
              }}
              title={`Unusable depth remainder: ${extraDepthMm}mm`}
            >
              +{extraDepthMm}mm
            </div>
          )}
          {extraWidthMm > 0 && extraDepthMm > 0 && (
            <div
              className="absolute bottom-0 right-0 border-l border-t border-gray-300 bg-amber-200/80"
              style={{
                width: extraWidthPx,
                height: extraDepthPx,
              }}
              title={`Unusable corner: ${extraWidthMm}mm x ${extraDepthMm}mm`}
            />
          )}
        </div>
      </div>
    </section>
  );
}
