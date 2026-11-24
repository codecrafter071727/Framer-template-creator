/** Injected in <head> before paint — keep sync with public/framely-bridge.js injectCriticalChrome(). */
export const FRAMELY_CRITICAL_CSS = `
#framely-panel-stack,
#framely-panel-stack .framely-panel {
  display: block !important;
  visibility: visible !important;
  max-height: none !important;
  overflow: visible !important;
  pointer-events: auto !important;
}
[data-framer-name="Main"] > .ssr-variant:has([data-framer-name="CTA Card"]),
[data-framer-name="Main"] > .ssr-variant:has([data-framer-name="Slide 1"]),
[data-framer-name="Main"] > .ssr-variant:has([data-framer-name="Slide 1 - Mobile"]),
[data-framer-name="Main"] > .ssr-variant:has([data-framer-name="Mobile  1"]),
[data-framer-name="Main"] > .ssr-variant:has([data-framer-name="Desktop  1"]),
.ssr-variant:has([data-framer-name="Mobile  1"]),
.ssr-variant:has([data-framer-name="Desktop  1"]),
.ssr-variant:has([data-framer-name="Newsletter"]):not(:has([data-framer-name="Copyright"])),
.ssr-variant:has([data-framer-name="CTA Card"]):not(:has([data-framer-name="Copyright"])),
[data-framer-name="Newsletter"],
[data-framer-name="Newsletter Form "] {
  display: none !important;
  visibility: hidden !important;
  max-height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}
#framely-site-footer {
  display: none !important;
  visibility: hidden !important;
  max-height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}
[data-framer-name="Buy Template Button"],
[data-framer-name="Another one"],
.framer-1k941ea-container,
a.framer-gkuFO,
.framer-1hdmz1q {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  max-height: 0 !important;
  overflow: hidden !important;
  position: absolute !important;
  width: 0 !important;
  height: 0 !important;
}
#__framer-badge-container,
.__framer-badge,
a.__framer-badge {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  max-height: 0 !important;
  overflow: hidden !important;
}
[data-framer-name="Introduction Section"],
[data-framer-name="Security Section"],
[data-framer-name="Features Section"],
[data-framer-name="Pricing Section"],
[data-framer-name^="Pricing Monthly"],
[data-framer-name="Price Wrap"],
[data-framer-name="Integrations Section"],
[data-framer-name="FAQ Section"],
[data-framer-name="Newsletter"],
[data-framer-name="Background CTA"],
[data-framer-name="CTA Card"],
[data-framer-name="Content Wrap"]:has([data-framer-name="CTA Card"]),
form:has(input[placeholder*="email" i]) {
  display: none !important;
  visibility: hidden !important;
  max-height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;
}
[data-framer-name="Navbar"],
[data-framer-name="Navigation"],
[data-framer-name="Nav Trigger"],
[data-framely-hide="1"] {
  display: none !important;
  visibility: hidden !important;
  max-height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}
[data-framer-name="Hero Section"] header [data-framer-name="Brand"] {
  display: none !important;
}
a[href="/manifesto"],
a[href="/careers"],
a[href="/pricing"],
a[href="/manifesto/"],
a[href="/careers/"],
a[href="/pricing/"] {
  display: none !important;
}
html:not(.framely-branded) [data-framer-name="Brand Logo"],
html:not(.framely-branded) [data-framer-name="Brand Wrap"] {
  opacity: 0 !important;
  visibility: hidden !important;
}
html.framely-branded [data-framer-name="Brand Logo"],
html.framely-branded [data-framer-name="Brand Wrap"] {
  opacity: 1 !important;
  visibility: visible !important;
}
html:not(.framely-branded) [data-framer-name="Testimonial"] [data-framer-name="Person"],
html:not(.framely-branded) [data-framer-name="Testimonial"] [data-framer-name="Avatar"] {
  opacity: 0 !important;
  visibility: hidden !important;
}
html.framely-branded [data-framer-name="Testimonial"] [data-framer-name="Person"],
html.framely-branded [data-framer-name="Testimonial"] [data-framer-name="Avatar"] {
  opacity: 1 !important;
  visibility: visible !important;
}
#framely-top-logo {
  visibility: hidden;
}
#framely-top-logo.framely-ready {
  visibility: visible;
}
#main,
[data-framer-name="Main"],
[data-framer-name="Hero Section"],
[data-framer-name="Benefits Section"],
[data-framer-name="Process Section"] {
  visibility: visible !important;
  opacity: 1 !important;
}
#framely-splash {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin: 0;
  padding: 24px;
  background:
    radial-gradient(ellipse 70% 55% at 50% 42%, rgba(255, 120, 40, 0.16), transparent 62%),
    #0a0a0a;
  color: #fff;
  transition: opacity 0.55s ease, visibility 0.55s ease;
}
#framely-splash.is-done {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
#framely-splash img {
  width: 84px;
  height: 84px;
  border-radius: 22px;
  object-fit: cover;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
  animation: framely-splash-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
#framely-splash span {
  font: 650 28px/1.1 "Geist", "Inter", system-ui, sans-serif;
  letter-spacing: -0.03em;
  animation: framely-splash-fade 0.7s ease 0.12s both;
}
#framely-splash .framely-splash-line {
  width: min(160px, 42vw);
  height: 2px;
  margin-top: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.12);
  animation: framely-splash-fade 0.7s ease 0.18s both;
}
#framely-splash .framely-splash-line > i {
  display: block;
  width: 0%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ff7a28, #ffb347, #ff7a28);
  background-size: 200% 100%;
  animation:
    framely-splash-load 1.15s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards,
    framely-splash-shimmer 1.1s linear 0.2s infinite;
}
#framely-splash.is-done .framely-splash-line > i {
  width: 100%;
  animation: none;
  background: linear-gradient(90deg, #ff7a28, #ffb347);
}
@keyframes framely-splash-pop {
  from { opacity: 0; transform: scale(0.86); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes framely-splash-fade {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes framely-splash-load {
  0% { width: 0%; }
  70% { width: 78%; }
  100% { width: 100%; }
}
@keyframes framely-splash-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
html.framely-splash-lock,
html.framely-splash-lock body {
  overflow: hidden !important;
}
`;

