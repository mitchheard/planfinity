# Planfinity MVP Data Model

## Model Overview

The MVP uses a compact client-side model centered on drawer geometry, reusable container types, and container placements on a unit grid.

## Types

```ts
type Drawer = {
  widthMm: number
  depthMm: number
  gridPitchMm: number
  widthUnits: number
  depthUnits: number
}

type ContainerType = {
  id: string
  label: string
  color: string
  widthUnits: number
  depthUnits: number
}

type Placement = {
  id: string
  containerTypeId: string
  x: number // top-left column in units, zero-based
  y: number // top-left row in units, zero-based
}

type LayoutState = {
  drawer: Drawer
  containerTypes: ContainerType[]
  placements: Placement[]
}
```

## Field Rules and Constraints

### `drawer`

- `widthMm > 0`
- `depthMm > 0`
- `gridPitchMm > 0`
- `widthUnits = floor(widthMm / gridPitchMm)`
- `depthUnits = floor(depthMm / gridPitchMm)`
- `widthUnits >= 1` and `depthUnits >= 1` for valid planning state

### `containerTypes`

- `id` is unique and stable
- `label` is human-readable and non-empty
- `color` stores UI color token/string
- `widthUnits >= 1`
- `depthUnits >= 1`

### `placements`

- `id` is unique
- `containerTypeId` references an existing `containerTypes.id`
- `x >= 0`, `y >= 0`
- Placement must satisfy bounds:
  - `x + container.widthUnits <= drawer.widthUnits`
  - `y + container.depthUnits <= drawer.depthUnits`
- Placement rectangles must be pairwise non-overlapping

## Derived/Computed Data

These values are computed from `LayoutState` and not persisted as source-of-truth fields.

```ts
type OccupancySummary = {
  totalUnits: number
  usedUnits: number
  freeUnits: number
  usedPercent: number
}

type ContainerCount = {
  containerTypeId: string
  label: string
  count: number
}

type BaseplatePiece = {
  widthUnits: number
  depthUnits: number
  quantity: number
}
```

- `totalUnits = drawer.widthUnits * drawer.depthUnits`
- `usedUnits = sum(area of each placement rectangle)`
- `freeUnits = totalUnits - usedUnits`
- `usedPercent = (usedUnits / totalUnits) * 100`
- `containerCounts` groups placements by `containerTypeId`
- `baseplatePieces` represent decomposition of drawer footprint into rectangles constrained to `<= 5x5`

## Validation Operations

- `toUnits(mm, pitchMm): number`
- `isWithinBounds(drawer, containerType, x, y): boolean`
- `overlapsAny(existingPlacements, candidatePlacement): boolean`
- `canPlace(...) = isWithinBounds && !overlapsAny`

## Persistence Shape

Persist one active layout under a single key, for example:

```ts
type PersistedLayoutV1 = {
  version: 1
  updatedAtIso: string
  layout: LayoutState
}
```

On load:

- If key is missing: return default empty state.
- If parse/version/shape validation fails: ignore persisted value and return default state.
