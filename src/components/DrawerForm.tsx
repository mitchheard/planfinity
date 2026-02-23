"use client";

import { useState } from "react";
import type { DrawerInput } from "@/types/planfinity";

type DrawerFormProps = {
  initialValue: DrawerInput;
  onApply: (value: DrawerInput) => void;
};

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
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-200/60 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Drawer Input</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block min-h-8 font-medium leading-tight">Width (mm)</span>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            type="number"
            min={1}
            value={widthMm}
            onChange={(event) => setWidthMm(event.target.value)}
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block min-h-8 font-medium leading-tight">Depth (mm)</span>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            type="number"
            min={1}
            value={depthMm}
            onChange={(event) => setDepthMm(event.target.value)}
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block min-h-8 font-medium leading-tight">Grid Pitch (mm)</span>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            type="number"
            min={1}
            value={gridPitchMm}
            onChange={(event) => setGridPitchMm(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
          onClick={applyForm}
        >
          Apply
        </button>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
    </section>
  );
}
