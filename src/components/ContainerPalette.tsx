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
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-200/60 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Container Palette</h2>
      <p className="mt-1 text-sm text-slate-600">Group by shape, then compare by depth.</p>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
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
            className={`rounded-lg border px-2 py-1 text-xs font-medium ${
              paletteFilter === "all"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            aria-pressed={paletteFilter === "all"}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPaletteFilter("squares")}
            className={`rounded-lg border px-2 py-1 text-xs font-medium ${
              paletteFilter === "squares"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            aria-pressed={paletteFilter === "squares"}
          >
            Squares
          </button>
          <button
            type="button"
            onClick={() => setPaletteFilter("rectangles")}
            className={`rounded-lg border px-2 py-1 text-xs font-medium ${
              paletteFilter === "rectangles"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            aria-pressed={paletteFilter === "rectangles"}
          >
            Rectangles
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsCompact((current) => !current)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          aria-pressed={isCompact}
        >
          {isCompact ? "Compact" : "Expanded"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {Array.from(groupedByDepth.entries()).map(([depthUnits, depthGroup]) => (
          <div key={`depth-${depthUnits}`}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Depth {depthUnits} units</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {depthGroup.map((containerType) => {
                const isSelected = containerType.id === selectedContainerTypeId;

                return (
                  <button
                    key={containerType.id}
                    type="button"
                    onClick={() => onSelect(containerType.id)}
                    className={`rounded-lg border text-left shadow-sm transition hover:-translate-y-px ${
                      isCompact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
                    } ${
                      isSelected ? "border-slate-900 ring-2 ring-sky-200" : "border-slate-300"
                    }`}
                    style={{ backgroundColor: containerType.color }}
                    aria-pressed={isSelected}
                  >
                    <div className="font-medium">{containerType.label}</div>
                    {isCompact ? null : (
                      <div className="text-xs text-slate-700">
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
