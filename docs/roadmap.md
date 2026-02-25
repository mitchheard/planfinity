# Planfinity MVP Roadmap

## MVP Goal

Deliver a usable first release that supports drawer setup, grid-based container placement, and print-oriented summary output with local persistence.

## Milestones

### M1: App Scaffold

- Next.js + Tailwind baseline
- Basic page shell and section layout
- Initial state wiring

### M2: Drawer and Grid

- Drawer input form (`widthMm`, `depthMm`, `gridPitchMm`)
- Unit conversion and derived dimensions
- Grid rendering from computed unit size

### M3: Placement Workflow

- Container type palette
- Placement interaction (select + place)
- Remove placement interaction
- Bounds and overlap guards

### M4: Summary + Baseplates

- Occupancy summary
- Container counts by type
- Baseplate rectangle decomposition with `<= 5x5` constraint

### M5: Persistence + Tests

- Save and restore one active layout via `localStorage`
- Unit tests for:
  - Unit conversion
  - Collision/bounds checks
  - Baseplate slicing

## MVP Acceptance Criteria

The MVP is complete when all criteria below pass:

1. User can input drawer dimensions/pitch and see derived grid dimensions.
2. User can place multiple rectangular container footprints on the grid.
3. Invalid placements (out of bounds or overlap) are blocked.
4. User can remove previously placed containers.
5. App shows occupancy and container count summary accurately.
6. App outputs baseplate breakdown that uses only pieces `<= 5x5`.
7. Layout state survives browser refresh via `localStorage`.
8. Core pure utility modules have automated tests and pass locally.

## Definition of Done Checklist

- [ ] Product behavior matches `docs/spec.md`
- [ ] Data model and invariants match `docs/data-model.md`
- [ ] All MVP acceptance criteria are demonstrably satisfied
- [ ] No backend dependency exists for core MVP flow
- [ ] Tests cover critical logic paths and edge cases

## v2 Backlog (Post-MVP)

- Drag-and-drop placement UX
- Rotate containers (90 degrees)
- Smart packing suggestions/autolayout
- Prompt-based AI layout generation from natural language storage goals (suggest container types + counts to fill the drawer)
- Multiple saved layouts
- Import/export layout JSON
- Print estimate features (material/time)
- Richer container catalog management
- Optional cloud sync/authentication
