import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LegalPageShell } from "@/components/LegalPageShell";
import { CONTACT_EMAIL, PRODUCT_NAME, PRODUCT_URL } from "@/lib/legalSite";

export const metadata: Metadata = {
  title: `Terms — ${PRODUCT_NAME}`,
  description: `Terms of Service for ${PRODUCT_NAME}.`,
  alternates: { canonical: `${PRODUCT_URL}/terms` },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2
        className="mb-2 text-base font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service">
      <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
        Last updated: April 7, 2026
      </p>
      <p>
        These Terms of Service (“Terms”) govern your access to and use of {PRODUCT_NAME} at{" "}
        {PRODUCT_URL} (the “Service”). By using the Service, you agree to these Terms.
      </p>

      <Section title="The Service">
        <p>
          {PRODUCT_NAME} helps you design Gridfinity-style drawer layouts. Features may change over
          time. We do not guarantee uninterrupted or error-free operation.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the Service in violation of law or third-party rights</li>
          <li>Attempt to probe, scan, or test the vulnerability of our systems without authorization</li>
          <li>Interfere with or disrupt the Service or other users’ use of it</li>
          <li>Reverse engineer or attempt to extract source code except where permitted by law</li>
        </ul>
      </Section>

      <Section title="Accounts">
        <p>
          If the Service offers sign-in, you are responsible for safeguarding your credentials and
          for activity under your account. Notify us if you suspect unauthorized access.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          The Service, including its design, branding, and software, is owned by us or our licensors.
          These Terms do not grant you any rights beyond the limited license to use the Service for
          your own purposes. Layouts and content you create remain yours.
        </p>
      </Section>

      <Section title="Disclaimer">
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE”, WITHOUT WARRANTIES OF ANY KIND,
          WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
          A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR SUPPLIERS WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
          PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR
          ANY CLAIM RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID
          US FOR THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS
          (US$100), IF YOU HAVE NOT PAID US ANYTHING.
        </p>
      </Section>

      <Section title="Indemnity">
        <p>
          You will defend and indemnify us against claims arising from your misuse of the Service or
          violation of these Terms, to the extent permitted by law.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may modify the Service or these Terms. If we make material changes, we will provide
          reasonable notice where appropriate (for example, by updating this page). Continued use
          after changes means you accept the updated Terms.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          We may suspend or terminate access to the Service at any time, with or without notice,
          for conduct that we believe violates these Terms or harms the Service or others.
        </p>
      </Section>

      <Section title="General">
        <p>
          These Terms are governed by the laws of the United States, without regard to conflict-of-law
          principles. If a provision is unenforceable, the remaining provisions remain in effect.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these Terms:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-2"
            style={{ color: "var(--accent-blue)" }}
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </LegalPageShell>
  );
}
