"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";

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

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

export function Topbar({ onNewLayout, onLoad, onSave }: TopbarProps) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="relative flex shrink-0 items-center justify-between border-b px-4 min-h-[44px] md:h-12"
      style={{
        minHeight: "44px",
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <LogoMark />
        <span
          className="font-mono text-[15px] font-normal truncate"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
        >
          Planfinity
        </span>
        {/* Desktop: tagline */}
        <div
          className="hidden md:flex items-center gap-3 shrink-0"
          aria-hidden
        >
          <div
            className="h-5 w-px shrink-0"
            style={{ backgroundColor: "var(--border)" }}
          />
          <span
            className="text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Design Gridfinity layouts faster, with live fit feedback.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile: hamburger menu */}
        {isMobile ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center justify-center rounded min-w-[44px] min-h-[44px] -m-2 transition-colors hover:bg-[var(--surface-2)] touch-manipulation"
              style={{ color: "var(--text-primary)" }}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <HamburgerIcon open={menuOpen} />
            </button>
            {menuOpen && (
              <div
                className="fixed inset-0 z-40 md:hidden"
                aria-hidden
                onClick={() => setMenuOpen(false)}
              />
            )}
            {menuOpen && (
              <div
                className="absolute top-full right-4 z-50 mt-1 rounded-lg border py-2 shadow-lg md:hidden"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  minWidth: "180px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onNewLayout();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-[var(--surface-2)] touch-manipulation min-h-[44px] flex items-center"
                  style={{ color: "var(--text-primary)" }}
                >
                  New layout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoad();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] font-medium transition-colors hover:bg-[var(--surface-2)] touch-manipulation min-h-[44px] flex items-center"
                  style={{ color: "var(--text-primary)" }}
                >
                  Load
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onSave}
              className="rounded px-4 py-2.5 font-medium text-[13px] transition-opacity hover:opacity-85 touch-manipulation min-h-[44px] flex items-center"
              style={{
                backgroundColor: "var(--text-primary)",
                color: "var(--surface)",
              }}
            >
              Save layout
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </header>
  );
}
