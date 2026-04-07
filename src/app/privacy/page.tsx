import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LegalPageShell } from "@/components/LegalPageShell";
import { CONTACT_EMAIL, PRODUCT_NAME, PRODUCT_URL } from "@/lib/legalSite";

export const metadata: Metadata = {
  title: `Privacy — ${PRODUCT_NAME}`,
  description: `How ${PRODUCT_NAME} collects, uses, and shares information.`,
  alternates: { canonical: `${PRODUCT_URL}/privacy` },
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

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
        Last updated: April 7, 2026
      </p>
      <p>
        This Privacy Policy describes how {PRODUCT_NAME} (“we”, “us”) handles information when you
        use {PRODUCT_URL} (the “Service”). By using the Service, you agree to this policy.
      </p>

      <Section title="Information we collect">
        <p>
          We may collect information you provide directly (for example, account or contact details
          if you sign in or contact us), and technical data sent automatically by your browser or
          device (for example, IP address, device type, browser type, and general usage events).
        </p>
      </Section>

      <Section title="How we use information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide, operate, and improve the Service</li>
          <li>Authenticate users and maintain security</li>
          <li>Respond to support requests</li>
          <li>Understand aggregate usage through privacy-friendly analytics</li>
          <li>Comply with legal obligations</li>
        </ul>
      </Section>

      <Section title="Third-party services">
        <p>
          We rely on service providers that process data on our behalf. Depending on how you use
          the Service, this may include:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              Google
            </span>{" "}
            — Sign-in with Google (OAuth) for authentication when that feature is enabled.
          </li>
          <li>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              Supabase
            </span>{" "}
            — Hosting, authentication, and database services that may store account-related data.
          </li>
          <li>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              Resend
            </span>{" "}
            — Transactional email delivery when we send email through that provider.
          </li>
          <li>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              Umami
            </span>{" "}
            — Privacy-focused, aggregate analytics to understand how the Service is used.
          </li>
        </ul>
        <p>
          Each provider has its own privacy practices. We encourage you to review their policies.
        </p>
      </Section>

      <Section title="Cookies and similar technologies">
        <p>
          We and our providers may use cookies, local storage, or similar technologies needed for
          the Service to function (for example, session or preference storage) and for analytics as
          described above.
        </p>
      </Section>

      <Section title="Retention">
        <p>
          We retain information only as long as needed for the purposes above, unless a longer
          period is required by law.
        </p>
      </Section>

      <Section title="Security">
        <p>
          We take reasonable measures to protect information, but no method of transmission or
          storage is completely secure.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          Where applicable, you may access, update, or delete certain account information through
          the Service or by contacting us. You can also use browser settings to limit cookies, which
          may affect functionality.
        </p>
      </Section>

      <Section title="Children">
        <p>The Service is not directed to children under 13, and we do not knowingly collect their personal information.</p>
      </Section>

      <Section title="Changes">
        <p>
          We may update this policy from time to time. We will post the updated version on this
          page and revise the “Last updated” date.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy:{" "}
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
