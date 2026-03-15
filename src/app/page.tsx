"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ContainerPalette } from "@/components/ContainerPalette";
import { DrawerForm } from "@/components/DrawerForm";
import { GridPlanner } from "@/components/GridPlanner";
import { Topbar } from "@/components/Topbar";
import { downloadLayoutFile, parseLayoutFile } from "@/lib/layoutFile";
import { deriveDrawerUnits } from "@/lib/planner";
import { buildPrintSummary } from "@/lib/printSummary";
import type { BaseplateStrategy, ContainerType, DrawerInput, Placement } from "@/types/planfinity";

const DEFAULT_DRAWER_INPUT: DrawerInput = {
  widthMm: 600,
  depthMm: 400,
  gridPitchMm: 42,
};

function buildContainerTypes(): ContainerType[] {
  const types: ContainerType[] = [];
  for (let depthUnits = 1; depthUnits <= 5; depthUnits++) {
    for (let widthUnits = 1; widthUnits <= depthUnits; widthUnits++) {
      const label = `${widthUnits}x${depthUnits}`;
      types.push({
        id: label,
        label,
        widthUnits,
        depthUnits,
      });
    }
  }
  return types;
}

const DEFAULT_CONTAINER_TYPES = buildContainerTypes();

function computeCoveragePercent(
  drawerUnits: { widthUnits: number; depthUnits: number },
  placements: Placement[],
  containerTypeById: Map<string, ContainerType>,
): number {
  if (drawerUnits.widthUnits <= 0 || drawerUnits.depthUnits <= 0) return 0;
  const totalCells = drawerUnits.widthUnits * drawerUnits.depthUnits;
  let used = 0;
  for (const p of placements) {
    const ct = containerTypeById.get(p.containerTypeId);
    if (!ct) continue;
    const w = p.isRotated ? ct.depthUnits : ct.widthUnits;
    const h = p.isRotated ? ct.widthUnits : ct.depthUnits;
    used += w * h;
  }
  return Math.round((used / totalCells) * 100);
}

