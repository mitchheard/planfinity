import type { DrawerInput, HistoryEntry, Placement } from "@/types/planfinity";

const MAX_HISTORY = 20;

function deepCloneState(drawerInput: DrawerInput, placements: Placement[]): HistoryEntry {
  return {
    drawerInput: structuredClone(drawerInput),
    placements: structuredClone(placements),
    timestamp: Date.now(),
    action: "",
  };
}

export function createHistoryEntry(
  drawerInput: DrawerInput,
  placements: Placement[],
  action: string,
): HistoryEntry {
  const entry = deepCloneState(drawerInput, placements);
  entry.action = action;
  return entry;
}

export function pushHistory(
  history: HistoryEntry[],
  drawerInput: DrawerInput,
  placements: Placement[],
  action: string,
): HistoryEntry[] {
  const entry = createHistoryEntry(drawerInput, placements, action);
  const next = [...history, entry];
  if (next.length > MAX_HISTORY) {
    return next.slice(-MAX_HISTORY);
  }
  return next;
}

export function popHistory(history: HistoryEntry[]): { entry: HistoryEntry; nextHistory: HistoryEntry[] } | null {
  if (history.length === 0) return null;
  const entry = history[history.length - 1];
  return { entry, nextHistory: history.slice(0, -1) };
}
