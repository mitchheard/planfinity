"use client";

type TopbarProps = {
  onNewLayout: () => void;
  onLoad: () => void;
  onSave: () => void;
};

function LogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="24" height="24" fill="var(--text-primary)" rx="4" />
      {/* Gridfinity-style grid: 4x4 unit grid */}
      <g stroke="white" strokeWidth="1" strokeOpacity="0.9">
        <line x1="6" y1="4" x2="6" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="18" y1="4" x2="18" y2="20" />
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </g>
    </svg>
  );
}

export function Topbar({ onNewLayout, onLoad, onSave }: TopbarProps) {
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b px-4"
      style={{
        height: "48px",
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <LogoMark />
        <span
          className="font-mono text-[15px] font-normal"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
        >
          Planfinity
        </span>
        <div
          className="h-5 w-px shrink-0"
          style={{ backgroundColor: "var(--border)" }}
          aria-hidden
        />
        <span
          className="text-[13px]"
          style={{ color: "var(--text-secondary)" }}
        >
          Design Gridfinity layouts faster, with live fit feedback.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewLayout}
          className="rounded px-3 py-1.5 font-medium text-[13px] transition-colors hover:bg-[var(--surface-2)]"
          style={{
            backgroundColor: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          New layout
        </button>
        <button
          type="button"
          onClick={onLoad}
          className="rounded px-3 py-1.5 font-medium text-[13px] transition-colors hover:bg-[var(--surface-2)]"
          style={{
            backgroundColor: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          Load
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded px-3 py-1.5 font-medium text-[13px] transition-colors hover:opacity-85"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--surface)",
          }}
        >
          Save layout
        </button>
      </div>
    </header>
  );
}
