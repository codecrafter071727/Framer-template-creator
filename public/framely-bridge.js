(() => {
  /** Keep in sync with scripts/framely-critical-css.mjs — applied before defer boot to avoid section flash. */
  function injectCriticalChrome() {
    if (document.getElementById("framely-critical")) return;
    const style = document.createElement("style");
    style.id = "framely-critical";
    style.textContent = `
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
.ssr-variant:has([data-framer-name="CTA Card"]):not(:has([data-framer-name="Copyright"])) {
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
[data-framer-name="Newsletter Form "],
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
    `.trim();
    const head = document.head || document.documentElement;
    head.appendChild(style);
  }
  injectCriticalChrome();

  function ensureSplash() {
    if (document.getElementById("framely-splash")) return;
    if (document.documentElement.dataset.framelySplashSkipped === "1") return;
    const splash = document.createElement("div");
    splash.id = "framely-splash";
    splash.setAttribute("role", "presentation");
    splash.setAttribute("aria-hidden", "true");
    splash.innerHTML =
      '<img src="/brand/framely-icon.png" width="84" height="84" alt="Framely" />' +
      "<span>Framely</span>" +
      '<div class="framely-splash-line" aria-hidden="true"><i></i></div>';
    document.documentElement.classList.add("framely-splash-lock");
    const host = document.body || document.documentElement;
    host.prepend(splash);
    const start = Date.now();
    const finish = () => {
      if (!splash.isConnected || splash.classList.contains("is-done")) return;
      splash.classList.add("is-done");
      document.documentElement.classList.remove("framely-splash-lock");
      setTimeout(() => splash.remove(), 600);
    };
    const onReady = () => {
      const wait = Math.max(0, 1200 - (Date.now() - start));
      setTimeout(finish, wait);
    };
    if (document.readyState === "complete") onReady();
    else window.addEventListener("load", onReady);
    setTimeout(finish, 2800);
  }
  ensureSplash();

  const FRAMELY_BANNER = "/brand/framely-banner.png";
  const FRAMELY_AVATAR = "/brand/anshul-bhathija.jpg";
  const FOOTER_CLUTTER_NAMES = ["Newsletter", "Background CTA", "CTA Card"];
  const TESTIMONIAL_CAROUSEL_MARKERS = ["Mobile  1", "Desktop  1"];

  function stripTestimonialsCarousel() {
    document
      .querySelectorAll(
        '[data-framer-name="Main"] > .ssr-variant:has([data-framer-name="Mobile  1"]), [data-framer-name="Main"] > .ssr-variant:has([data-framer-name="Desktop  1"]), .ssr-variant:has([data-framer-name="Mobile  1"]), .ssr-variant:has([data-framer-name="Desktop  1"])',
      )
      .forEach((el) => el.remove());
    document.querySelectorAll("div.ssr-variant").forEach((el) => {
      const text = el.textContent || "";
      if (
        text.includes("What people are saying") ||
        text.includes("Trusted by Innovators") ||
        text.includes("Feels like adding superpowers")
      ) {
        el.remove();
      }
    });
    for (const name of TESTIMONIAL_CAROUSEL_MARKERS) {
      document.querySelectorAll(`[data-framer-name="${name}"]`).forEach((el) => {
        const host = el.closest(".ssr-variant") || el;
        host.remove();
      });
    }
  }

  function stripFooterClutter() {
    document.querySelectorAll("div.ssr-variant").forEach((el) => {
      const hasPromo = FOOTER_CLUTTER_NAMES.some((name) =>
        el.querySelector(`[data-framer-name="${name}"]`),
      );
      if (!hasPromo) return;
      if (el.querySelector('[data-framer-name="Copyright"]')) {
        el
          .querySelectorAll(
            '[data-framer-name="Newsletter"], [data-framer-name="Newsletter Form "]',
          )
          .forEach((node) => {
            const drop =
              node.closest('[data-framer-name="Container"]') || node;
            drop.remove();
          });
        return;
      }
      el.remove();
    });
    for (const name of FOOTER_CLUTTER_NAMES) {
      document.querySelectorAll(`[data-framer-name="${name}"]`).forEach((el) => {
        const variant = el.closest(".ssr-variant");
        if (variant?.querySelector('[data-framer-name="Copyright"]')) {
          const drop = el.closest('[data-framer-name="Container"]') || el;
          drop.remove();
          return;
        }
        const host = el.closest(".ssr-variant") || el;
        host.remove();
      });
    }
    document.querySelectorAll('input[placeholder*="email" i]').forEach((input) => {
      const block = input.closest("form") || input.closest("[data-framer-name]");
      if (block) block.remove();
    });
  }

  function removeCustomSiteFooter() {
    document.getElementById("framely-site-footer")?.remove();
  }

  function applyInstantBrand() {
    stripTestimonialsCarousel();
    stripFooterClutter();
    removeCustomSiteFooter();
    document
      .querySelectorAll(
        '[data-framer-name="Buy Template Button"], .framer-1k941ea-container, a.framer-gkuFO, .framer-1hdmz1q, #__framer-badge-container, .__framer-badge, a.__framer-badge, [data-framer-name="Another one"]',
      )
      .forEach((el) => el.remove());

    document.querySelectorAll('[data-framer-name="Brand Logo"] img').forEach((img) => {
      if (img.getAttribute("src") !== FRAMELY_BANNER) {
        img.setAttribute("src", FRAMELY_BANNER);
        img.setAttribute("srcset", `${FRAMELY_BANNER} 668w`);
        img.removeAttribute("sizes");
      }
      img.alt = "Framely";
    });

    document
      .querySelectorAll('[data-framer-name="Testimonial"] img, [data-framer-name="Avatar"] img')
      .forEach((img) => {
        if (img.getAttribute("src") !== FRAMELY_AVATAR) {
          img.setAttribute("src", FRAMELY_AVATAR);
          img.setAttribute("srcset", `${FRAMELY_AVATAR} 512w`);
          img.removeAttribute("sizes");
        }
        img.alt = "Anshul Bhathija";
      });

    document.querySelectorAll('img[alt*="logo badge" i]').forEach((img) => {
      if (img.closest("#framely-top-logo")) return;
      img.src = FRAMELY_BANNER;
      img.alt = "Framely";
    });

    document.documentElement.classList.add("framely-branded");
  }

  let promoGuardPending = false;
  function purgeFramerPromo() {
    if (promoGuardPending) return;
    promoGuardPending = true;
    requestAnimationFrame(() => {
      promoGuardPending = false;
      applyInstantBrand();
    });
  }
  purgeFramerPromo();

  const PLACEHOLDER = "Paste a published Framer URL to download the zip…";
  const STATUS_ID = "framely-status";

  /** Homepage keeps hero, benefits, process, convert panel, footer. */
  const KEEP_SECTIONS = new Set([
    "Hero Section",
    "Benefits Section",
    "Process Section",
  ]);

  const HIDE_SECTION_NAMES = [
    "Introduction Section",
    "Security Section",
    "Features Section",
    "Pricing Section",
    "Integrations Section",
    "FAQ Section",
    "Newsletter",
    "Background CTA",
    "CTA Card",
    "Mobile  1",
    "Desktop  1",
    "Navbar",
    "Navigation",
    "Nav Trigger",
  ];

  function ensureStatus() {
    let el = document.getElementById(STATUS_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = STATUS_ID;
    el.setAttribute(
      "style",
      [
        "position:fixed",
        "left:50%",
        "bottom:28px",
        "transform:translateX(-50%)",
        "z-index:2147483000",
        "max-width:min(520px,92vw)",
        "padding:12px 16px",
        "border-radius:14px",
        "background:rgba(20,20,20,0.92)",
        "color:#fff",
        "font:600 13px/1.4 Geist,system-ui,sans-serif",
        "box-shadow:0 16px 40px rgba(0,0,0,.35)",
        "backdrop-filter:blur(12px)",
        "display:none",
        "text-align:center",
      ].join(";"),
    );
    document.body.appendChild(el);
    return el;
  }

  function setStatus(message, show = true) {
    const el = ensureStatus();
    el.textContent = message;
    el.style.display = show ? "block" : "none";
  }

  function looksLikeUrl(value) {
    try {
      const u = new URL(value.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  const PENDING_EXTRACT_KEY = "framely_pending_extract";
  let authSnapshot = null;

  async function loadAuthState() {
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      if (!res.ok) return { configured: false, required: false, user: null };
      return await res.json();
    } catch {
      return { configured: false, required: false, user: null };
    }
  }

  function ensureLoginModal() {
    let root = document.getElementById("framely-login-modal");
    if (root) return root;

    root = document.createElement("div");
    root.id = "framely-login-modal";
    root.hidden = true;
    root.innerHTML = `
      <div class="framely-login-backdrop" data-framely-close="1"></div>
      <div class="framely-login-dialog" role="dialog" aria-labelledby="framely-login-title" aria-modal="true">
        <button type="button" class="framely-login-close" data-framely-close="1" aria-label="Close">×</button>
        <img src="/brand/framely-icon.png" alt="" width="48" height="48" style="border-radius:12px;margin:0 auto 12px;display:block" />
        <h2 id="framely-login-title">Sign in to extract</h2>
        <p class="framely-login-copy">Use Google to download your Framer site zip. We only use your email to identify your account.</p>
        <a class="framely-login-google" id="framely-login-google-btn" href="/api/auth/google">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.653 32.657 29.083 36 24 36c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.314 0 6.314 1.286 8.485 3.515l5.657-5.657C34.858 5.955 29.7 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.659-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 16.108 18.961 13 24 13c3.314 0 6.314 1.286 8.485 3.515l5.657-5.657C34.858 5.955 29.7 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.167 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.543 5.036C9.5 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.07 12.07 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.659-.389-3.917z"/></svg>
          Continue with Google
        </a>
        <p class="framely-login-foot" id="framely-login-foot"></p>
      </div>
    `;
    document.body.appendChild(root);

    if (!document.getElementById("framely-login-style")) {
      const style = document.createElement("style");
      style.id = "framely-login-style";
      style.textContent = `
        #framely-login-modal { position:fixed; inset:0; z-index:2147483646; display:flex; align-items:center; justify-content:center; padding:24px; }
        #framely-login-modal[hidden] { display:none !important; }
        .framely-login-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.62); backdrop-filter:blur(6px); }
        .framely-login-dialog { position:relative; z-index:1; width:min(400px,100%); padding:28px 24px 24px; border-radius:20px; background:#111; color:#fff; box-shadow:0 24px 80px rgba(0,0,0,.45); text-align:center; border:1px solid rgba(255,255,255,.08); }
        .framely-login-dialog h2 { margin:0 0 8px; font:700 22px/1.2 Geist,system-ui,sans-serif; letter-spacing:-0.02em; }
        .framely-login-copy { margin:0 0 20px; font:400 14px/1.5 Geist,system-ui,sans-serif; color:rgba(255,255,255,.65); }
        .framely-login-google { display:inline-flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:12px 16px; border-radius:12px; background:#fff; color:#111; font:600 15px/1 Geist,system-ui,sans-serif; text-decoration:none; box-shadow:0 8px 24px rgba(0,0,0,.25); }
        .framely-login-google:hover { background:#f5f5f5; }
        .framely-login-foot { margin:14px 0 0; font:500 12px/1.4 Geist,system-ui,sans-serif; color:rgba(255,255,255,.45); min-height:1.2em; }
        .framely-login-close { position:absolute; top:10px; right:12px; border:0; background:transparent; color:rgba(255,255,255,.55); font-size:22px; cursor:pointer; line-height:1; padding:4px 8px; }
      `;
      document.head.appendChild(style);
    }

    root.addEventListener("click", (event) => {
      const t = event.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-framely-close]")) hideLoginModal();
    });

    return root;
  }

  function hideLoginModal() {
    const root = document.getElementById("framely-login-modal");
    if (root) root.hidden = true;
  }

  function showLoginModal(pendingUrl) {
    authSnapshot = authSnapshot || { required: true, configured: true, user: null };
    if (pendingUrl) sessionStorage.setItem(PENDING_EXTRACT_KEY, pendingUrl);

    const root = ensureLoginModal();
    const returnTo = `${location.pathname}${location.search}`;
    const btn = root.querySelector("#framely-login-google-btn");
    const foot = root.querySelector("#framely-login-foot");
    if (btn) {
      const configured = authSnapshot.configured !== false;
      if (configured) {
        btn.setAttribute(
          "href",
          `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
        );
        btn.onclick = null;
        btn.style.opacity = "";
        btn.style.pointerEvents = "";
      } else {
        btn.setAttribute("href", "#");
        btn.style.opacity = "0.85";
        btn.onclick = (event) => {
          event.preventDefault();
          setStatus(
            "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local, then restart npm run dev",
          );
        };
      }
    }
    if (foot) {
      if (authSnapshot.required && authSnapshot.configured === false) {
        foot.textContent =
          "Google OAuth keys missing on the server — modal works, but Continue needs your Client ID & secret.";
      } else {
        foot.textContent = "After sign-in, your extract will start automatically.";
      }
    }
    root.hidden = false;
    setStatus("Sign in with Google to download your zip", true);
  }

  async function ensureSignedIn(pendingUrl) {
    authSnapshot = await loadAuthState();
    if (!authSnapshot.required) return true;
    if (authSnapshot.user) return true;
    showLoginModal(pendingUrl || "");
    return false;
  }

  async function pollJob(jobId) {
    for (;;) {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to read job status");
      const job = await res.json();
      const detail = job.progress?.detail || job.progress?.step || job.status;
      const pct = job.progress?.percent ?? 0;
      setStatus(`Framely · ${job.status} ${pct}% — ${detail}`);
      if (job.status === "completed") return job;
      if (job.status === "failed") {
        throw new Error(job.error || "Extract failed");
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  async function extractAndDownload(url) {
    if (!(await ensureSignedIn(url))) return;
    hideLoginModal();
    setStatus("Framely · starting extract…");
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ url, maxPages: 15 }),
    });
    const raw = await res.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(raw || `Extract failed (${res.status})`);
    }
    if (res.status === 401) {
      showLoginModal(url);
      throw new Error("Sign in with Google to extract");
    }
    if (!res.ok || !data.jobId) {
      throw new Error(data.error || "Could not start extract");
    }
    const job = await pollJob(data.jobId);
    setStatus("Framely · downloading zip…");
    const a = document.createElement("a");
    a.href = job.resultBlobUrl || `/api/jobs/${job.id}/download`;
    a.download = job.downloadName || "framely-extract.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus("Framely · zip ready. Download started.", true);
    setTimeout(() => setStatus("", false), 4000);
  }

  function findHeroPrompt() {
    const areas = Array.from(
      document.querySelectorAll('textarea[name="Prompt"], textarea.framer-form-input'),
    );
    return (
      areas.find((el) => {
        const ph = (el.getAttribute("placeholder") || "").toLowerCase();
        return (
          ph.includes("create today") ||
          ph.includes("framer") ||
          ph.includes("paste")
        );
      }) || areas[0] || null
    );
  }

  /** @type {Array<[string, string]> | null} */
  let copyReplacements = null;

  async function loadReplacements() {
    if (copyReplacements) return copyReplacements;
    try {
      const res = await fetch("/framely-replacements.json", { cache: "no-store" });
      if (res.ok) {
        copyReplacements = await res.json();
        return copyReplacements;
      }
    } catch {
      // ignore
    }
    copyReplacements = [];
    return copyReplacements;
  }

  function applyRuntimeCopy(pairs) {
    const root = document.getElementById("main");
    if (!root || !pairs.length) return;
    for (const [from, to] of pairs) {
      if (!from || from.length < 2) continue;
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
      );
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue || !node.nodeValue.includes(from)) continue;
        if (node.parentElement?.closest("#framely-top-logo")) continue;
        node.nodeValue = node.nodeValue.split(from).join(to);
      }
    }
  }

  function footerBlock(el) {
    return Boolean(
      el.querySelector('[data-framer-name="Copyright"]') ||
        el.querySelector('a[href="/privacy"], a[href="/terms"]') ||
        el.querySelector('[data-framer-name="Social Link Grid"]'),
    );
  }

  function markHidden(el) {
    if (!el || el.id === "framely-top-logo" || el.id === "main") return;
    const name = el.getAttribute("data-framer-name") || "";
    if (KEEP_SECTIONS.has(name) || footerBlock(el)) return;
    for (const keep of KEEP_SECTIONS) {
      if (el.querySelector(`[data-framer-name="${keep}"]`) && name !== keep) return;
    }

    el.setAttribute("data-framely-hide", "1");
  }

  function trimMainLayout() {
    const layout = document.querySelector('[data-framer-name="Main"]');
    if (!layout) return;

    for (const child of [...layout.children]) {
      const name = child.getAttribute("data-framer-name") || "";
      if (KEEP_SECTIONS.has(name)) continue;
      markHidden(child);
    }
  }

  function trimPageChrome() {
    const root = document.getElementById("main");
    if (!root) return;

    for (const child of [...root.children]) {
      if (footerBlock(child)) continue;
      if (child.querySelector('[data-framer-name="Main"]')) continue;
      markHidden(child);
    }
  }

  function createConvertWhitePanel() {
    const panel = document.createElement("div");
    panel.id = "framely-panel-convert";
    panel.className = "framely-panel__inner";
    panel.innerHTML = `
      <p class="framely-eyebrow">Output</p>
      <p class="framely-eyebrow-muted">(What ships in your zip)</p>
      <h2 class="framely-panel-title">Production-ready Next.js, not a screenshot.</h2>
      <ul class="framely-panel-list">
        <li>
          <span class="framely-panel-num">01</span>
          <div>
            <strong>Complete asset pack</strong>
            <p>HTML, JS, CSS, fonts, images, and media from your published Framer URL — offline in one zip.</p>
          </div>
        </li>
        <li>
          <span class="framely-panel-num">02</span>
          <div>
            <strong>Structure + motion metadata</strong>
            <p>Manifests, tokens, layout hierarchy, and animation hints so convert stays faithful to what Framer shipped.</p>
          </div>
        </li>
        <li>
          <span class="framely-panel-num">03</span>
          <div>
            <strong>Optional AI convert</strong>
            <p>Describe your stack and download a Next.js or React project tuned for App Router and your deploy target.</p>
          </div>
        </li>
      </ul>
      <p class="framely-panel-foot">Paste your Framer URL above — extract is free, no editor access required.</p>
    `;
    return panel;
  }

  function withPreservedScroll(fn) {
    const x = window.scrollX;
    const y = window.scrollY;
    try {
      fn();
    } finally {
      if (window.scrollX !== x || window.scrollY !== y) {
        window.scrollTo(x, y);
      }
    }
  }

  function needsChromeRefresh() {
    const layout = document.querySelector('[data-framer-name="Main"]');
    if (!layout) return false;
    const stack = document.getElementById("framely-panel-stack");
    const benefits = layout.querySelector(
      '[data-framer-name="Benefits Section"]',
    );
    const process = layout.querySelector(
      '[data-framer-name="Process Section"]',
    );
    if (!document.getElementById("framely-top-logo")) return true;
    if (!stack) return Boolean(benefits && process);
    if (benefits && !stack.contains(benefits)) return true;
    if (process && !stack.contains(process)) return true;
    return false;
  }

  function mountPanelLayout() {
    const layout = document.querySelector('[data-framer-name="Main"]');
    const hero = layout?.querySelector('[data-framer-name="Hero Section"]');
    const benefits = layout?.querySelector('[data-framer-name="Benefits Section"]');
    const process = layout?.querySelector('[data-framer-name="Process Section"]');
    if (!layout || !hero || !benefits || !process) return;

    let stack = document.getElementById("framely-panel-stack");
    // Framer hydrate can remount sections outside our stack — rebuild when that happens.
    if (stack && stack.contains(benefits) && stack.contains(process)) return;
    if (stack) stack.remove();

    stack = document.createElement("div");
    stack.id = "framely-panel-stack";

    const whiteTop = document.createElement("div");
    whiteTop.className = "framely-panel framely-panel--light";
    whiteTop.appendChild(benefits);

    const blackMid = document.createElement("div");
    blackMid.className = "framely-panel framely-panel--dark";
    blackMid.appendChild(process);

    const whiteBottom = document.createElement("div");
    whiteBottom.className = "framely-panel framely-panel--light";
    whiteBottom.appendChild(createConvertWhitePanel());

    stack.append(whiteTop, blackMid, whiteBottom);

    hero.insertAdjacentElement("afterend", stack);
    stampFooterCurve();
  }

  function stampFooterCurve() {
    const main = document.getElementById("main");
    if (!main) return;
    removeCustomSiteFooter();
    const copyright = document.querySelector('[data-framer-name="Copyright"]');
    if (!copyright) return;

    let footer = copyright;
    while (footer.parentElement && footer.parentElement !== main) {
      footer = footer.parentElement;
    }
    if (footer.parentElement === main) {
      footer.id = "framely-footer-curve";
    }
  }

  function simplifyLandingPage() {
    for (const name of HIDE_SECTION_NAMES) {
      document
        .querySelectorAll(`[data-framer-name="${name}"]`)
        .forEach((el) => markHidden(el));
    }

    document.querySelectorAll("[data-framer-name$=' Section']").forEach((el) => {
      const name = el.getAttribute("data-framer-name") || "";
      if (!KEEP_SECTIONS.has(name)) markHidden(el);
    });

    trimMainLayout();
    trimPageChrome();
  }

  function hidePricingAndCareers() {
    document
      .querySelectorAll(
        'a[href="/pricing"], a[href="/careers"], a[href="/pricing/"], a[href="/careers/"]',
      )
      .forEach((el) => {
        markHidden(el.closest("[data-framer-name]") || el);
      });

    document
      .querySelectorAll(
        '[data-framer-name="Pricing Section"], [data-framer-name^="Pricing Monthly"], [data-framer-name="Price Wrap"]',
      )
      .forEach((el) => markHidden(el));

  }

  function removeLaunchClutter() {
    const root = document.getElementById("main");
    if (!root) return;
    simplifyLandingPage();
    hidePricingAndCareers();
    root.querySelectorAll("a, button").forEach((el) => {
      const label = (el.textContent || "").trim().toLowerCase();
      const href = (el.getAttribute("href") || "").toLowerCase();
      if (
        label.includes("get this template") ||
        label.includes("remixfor free") ||
        label.includes("made in framer") ||
        label.includes("n!nhstudio") ||
        label.includes("create a free website with framer") ||
        label.includes("join our newsletter") ||
        href.includes("framer.com/projects") ||
        href.includes("framer.link")
      ) {
        el.style.display = "none";
      }
    });

    // Saino logo badge art → Framely (hide outside hero; hero handled in rebrandHeroWordmark)
    document.querySelectorAll('img[alt*="logo badge" i]').forEach((img) => {
      if (img.closest("#framely-top-logo")) return;
      img.src = "/brand/framely-banner.png";
      img.alt = "Framely";
      const host = img.closest("[data-framer-name]") || img.parentElement;
      if (img.closest('[data-framer-name="Hero Section"]')) return;
      if (host) host.style.visibility = "hidden";
    });

    stripTestimonialsCarousel();
    stripFooterClutter();
  }

  function rebrandFooterWordmark() {
    const banner = "/brand/framely-banner.png";
    document.querySelectorAll('a[data-framer-name="Brand Logo"]').forEach((a) => {
      a.style.width = "min(240px, max(210px, 28vw))";
    });
    document.querySelectorAll('[data-framer-name="Brand Logo"] img').forEach((img) => {
      img.src = banner;
      img.srcset = `${banner} 668w`;
      img.removeAttribute("sizes");
      img.alt = "Framely";
    });
  }

  function rebrandBenefitsTestimonial() {
    const photo = "/brand/anshul-bhathija.jpg";
    const testimonial = document.querySelector(
      '[data-framer-name="Benefits Section"] [data-framer-name="Testimonial"]',
    );
    if (!testimonial) return;

    const nameHost = testimonial.querySelector('[data-framer-name="Name"]');
    if (nameHost) {
      const textEl = nameHost.querySelector(".framer-text") || nameHost;
      textEl.textContent = "Anshul Bhathija";
    }

    const roleHost = testimonial.querySelector('[data-framer-name="Role"]');
    if (roleHost) {
      const textEl = roleHost.querySelector(".framer-text") || roleHost;
      textEl.textContent = "Engineering lead";
    }

    testimonial.querySelectorAll("img").forEach((img) => {
      img.src = photo;
      img.srcset = `${photo} 512w`;
      img.removeAttribute("sizes");
      img.alt = "Anshul Bhathija";
      img.style.objectFit = "cover";
      img.style.objectPosition = "center 22%";
    });
  }

  function mountHeroLogo() {
    const hero = document.querySelector('[data-framer-name="Hero Section"]');
    if (!hero) return null;

    let wrap = document.getElementById("framely-top-logo");
    if (!wrap) {
      wrap = document.createElement("a");
      wrap.id = "framely-top-logo";
      wrap.href = "/";
      wrap.innerHTML =
        '<img src="/brand/framely-icon.png" alt="Framely" />' +
        '<span>Framely</span>';
    }

    const img = wrap.querySelector("img");
    const label = wrap.querySelector("span");
    if (img) {
      img.width = 48;
      img.height = 48;
      img.alt = "Framely";
    }
    if (label) {
      label.textContent = "Framely";
    }

    const header = hero.querySelector('header[data-framer-name="Default"]');
    const host = header || hero;
    if (!host.contains(wrap)) host.appendChild(wrap);
    wrap.classList.add("framely-ready");

    return wrap;
  }

  function wireHeroLogoScroll() {
    const logo = document.getElementById("framely-top-logo");
    const hero = document.querySelector('[data-framer-name="Hero Section"]');
    if (!logo || !hero) return;
    if (logo.dataset.framelyScrollWired) return;
    logo.dataset.framelyScrollWired = "1";

    const update = () => {
      const threshold = Math.min(120, Math.max(40, hero.offsetHeight * 0.08));
      logo.classList.toggle("is-floating", window.scrollY > threshold);
    };

    // Stay on the same page when already home — avoid a hard reload to the hero.
    logo.addEventListener("click", (event) => {
      if (location.pathname !== "/" && location.pathname !== "") return;
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function rebrandHeroWordmark() {
    const banner = "/brand/framely-banner.png";
    const hero = document.querySelector('[data-framer-name="Hero Section"]');
    if (!hero) return;

    const brand = hero.querySelector('header [data-framer-name="Brand"]');
    if (brand) brand.style.display = "none";

    hero.querySelectorAll('img[alt*="logo badge" i]').forEach((img) => {
      img.src = banner;
      img.alt = "Framely";
      const host = img.closest("[data-framer-name]") || img.parentElement;
      if (host) {
        host.style.visibility = "visible";
        host.style.opacity = "1";
      }
    });
  }

  function brandChrome() {
    if (document.documentElement.dataset.framelyChromeDone === "1") return;
    withPreservedScroll(() => {
      brandChromeInner();
    });
  }

  function brandChromeInner() {
    applyInstantBrand();
    document.title = "Framely — Framer to Next.js";

    // Favicon / tab icon → Framely F
    document
      .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((link) => link.remove());
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/png";
    icon.href = "/brand/framely-icon.png";
    document.head.appendChild(icon);
    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = "/brand/framely-icon.png";
    document.head.appendChild(apple);

    if (!document.getElementById("framely-brand-style")) {
      const style = document.createElement("style");
      style.id = "framely-brand-style";
      style.textContent = `
        #framely-top-logo {
          position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
          z-index: 2147483000; display: flex; align-items: center; gap: 10px;
          padding: 8px 16px; border-radius: 999px;
          background: rgba(10,10,10,0.72); backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,.35); text-decoration: none;
        }
        a[href="/manifesto"], a[href="/careers"], a[href="/pricing"],
        a[href="/manifesto/"], a[href="/careers/"], a[href="/pricing/"] {
          display: none !important;
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
        [data-framer-name="Buy Template Button"],
        .framer-1k941ea-container,
        [data-framely-hide="1"] {
          display: none !important;
          visibility: hidden !important;
          max-height: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        #framely-panel-stack {
          width: 100%;
          display: flex !important;
          flex-direction: column;
          gap: 0;
          max-height: none !important;
          visibility: visible !important;
          overflow: visible !important;
        }
        .framely-panel--light {
          background: #eeeee9;
          padding-block: clamp(12px, 2.5vw, 28px);
          padding-inline: clamp(16px, 4vw, 40px);
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] {
          background: #fff;
          border-radius: clamp(32px, 5vw, 56px);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.07);
          max-width: min(1160px, 100%);
          margin: 0 auto;
          padding-block: clamp(10px, 1.8vw, 18px);
          padding-inline: clamp(24px, 5vw, 56px);
        }
        #framely-panel-convert.framely-panel__inner {
          background: #fff;
          border-radius: clamp(32px, 5vw, 56px);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.07);
          max-width: min(1160px, 100%);
          margin: 0 auto;
          padding: clamp(36px, 6vw, 72px) clamp(24px, 5vw, 56px);
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Cards"] {
          transform: scaleY(0.88) scaleX(1);
          transform-origin: center top;
          margin-bottom: -40px !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] h2 {
          margin-block: 0 0.25em !important;
          line-height: 1.05 !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Heading Layout"],
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Heading Wrap"],
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Content Wrap"] {
          gap: 6px !important;
          padding-block: 0 !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Testimonial"] {
          margin-top: clamp(8px, 1.5vw, 18px) !important;
          margin-inline: auto !important;
          width: 100% !important;
          max-width: min(720px, 92%) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
        }
        .framely-panel--dark {
          position: relative;
          z-index: 2;
          background: #0b0b0b;
          padding: clamp(48px, 8vw, 100px) clamp(16px, 4vw, 32px);
          width: 100%;
          overflow: hidden;
          border-radius: clamp(64px, 14vw, 112px);
          margin-block: clamp(8px, 1.5vw, 20px);
        }
        #framely-panel-stack > .framely-panel--light:last-of-type {
          position: relative;
          z-index: 1;
          padding-bottom: clamp(20px, 4vw, 40px);
        }
        #framely-footer-curve {
          position: relative;
          z-index: 2;
          background: #0b0b0b !important;
          overflow: hidden;
          border-radius: clamp(64px, 14vw, 112px) clamp(64px, 14vw, 112px) 0 0;
          margin-top: clamp(-20px, -2vw, -8px);
          padding-top: clamp(20px, 4vw, 48px) !important;
        }
        a[data-framer-name="Brand Logo"] {
          width: clamp(210px, 28vw, 240px) !important;
          max-width: 88vw;
        }
        a[data-framer-name="Brand Logo"] [data-framer-name="Logo"] {
          width: 100% !important;
        }
        /* Template Saino SVG sits in the hero header; we use #framely-top-logo instead */
        [data-framer-name="Hero Section"] header [data-framer-name="Brand"] {
          display: none !important;
        }
        .framely-panel--dark > [data-framer-name="Process Section"] {
          max-width: min(1160px, 100%);
          margin: 0 auto;
        }
        .framely-eyebrow {
          margin: 0 0 4px;
          font: 600 13px/1.4 Geist, system-ui, sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a8a85;
        }
        .framely-eyebrow-muted {
          margin: 0 0 20px;
          font: 400 15px/1.5 Geist, system-ui, sans-serif;
          color: rgba(0, 0, 0, 0.45);
        }
        .framely-panel-title {
          margin: 0 0 36px;
          font: 400 clamp(32px, 5vw, 48px) / 1.08 ui-serif, "Instrument Serif", Georgia, serif;
          letter-spacing: -0.03em;
          color: #111;
        }
        .framely-panel-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .framely-panel-list li {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 20px;
          align-items: start;
        }
        .framely-panel-num {
          font: 600 13px/1 Geist, system-ui, sans-serif;
          color: rgba(0, 0, 0, 0.35);
        }
        .framely-panel-list strong {
          display: block;
          margin-bottom: 6px;
          font: 600 18px/1.3 Geist, system-ui, sans-serif;
          color: #111;
        }
        .framely-panel-list p {
          margin: 0;
          font: 400 15px/1.55 Geist, system-ui, sans-serif;
          color: rgba(0, 0, 0, 0.55);
        }
        .framely-panel-foot {
          margin: 40px 0 0;
          padding-top: 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          font: 500 14px/1.5 Geist, system-ui, sans-serif;
          color: rgba(0, 0, 0, 0.5);
          text-align: center;
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById("framely-testimonial-style-v3")) {
      document.getElementById("framely-testimonial-style")?.remove();
      document.getElementById("framely-testimonial-style-v2")?.remove();
      const testimonialStyle = document.createElement("style");
      testimonialStyle.id = "framely-testimonial-style-v3";
      testimonialStyle.textContent = `
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Testimonial"] {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          margin-inline: auto !important;
          width: 100% !important;
          max-width: min(720px, 92%) !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Quote"] {
          width: 100% !important;
          text-align: center !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Quote"] .framer-text {
          text-align: center !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Person"] {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Person"] > div {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Info"],
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Name"],
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Role"] {
          text-align: center !important;
          align-items: center !important;
        }
        .framely-panel--light > [data-framer-name="Benefits Section"] [data-framer-name="Avatar"] img {
          object-fit: cover !important;
          object-position: center 22% !important;
        }
      `;
      document.head.appendChild(testimonialStyle);
    }

    if (!document.getElementById("framely-hero-logo-style-v5")) {
      document.getElementById("framely-hero-logo-style")?.remove();
      document.getElementById("framely-hero-logo-style-v2")?.remove();
      document.getElementById("framely-hero-logo-style-v3")?.remove();
      document.getElementById("framely-hero-logo-style-v4")?.remove();
      const logoStyle = document.createElement("style");
      logoStyle.id = "framely-hero-logo-style-v5";
      logoStyle.textContent = `
        [data-framer-name="Hero Section"] {
          position: relative !important;
        }
        [data-framer-name="Hero Section"] header[data-framer-name="Default"] {
          position: relative !important;
          min-height: clamp(64px, 10vw, 88px);
        }
        #framely-top-logo {
          position: absolute !important;
          top: clamp(4px, 1.2vw, 12px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 6 !important;
          display: flex !important;
          align-items: center !important;
          gap: 14px !important;
          padding: 12px 34px !important;
          min-width: min(260px, 78vw) !important;
          justify-content: center !important;
          border-radius: 999px !important;
          background: transparent !important;
          backdrop-filter: none !important;
          box-shadow: none !important;
          text-decoration: none !important;
          transition:
            top 0.22s ease,
            box-shadow 0.22s ease,
            background 0.22s ease,
            backdrop-filter 0.22s ease,
            padding 0.22s ease;
        }
        #framely-top-logo img {
          width: 48px !important;
          height: 48px !important;
          border-radius: 12px !important;
          display: block !important;
        }
        #framely-top-logo span {
          font: 700 22px/1 Geist, system-ui, sans-serif !important;
          letter-spacing: -0.03em !important;
          color: #fff !important;
        }
        #framely-top-logo.is-floating {
          position: fixed !important;
          top: 14px !important;
          z-index: 2147483000 !important;
          padding: 10px 18px !important;
          min-width: unset !important;
          background: rgba(10, 10, 10, 0.72) !important;
          backdrop-filter: blur(10px) !important;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45) !important;
        }
        #framely-top-logo.is-floating img {
          width: 40px !important;
          height: 40px !important;
        }
        #framely-top-logo.is-floating span {
          font-size: 20px !important;
        }
      `;
      document.head.appendChild(logoStyle);
    }

    mountHeroLogo();
    wireHeroLogoScroll();

    removeLaunchClutter();
    rebrandFooterWordmark();
    rebrandHeroWordmark();
    rebrandBenefitsTestimonial();
    mountPanelLayout();
    removeCustomSiteFooter();
    stampFooterCurve();
    document.documentElement.dataset.framelyChromeDone = "1";
  }

  function wireGetStartedActions() {
    if (document.documentElement.dataset.framelyClickWired) return;
    document.documentElement.dataset.framelyClickWired = "1";
    document.addEventListener(
      "click",
      async (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const btn = target.closest("button, a, [role='button']");
        if (!btn) return;
        const label = (btn.textContent || "").trim().toLowerCase();
        if (!label.includes("get started") && !label.includes("extract")) return;

        const inHero = btn.closest('[data-framer-name="Hero Section"]');
        if (!inHero) return;

        const area = findHeroPrompt();
        const value = (area?.value || "").trim();

        event.preventDefault();
        event.stopImmediatePropagation();
        if (!(await ensureSignedIn(value))) return;
        if (!looksLikeUrl(value)) {
          setStatus("Paste a full Framer URL (https://…) then tap Get Started");
          return;
        }
        try {
          await extractAndDownload(value);
        } catch (err) {
          setStatus(err instanceof Error ? err.message : "Extract failed");
        }
      },
      true,
    );
  }

  function wireHeroChat() {
    wireGetStartedActions();

    const textarea = findHeroPrompt();
    if (!textarea) return false;

    textarea.setAttribute("placeholder", PLACEHOLDER);
    textarea.setAttribute("name", "FramerURL");

    const form = textarea.closest("form");
    if (form && !form.dataset.framelyWired) {
      form.dataset.framelyWired = "1";
      form.addEventListener(
        "submit",
        async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const value = textarea.value.trim();
          if (!(await ensureSignedIn(value))) return;
          if (!looksLikeUrl(value)) {
            setStatus("Paste a full Framer URL (https://…)");
            return;
          }
          try {
            await extractAndDownload(value);
          } catch (err) {
            setStatus(err instanceof Error ? err.message : "Extract failed");
          }
        },
        true,
      );
    }

    return true;
  }

  async function resumePendingExtract() {
    const params = new URLSearchParams(location.search);
    if (!params.has("signed_in")) return;
    const pending = sessionStorage.getItem(PENDING_EXTRACT_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_EXTRACT_KEY);
    params.delete("signed_in");
    const q = params.toString();
    history.replaceState({}, "", location.pathname + (q ? `?${q}` : "") + location.hash);
    try {
      await extractAndDownload(pending);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Extract failed");
    }
  }

  async function boot() {
    wireGetStartedActions();
    brandChrome();
    wireHeroChat();
    loadReplacements()
      .then((pairs) => applyRuntimeCopy(pairs))
      .catch(() => {});
    authSnapshot = await loadAuthState();
    await resumePendingExtract();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      boot().catch(() => {});
    });
  } else {
    boot().catch(() => {});
  }

  // Re-apply Framely chrome after Framer hydrates — only when DOM was remounted.
  // Blindly clearing the flag + remounting panels was jumping scroll back to the hero.
  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";
  } catch {
    /* ignore */
  }

  let hydrateTries = 0;
  const hydrateTimer = setInterval(() => {
    hydrateTries += 1;
    if (needsChromeRefresh()) {
      document.documentElement.dataset.framelyChromeDone = "";
      brandChrome();
    } else {
      applyInstantBrand();
    }
    wireHeroChat();
    if (hydrateTries >= 6) clearInterval(hydrateTimer);
  }, 700);
})();
