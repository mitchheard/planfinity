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
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Drawer Input</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-gray-700">
          Width (mm)
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            type="number"
            min={1}
            value={widthMm}
            onChange={(event) => setWidthMm(event.target.value)}
          />
        </label>

        <label className="text-sm text-gray-700">
          Depth (mm)
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            type="number"
            min={1}
            value={depthMm}
            onChange={(event) => setDepthMm(event.target.value)}
          />
        </label>

        <label className="text-sm text-gray-700">
          Grid Pitch (mm)
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
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
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          onClick={applyForm}
        >
          Apply
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
