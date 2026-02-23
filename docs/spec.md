# Planfinity MVP Product Specification

## Purpose

Planfinity MVP helps a user design a practical organizer layout for a drawer by:

- Defining drawer dimensions and grid pitch
- Viewing the resulting grid in units
- Placing and removing container footprints
- Getting a print-oriented summary of containers and baseplates

The MVP is fully client-side, with one active layout persisted locally in the browser.

## Target User

- Maker/hobbyist with a physical drawer to organize
- Wants a fast "good enough" layout without advanced automation
- Is comfortable working in discrete grid units

## In-Scope (MVP)

- Drawer inputs: `widthMm`, `depthMm`, `gridPitchMm`
- Derived drawer grid dimensions: `widthUnits`, `depthUnits`
- Grid rendering based on derived unit dimensions
- Container palette with predefined rectangular footprints
- Placement by selecting a container type and a top-left grid coordinate
- Placement removal behavior
- Validation for out-of-bounds and overlap
- Summary output:
  - Occupancy (used units vs total units)
  - Container counts by type
  - Baseplate decomposition into rectangles constrained to `<= 5x5` units
- Persistence of one active layout via `localStorage`

## Out-of-Scope (MVP)

- Backend, accounts, or cloud sync
- Multi-layout management
- Drag-and-drop and rotation UX
- Smart packing/autolayout
- Cost, filament, or print-time estimates
- Non-rectangular containers

## Core User Flows

### Flow 1: Initialize Drawer

1. User enters drawer width/depth in mm and a grid pitch in mm.
2. System computes `widthUnits = floor(widthMm / gridPitchMm)` and `depthUnits = floor(depthMm / gridPitchMm)`.
3. System renders a grid with those unit dimensions.
4. If dimensions produce zero units in either axis, system blocks further planning and shows validation feedback.

### Flow 2: Place Containers

1. User selects a container type from the palette.
2. User chooses a top-left grid coordinate.
3. System checks:
   - Rectangle is within bounds.
   - Rectangle does not overlap existing placements.
4. If valid, placement is added and summary updates.
5. If invalid, placement is rejected with clear feedback.

### Flow 3: Remove Containers

1. User selects an existing placement to remove.
2. System deletes that placement.
3. Grid and summary refresh immediately.

### Flow 4: Review Print Summary

1. User opens summary panel.
2. System displays occupancy and per-type counts.
3. System computes required baseplates as `<= 5x5` rectangular pieces for the current grid footprint.

### Flow 5: Resume Layout

1. User refreshes or returns to app later.
2. System loads saved layout from `localStorage`.
3. If saved data is missing/invalid, app falls back to default empty state.

## Functional Requirements

- Inputs must accept positive numeric values in millimeters.
- Grid dimensions are computed from validated inputs and must be integers.
- Every placement references a known container type.
- Placement collision and bounds checks must run before insert.
- Removing a placement cannot affect unrelated placements.
- Summary must always reflect current in-memory state.
- Persistence writes happen on meaningful state change and restore on app load.

## Non-Functional Requirements

- Interactive placement/removal should feel immediate on typical laptop hardware.
- Domain logic should be isolated in pure utility modules for testability.
- UI components should be stateless where practical, with page-level state ownership.
- App should degrade safely when `localStorage` is unavailable or corrupt.

## Key Decisions

- Single active layout keeps MVP scope tight.
- Integer unit model avoids ambiguous sub-grid placement.
- Baseplate output constrained to `<= 5x5` aligns with printability requirement.
