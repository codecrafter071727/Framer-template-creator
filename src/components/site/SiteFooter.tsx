import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image
            src="/brand/framely-icon.png"
            alt=""
            width={36}
            height={36}
          />
          <strong>Framely</strong>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <a href="#how">How it works</a>
          <a href="#workspace">Workspace</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <p className="footer-copy">© 2026 Framely · Framer → Next.js</p>
      </div>
    </footer>
  );
}
