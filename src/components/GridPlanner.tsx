"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ContainerType, DrawerInput, DrawerUnits, Placement } from "@/types/planfinity";
import { canPlaceContainer, doesPlacementCollide, isPlacementWithinBounds } from "@/lib/planner";

const CELL_SIZE_PX = 30;

function getContainerColor(depth: number): { fill: string; stroke: string; labelColor: string } {
  if (depth <= 2) return { fill: "#DBEAFE", stroke: "#93C5FD", labelColor: "#1D4ED8" };
  if (depth === 3) return { fill: "#5EEAD4", stroke: "#0D9488", labelColor: "#0F5C52" };
  return { fill: "#0D9488", stroke: "#085041", labelColor: "#E1F5EE" }; // depth 4-5
}

type GridPlannerProps = {
  drawerInput: DrawerInput;
  drawerUnits: DrawerUnits;
  containerTypes: ContainerType[];
  selectedContainerTypeId: string;
  placements: Placement[];
  coveragePercent: number;
  onAddPlacement: (placement: Placement) => void;
  onRemovePlacement: (placementId: string) => void;
  onClearLayout: () => void;
  /** When true, show touch tip and tap-on-placement rotates instead of remove */
  touchMode?: boolean;
  /** Optional: tap on placed container rotates it (used in touch mode) */
  onRotatePlacement?: (placementId: string) => void;
  /** When true, grid fills container with aspect ratio (for mobile responsive) */
  fillContainer?: boolean;
  /** When true, hide the grid footer (meta + coverage bar) - e.g. when stats are in a mobile tab */
  hideFooter?: boolean;
};

