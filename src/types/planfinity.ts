export type DrawerInput = {
  widthMm: number;
  depthMm: number;
  gridPitchMm: number;
};

export type DrawerUnits = {
  widthUnits: number;
  depthUnits: number;
};

export type ContainerType = {
  id: string;
  label: string;
  color?: string;
  widthUnits: number;
  depthUnits: number;
};

export type Placement = {
  id?: string;
  containerTypeId: string;
  x: number;
  y: number;
  isRotated?: boolean;
};

export type PlannerLayout = {
  drawer: DrawerInput;
  containerTypes: ContainerType[];
  placements: Placement[];
};

export type ContainerCountSummary = {
  containerTypeId: string;
  label: string;
  widthUnits: number;
  depthUnits: number;
  count: number;
};

export type BaseplateTile = {
  x: number;
  y: number;
  widthUnits: number;
  depthUnits: number;
};

export type BaseplateSizeCount = {
  widthUnits: number;
  depthUnits: number;
  count: number;
};

export type BaseplateSummary = {
  maxTileUnits: number;
  tiles: BaseplateTile[];
  sizeCounts: BaseplateSizeCount[];
  totalTiles: number;
  coveredAreaUnits: number;
};

export type BaseplateStrategy = "max-first" | "balanced";

export type PrintSummary = {
  containerCounts: ContainerCountSummary[];
  baseplates: BaseplateSummary;
};
