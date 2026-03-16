# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

### Added

- **Load/Save layout files**: Load a layout from a JSON file (Load in topbar or hamburger on mobile); save the current layout to a new file (Save layout). Supports full load → edit (remove, rotate, add) → save workflow.
- **Mobile-responsive layout** (≤768px): Single-column stack with condensed topbar (hamburger for New/Load, Save primary), compact drawer form, full-width grid with aspect ratio, and tabbed bottom panel (Containers | Stats | Baseplates). Touch: tap to place, tap container to rotate, long-press to remove.
- Print List button in the computed grid summary that opens a printer-friendly bill of materials for containers and baseplates.
- Roadmap entries for prompt-based AI layout suggestions that recommend container mixes from natural language storage goals.

### Changed

- **Apply drawer dimensions**: Changing width, depth, or grid pitch and clicking Apply now keeps placements that still fit in the new grid; only out-of-bounds placements are removed (previously all placements were cleared).
- **Removal after load**: Placements loaded from a file (which have no stored id) can be removed; removal uses a stable key so it works on both desktop and mobile.

### Fixed

- **Grid missing after load**: Duplicate SVG pattern `id="grid-pattern"` when both mobile and desktop GridPlanner instances were in the DOM caused one grid to render without lines; each instance now uses a unique pattern id (`useId()`).
- **Spacer dimension labels cut off**: When the extra width/depth strip was narrow, "+Nmm" labels were clipped; labels now use a smaller font and are nudged inward on narrow strips, and the SVG uses `overflow="visible"`.

## [0.1.1] - 2026-02-24

### Added

- Baseplate strategy toggle with `Max-first` and `Balanced` decomposition options in the computed grid summary.
- Balanced baseplate decomposition logic and tests to validate behavior for mixed and square footprints.
- Container Fit Finder (2D) to suggest matching predefined bins from object width/depth plus configurable side clearance.
- Fit suggestion utility module and test coverage for clearance, rotation-aware matches, and invalid input handling.

### Changed

- Moved the fit finder into the Container Palette panel for a more contextual workflow.
- Simplified fit output to a normalized single best-fit footprint (with concise no-fit messaging).
- Removed the compact/expanded palette mode toggle and kept compact cards as the default behavior.
- Refined fit finder form layout with responsive two-column width/depth inputs and a dedicated clearance row.

## [0.1.0] - 2026-02-22

### Added

- Initial Planfinity MVP scaffold using Next.js, React, Tailwind CSS, and TypeScript.
- Drawer input workflow with unit conversion to Gridfinity cell dimensions.
- Interactive grid planner with placement, removal, bounds checks, and overlap prevention.
- Container count and baseplate (`<= 5x5`) print summary generation.
- Automated tests for planner, summary, baseplate, and persistence utility modules.
- Core planning documentation in `docs/spec.md`, `docs/data-model.md`, and `docs/roadmap.md`.
