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
  return { long, short, key: `${long}x${short}` };
}

function isTealContainer(ct: ContainerType): boolean {
  return ct.depthUnits >= 3;
}

export function ContainerPalette({
  containerTypes,
  gridPitchMm,
  selectedContainerTypeId,
  onSelect,
}: ContainerPaletteProps) {
  const [paletteFilter, setPaletteFilter] = useState<PaletteFilter>("all");
  const [objectWidthMmInput, setObjectWidthMmInput] = useState("120");
  const [objectDepthMmInput, setObjectDepthMmInput] = useState("80");
  const [clearanceMmInput, setClearanceMmInput] = useState("2");

  const sortedContainerTypes = [...containerTypes].sort((a, b) => {
    if (a.depthUnits !== b.depthUnits) return a.depthUnits - b.depthUnits;
    return a.widthUnits - b.widthUnits;
  });

  const selectedContainerType =
    sortedContainerTypes.find((c) => c.id === selectedContainerTypeId) ?? sortedContainerTypes[0] ?? null;

  const filteredContainerTypes = sortedContainerTypes.filter((ct) => {
    if (paletteFilter === "squares") return ct.widthUnits === ct.depthUnits;
    if (paletteFilter === "rectangles") return ct.widthUnits !== ct.depthUnits;
    return true;
  });

  const groupedByDepth = new Map<number, ContainerType[]>();
  filteredContainerTypes.forEach((ct) => {
    const list = groupedByDepth.get(ct.depthUnits) ?? [];
    list.push(ct);
    groupedByDepth.set(ct.depthUnits, list);
  });

  const fitSuggestionResult = useMemo(() => {
    const objectWidthMm = Number(objectWidthMmInput);
    const objectDepthMm = Number(objectDepthMmInput);
    const clearanceMm = Number(clearanceMmInput);
    if (
      !Number.isFinite(objectWidthMm) ||
      !Number.isFinite(objectDepthMm) ||
      !Number.isFinite(clearanceMm)
    ) {
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
    if (!fitSuggestionResult.summary) return null;
    const required = normalizeUnits(
      fitSuggestionResult.summary.requiredWidthUnits,
      fitSuggestionResult.summary.requiredDepthUnits,
    );
    const uniqueSuggestions = fitSuggestionResult.summary.suggestions.reduce<
      Array<{ key: string; label: string; showRotateObjectHint: boolean }>
    >((acc, suggestion) => {
      const norm = normalizeUnits(suggestion.widthUnits, suggestion.depthUnits);
      if (acc.some((item) => item.key === norm.key)) return acc;
      acc.push({
        key: norm.key,
        label: `${norm.long}x${norm.short}`,
        showRotateObjectHint: suggestion.usesRotatedFit && norm.key !== required.key,
      });
      return acc;
    }, []);
    return {
      requiredLabel: `${required.long}x${required.short}`,
      bestFit: uniqueSuggestions[0] ?? null,
      hasAnyFit: uniqueSuggestions.length > 0,
    };
  }, [fitSuggestionResult.summary]);

  return (
    <div className="flex flex-col gap-4">
      {/* Selected container badge — always visible at top */}
      {selectedContainerType && (
        <div
          className="rounded-[var(--radius-md)] border p-2.5"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "var(--border)",
            padding: "9px 11px",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border text-[11px] font-medium"
                style={{
                  backgroundColor: isTealContainer(selectedContainerType)
                  ? "var(--accent-teal-light)"
                  : "var(--accent-blue-light)",
                borderColor: isTealContainer(selectedContainerType)
                  ? "var(--accent-teal-mid)"
                  : "var(--accent-blue-mid)",
                color: isTealContainer(selectedContainerType) ? "var(--container-teal-label)" : "var(--tip-text)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {selectedContainerType.label}
            </div>
            <div className="min-w-0">
              <div
                className="truncate text-[13px] font-medium"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--text-primary)",
                }}
              >
                {selectedContainerType.widthUnits}×{selectedContainerType.depthUnits}
              </div>
              <div
                className="text-[11px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-tertiary)",
                }}
              >
                depth {selectedContainerType.depthUnits} ·{" "}
                {Math.max(selectedContainerType.widthUnits, selectedContainerType.depthUnits) * gridPitchMm}mm
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs: All / Sq / Rect */}
      <div
        className="flex overflow-hidden rounded-[var(--radius-sm)] border"
        style={{ borderColor: "var(--border)" }}
      >
        {(
          [
            ["all", "All"],
            ["squares", "Sq"],
            ["rectangles", "Rect"],
          ] as const
        ).map(([key, label], i) => (
          <button
            key={key}
            type="button"
            onClick={() => setPaletteFilter(key)}
            className="flex-1 py-1.5 text-[11px] transition-colors hover:bg-[var(--surface-2)]"
            style={{
              fontFamily: "var(--font-mono)",
              backgroundColor: paletteFilter === key ? "var(--surface-2)" : "transparent",
              borderRight: i < 2 ? "1px solid var(--border)" : undefined,
              color: paletteFilter === key ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: paletteFilter === key ? 500 : 400,
            }}
            aria-pressed={paletteFilter === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Depth groups and container chips */}
      <div className="flex flex-col gap-3">
        {Array.from(groupedByDepth.entries()).map(([depthUnits, depthGroup]) => (
          <div key={`depth-${depthUnits}`}>
            <p
              className="mb-1.5 uppercase tracking-wider text-[10px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
                letterSpacing: "0.1em",
              }}
            >
              Depth {depthUnits}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {depthGroup.map((ct) => {
                const isSelected = ct.id === selectedContainerTypeId;
                const teal = isTealContainer(ct);
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => onSelect(ct.id)}
                    className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] transition-colors hover:bg-[var(--surface-2)] hover:border-[var(--border-2)]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      backgroundColor: isSelected
                        ? "var(--accent-blue-light)"
                        : "var(--bg)",
                      border: `1px solid ${isSelected ? "var(--accent-blue-mid)" : "var(--border)"}`,
                      color: isSelected ? "var(--tip-text)" : "var(--text-secondary)",
                      fontWeight: isSelected ? 500 : 400,
                    }}
                    aria-pressed={isSelected}
                  >
                    {ct.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Fit Finder */}
      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <p
          className="mb-2 uppercase tracking-wider text-[10px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-tertiary)",
            letterSpacing: "0.1em",
          }}
        >
          Fit finder
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="sr-only">Object width (mm)</span>
            <InputWithSuffix
              value={objectWidthMmInput}
              onChange={setObjectWidthMmInput}
              suffix="W"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="sr-only">Object depth (mm)</span>
            <InputWithSuffix
              value={objectDepthMmInput}
              onChange={setObjectDepthMmInput}
              suffix="D"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-0.5">
            <span className="sr-only">Clearance (mm)</span>
            <InputWithSuffix
              value={clearanceMmInput}
              onChange={setClearanceMmInput}
              suffix="mm"
            />
          </label>
        </div>
        <div className="mt-2">
          <button
            type="button"
            className="rounded-[var(--radius-sm)] border px-2 py-1 text-[11px] font-medium"
            style={{
              fontFamily: "var(--font-mono)",
              backgroundColor: "var(--surface-2)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            Find
          </button>
        </div>
        {fitSuggestionResult.error ? (
          <p className="mt-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {fitSuggestionResult.error}
          </p>
        ) : fitDisplay ? (
          <div
            className="mt-2 rounded-[var(--radius-sm)] border p-2 text-[11px]"
            style={{
              fontFamily: "var(--font-mono)",
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
            }}
          >
            {!fitDisplay.hasAnyFit ? (
              <span style={{ color: "var(--text-secondary)" }}>
                No predefined container fits {fitDisplay.requiredLabel} units.
              </span>
            ) : (
              <span>
                Best fit:{" "}
                <span style={{ color: "var(--accent-teal)", fontWeight: 500 }}>
                  {fitDisplay.bestFit?.label}
                </span>
                {fitDisplay.bestFit?.showRotateObjectHint ? " (rotate object)" : ""}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InputWithSuffix({
  value,
  onChange,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
}) {
  return (
    <div
      className="flex overflow-hidden rounded-[var(--radius-sm)] border"
      style={{ borderColor: "var(--border)" }}
    >
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
        style={{
          fontFamily: "var(--font-mono)",
          backgroundColor: "var(--bg)",
          color: "var(--text-primary)",
        }}
      />
      <span
        className="flex shrink-0 items-center px-1.5 py-1 text-[11px]"
        style={{
          fontFamily: "var(--font-mono)",
          backgroundColor: "var(--surface-2)",
          color: "var(--text-tertiary)",
        }}
      >
        {suffix}
      </span>
    </div>
  );
}
