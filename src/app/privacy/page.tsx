import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Minderra",
  description:
    "Privacy Policy for Minderra, your personal money, time, and information guard.",
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "48px 24px",
      }}
    >
      <article
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "40px",
        }}
      >
        <Link href="/" style={{ color: "#2563eb", fontWeight: 700 }}>
          ← Back to Minderra
        </Link>

        <h1>Privacy Policy</h1>

        <p>
          This Privacy Policy explains how Minderra collects, uses, stores,
          and protects information when you use the Minderra website and
          connected services.
        </p>

        <h2>Information we collect</h2>
        <p>
          Depending on the features you use, Minderra may collect account
          information such as your name, email address, and authentication
          information. Minderra may also store information that you
          intentionally submit, including expenses, tasks, notes, and
          messages.
        </p>

        <h2>Connected services</h2>
        <p>
          Minderra can connect to third-party services such as Google Gmail
          and Telegram when you explicitly authorize those integrations.
          Access is limited to the permissions required for the features you
          choose to use.
        </p>

        <h2>Google data</h2>
        <p>
          When you connect a Google account, Minderra uses the Google OAuth
          permissions you authorize to provide supported Gmail features.
          Minderra does not sell your Google data or use it for advertising.
        </p>

        <h2>How we use information</h2>
        <p>
          Information is used to provide, maintain, secure, and improve
          Minderra features, including account access, expense processing,
          notifications, connected-service functionality, and support.
        </p>

        <h2>Data sharing</h2>
        <p>
          Minderra does not sell personal information. Information may be
          processed by infrastructure and service providers that are necessary
          to operate the application, subject to appropriate security and
          contractual controls.
        </p>

        <h2>Data security</h2>
        <p>
          Minderra uses authentication, access controls, encrypted transport,
          and other reasonable technical measures intended to protect stored
          information against unauthorized access, alteration, or disclosure.
        </p>

        <h2>Data retention and deletion</h2>
        <p>
          Information is retained only as needed to provide the service and
          meet legitimate operational requirements. You may request deletion
          of your account and associated personal information through the
          available support channel.
        </p>

        <h2>Third-party services</h2>
        <p>
          When you authorize an integration, the relevant third party may
          process information under its own privacy policy and terms. You
          should review the policies of services you choose to connect.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          This Privacy Policy may be updated as Minderra evolves. The updated
          version will be published on this page with its revised content.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions or data-deletion requests, use the contact
          method provided by the Minderra service operator.
        </p>

        <p
          style={{
            marginTop: "40px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Last updated: September 11, 2026
        </p>
      </article>
    </main>
  );
}
