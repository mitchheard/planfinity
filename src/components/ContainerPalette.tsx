"use client";

import type { ContainerType } from "@/types/planfinity";

type ContainerPaletteProps = {
  containerTypes: ContainerType[];
  selectedContainerTypeId: string;
  onSelect: (id: string) => void;
};

export function ContainerPalette({ containerTypes, selectedContainerTypeId, onSelect }: ContainerPaletteProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Container Palette</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {containerTypes.map((containerType) => {
          const isSelected = containerType.id === selectedContainerTypeId;

          return (
            <button
              key={containerType.id}
              type="button"
              onClick={() => onSelect(containerType.id)}
              className={`rounded border px-3 py-2 text-left text-sm ${
                isSelected ? "border-gray-900 ring-2 ring-gray-300" : "border-gray-300"
              }`}
              style={{ backgroundColor: containerType.color }}
              aria-pressed={isSelected}
            >
              <div className="font-medium">{containerType.label}</div>
              <div className="text-xs text-gray-700">
                {containerType.widthUnits}x{containerType.depthUnits} units
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
