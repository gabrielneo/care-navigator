import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

const SITE = "https://care-pacity-planner.vercel.app";
const DESCRIPTION =
  "Work out which care services fit, what they may cost after the 2026 subsidies, and who to call first. About 5 minutes. Nothing is saved.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Care-pacity Planner — plan care for an older parent", template: "%s — Care-pacity Planner" },
  description: DESCRIPTION,
  robots: { index: false, follow: false },             // prototype (spec 11): remove before a public launch
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "Care-pacity Planner",
    title: "Plan care for an older parent in 5 minutes",
    description: "See what care may cost after 2026 subsidies, and who to call first. Nothing is saved.",
    url: SITE,
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#7C3415", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-SG">
      <body>
        <div className="page">
          <div className="proto" role="note">
            Prototype for testing. Figures and wording have not yet been checked by a care professional.
          </div>
          <noscript>
            <p className="notice warn">
              This planner needs JavaScript. For help, call the AIC hotline on 1800-650-6060.
            </p>
          </noscript>
          <main>{children}</main>
          <footer className="ft">
            <span><b>AIC hotline 1800-650-6060</b> · Mon–Fri 8.30am–8.30pm, Sat 8.30am–4pm</span>
            <span>Medical emergency: <b>995</b></span>
            <span>Independent student project. Not affiliated with MOH, AIC or the Government of Singapore.</span>
            <nav aria-label="Site">
              <Link href="/about/">About</Link>
              <Link href="/privacy/">Privacy</Link>
              <Link href="/data-sources/">Data sources</Link>
            </nav>
          </footer>
        </div>
      </body>
    </html>
  );
}
