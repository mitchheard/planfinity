"use client";

import { useState } from "react";
import type { ContainerType } from "@/types/planfinity";

type ContainerPaletteProps = {
  containerTypes: ContainerType[];
  selectedContainerTypeId: string;
  onSelect: (id: string) => void;
};

type PaletteFilter = "all" | "squares" | "rectangles";

export function ContainerPalette({ containerTypes, selectedContainerTypeId, onSelect }: ContainerPaletteProps) {
  const [paletteFilter, setPaletteFilter] = useState<PaletteFilter>("all");
  const [isCompact, setIsCompact] = useState(true);

  const sortedContainerTypes = [...containerTypes].sort((a, b) => {
    if (a.depthUnits !== b.depthUnits) {
      return a.depthUnits - b.depthUnits;
    }
    return a.widthUnits - b.widthUnits;
  });

  const selectedContainerType =
    sortedContainerTypes.find((containerType) => containerType.id === selectedContainerTypeId) ?? null;

  const filteredContainerTypes = sortedContainerTypes.filter((containerType) => {
    if (paletteFilter === "squares") {
      return containerType.widthUnits === containerType.depthUnits;
    }
    if (paletteFilter === "rectangles") {
      return containerType.widthUnits !== containerType.depthUnits;
    }
    return true;
  });

  const groupedByDepth = new Map<number, ContainerType[]>();
  filteredContainerTypes.forEach((containerType) => {
    const currentDepthGroup = groupedByDepth.get(containerType.depthUnits) ?? [];
    currentDepthGroup.push(containerType);
    groupedByDepth.set(containerType.depthUnits, currentDepthGroup);
  });

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Container Palette</h2>
      <p className="mt-1 text-sm text-gray-600">Group by shape, then compare by depth.</p>

      <div className="mt-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
        <span className="font-medium">Selected:</span>{" "}
        {selectedContainerType
          ? `${selectedContainerType.widthUnits}x${selectedContainerType.depthUnits}`
          : "No container selected"}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPaletteFilter("all")}
            className={`rounded border px-2 py-1 text-xs font-medium ${
              paletteFilter === "all" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-700"
            }`}
            aria-pressed={paletteFilter === "all"}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPaletteFilter("squares")}
            className={`rounded border px-2 py-1 text-xs font-medium ${
              paletteFilter === "squares"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 text-gray-700"
            }`}
            aria-pressed={paletteFilter === "squares"}
          >
            Squares
          </button>
          <button
            type="button"
            onClick={() => setPaletteFilter("rectangles")}
            className={`rounded border px-2 py-1 text-xs font-medium ${
              paletteFilter === "rectangles"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 text-gray-700"
            }`}
            aria-pressed={paletteFilter === "rectangles"}
          >
            Rectangles
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsCompact((current) => !current)}
          className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"
          aria-pressed={isCompact}
        >
          {isCompact ? "Compact" : "Expanded"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {Array.from(groupedByDepth.entries()).map(([depthUnits, depthGroup]) => (
          <div key={`depth-${depthUnits}`}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">Depth {depthUnits} units</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {depthGroup.map((containerType) => {
                const isSelected = containerType.id === selectedContainerTypeId;

                return (
                  <button
                    key={containerType.id}
                    type="button"
                    onClick={() => onSelect(containerType.id)}
                    className={`rounded border text-left ${
                      isCompact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
                    } ${
                      isSelected ? "border-gray-900 ring-2 ring-gray-300" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: containerType.color }}
                    aria-pressed={isSelected}
                  >
                    <div className="font-medium">{containerType.label}</div>
                    {isCompact ? null : (
                      <div className="text-xs text-gray-700">
                        {containerType.widthUnits}x{containerType.depthUnits} units
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
