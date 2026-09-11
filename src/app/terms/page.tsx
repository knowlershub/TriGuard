import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Minderra",
  description: "Terms of Service for Minderra.",
};

export default function TermsPage() {
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

        <h1>Terms of Service</h1>

        <p>
          These Terms of Service govern your use of the Minderra website and
          related services.
        </p>

        <h2>Use of the service</h2>
        <p>
          You agree to use Minderra lawfully and responsibly and to provide
          accurate information when creating or maintaining an account.
        </p>

        <h2>Accounts</h2>
        <p>
          You are responsible for maintaining the security of your account and
          for activity performed through your account.
        </p>

        <h2>Connected services</h2>
        <p>
          When you connect a third-party service, you authorize Minderra to
          access the permissions you approve for that integration. You may
          disconnect supported services from Minderra settings.
        </p>

        <h2>User content</h2>
        <p>
          You retain responsibility for information and content you submit to
          Minderra. You must have the right to provide that information and
          must not use the service to process unlawful or abusive content.
        </p>

        <h2>Service availability</h2>
        <p>
          Minderra is provided on an evolving basis. Features may change,
          become unavailable, or be improved as the service develops.
        </p>

        <h2>Third-party services</h2>
        <p>
          Third-party integrations are subject to the relevant provider&apos;s
          own terms and policies. Minderra is not responsible for outages,
          policy changes, or actions taken independently by third-party
          providers.
        </p>

        <h2>Termination</h2>
        <p>
          Access may be suspended or terminated when necessary to protect the
          service, its users, or comply with applicable requirements.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may be updated as Minderra develops. Continued use of
          the service after an update constitutes acceptance of the revised
          terms where permitted by law.
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
