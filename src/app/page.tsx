"use client";

import { useMemo, useState } from "react";
import { ContainerPalette } from "@/components/ContainerPalette";
import { DrawerForm } from "@/components/DrawerForm";
import { GridPlanner } from "@/components/GridPlanner";
import { deriveDrawerUnits } from "@/lib/planner";
import { buildPrintSummary } from "@/lib/printSummary";
import type { BaseplateStrategy, ContainerType, DrawerInput, Placement } from "@/types/planfinity";

const DEFAULT_DRAWER_INPUT: DrawerInput = {
  widthMm: 600,
  depthMm: 400,
  gridPitchMm: 42,
};

const CONTAINER_COLORS = [
  "#cfe8ff",
  "#d9f7be",
  "#ffd9b3",
  "#f4d3ff",
  "#ffe7ba",
  "#ffd6e7",
  "#d6f5f5",
  "#e8e8ff",
];

const DEFAULT_CONTAINER_TYPES: ContainerType[] = Array.from({ length: 5 }, (_, depthIndex) => depthIndex + 1).flatMap(
  (depthUnits) =>
    Array.from({ length: depthUnits }, (_, widthIndex) => widthIndex + 1).map((widthUnits, indexWithinDepth) => {
      const colorIndex = (depthUnits + indexWithinDepth) % CONTAINER_COLORS.length;
      const label = `${widthUnits}x${depthUnits}`;

      return {
        id: label,
        label,
        color: CONTAINER_COLORS[colorIndex],
        widthUnits,
        depthUnits,
      };
    }),
);

export default function HomePage() {
  const [drawerInput, setDrawerInput] = useState<DrawerInput>(DEFAULT_DRAWER_INPUT);
  const [selectedContainerTypeId, setSelectedContainerTypeId] = useState<string>(DEFAULT_CONTAINER_TYPES[0].id);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [baseplateStrategy, setBaseplateStrategy] = useState<BaseplateStrategy>("max-first");

  const drawerUnits = useMemo(() => deriveDrawerUnits(drawerInput), [drawerInput]);
  const printSummary = useMemo(
    () => buildPrintSummary(drawerUnits, placements, DEFAULT_CONTAINER_TYPES, 5, baseplateStrategy),
    [drawerUnits, placements, baseplateStrategy],
  );

  const handleApplyDrawerInput = (nextInput: DrawerInput) => {
    setDrawerInput(nextInput);
    setPlacements([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/40 p-4 sm:p-6">
      <div className="mx-auto mb-4 flex max-w-7xl items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Planfinity</h1>
          <p className="mt-1 text-sm text-slate-600">Design Gridfinity layouts faster, with live fit feedback.</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <DrawerForm initialValue={drawerInput} onApply={handleApplyDrawerInput} />

          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-200/60 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900">Computed Grid</h2>
            <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {drawerUnits.widthUnits} x {drawerUnits.depthUnits} units
            </p>
            <p className="mt-2 text-sm text-slate-700">Placed Containers: {placements.length}</p>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-slate-900">Container Counts</h3>
              <div className="mt-1 space-y-1 text-sm text-slate-700">
                {printSummary.containerCounts.length === 0 ? (
                  <p>No containers placed.</p>
                ) : (
                  printSummary.containerCounts.map((containerCount) => (
                    <p key={containerCount.containerTypeId}>
                      {containerCount.label} ({containerCount.widthUnits}x{containerCount.depthUnits}):{" "}
                      {containerCount.count}
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-sm font-semibold text-slate-900">Baseplate Strategy</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBaseplateStrategy("max-first")}
                  className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                    baseplateStrategy === "max-first"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={baseplateStrategy === "max-first"}
                >
                  Max-first
                </button>
                <button
                  type="button"
                  onClick={() => setBaseplateStrategy("balanced")}
                  className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                    baseplateStrategy === "balanced"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={baseplateStrategy === "balanced"}
                >
                  Balanced
                </button>
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Baseplates (&le;{printSummary.baseplates.maxTileUnits}x
                {printSummary.baseplates.maxTileUnits})
              </h3>
              <p className="mt-1 text-sm text-slate-700">Total tiles: {printSummary.baseplates.totalTiles}</p>
              <div className="mt-1 space-y-1 text-sm text-slate-700">
                {printSummary.baseplates.sizeCounts.map((sizeCount) => (
                  <p key={`${sizeCount.widthUnits}x${sizeCount.depthUnits}`}>
                    {sizeCount.widthUnits}x{sizeCount.depthUnits}: {sizeCount.count}
                  </p>
                ))}
              </div>
            </div>
          </section>

        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <GridPlanner
            drawerInput={drawerInput}
            drawerUnits={drawerUnits}
            containerTypes={DEFAULT_CONTAINER_TYPES}
            selectedContainerTypeId={selectedContainerTypeId}
            placements={placements}
            onAddPlacement={(placement) => setPlacements((current) => [...current, placement])}
            onRemovePlacement={(placementId) =>
              setPlacements((current) => current.filter((placement) => placement.id !== placementId))
            }
          />
          <aside
            className={`space-y-2 lg:sticky lg:top-6 ${
              isPaletteCollapsed ? "w-14 self-start" : "w-full lg:w-[300px]"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsPaletteCollapsed((current) => !current)}
              className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${
                isPaletteCollapsed ? "h-12 px-0 text-xs" : ""
              }`}
              title={isPaletteCollapsed ? "Show container palette" : "Hide container palette"}
            >
              {isPaletteCollapsed ? "Show" : "Hide Palette"}
            </button>
            {!isPaletteCollapsed ? (
              <ContainerPalette
                containerTypes={DEFAULT_CONTAINER_TYPES}
                gridPitchMm={drawerInput.gridPitchMm}
                selectedContainerTypeId={selectedContainerTypeId}
                onSelect={setSelectedContainerTypeId}
              />
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
