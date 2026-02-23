import type { BaseplateTile } from "../types/planfinity";

const MAX_BASEPLATE_UNITS = 5;

export function decomposeBaseplates(
  widthUnits: number,
  depthUnits: number,
): BaseplateTile[] {
  if (widthUnits <= 0 || depthUnits <= 0) {
    return [];
  }

  const rows = splitDimension(depthUnits, MAX_BASEPLATE_UNITS);
  const cols = splitDimension(widthUnits, MAX_BASEPLATE_UNITS);
  const pieces: BaseplateTile[] = [];

  let yOffset = 0;
  for (const rowHeight of rows) {
    let xOffset = 0;
    for (const colWidth of cols) {
      pieces.push({
        x: xOffset,
        y: yOffset,
        widthUnits: colWidth,
        depthUnits: rowHeight,
      });
      xOffset += colWidth;
    }
    yOffset += rowHeight;
  }

  return pieces;
}

function splitDimension(total: number, maxPiece: number): number[] {
  const result: number[] = [];
  let remaining = total;

  while (remaining > 0) {
    const size = Math.min(maxPiece, remaining);
    result.push(size);
    remaining -= size;
  }

  return result;
}
