import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function PrivacyPage() {
  return (
    <div className="site">
      <div className="noise" aria-hidden />
      <div className="site-content">
        <SiteHeader />
        <main className="legal-page">
          <p>
            <Link href="/">← Framely</Link>
          </p>
          <h1>Privacy</h1>
          <p>
            Framely processes Framer URLs and zip uploads only to run extract and
            convert jobs. Do not submit private credentials or data you do not
            control. Jobs may be stored locally or in configured blob storage for
            download.
          </p>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
