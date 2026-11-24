/** Framely site footer — injected into branded Framer HTML and mounted by framely-bridge.js */
export const FRAMELY_FOOTER_CSS = `
#framely-site-footer {
  position: relative;
  z-index: 2;
  width: 100%;
  margin-top: clamp(-20px, -2vw, -8px);
  padding: clamp(48px, 8vw, 88px) clamp(20px, 4vw, 32px) clamp(32px, 5vw, 48px);
  background: #0b0b0b;
  color: rgba(255, 255, 255, 0.88);
  border-radius: clamp(64px, 14vw, 112px) clamp(64px, 14vw, 112px) 0 0;
  overflow: hidden;
}
#framely-site-footer .framely-site-footer__inner {
  max-width: min(1080px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(20px, 3vw, 28px);
  text-align: center;
}
#framely-site-footer .framely-site-footer__brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
#framely-site-footer .framely-site-footer__brand img {
  width: min(220px, 72vw);
  height: auto;
  display: block;
}
#framely-site-footer .framely-site-footer__tagline {
  margin: 0;
  font: 400 clamp(15px, 2.2vw, 17px) / 1.5 Geist, system-ui, sans-serif;
  color: rgba(255, 255, 255, 0.55);
  max-width: 36ch;
}
#framely-site-footer .framely-site-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px 22px;
}
#framely-site-footer .framely-site-footer__links a {
  font: 500 14px/1.35 Geist, system-ui, sans-serif;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  transition: color 140ms ease;
}
#framely-site-footer .framely-site-footer__links a:hover {
  color: #fff;
}
#framely-site-footer .framely-site-footer__copy {
  margin: 8px 0 0;
  font: 400 13px/1.5 Geist, system-ui, sans-serif;
  color: rgba(255, 255, 255, 0.4);
}
`;

export const FRAMELY_FOOTER_HTML = `
<footer id="framely-site-footer" role="contentinfo">
  <div class="framely-site-footer__inner">
    <a class="framely-site-footer__brand" href="/" aria-label="Framely home">
      <img src="/brand/framely-banner.png" alt="Framely" width="220" height="48" loading="lazy" decoding="async" />
    </a>
    <p class="framely-site-footer__tagline">Extract published Framer sites — ship production Next.js.</p>
    <nav class="framely-site-footer__links" aria-label="Footer">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/changelog">Changelog</a>
      <a href="/contact">Contact</a>
    </nav>
    <p class="framely-site-footer__copy">© Framely 2026. All rights reserved.</p>
  </div>
</footer>`;

export function appendFramelyFooter($) {
  const main = $("#main");
  const existing = $("#framely-site-footer");
  if (existing.length && main.length) {
    main.after(existing);
    return;
  }
  if (existing.length) return;
  if (main.length) main.after(FRAMELY_FOOTER_HTML);
  else $("body").append(FRAMELY_FOOTER_HTML);
}