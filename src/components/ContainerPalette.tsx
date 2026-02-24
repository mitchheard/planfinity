"use client";

import { useMemo, useState } from "react";
import { suggestContainerFits } from "@/lib/containerSuggestions";
import type { ContainerType } from "@/types/planfinity";

type ContainerPaletteProps = {
  containerTypes: ContainerType[];
  gridPitchMm: number;
  selectedContainerTypeId: string;
  onSelect: (id: string) => void;
};

type PaletteFilter = "all" | "squares" | "rectangles";

function normalizeUnits(widthUnits: number, depthUnits: number): { long: number; short: number; key: string } {
  const long = Math.max(widthUnits, depthUnits);
  const short = Math.min(widthUnits, depthUnits);
  return {
    long,
    short,
    key: `${long}x${short}`,
  };
}

export function ContainerPalette({ containerTypes, gridPitchMm, selectedContainerTypeId, onSelect }: ContainerPaletteProps) {
  const [paletteFilter, setPaletteFilter] = useState<PaletteFilter>("all");
  const [objectWidthMmInput, setObjectWidthMmInput] = useState("120");
  const [objectDepthMmInput, setObjectDepthMmInput] = useState("80");
  const [clearanceMmInput, setClearanceMmInput] = useState("2");

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

  const fitSuggestionResult = useMemo(() => {
    const objectWidthMm = Number(objectWidthMmInput);
    const objectDepthMm = Number(objectDepthMmInput);
    const clearanceMm = Number(clearanceMmInput);

    if (!Number.isFinite(objectWidthMm) || !Number.isFinite(objectDepthMm) || !Number.isFinite(clearanceMm)) {
      return { error: "Enter valid numbers for object size and clearance.", summary: null };
    }

    if (objectWidthMm <= 0 || objectDepthMm <= 0) {
      return { error: "Object width/depth must be greater than 0.", summary: null };
    }

    if (clearanceMm < 0) {
      return { error: "Clearance must be 0 or greater.", summary: null };
    }

    return {
      error: null,
      summary: suggestContainerFits(
        containerTypes,
        gridPitchMm,
        objectWidthMm,
        objectDepthMm,
        clearanceMm,
      ),
    };
  }, [objectWidthMmInput, objectDepthMmInput, clearanceMmInput, containerTypes, gridPitchMm]);
  const fitDisplay = useMemo(() => {
    if (!fitSuggestionResult.summary) {
      return null;
    }

    const required = normalizeUnits(
      fitSuggestionResult.summary.requiredWidthUnits,
      fitSuggestionResult.summary.requiredDepthUnits,
    );

    const uniqueSuggestions = fitSuggestionResult.summary.suggestions.reduce<
      Array<{
        key: string;
        label: string;
        showRotateObjectHint: boolean;
      }>
    >((accumulator, suggestion) => {
      const normalized = normalizeUnits(suggestion.widthUnits, suggestion.depthUnits);
      if (accumulator.some((item) => item.key === normalized.key)) {
        return accumulator;
      }

      accumulator.push({
        key: normalized.key,
        label: `${normalized.long}x${normalized.short}`,
        showRotateObjectHint: suggestion.usesRotatedFit && normalized.key !== required.key,
      });
      return accumulator;
    }, []);

    return {
      requiredLabel: `${required.long}x${required.short}`,
      bestFit: uniqueSuggestions[0] ?? null,
      hasAnyFit: uniqueSuggestions.length > 0,
    };
  }, [fitSuggestionResult.summary]);

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
                      "px-2 py-1 text-xs"
                    } ${
                      isSelected ? "border-slate-900 ring-2 ring-sky-200" : "border-slate-300"
                    }`}
                    style={{ backgroundColor: containerType.color }}
                    aria-pressed={isSelected}
                  >
                    <div className="font-medium">{containerType.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Container Fit Finder (2D)</h3>
        <p className="mt-1 text-xs text-slate-600">
          Suggests bins that fit object footprint + side clearance. Height is not considered.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="flex max-w-40 flex-col gap-1 text-xs text-slate-700">
            Object width (mm)
            <input
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              type="number"
              min={0.1}
              step="any"
              value={objectWidthMmInput}
              onChange={(event) => setObjectWidthMmInput(event.target.value)}
            />
          </label>
          <label className="flex max-w-40 flex-col gap-1 text-xs text-slate-700">
            Object depth (mm)
            <input
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              type="number"
              min={0.1}
              step="any"
              value={objectDepthMmInput}
              onChange={(event) => setObjectDepthMmInput(event.target.value)}
            />
          </label>
          <label className="flex max-w-40 flex-col gap-1 text-xs text-slate-700 sm:col-span-2">
            Clearance per side (mm)
            <input
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              type="number"
              min={0}
              step="any"
              value={clearanceMmInput}
              onChange={(event) => setClearanceMmInput(event.target.value)}
            />
          </label>
        </div>
        {fitSuggestionResult.error ? (
          <p className="mt-2 text-sm text-rose-600">{fitSuggestionResult.error}</p>
        ) : fitDisplay ? (
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            {!fitDisplay.hasAnyFit ? (
              <p>No predefined container size fits {fitDisplay.requiredLabel} units.</p>
            ) : (
              <p>
                <span className="font-medium">Best fit footprint:</span>{" "}
                {fitDisplay.bestFit?.label} units
                {fitDisplay.bestFit?.showRotateObjectHint ? " (rotate object)" : ""}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
