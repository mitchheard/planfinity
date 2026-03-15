import { describe, expect, it } from "vitest";
import type { ContainerType, DrawerInput, Placement } from "@/types/planfinity";
import { downloadLayoutFile, parseLayoutFile } from "./layoutFile";

const CONTAINER_TYPES: ContainerType[] = [
  { id: "1x1", label: "1x1", widthUnits: 1, depthUnits: 1 },
  { id: "3x5", label: "3x5", widthUnits: 3, depthUnits: 5 },
  { id: "4x4", label: "4x4", widthUnits: 4, depthUnits: 4 },
];

describe("layoutFile", () => {
  describe("parseLayoutFile", () => {
    it("parses valid layout and returns drawer + placements", () => {
      const json = JSON.stringify({
        version: 1,
        drawer: { width: 600, depth: 400, pitch: 42 },
        containers: [
          { type: "3x5", col: 0, row: 0, rotated: false },
          { type: "4x4", col: 3, row: 2, rotated: true },
        ],
      });
      const result = parseLayoutFile(json, CONTAINER_TYPES);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.drawerInput).toEqual({
        widthMm: 600,
        depthMm: 400,
        gridPitchMm: 42,
      });
      expect(result.placements).toHaveLength(2);
      expect(result.placements[0]).toMatchObject({
        containerTypeId: "3x5",
        x: 0,
        y: 0,
        isRotated: false,
      });
      expect(result.placements[1]).toMatchObject({
        containerTypeId: "4x4",
        x: 3,
        y: 2,
        isRotated: true,
      });
      expect(result.skippedCount).toBe(0);
    });

    it("returns error for invalid JSON", () => {
      const result = parseLayoutFile("not json", CONTAINER_TYPES);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("Invalid layout file");
    });

    it("returns error for wrong version", () => {
      const json = JSON.stringify({
        version: 2,
        drawer: { width: 600, depth: 400, pitch: 42 },
        containers: [],
      });
      const result = parseLayoutFile(json, CONTAINER_TYPES);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("Invalid layout file");
    });

    it("returns error when drawer is missing", () => {
      const json = JSON.stringify({
        version: 1,
        containers: [],
      });
      const result = parseLayoutFile(json, CONTAINER_TYPES);
      expect(result.ok).toBe(false);
    });

    it("returns error when containers is not an array", () => {
      const json = JSON.stringify({
        version: 1,
        drawer: { width: 600, depth: 400, pitch: 42 },
        containers: "not-array",
      });
      const result = parseLayoutFile(json, CONTAINER_TYPES);
      expect(result.ok).toBe(false);
    });

    it("skips out-of-bounds containers and reports count", () => {
      const json = JSON.stringify({
        version: 1,
        drawer: { width: 42 * 5, depth: 42 * 5, pitch: 42 },
        containers: [
          { type: "1x1", col: 0, row: 0, rotated: false },
          { type: "3x5", col: 10, row: 10, rotated: false },
          { type: "1x1", col: 4, row: 4, rotated: false },
        ],
      });
      const result = parseLayoutFile(json, CONTAINER_TYPES);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.placements).toHaveLength(2);
      expect(result.skippedCount).toBe(1);
    });

    it("accepts empty containers array", () => {
      const json = JSON.stringify({
        version: 1,
        drawer: { width: 600, depth: 400, pitch: 42 },
        containers: [],
      });
      const result = parseLayoutFile(json, CONTAINER_TYPES);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.placements).toHaveLength(0);
      expect(result.skippedCount).toBe(0);
    });
  });

  describe("downloadLayoutFile", () => {
    it("creates blob and triggers download (no throw)", () => {
      if (typeof document === "undefined") return;
      const drawerInput: DrawerInput = {
        widthMm: 600,
        depthMm: 400,
        gridPitchMm: 42,
      };
      const placements: Placement[] = [
        { containerTypeId: "3x5", x: 0, y: 0, isRotated: false },
      ];
      expect(() => downloadLayoutFile(drawerInput, placements)).not.toThrow();
    });

    it("allows empty placements", () => {
      if (typeof document === "undefined") return;
      const drawerInput: DrawerInput = {
        widthMm: 600,
        depthMm: 400,
        gridPitchMm: 42,
      };
      expect(() => downloadLayoutFile(drawerInput, [])).not.toThrow();
    });
  });
});
