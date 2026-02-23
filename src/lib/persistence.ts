import type { PlannerLayout } from "../types/planfinity";

export const ACTIVE_LAYOUT_STORAGE_KEY = "planfinity.activeLayout";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function saveActiveLayout(
  layout: PlannerLayout,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(ACTIVE_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore storage write failures to keep the app usable.
  }
}

export function loadActiveLayout(
  storage: StorageLike | null = getBrowserStorage(),
): PlannerLayout | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(ACTIVE_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isPlannerLayout(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearActiveLayout(
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(ACTIVE_LAYOUT_STORAGE_KEY);
  } catch {
    // Ignore storage removal failures.
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isPlannerLayout(value: unknown): value is PlannerLayout {
  if (!value || typeof value !== "object") return false;
  const candidate = value as PlannerLayout;

  return (
    isPositiveNumber(candidate.drawer?.widthMm) &&
    isPositiveNumber(candidate.drawer?.depthMm) &&
    isPositiveNumber(candidate.drawer?.gridPitchMm) &&
    Array.isArray(candidate.containerTypes) &&
    Array.isArray(candidate.placements)
  );
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
