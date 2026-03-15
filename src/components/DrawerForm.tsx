"use client";

import { useState } from "react";
import type { DrawerInput } from "@/types/planfinity";

type DrawerFormProps = {
  initialValue: DrawerInput;
  onApply: (value: DrawerInput) => void;
};

function InputWithSuffix({
  value,
  onChange,
  suffix,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-[var(--radius-sm)] border" style={{ borderColor: "var(--border)" }}>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="w-0 min-w-0 flex-1 bg-transparent px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-primary)",
          backgroundColor: "var(--bg)",
          border: "none",
          borderRadius: "var(--radius-sm)",
        }}
      />
      <span
        className="flex shrink-0 items-center px-2 py-1.5 text-[12px]"
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

export function DrawerForm({ initialValue, onApply }: DrawerFormProps) {
  const [widthMm, setWidthMm] = useState(String(initialValue.widthMm));
  const [depthMm, setDepthMm] = useState(String(initialValue.depthMm));
  const [gridPitchMm, setGridPitchMm] = useState(String(initialValue.gridPitchMm));
  const [error, setError] = useState<string | null>(null);

  const applyForm = () => {
    const parsed = {
      widthMm: Number(widthMm),
      depthMm: Number(depthMm),
      gridPitchMm: Number(gridPitchMm),
    };

    if (!Number.isFinite(parsed.widthMm) || !Number.isFinite(parsed.depthMm) || !Number.isFinite(parsed.gridPitchMm)) {
      setError("All fields must be valid numbers.");
      return;
    }

    if (parsed.widthMm <= 0 || parsed.depthMm <= 0 || parsed.gridPitchMm <= 0) {
      setError("All values must be greater than 0.");
      return;
    }

    setError(null);
    onApply(parsed);
  };

  return (
    <section>
      <p
        className="uppercase tracking-wider text-[10px]"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--text-tertiary)",
          letterSpacing: "0.1em",
        }}
      >
        Drawer input
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="sr-only">Width (mm)</span>
          <InputWithSuffix value={widthMm} onChange={setWidthMm} suffix="W" ariaLabel="Width mm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="sr-only">Depth (mm)</span>
          <InputWithSuffix value={depthMm} onChange={setDepthMm} suffix="D" ariaLabel="Depth mm" />
        </label>
      </div>
      <div className="mt-2">
        <label className="flex flex-col gap-1">
          <span className="sr-only">Grid pitch (mm)</span>
          <InputWithSuffix value={gridPitchMm} onChange={setGridPitchMm} suffix="mm" ariaLabel="Grid pitch mm" />
        </label>
      </div>
      <button
        type="button"
        onClick={applyForm}
        className="mt-3 w-full rounded-[var(--radius-sm)] py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--text-primary)" }}
      >
        Apply
      </button>
      {error ? (
        <p className="mt-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
