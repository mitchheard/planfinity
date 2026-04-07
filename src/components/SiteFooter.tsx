import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t px-4 py-2 text-[12px]"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--text-secondary)",
      }}
    >
      <Link
        href="/privacy"
        className="underline underline-offset-2 hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        Privacy
      </Link>
      <Link
        href="/terms"
        className="underline underline-offset-2 hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        Terms
      </Link>
    </footer>
  );
}