export const FRAMELY_PRELOAD_HEAD = `
<link rel="preload" as="image" href="/brand/framely-icon.png">
<link rel="preload" as="image" href="/brand/framely-banner.png">
<link rel="preload" as="image" href="/brand/anshul-bhathija.jpg">
`;

export const FRAMELY_PROMO_GUARD_SCRIPT = `<script id="framely-promo-guard">(function(){var B="/brand/framely-banner.png",A="/brand/anshul-bhathija.jpg";function stripTestimonials(){document.querySelectorAll('.ssr-variant:has([data-framer-name="Mobile  1"]),.ssr-variant:has([data-framer-name="Desktop  1"])').forEach(function(e){e.remove();});document.querySelectorAll("div.ssr-variant").forEach(function(e){var t=e.textContent||"";if(t.indexOf("What people are saying")>=0||t.indexOf("Trusted by Innovators")>=0||t.indexOf("Feels like adding superpowers")>=0)e.remove();});["Mobile  1","Desktop  1"].forEach(function(n){document.querySelectorAll('[data-framer-name="'+n+'"]').forEach(function(e){var h=e.closest(".ssr-variant")||e;h.remove();});});}function stripFooter(){document.querySelectorAll("div.ssr-variant").forEach(function(v){var has=v.querySelector('[data-framer-name="Newsletter"],[data-framer-name="CTA Card"],[data-framer-name="Background CTA"]');if(!has)return;if(v.querySelector('[data-framer-name="Copyright"]')){v.querySelectorAll('[data-framer-name="Newsletter"],[data-framer-name="Newsletter Form "]').forEach(function(n){var d=n.closest('[data-framer-name="Container"]')||n;d.remove();});return;}v.remove();});["Newsletter","Background CTA","CTA Card"].forEach(function(n){document.querySelectorAll('[data-framer-name="'+n+'"]').forEach(function(e){var v=e.closest(".ssr-variant");if(v&&v.querySelector('[data-framer-name="Copyright"]')){var d=e.closest('[data-framer-name="Container"]')||e;d.remove();return;}var h=e.closest(".ssr-variant")||e;h.remove();});});document.querySelectorAll('input[placeholder*="email" i]').forEach(function(inp){var f=inp.closest("form")||inp.closest("[data-framer-name]");if(f)f.remove();});}function dropCustomFooter(){var f=document.getElementById("framely-site-footer");if(f)f.remove();}function s(){stripTestimonials();stripFooter();dropCustomFooter();document.querySelectorAll('[data-framer-name="Buy Template Button"],.framer-1k941ea-container,a.framer-gkuFO,.framer-1hdmz1q,#__framer-badge-container,.__framer-badge,a.__framer-badge,[data-framer-name="Another one"]').forEach(function(e){e.remove()});document.querySelectorAll('[data-framer-name="Brand Logo"] img').forEach(function(img){if(img.getAttribute("src")!==B){img.setAttribute("src",B);img.setAttribute("srcset",B+" 668w");img.removeAttribute("sizes");img.alt="Framely";}});document.querySelectorAll('[data-framer-name="Testimonial"] img,[data-framer-name="Avatar"] img').forEach(function(img){if(img.getAttribute("src")!==A){img.setAttribute("src",A);img.setAttribute("srcset",A+" 512w");img.removeAttribute("sizes");img.alt="Anshul Bhathija";}});document.querySelectorAll('img[alt*="logo badge" i]').forEach(function(img){if(!img.closest("#framely-top-logo")){img.src=B;img.alt="Framely";}});document.documentElement.classList.add("framely-branded");}s();})();</script>`;

export const FRAMELY_SPLASH_MARKUP = `<div id="framely-splash" role="presentation" aria-hidden="true"><img src="/brand/framely-icon.png" width="84" height="84" alt="Framely" /><span>Framely</span><div class="framely-splash-line" aria-hidden="true"><i></i></div></div>
<script id="framely-splash-boot">(function(){var html=document.documentElement;html.classList.add("framely-splash-lock");var start=Date.now();var MIN=1200;var MAX=2800;function done(){var el=document.getElementById("framely-splash");if(!el||el.classList.contains("is-done"))return;el.classList.add("is-done");html.classList.remove("framely-splash-lock");setTimeout(function(){el.remove();},600);}function maybe(){var wait=Math.max(0,MIN-(Date.now()-start));setTimeout(done,wait);}if(document.readyState==="complete")maybe();else window.addEventListener("load",maybe);setTimeout(done,MAX);})();</script>`;

export const FRAMELY_CRITICAL_HEAD = `${FRAMELY_PRELOAD_HEAD}<style id="framely-critical">${FRAMELY_CRITICAL_CSS}</style>
${FRAMELY_PROMO_GUARD_SCRIPT}`;