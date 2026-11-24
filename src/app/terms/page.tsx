import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function TermsPage() {
  return (
    <div className="site">
      <div className="noise" aria-hidden />
      <div className="site-content">
        <SiteHeader />
        <main className="legal-page">
          <p>
            <Link href="/">← Framely</Link>
          </p>
          <h1>Terms</h1>
          <p>
            You must have rights to any Framer site or assets you process with
            Framely. Framely captures published sites only — not Framer editor
            source — and output quality depends on the site and your convert
            prompt.
          </p>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
