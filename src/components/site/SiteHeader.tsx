import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand-mark" aria-label="Framely home">
        <Image
          className="brand-icon"
          src="/brand/framely-icon.png"
          alt=""
          width={44}
          height={44}
          priority
        />
        <span className="brand-word">Framely</span>
      </Link>
    </header>
  );
}
