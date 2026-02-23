"use client";

import { useMemo, useState } from "react";
import { ContainerPalette } from "@/components/ContainerPalette";
import { DrawerForm } from "@/components/DrawerForm";
import { GridPlanner } from "@/components/GridPlanner";
import { deriveDrawerUnits } from "@/lib/planner";
import { buildPrintSummary } from "@/lib/printSummary";
import type { ContainerType, DrawerInput, Placement } from "@/types/planfinity";

const DEFAULT_DRAWER_INPUT: DrawerInput = {
  widthMm: 600,
  depthMm: 400,
  gridPitchMm: 42,
};

const DEFAULT_CONTAINER_TYPES: ContainerType[] = [
  { id: "1x1", label: "1x1", color: "#cfe8ff", widthUnits: 1, depthUnits: 1 },
  { id: "2x1", label: "2x1", color: "#d9f7be", widthUnits: 2, depthUnits: 1 },
  { id: "2x2", label: "2x2", color: "#ffd9b3", widthUnits: 2, depthUnits: 2 },
  { id: "3x2", label: "3x2", color: "#f4d3ff", widthUnits: 3, depthUnits: 2 },
];

export default function HomePage() {
  const [drawerInput, setDrawerInput] = useState<DrawerInput>(DEFAULT_DRAWER_INPUT);
  const [selectedContainerTypeId, setSelectedContainerTypeId] = useState<string>(DEFAULT_CONTAINER_TYPES[0].id);
  const [placements, setPlacements] = useState<Placement[]>([]);

  const drawerUnits = useMemo(() => deriveDrawerUnits(drawerInput), [drawerInput]);
  const printSummary = useMemo(
    () => buildPrintSummary(drawerUnits, placements, DEFAULT_CONTAINER_TYPES),
    [drawerUnits, placements],
  );

  const handleApplyDrawerInput = (nextInput: DrawerInput) => {
    setDrawerInput(nextInput);
    setPlacements([]);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Planfinity MVP</h1>
          <DrawerForm initialValue={drawerInput} onApply={handleApplyDrawerInput} />
          <ContainerPalette
            containerTypes={DEFAULT_CONTAINER_TYPES}
            selectedContainerTypeId={selectedContainerTypeId}
            onSelect={setSelectedContainerTypeId}
          />

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Computed Grid</h2>
            <p className="mt-1 text-sm text-gray-700">
              {drawerUnits.widthUnits} x {drawerUnits.depthUnits} units
            </p>
            <p className="mt-2 text-sm text-gray-700">Placed Containers: {placements.length}</p>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-gray-900">Container Counts</h3>
              <div className="mt-1 space-y-1 text-sm text-gray-700">
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
              <h3 className="text-sm font-semibold text-gray-900">
                Baseplates (&le;{printSummary.baseplates.maxTileUnits}x
                {printSummary.baseplates.maxTileUnits})
              </h3>
              <p className="mt-1 text-sm text-gray-700">Total tiles: {printSummary.baseplates.totalTiles}</p>
              <div className="mt-1 space-y-1 text-sm text-gray-700">
                {printSummary.baseplates.sizeCounts.map((sizeCount) => (
                  <p key={`${sizeCount.widthUnits}x${sizeCount.depthUnits}`}>
                    {sizeCount.widthUnits}x{sizeCount.depthUnits}: {sizeCount.count}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>

        <GridPlanner
          drawerUnits={drawerUnits}
          containerTypes={DEFAULT_CONTAINER_TYPES}
          selectedContainerTypeId={selectedContainerTypeId}
          placements={placements}
          onAddPlacement={(placement) => setPlacements((current) => [...current, placement])}
          onRemovePlacement={(placementId) =>
            setPlacements((current) => current.filter((placement) => placement.id !== placementId))
          }
        />
      </div>
    </main>
  );
}
