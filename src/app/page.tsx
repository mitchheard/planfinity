"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ContainerPalette } from "@/components/ContainerPalette";
import { DrawerForm } from "@/components/DrawerForm";
import { GridPlanner } from "@/components/GridPlanner";
import { Topbar } from "@/components/Topbar";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { downloadLayoutFile, parseLayoutFile } from "@/lib/layoutFile";
import { deriveDrawerUnits, isPlacementFullyWithinBounds } from "@/lib/planner";
import { buildPrintSummary } from "@/lib/printSummary";
import type { BaseplateStrategy, ContainerType, DrawerInput, Placement } from "@/types/planfinity";

type MobileTabId = "containers" | "stats" | "baseplates";

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
  const isMobile = useIsMobile();
  const [drawerInput, setDrawerInput] = useState<DrawerInput>(DEFAULT_DRAWER_INPUT);
  const [selectedContainerTypeId, setSelectedContainerTypeId] = useState<string>(DEFAULT_CONTAINER_TYPES[0].id);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [baseplateStrategy, setBaseplateStrategy] = useState<BaseplateStrategy>("max-first");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTabId>("containers");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRotatePlacement = useCallback((placementId: string) => {
    setPlacements((prev) =>
      prev.map((p) => {
        const id = p.id ?? `${p.containerTypeId}-${p.x}-${p.y}`;
        if (id === placementId) return { ...p, isRotated: !p.isRotated };
        return p;
      }),
    );
  }, []);

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
    const nextUnits = deriveDrawerUnits(nextInput);
    setDrawerInput(nextInput);
    setPlacements((prev) => {
      if (nextUnits.widthUnits <= 0 || nextUnits.depthUnits <= 0) return [];
      return prev.filter((p) => {
        const ct = containerTypeById.get(p.containerTypeId);
        return ct ? isPlacementFullyWithinBounds(nextUnits, p, ct) : false;
      });
    });
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

      {/* Mobile layout: single column + tabbed bottom panel (≤768px) */}
      <div className="flex-1 min-h-0 flex flex-col max-[768px]:flex min-[769px]:hidden">
        <section
          className="shrink-0 border-b px-4 py-3"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <DrawerForm initialValue={drawerInput} onApply={handleApplyDrawerInput} compact />
        </section>
        <main
          className="min-h-0 flex-1 flex flex-col px-4 py-3"
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
              setPlacements((current) =>
                current.filter((p) => (p.id ?? `${p.containerTypeId}-${p.x}-${p.y}`) !== placementId),
              )
            }
            onClearLayout={handleClearLayout}
            touchMode={isMobile}
            onRotatePlacement={handleRotatePlacement}
            fillContainer={isMobile}
            hideFooter={isMobile}
          />
        </main>
        <aside
          className="shrink-0 border-t"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            maxHeight: "280px",
          }}
        >
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {(
              [
                ["containers", "Containers"],
                ["stats", "Stats"],
                ["baseplates", "Baseplates"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMobileTab(id)}
                className="flex-1 py-3 text-[13px] font-medium transition-colors touch-manipulation min-h-[44px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  backgroundColor: mobileTab === id ? "var(--surface-2)" : "transparent",
                  color: mobileTab === id ? "var(--text-primary)" : "var(--text-secondary)",
                }}
                aria-pressed={mobileTab === id}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto p-3" style={{ maxHeight: "220px" }}>
            {mobileTab === "containers" && (
              <ContainerPalette
                containerTypes={DEFAULT_CONTAINER_TYPES}
                gridPitchMm={drawerInput.gridPitchMm}
                selectedContainerTypeId={selectedContainerTypeId}
                onSelect={setSelectedContainerTypeId}
                variant="horizontal"
              />
            )}
            {mobileTab === "stats" &&
              drawerUnits.widthUnits > 0 &&
              drawerUnits.depthUnits > 0 && (
                <div className="flex flex-col gap-3 text-[12px]" style={{ fontFamily: "var(--font-sans)" }}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: "var(--text-tertiary)" }}>Grid:</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {drawerUnits.widthUnits}×{drawerUnits.depthUnits}
                    </span>
                    <span style={{ color: "var(--text-tertiary)" }}>·</span>
                    <span style={{ color: "var(--text-tertiary)" }}>Containers:</span>
                    <span style={{ color: "var(--text-primary)" }}>{placements.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    {printSummary.containerCounts.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)" }}>No containers placed.</p>
                    ) : (
                      printSummary.containerCounts.map((cc) => (
                        <p key={cc.containerTypeId} style={{ color: "var(--text-secondary)" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--text-primary)" }}>
                            {cc.count}×
                          </span>{" "}
                          {cc.label}
                        </p>
                      ))
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>Coverage</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{coveragePercent}%</span>
                    </div>
                    <div
                      className="overflow-hidden rounded-[var(--radius-sm)] border h-1"
                      style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
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
                  <button
                    type="button"
                    onClick={handlePrintSummary}
                    className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border py-2.5 text-[12px] font-medium touch-manipulation min-h-[44px]"
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
              )}
            {mobileTab === "baseplates" &&
              drawerUnits.widthUnits > 0 &&
              drawerUnits.depthUnits > 0 && (
                <div className="flex flex-col gap-3 text-[12px]">
                  <p className="uppercase tracking-wider text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>
                    Strategy
                  </p>
                  <div
                    className="flex overflow-hidden rounded-[var(--radius-sm)] border"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setBaseplateStrategy("max-first")}
                      className="flex-1 py-2.5 text-[11px] font-medium transition-colors touch-manipulation min-h-[44px]"
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
                      className="flex-1 py-2.5 text-[11px] font-medium transition-colors touch-manipulation min-h-[44px]"
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
                  <div className="space-y-0.5" style={{ fontFamily: "var(--font-sans)", color: "var(--text-secondary)" }}>
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
                    className="rounded-[var(--radius-md)] border p-2"
                    style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
                  >
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "16px", color: "var(--text-primary)" }}>
                      {printSummary.baseplates.totalTiles}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                      total tiles
                    </div>
                  </div>
                </div>
              )}
          </div>
        </aside>
      </div>

      {/* Desktop layout: 3-column grid (>768px) */}
      <div
        className="flex-1 min-h-0 hidden min-[769px]:grid"
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
              setPlacements((current) =>
                current.filter((p) => (p.id ?? `${p.containerTypeId}-${p.x}-${p.y}`) !== placementId),
              )
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
