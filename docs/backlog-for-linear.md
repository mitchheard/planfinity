# Planfinity — Backlog for Linear Tickets *(Archived)*

**✅ COMPLETED: All items converted to Linear tickets AVIDX-45 through AVIDX-51 on 2026-03-15.**

*Archived. Kept for reference only. Linear (AVIDX-45–AVIDX-51, plus AVIDX-42–44, AVIDX-24) is the source of truth for future development.*

---

Use this list to create or update Linear issues. Items below are **not yet** in Linear (or need to be reflected there). Existing Planfinity Linear issues: **AVIDX-42** (Fill grid randomly), **AVIDX-43** (Undo), **AVIDX-44** (User accounts + layout library), **AVIDX-24** (Analytics).

**Already done (no ticket):** Improve UX for placement and removal; JSON import/export (load/save files); rotate containers (90°).  
**Dropped:** Print/material/time estimation (too many outside factors).  
**Replaced:** Smart packing/autolayout → covered by AVIDX-42 (Fill grid randomly).

---

## MVP Stabilization (Now)

1. **Quick presets for drawer and containers**  
   Add presets for common drawer dimensions and/or container setups so users can start from a typical configuration instead of typing values from scratch.

2. **Expand test coverage**  
   Add tests for edge-case placements and baseplate slicing so regressions are caught and behavior is documented.

---

## Next (v0.2.x)

3. **Drag-and-drop placement**  
   Allow placing containers by dragging from the palette (or a chosen container) onto the grid, in addition to current click-to-place.

4. **Multiple saved layouts (local-only)**  
   Support more than one named layout per browser (e.g. list of layouts, load/save/delete), stored locally only (no backend).

5. **Prompt-based AI layout suggestions**  
   Let the user describe what they want to store (e.g. "pliers, screws, drill bits"); suggest a container mix and optionally a layout to fill the drawer.

---

## Later (v0.3.x+)

6. **Smarter baseplate planning and packing**  
   Improve baseplate decomposition and packing suggestions (e.g. better tiling, fewer pieces, or clearer guidance).

7. **Rich container catalog management**  
   Allow users to manage a larger or custom container catalog (add, edit, group, filter) instead of a fixed predefined set.

8. **Optional cloud sync and accounts**  
   Optional user accounts and cloud sync so layouts can be stored and restored across devices (see also AVIDX-44).

---

## Reference — Already in Linear

- **AVIDX-42** — Fill grid randomly with containers (replaces “smart packing/autolayout” on the roadmap).
- **AVIDX-43** — Undo functionality.
- **AVIDX-44** — User accounts + layout library (monetization).
- **AVIDX-24** — Add analytics.