export function GridPlanner({
  drawerInput,
  drawerUnits,
  containerTypes,
  selectedContainerTypeId,
  placements,
  coveragePercent,
  onAddPlacement,
  onRemovePlacement,
  onClearLayout,
  touchMode = false,
  onRotatePlacement,
  fillContainer = false,
  hideFooter = false,
}: GridPlannerProps) {
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [isRotateHeld, setIsRotateHeld] = useState(false);
  const [isControlHeld, setIsControlHeld] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [isClearConfirming, setIsClearConfirming] = useState(false);
  const [hoverPlacementId, setHoverPlacementId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressHandledRef = useRef(false);
  const gridPatternId = useId();
  const containerTypeById = new Map(containerTypes.map((c) => [c.id, c]));
  const selectedContainerType = containerTypeById.get(selectedContainerTypeId) ?? containerTypes[0];
  const shouldPreviewRotated = isRotateHeld || isControlHeld || isAltHeld;
  const selectedPlacementType = selectedContainerType
    ? {
        ...selectedContainerType,
        widthUnits: shouldPreviewRotated ? selectedContainerType.depthUnits : selectedContainerType.widthUnits,
        depthUnits: shouldPreviewRotated ? selectedContainerType.widthUnits : selectedContainerType.depthUnits,
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
  const hasExtraSpace = extraWidthMm > 0 || extraDepthMm > 0;

  const getAdjustedPlacementPosition = (x: number, y: number, containerType: ContainerType) => {
    const maxStartX = Math.max(0, drawerUnits.widthUnits - containerType.widthUnits);
    const maxStartY = Math.max(0, drawerUnits.depthUnits - containerType.depthUnits);
    return { x: Math.min(x, maxStartX), y: Math.min(y, maxStartY) };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") setIsRotateHeld(true);
      if (e.key === "Control") setIsControlHeld(true);
      if (e.key === "Alt") setIsAltHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") setIsRotateHeld(false);
      if (e.key === "Control") setIsControlHeld(false);
      if (e.key === "Alt") setIsAltHeld(false);
    };
    const handleWindowBlur = () => {
      setIsRotateHeld(false);
      setIsControlHeld(false);
      setIsAltHeld(false);
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

  useEffect(() => {
    if (placements.length === 0) setIsClearConfirming(false);
  }, [placements.length]);

  const startClearLayout = () => {
    if (placements.length === 0) return;
    setIsClearConfirming(true);
  };
  const cancelClearLayout = () => setIsClearConfirming(false);
  const confirmClearLayout = () => {
    onClearLayout();
    setIsClearConfirming(false);
  };

  const placeAtCell = (x: number, y: number, shouldRotate: boolean) => {
    if (!selectedContainerType) return;
    const placementType = shouldRotate
      ? { ...selectedContainerType, widthUnits: selectedContainerType.depthUnits, depthUnits: selectedContainerType.widthUnits }
      : selectedContainerType;
    const { x: adjustedX, y: adjustedY } = getAdjustedPlacementPosition(x, y, placementType);
    const isValid = canPlaceContainer(drawerUnits, placements, containerTypeById, placementType, adjustedX, adjustedY);
    if (!isValid) {
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
          const pos = getAdjustedPlacementPosition(hoverCell.x, hoverCell.y, selectedPlacementType);
          const inBounds = isPlacementWithinBounds(drawerUnits, selectedPlacementType, pos.x, pos.y);
          const collides =
            inBounds &&
            doesPlacementCollide(placements, containerTypeById, selectedPlacementType, pos.x, pos.y);
          return { x: pos.x, y: pos.y, isValid: inBounds && !collides };
        })()
      : null;

  if (drawerUnits.widthUnits <= 0 || drawerUnits.depthUnits <= 0) {
    return (
      <div className="flex flex-1 flex-col">
        <div
          className="rounded-[var(--radius-md)] border p-3"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)" }}>
            Enter valid dimensions to render a grid.
          </p>
        </div>
      </div>
    );
  }

  const tipBarStyle = {
    backgroundColor: "var(--accent-blue-light)",
    border: "1px solid var(--accent-blue-mid)",
    borderRadius: "var(--radius-md)",
    padding: "10px 13px",
  };
  const keyChipStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    fontWeight: 500,
    color: "var(--tip-text)",
    backgroundColor: "var(--surface)",
    border: "2px solid var(--accent-blue-mid)",
    borderBottomWidth: "2px",
    borderRadius: "4px",
    padding: "0 5px",
    lineHeight: "18px",
  };

  const getPlacementId = (placement: Placement) =>
    placement.id ?? `${placement.containerTypeId}-${placement.x}-${placement.y}`;

  const LONG_PRESS_MS = 500;

  const handlePlacementClick = (placement: Placement) => {
    const pid = getPlacementId(placement);
    if (touchMode && onRotatePlacement) {
      onRotatePlacement(pid);
    } else {
      onRemovePlacement(pid);
    }
  };

  const handlePlacementTouchStart = (placement: Placement) => {
    if (!touchMode || !onRotatePlacement) return;
    longPressHandledRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressHandledRef.current = true;
      onRemovePlacement(getPlacementId(placement));
      longPressTimerRef.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePlacementTouchEnd = (placement: Placement) => {
    if (!touchMode || !onRotatePlacement) return;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!longPressHandledRef.current) {
      onRotatePlacement(getPlacementId(placement));
    }
    longPressHandledRef.current = false;
  };

  const totalWidthPx = gridWidthPx + extraWidthPx;
  const totalHeightPx = gridDepthPx + extraDepthPx;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Persistent tip banner — always visible, never dismissible */}
      <div style={tipBarStyle} className="flex flex-wrap items-center gap-1.5">
        <span className="shrink-0" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="var(--accent-blue)" />
            <path
              d="M12 16v-4M12 8h.01"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span
          className="flex flex-wrap items-center gap-1.5 text-[11.5px] leading-[1.6]"
          style={{ color: "var(--tip-text)" }}
        >
          {touchMode ? (
            <>Tap to place · Tap container to rotate · Long-press to remove</>
          ) : (
            <>
              Click to place
              <span style={{ color: "var(--accent-blue-mid)" }}> · </span>
              Hold <kbd style={keyChipStyle}>R</kbd> to rotate
              <span style={{ color: "var(--accent-blue-mid)" }}> · </span>
              Right-click to place rotated
              <span style={{ color: "var(--accent-blue-mid)" }}> · </span>
              <kbd style={keyChipStyle}>Ctrl</kbd> + click to place rotated directly
            </>
          )}
        </span>
      </div>

      {/* Grid canvas: flex-1, white bg, border, SVG inside */}
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-[var(--radius-lg)] border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          ...(fillContainer && {
            aspectRatio: `${totalWidthPx} / ${totalHeightPx}`,
            flex: "0 1 auto",
            minHeight: 0,
          }),
        }}
      >
        <div
          className={fillContainer ? "absolute inset-0 flex items-center justify-center p-2" : "absolute inset-0 flex items-center justify-center overflow-auto p-2"}
          onMouseLeave={() => setHoverCell(null)}
        >
          <div
            className="relative shrink-0"
            style={
              fillContainer
                ? { width: "100%", height: "100%", maxWidth: totalWidthPx, maxHeight: totalHeightPx }
                : { width: totalWidthPx, height: totalHeightPx }
            }
          >
            <svg
              viewBox={`0 0 ${totalWidthPx} ${totalHeightPx}`}
              overflow="visible"
              {...(fillContainer
                ? { width: "100%", height: "100%", preserveAspectRatio: "xMidYMid meet", className: "absolute inset-0 block" }
                : { width: totalWidthPx, height: totalHeightPx, className: "absolute left-0 top-0 block" })}
            >
              <defs>
                <pattern
                  id={gridPatternId}
                  width={CELL_SIZE_PX}
                  height={CELL_SIZE_PX}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${CELL_SIZE_PX} 0 L 0 0 0 ${CELL_SIZE_PX}`}
                    fill="none"
                    stroke="var(--gridline)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              {/* Grid area background + gridlines */}
              <rect x={0} y={0} width={gridWidthPx} height={gridDepthPx} fill="var(--grid-bg)" />
              <rect x={0} y={0} width={gridWidthPx} height={gridDepthPx} fill={`url(#${gridPatternId})`} />
              <rect
                x={0}
                y={0}
                width={gridWidthPx}
                height={gridDepthPx}
                fill="none"
                stroke="var(--grid-outer)"
                strokeWidth="1"
              />
              {/* Placements as rects */}
              {placements.map((placement) => {
                const ct = containerTypeById.get(placement.containerTypeId);
                if (!ct) return null;
                const w = placement.isRotated ? ct.depthUnits : ct.widthUnits;
                const h = placement.isRotated ? ct.widthUnits : ct.depthUnits;
                const { fill, stroke, labelColor } = getContainerColor(ct.depthUnits);
                const isHovered = hoverPlacementId === (placement.id ?? "");
                const strokeWidth = isHovered ? 2 : 1.25;
                const strokeColor = isHovered ? "#2563EB" : stroke;
                return (
                  <g key={placement.id ?? `${placement.containerTypeId}-${placement.x}-${placement.y}`}>
                    <rect
                      x={placement.x * CELL_SIZE_PX + 0.5}
                      y={placement.y * CELL_SIZE_PX + 0.5}
                      width={w * CELL_SIZE_PX - 1}
                      height={h * CELL_SIZE_PX - 1}
                      rx={4}
                      fill={fill}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                    <text
                      x={placement.x * CELL_SIZE_PX + (w * CELL_SIZE_PX) / 2}
                      y={placement.y * CELL_SIZE_PX + (h * CELL_SIZE_PX) / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        fontWeight: 500,
                        fill: labelColor,
                      }}
                    >
                      {ct.label}
                    </text>
                  </g>
                );
              })}
              {/* Ghost container */}
              {hoveredPlacementPreview && selectedPlacementType && (
                <g>
                  <rect
                    x={hoveredPlacementPreview.x * CELL_SIZE_PX}
                    y={hoveredPlacementPreview.y * CELL_SIZE_PX}
                    width={selectedPlacementType.widthUnits * CELL_SIZE_PX}
                    height={selectedPlacementType.depthUnits * CELL_SIZE_PX}
                    rx={4}
                    fill="rgba(37, 99, 235, 0.12)"
                    stroke="#2563EB"
                    strokeWidth={1.5}
                  />
                  <text
                    x={
                      hoveredPlacementPreview.x * CELL_SIZE_PX +
                      (selectedPlacementType.widthUnits * CELL_SIZE_PX) / 2
                    }
                    y={
                      hoveredPlacementPreview.y * CELL_SIZE_PX +
                      (selectedPlacementType.depthUnits * CELL_SIZE_PX) / 2
                    }
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      fill: "#2563EB",
                    }}
                  >
                    {selectedPlacementType.label}
                  </text>
                </g>
              )}
              {/* Overflow dimension labels and dashed boundaries */}
              {extraWidthMm > 0 && (() => {
                const narrow = extraWidthPx < 28;
                const labelX = narrow ? gridWidthPx + extraWidthPx * 0.35 : gridWidthPx + extraWidthPx / 2;
                return (
                  <>
                    <line
                      x1={gridWidthPx}
                      y1={0}
                      x2={gridWidthPx}
                      y2={gridDepthPx}
                      stroke="var(--gridline)"
                      strokeWidth={0.5}
                      strokeDasharray="2 2"
                    />
                    <text
                      x={labelX}
                      y={gridDepthPx / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: narrow ? "7px" : "9px",
                        fill: "var(--text-tertiary)",
                      }}
                    >
                      +{extraWidthMm}mm
                    </text>
                  </>
                );
              })()}
              {extraDepthMm > 0 && (() => {
                const narrow = extraDepthPx < 28;
                const labelY = narrow ? gridDepthPx + extraDepthPx * 0.35 : gridDepthPx + extraDepthPx / 2;
                return (
                  <>
                    <line
                      x1={0}
                      y1={gridDepthPx}
                      x2={gridWidthPx}
                      y2={gridDepthPx}
                      stroke="var(--gridline)"
                      strokeWidth={0.5}
                      strokeDasharray="2 2"
                    />
                    <text
                      x={gridWidthPx / 2}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: narrow ? "7px" : "9px",
                        fill: "var(--text-tertiary)",
                      }}
                    >
                      +{extraDepthMm}mm
                    </text>
                  </>
                );
              })()}
            </svg>

            {/* Invisible cell grid for click targets — use 1fr grid when fillContainer so it scales with SVG */}
            <div
              className="absolute left-0 top-0 grid border-0"
              style={
                fillContainer
                  ? {
                      width: "100%",
                      height: "100%",
                      gridTemplateColumns: `repeat(${drawerUnits.widthUnits}, 1fr)`,
                      gridTemplateRows: `repeat(${drawerUnits.depthUnits}, 1fr)`,
                    }
                  : {
                      width: gridWidthPx,
                      height: gridDepthPx,
                      gridTemplateColumns: `repeat(${drawerUnits.widthUnits}, ${CELL_SIZE_PX}px)`,
                      gridTemplateRows: `repeat(${drawerUnits.depthUnits}, ${CELL_SIZE_PX}px)`,
                    }
              }
            >
              {Array.from({ length: drawerUnits.widthUnits * drawerUnits.depthUnits }).map((_, index) => {
                const x = index % drawerUnits.widthUnits;
                const y = Math.floor(index / drawerUnits.widthUnits);
                return (
                  <button
                    key={`cell-${x}-${y}`}
                    type="button"
                    className="cursor-crosshair border-0 bg-transparent p-0 touch-manipulation"
                    style={fillContainer ? { gridColumn: x + 1, gridRow: y + 1 } : undefined}
                    onClick={(e) =>
                      placeAtCell(x, y, isRotateHeld || isControlHeld || isAltHeld || e.ctrlKey || e.altKey)
                    }
                    onContextMenu={(e) => {
                      e.preventDefault();
                      placeAtCell(x, y, true);
                    }}
                    onMouseEnter={() => setHoverCell({ x, y })}
                    onFocus={() => setHoverCell({ x, y })}
                    aria-label={`Place at ${x},${y}`}
                  />
                );
              })}
            </div>

            {/* Invisible placement rects for click-to-rotate/remove (positioned over SVG placements) */}
            {placements.map((placement) => {
              const ct = containerTypeById.get(placement.containerTypeId);
              if (!ct) return null;
              const w = placement.isRotated ? ct.depthUnits : ct.widthUnits;
              const h = placement.isRotated ? ct.widthUnits : ct.depthUnits;
              const pid = placement.id ?? `${placement.containerTypeId}-${placement.x}-${placement.y}`;
              return (
                <button
                  key={pid}
                  type="button"
                  className={`cursor-pointer border-0 bg-transparent p-0 touch-manipulation ${fillContainer ? "" : "absolute"}`}
                  style={
                    fillContainer
                      ? {
                          gridColumn: placement.x + 1,
                          gridRow: placement.y + 1,
                          gridColumnEnd: `span ${w}`,
                          gridRowEnd: `span ${h}`,
                        }
                      : {
                          left: placement.x * CELL_SIZE_PX,
                          top: placement.y * CELL_SIZE_PX,
                          width: w * CELL_SIZE_PX,
                          height: h * CELL_SIZE_PX,
                        }
                  }
                  onClick={(e) => {
                    if (touchMode) {
                      e.preventDefault();
                      e.stopPropagation();
                    } else {
                      handlePlacementClick(placement);
                    }
                  }}
                  onTouchStart={() => handlePlacementTouchStart(placement)}
                  onTouchEnd={() => handlePlacementTouchEnd(placement)}
                  onMouseEnter={() => setHoverPlacementId(pid)}
                  onMouseLeave={() => setHoverPlacementId(null)}
                  aria-label={
                    touchMode && onRotatePlacement
                      ? `Rotate ${ct.label} (long-press to remove)`
                      : `Remove ${ct.label} at ${placement.x},${placement.y}`
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid footer: meta + coverage bar (hidden on mobile when stats are in tab) */}
      {!hideFooter && (
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-2" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span>
            <span style={{ color: "var(--text-tertiary)" }}>Input:</span>{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {drawerInput.widthMm}×{drawerInput.depthMm}mm
            </span>
          </span>
          <span>
            <span style={{ color: "var(--text-tertiary)" }}>Pitch:</span>{" "}
            <span style={{ color: "var(--text-secondary)" }}>{drawerInput.gridPitchMm}mm</span>
          </span>
          <span>
            <span style={{ color: "var(--text-tertiary)" }}>Grid:</span>{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {drawerUnits.widthUnits}×{drawerUnits.depthUnits}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
            {coveragePercent}%
          </span>
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{
              width: "120px",
              height: "4px",
              backgroundColor: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="h-full rounded-[var(--radius-sm)]"
              style={{
                width: `${Math.min(100, coveragePercent)}%`,
                backgroundColor: "var(--accent-teal)",
              }}
            />
          </div>
        </div>
      </div>
      )}

      {placementError ? (
        <p className="shrink-0 text-[12px]" style={{ color: "var(--text-secondary)" }} aria-live="polite">
          {placementError}
        </p>
      ) : null}
    </div>
  );
}
