# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

### Added

- Print List button in the computed grid summary that opens a printer-friendly bill of materials for containers and baseplates.
- Roadmap entries for prompt-based AI layout suggestions that recommend container mixes from natural language storage goals.

### Changed

- None yet.

### Fixed

- None yet.

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