export default function HomePage() {
  const [drawerInput, setDrawerInput] = useState<DrawerInput>(DEFAULT_DRAWER_INPUT);
  const [selectedContainerTypeId, setSelectedContainerTypeId] = useState<string>(DEFAULT_CONTAINER_TYPES[0].id);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [baseplateStrategy, setBaseplateStrategy] = useState<BaseplateStrategy>("max-first");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawerUnits = useMemo(() => deriveDrawerUnits(drawerInput), [drawerInput]);
  const printSummary = useMemo(
    () => buildPrintSummary(drawerUnits, placements, DEFAULT_CONTAINER_TYPES, 5, baseplateStrategy),
    [drawerUnits, placements, baseplateStrategy],
  );
  const containerTypeById = useMemo(
    () => new Map(DEFAULT_CONTAINER_TYPES.map((c) => [c.id, c])),
    [],
  );
  const coveragePercent = useMemo(
    () => computeCoveragePercent(drawerUnits, placements, containerTypeById),
    [drawerUnits, placements, containerTypeById],
  );

  const baseplatesSameForBothStrategies = useMemo(() => {
    if (drawerUnits.widthUnits <= 0 || drawerUnits.depthUnits <= 0) return true;
    const maxFirst = buildPrintSummary(drawerUnits, placements, DEFAULT_CONTAINER_TYPES, 5, "max-first");
    const balanced = buildPrintSummary(drawerUnits, placements, DEFAULT_CONTAINER_TYPES, 5, "balanced");
    const a = maxFirst.baseplates.sizeCounts;
    const b = balanced.baseplates.sizeCounts;
    if (a.length !== b.length) return false;
    return a.every(
      (s, i) =>
        b[i] &&
        s.widthUnits === b[i].widthUnits &&
        s.depthUnits === b[i].depthUnits &&
        s.count === b[i].count,
    );
  }, [drawerUnits, placements]);

  const handleApplyDrawerInput = (nextInput: DrawerInput) => {
    setDrawerInput(nextInput);
    setPlacements([]);
  };

  const handleNewLayout = useCallback(() => {
    setDrawerInput(DEFAULT_DRAWER_INPUT);
    setPlacements([]);
    setLoadError(null);
    setLoadWarning(null);
  }, []);

  const handleSave = useCallback(() => {
    setLoadError(null);
    setLoadWarning(null);
    downloadLayoutFile(drawerInput, placements);
  }, [drawerInput, placements]);

  const handleLoad = useCallback(() => {
    setLoadError(null);
    setLoadWarning(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        const result = parseLayoutFile(text, DEFAULT_CONTAINER_TYPES);
        if (!result.ok) {
          setLoadError(result.error);
          setLoadWarning(null);
          return;
        }
        setLoadError(null);
        setDrawerInput(result.drawerInput);
        setPlacements(result.placements);
        if (result.skippedCount > 0) {
          setLoadWarning(
            `${result.skippedCount} container(s) were out of bounds and skipped.`,
          );
        } else {
          setLoadWarning(null);
        }
      };
      reader.onerror = () => {
        setLoadError("Invalid layout file");
        setLoadWarning(null);
      };
      reader.readAsText(file, "utf-8");
    },
    [],
  );

  const handleClearLayout = () => {
    if (placements.length === 0) return;
    setPlacements([]);
  };

  const handlePrintSummary = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const containerRows =
      printSummary.containerCounts.length === 0
        ? `<tr><td colspan="3">No containers placed.</td></tr>`
        : printSummary.containerCounts
            .map(
              (containerCount) =>
                `<tr><td>${escapeHtml(containerCount.label)}</td><td>${containerCount.widthUnits}x${containerCount.depthUnits}</td><td>${containerCount.count}</td></tr>`,
            )
            .join("");

    const baseplateRows =
      printSummary.baseplates.sizeCounts.length === 0
        ? `<tr><td colspan="2">No baseplates required.</td></tr>`
        : printSummary.baseplates.sizeCounts
            .map(
              (baseplateSize) =>
                `<tr><td>${baseplateSize.widthUnits}x${baseplateSize.depthUnits}</td><td>${baseplateSize.count}</td></tr>`,
            )
            .join("");

    const containerTotal = printSummary.containerCounts.reduce((total, item) => total + item.count, 0);
    const printDate = new Date().toLocaleString();

    const printHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Planfinity Print List</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 24px; color: var(--text-primary, #1A1916); background: var(--surface, #fff); font-family: var(--font-sans), sans-serif; }
      h1, h2 { margin: 0 0 8px; }
      p { margin: 0 0 8px; }
      .meta { margin-bottom: 16px; color: var(--text-secondary, #6B6860); font-size: 14px; }
      section { margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid var(--border, #D6D2C8); padding: 8px; text-align: left; }
      th { background: var(--surface-2, #EEEBe4); }
      .totals { margin-top: 16px; font-weight: 600; }
      @media print { body { margin: 0.5in; } }
    </style>
  </head>
  <body>
    <h1>Planfinity Print List</h1>
    <div class="meta">
      <p>Generated: ${escapeHtml(printDate)}</p>
      <p>Drawer input: ${drawerInput.widthMm}mm x ${drawerInput.depthMm}mm @ ${drawerInput.gridPitchMm}mm pitch</p>
      <p>Computed grid: ${drawerUnits.widthUnits} x ${drawerUnits.depthUnits} units</p>
      <p>Baseplate strategy: ${baseplateStrategy}</p>
    </div>
    <section>
      <h2>Containers to Print</h2>
      <table>
        <thead><tr><th>Container</th><th>Size (units)</th><th>Qty</th></tr></thead>
        <tbody>${containerRows}</tbody>
      </table>
    </section>
    <section>
      <h2>Baseplates to Print</h2>
      <table>
        <thead><tr><th>Baseplate Size (units)</th><th>Qty</th></tr></thead>
        <tbody>${baseplateRows}</tbody>
      </table>
    </section>
    <p class="totals">Totals: ${containerTotal} containers, ${printSummary.baseplates.totalTiles} baseplates</p>
  </body>
</html>`;
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ height: "100vh" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        aria-hidden
        onChange={handleFileChange}
      />
      <Topbar onNewLayout={handleNewLayout} onLoad={handleLoad} onSave={handleSave} />
      {(loadError || loadWarning) && (
        <div
          role="alert"
          className="px-4 py-2 text-[13px]"
          style={{
            backgroundColor: loadError ? "var(--surface-2)" : "var(--bg)",
            borderBottom: "1px solid var(--border)",
            color: loadError ? "var(--text-primary)" : "var(--text-secondary)",
          }}
        >
          {loadError ?? loadWarning}
        </div>
      )}

      <div
        className="grid flex-1 min-h-0"
        style={{
          gridTemplateColumns: "216px 1fr 196px",
        }}
      >
        {/* Left panel */}
        <aside
          className="flex flex-col overflow-y-auto border-r p-3"
          style={{
            width: "216px",
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <DrawerForm initialValue={drawerInput} onApply={handleApplyDrawerInput} />

          {drawerUnits.widthUnits > 0 && drawerUnits.depthUnits > 0 && (
            <>
              <section className="mt-4">
                <p
                  className="uppercase tracking-wider text-[10px]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Computed grid
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div
                    className="rounded-md border p-2"
                    style={{
                      backgroundColor: "var(--bg)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "9px 10px",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--text-primary)" }}>
                      {drawerUnits.widthUnits}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      width
                    </div>
                  </div>
                  <div
                    className="rounded-md border p-2"
                    style={{
                      backgroundColor: "var(--bg)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "9px 10px",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--text-primary)" }}>
                      {drawerUnits.depthUnits}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      depth
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-4">
                <p
                  className="uppercase tracking-wider text-[10px]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Container counts
                </p>
                <div
                  className="mt-1.5 space-y-0.5 text-[12px] leading-[1.9]"
                  style={{ fontFamily: "var(--font-sans)", color: "var(--text-secondary)" }}
                >
                  {printSummary.containerCounts.length === 0 ? (
                    <p>No containers placed.</p>
                  ) : (
                    printSummary.containerCounts.map((cc) => (
                      <p key={cc.containerTypeId}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--text-primary)" }}>
                          {cc.count}×
                        </span>{" "}
                        {cc.label}
                      </p>
                    ))
                  )}
                </div>
              </section>

              <section className="mt-4">
                <p
                  className="uppercase tracking-wider text-[10px]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Baseplate strategy
                </p>
                <div
                  className="mt-1.5 flex overflow-hidden rounded-[var(--radius-sm)] border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setBaseplateStrategy("max-first")}
                    className="flex-1 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--surface-2)]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      backgroundColor: baseplateStrategy === "max-first" ? "var(--text-primary)" : "transparent",
                      color: baseplateStrategy === "max-first" ? "var(--surface)" : "var(--text-secondary)",
                    }}
                    aria-pressed={baseplateStrategy === "max-first"}
                  >
                    Max-first
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaseplateStrategy("balanced")}
                    className="flex-1 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--surface-2)]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      backgroundColor: baseplateStrategy === "balanced" ? "var(--text-primary)" : "transparent",
                      color: baseplateStrategy === "balanced" ? "var(--surface)" : "var(--text-secondary)",
                    }}
                    aria-pressed={baseplateStrategy === "balanced"}
                  >
                    Balanced
                  </button>
                </div>
              </section>

              <section className="mt-4">
                <p
                  className="uppercase tracking-wider text-[10px]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Baseplates ({baseplateStrategy === "max-first" ? "Max-first" : "Balanced"}) (≤
                  {printSummary.baseplates.maxTileUnits}×{printSummary.baseplates.maxTileUnits})
                </p>
                {baseplatesSameForBothStrategies && (
                  <p
                    className="mt-1 text-[11px]"
                    style={{ fontFamily: "var(--font-sans)", color: "var(--text-tertiary)" }}
                  >
                    Same result for both strategies for this grid size.
                  </p>
                )}
                <div
                  className="mt-1.5 space-y-0.5 text-[12px] leading-[1.9]"
                  style={{ fontFamily: "var(--font-sans)", color: "var(--text-secondary)" }}
                >
                  {printSummary.baseplates.sizeCounts.map((sc) => (
                    <p key={`${sc.widthUnits}x${sc.depthUnits}`}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--text-primary)" }}>
                        {sc.count}×
                      </span>{" "}
                      {sc.widthUnits}×{sc.depthUnits}
                    </p>
                  ))}
                </div>
                <div
                  className="mt-2 rounded-md border p-2"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderColor: "var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "9px 10px",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--text-primary)" }}>
                    {printSummary.baseplates.totalTiles}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                    total tiles
                  </div>
                </div>
              </section>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handlePrintSummary}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border py-2 text-[12px] font-medium"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <ListLinesIcon />
                  Print list
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span
                    className="uppercase tracking-wider text-[10px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-tertiary)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Coverage
                  </span>
                  <span
                    className="text-[13px] font-medium"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {coveragePercent}%
                  </span>
                </div>
                <div
                  className="mt-1 h-1 overflow-hidden rounded-[var(--radius-sm)] border"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    borderColor: "var(--border)",
                    height: "4px",
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
            </>
          )}
        </aside>

        {/* Center — grid area */}
        <main
          className="flex min-h-0 flex-1 flex-col p-4"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <GridPlanner
            drawerInput={drawerInput}
            drawerUnits={drawerUnits}
            containerTypes={DEFAULT_CONTAINER_TYPES}
            selectedContainerTypeId={selectedContainerTypeId}
            placements={placements}
            coveragePercent={coveragePercent}
            onAddPlacement={(placement) => setPlacements((current) => [...current, placement])}
            onRemovePlacement={(placementId) =>
              setPlacements((current) => current.filter((p) => p.id !== placementId))
            }
            onClearLayout={handleClearLayout}
          />
        </main>

        {/* Right panel */}
        <aside
          className="flex flex-col overflow-y-auto border-l p-3"
          style={{
            width: "196px",
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <ContainerPalette
            containerTypes={DEFAULT_CONTAINER_TYPES}
            gridPitchMm={drawerInput.gridPitchMm}
            selectedContainerTypeId={selectedContainerTypeId}
            onSelect={setSelectedContainerTypeId}
          />
        </aside>
      </div>
    </div>
  );
}

function ListLinesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
