# Planfinity

Planfinity is a web app for planning Gridfinity drawer layouts before printing.
It converts drawer dimensions into grid units, lets you place container footprints,
and generates a print-oriented summary for both containers and baseplates.

## Current Status

This repository contains an MVP built with Next.js, React, Tailwind CSS, and TypeScript.

## MVP Features

- Drawer inputs in mm (`width`, `depth`, `grid pitch`)
- Derived drawer grid dimensions in units
- **Load/Save layout files** — load a layout from JSON, edit (remove, rotate, add containers), then save to a new file
- Interactive placement of container footprints (click/tap to place; rotate via R key, right-click, or tap on mobile; remove via click or long-press on mobile)
- Collision and bounds validation
- **Resize drawer** — when you change dimensions and Apply, placements that still fit are kept; only out-of-bounds ones are removed
- Container count summary and baseplate breakdown constrained to `<= 5x5`
- **Mobile-responsive layout** (≤768px) — single column, tabbed bottom panel (Containers, Stats, Baseplates), touch-friendly
- Unit tests for core planner logic

## Tech Stack

- Next.js
- React
- Tailwind CSS
- TypeScript
- Vitest

## Getting Started

### Prerequisites

- Node.js 20+ (or current LTS)

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Run Tests

```bash
npm run test
```

### Run Lint

```bash
npm run lint
```

## Project Structure

- `src/app/` - Next.js app shell and page
- `src/components/` - UI for form, palette, and grid planner
- `src/lib/` - planner logic, print summary, baseplate slicing, persistence helpers
- `src/types/` - shared TypeScript domain types
- `docs/` - detailed product and technical docs

## Documentation

- Product spec: `docs/spec.md`
- Data model: `docs/data-model.md`
- Detailed roadmap: `docs/roadmap.md`
- Release notes: `CHANGELOG.md`

## Roadmap

High-level roadmap and milestone detail: `ROADMAP.md` and `docs/roadmap.md`. **Future development is tracked in Linear (Planfinity tickets AVIDX-24, AVIDX-42 through AVIDX-51+); Linear is the source of truth for specs and backlog.**
