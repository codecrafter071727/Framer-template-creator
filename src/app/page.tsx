import { ConverterApp } from "@/components/ConverterApp";

export default function Home() {
  return (
    <main className="shell">
      <header className="hero">
        <p className="chip">Framer → Zip → Code</p>
        <h1 className="brand">FramerForge</h1>
        <p className="hero-copy">
          Drop a published Framer link. We build a high-accuracy zip — full assets
          plus a conversion pack (content map, design tokens, semantic HTML,
          screenshots) — so one prompt can rebuild the whole site in Next.js or React.
        </p>
        <div className="hero-meta">
          <span className="chip">Deep Chromium capture</span>
          <span className="chip">High-accuracy conversion pack</span>
          <span className="chip">Single-prompt rebuild</span>
        </div>
      </header>

      <ConverterApp />

      <p className="footer-note">
        This captures the complete published website (what the browser loads), not
        Framer editor/canvas source files — those are never exposed by Framer.
        Set <code>AI_GATEWAY_API_KEY</code> for semantic conversion; without it, a
        structural Next/React shell is still generated from the extract.
      </p>
    </main>
  );
}
