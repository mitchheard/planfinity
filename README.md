# Planfinity

Planfinity is a web app for planning Gridfinity drawer layouts before printing.
It converts drawer dimensions into grid units, lets you place container footprints,
and generates a print-oriented summary for both containers and baseplates.

## Current Status

This repository contains an MVP built with Next.js, React, Tailwind CSS, and TypeScript.

## MVP Features

- Drawer inputs in mm (`width`, `depth`, `grid pitch`)
- Derived drawer grid dimensions in units
- Interactive placement of container footprints
- Collision and bounds validation
- Placement removal
- Container count summary
- Baseplate breakdown constrained to `<= 5x5`
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

For the high-level roadmap, see `ROADMAP.md`.
For milestone-level detail and acceptance criteria, see `docs/roadmap.md`.
