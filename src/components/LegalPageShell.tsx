import type { ReactNode } from "react";
import Link from "next/link";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className="flex shrink-0 items-center border-b px-4 py-3"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <Link
          href="/"
          className="font-mono text-[15px] font-normal underline-offset-2 hover:underline"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
        >
          ← Planfinity
        </Link>
      </header>
      <main
        className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-8 md:px-6"
        style={{ color: "var(--text-primary)" }}
      >
        <h1
          className="mb-6 text-2xl font-normal md:text-3xl"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {title}
        </h1>
        <div
          className="space-y-5 text-[15px] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
