import dns from "node:dns/promises";
import net from "node:net";
import { assertSafeUrl, isPrivateIp } from "@/lib/ssrf";

// Avoid static playwright imports — they break Vercel packaging (browsers.json).
type Browser = Awaited<
  ReturnType<
    Awaited<typeof import("playwright-core")>["chromium"]["launch"]
  >
>;
type Page = Awaited<ReturnType<Browser["newPage"]>>;
type PWResponse = NonNullable<Awaited<ReturnType<Page["goto"]>>>;

async function launchBrowser(): Promise<Browser> {
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );

  if (isServerless) {
    // playwright-core packaging on Vercel Hobby often omits browsers.json.
    // Prefer @sparticuz/chromium when available; otherwise fail into fetch fallback.
    try {
      const [{ default: chromium }, pwMod] = await Promise.all([
        import("@sparticuz/chromium"),
        import("playwright-core"),
      ]);
      const pw = pwMod.chromium;
      return await pw.launch({
        args: [...chromium.args, "--disable-dev-shm-usage", "--no-sandbox"],
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } catch (error) {
      throw new Error(
        `Serverless browser unavailable (${
          error instanceof Error ? error.message : "unknown"
        }). Falling back to fetch extraction.`,
      );
    }
  }

  try {
    const full = await import("playwright");
    return full.chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
  } catch {
    const { chromium: pw } = await import("playwright-core");
    return pw.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
      channel: "chrome",
    });
  }
}

export type CapturedResource = {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string | null;
  body: Buffer;
  resourceType: string;
};

export type DomContentMap = {
  headings: Array<{ tag: string; text: string }>;
  paragraphs: string[];
  ctas: string[];
  images: Array<{ src: string; alt: string }>;
  sections: Array<{ name: string; text: string }>;
};

export type FramerLayer = {
  name: string;
  componentType: string | null;
  text: string;
  bounds: { x: number; y: number; width: number; height: number };
  backgroundImage: string | null;
  backgroundColor: string | null;
  fontFamily: string | null;
  fontSize: string | null;
  color: string | null;
};

export type LiveAnimationSnapshot = {
  id: string | null;
  playState: string;
  currentTime: number | null;
  duration: number | null;
  iterations: number | string | null;
  easing: string | null;
  keyframes: unknown[];
  targetTag: string | null;
  targetName: string | null;
  targetAppearId: string | null;
  targetText: string;
};

export type CapturedPage = {
  url: string;
  title: string;
  initialHtml: string;
  /** DOM after hydration, before forcing settled/sharp styles (keeps animation state). */
  animatedHtml: string;
  /** DOM after animation settle (sharp text) — best for screenshots/conversion. */
  renderedHtml: string;
  /** Live Web Animations API snapshot taken before settle. */
  liveAnimations: LiveAnimationSnapshot[];
  links: string[];
  resources: CapturedResource[];
  inlineStyles: string[];
  inlineScripts: string[];
  extractedStylesheets: string[];
  discoveredUrls: string[];
  screenshot: Buffer | null;
  mobileScreenshot: Buffer | null;
  contentMap: DomContentMap;
  framerLayers: FramerLayer[];
};

const SKIP_RESOURCE_TYPES = new Set(["websocket", "eventsource"]);
const MAX_ASSET_BYTES = 40 * 1024 * 1024;

async function hostnameIsPublic(hostname: string): Promise<boolean> {
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }
  if (net.isIP(hostname)) {
    return !isPrivateIp(hostname);
  }
  try {
    const records = await dns.lookup(hostname, { all: true });
    return records.length > 0 && records.every((r) => !isPrivateIp(r.address));
  } catch {
    return false;
  }
}

async function shouldKeepUrl(raw: string): Promise<boolean> {
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return hostnameIsPublic(url.hostname);
  } catch {
    return false;
  }
}

async function readResponseBody(response: PWResponse): Promise<Buffer | null> {
  try {
    const headers = response.headers();
    const length = Number(headers["content-length"] || 0);
    if (length > MAX_ASSET_BYTES) return null;
    const body = await response.body();
    if (body.byteLength === 0 || body.byteLength > MAX_ASSET_BYTES) return null;
    return Buffer.from(body);
  } catch {
    return null;
  }
}

async function deepInteract(page: Page) {
  // Scroll the full page to force lazy media
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let total = 0;
      const distance = 500;
      const timer = window.setInterval(() => {
        const { scrollHeight } = document.documentElement;
        window.scrollBy(0, distance);
        total += distance;
        if (total >= scrollHeight || total > 24000) {
          window.clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 80);
    });
  });

  // Hover interactive nodes that often reveal menus / images
  await page.evaluate(async () => {
    const nodes = Array.from(
      document.querySelectorAll("a, button, [role='button'], [data-framer-name]"),
    ).slice(0, 40);
    for (const node of nodes) {
      node.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      node.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 40));
    }
  });

  // Brief mobile viewport pass for responsive asset variants
  await page.setViewportSize({ width: 390, height: 844 });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((resolve) => setTimeout(resolve, 800));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await new Promise((resolve) => setTimeout(resolve, 800));
}

async function captureLiveAnimations(page: Page): Promise<LiveAnimationSnapshot[]> {
  return page
    .evaluate(() => {
      const doc = document as Document & {
        getAnimations?: (options?: { subtree?: boolean }) => Animation[];
      };
      const list = doc.getAnimations?.({ subtree: true }) || [];
      return list.slice(0, 300).map((animation) => {
        const effect = animation.effect as KeyframeEffect | null;
        const target = effect?.target as HTMLElement | null;
        let keyframes: unknown[] = [];
        try {
          keyframes = effect?.getKeyframes?.() || [];
        } catch {
          keyframes = [];
        }
        const timing = effect?.getTiming?.();
        return {
          id: animation.id || null,
          playState: animation.playState,
          currentTime:
            typeof animation.currentTime === "number"
              ? animation.currentTime
              : null,
          duration:
            typeof timing?.duration === "number" ? timing.duration : null,
          iterations: timing?.iterations ?? null,
          easing: timing?.easing || null,
          keyframes: keyframes.slice(0, 12),
          targetTag: target?.tagName?.toLowerCase() || null,
          targetName: target?.getAttribute?.("data-framer-name") || null,
          targetAppearId:
            target?.getAttribute?.("data-framer-appear-id") || null,
          targetText: (target?.innerText || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80),
        };
      });
    })
    .catch(() => [] as LiveAnimationSnapshot[]);
}

/**
 * Framer Appear effects often leave text blurred or with doubled/overlapping
 * characters mid-animation. Force fonts + animations to their final sharp state
 * before HTML/screenshot capture.
 */
async function settleFramerVisuals(page: Page) {
  await page.evaluate(async () => {
    // 1) Wait for fonts so letter metrics are correct
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    } catch {
      // ignore
    }

    // 2) Finish running CSS/WAAPI animations at their end state
    const animations =
      (
        document as Document & {
          getAnimations?: (options?: { subtree?: boolean }) => Animation[];
        }
      ).getAnimations?.({ subtree: true }) || [];
    for (const animation of animations) {
      try {
        animation.finish();
      } catch {
        try {
          animation.cancel();
        } catch {
          // ignore
        }
      }
    }

    // 3) Clear residual blur/opacity from Appear transforms on text-like nodes
    const candidates = Array.from(
      document.querySelectorAll(
        "h1,h2,h3,h4,h5,p,span,a,button,[data-framer-component-type='Text'],[data-framer-name],[data-framer-appear-id]",
      ),
    ) as HTMLElement[];

    for (const el of candidates) {
      const style = window.getComputedStyle(el);
      const filter = style.filter || "";
      const opacity = Number(style.opacity || "1");
      const hasBlur = /blur\(/i.test(filter);
      if (hasBlur || opacity < 0.95) {
        el.style.setProperty("filter", "none", "important");
        el.style.setProperty("opacity", "1", "important");
        el.style.setProperty("transform", "none", "important");
        el.style.setProperty("visibility", "visible", "important");
      }
    }

    // 4) Hide duplicate/blur-twin text layers that cause "Nohiidddeennfeess" stacking
    const textBlocks = Array.from(
      document.querySelectorAll(
        "[data-framer-component-type='Text'], [data-framer-name], p, span, h1, h2, h3",
      ),
    ) as HTMLElement[];

    const byKey = new Map<string, HTMLElement[]>();
    for (const el of textBlocks) {
      const text = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (text.length < 4 || text.length > 80) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 8) continue;
      const key = `${text}::${Math.round(rect.y / 4)}::${Math.round(rect.x / 20)}`;
      const list = byKey.get(key) || [];
      list.push(el);
      byKey.set(key, list);
    }

    for (const [, group] of byKey) {
      if (group.length < 2) continue;
      // Keep the sharpest / most opaque copy; hide blurred twins
      const ranked = group
        .map((el) => {
          const style = window.getComputedStyle(el);
          const blurMatch = (style.filter || "").match(/blur\(([0-9.]+)px\)/i);
          const blur = blurMatch ? Number(blurMatch[1]) : 0;
          const opacity = Number(style.opacity || "1");
          return { el, score: opacity * 10 - blur };
        })
        .sort((a, b) => b.score - a.score);

      for (const item of ranked.slice(1)) {
        item.el.style.setProperty("display", "none", "important");
      }
      const keep = ranked[0]?.el;
      if (keep) {
        keep.style.setProperty("filter", "none", "important");
        keep.style.setProperty("opacity", "1", "important");
        keep.style.setProperty("letter-spacing", "normal", "important");
      }
    }

    // 5) Fix Framer character-split text that collapses on top of itself
    document
      .querySelectorAll("[data-framer-component-type='Text']")
      .forEach((root) => {
        const spans = Array.from(root.querySelectorAll("span")).filter((span) => {
          const t = (span.textContent || "").trim();
          return t.length === 1 || t.length === 2;
        }) as HTMLElement[];
        if (spans.length < 4) return;

        // If many single-char spans share nearly the same X, restore normal flow
        const xs = spans.map((s) => Math.round(s.getBoundingClientRect().x));
        const uniqueX = new Set(xs);
        if (uniqueX.size <= Math.max(2, Math.floor(spans.length / 3))) {
          const host = root as HTMLElement;
          host.style.setProperty("display", "inline-block", "important");
          host.style.setProperty("white-space", "normal", "important");
          spans.forEach((span) => {
            span.style.setProperty("position", "static", "important");
            span.style.setProperty("transform", "none", "important");
            span.style.setProperty("left", "auto", "important");
            span.style.setProperty("display", "inline", "important");
            span.style.setProperty("filter", "none", "important");
            span.style.setProperty("opacity", "1", "important");
          });
        }
      });
  });

  // Let layout settle after style overrides
  await new Promise((resolve) => setTimeout(resolve, 600));
}

async function extractDomExtras(page: Page, pageUrl: string) {
  return page.evaluate((base) => {
    const abs = (value: string | null | undefined) => {
      if (!value) return null;
      try {
        return new URL(value, base).toString();
      } catch {
        return null;
      }
    };

    const clean = (value: string) => value.replace(/\s+/g, " ").trim();
    const discovered = new Set<string>();
    const push = (value: string | null | undefined) => {
      const resolved = abs(value || null);
      if (resolved) discovered.add(resolved);
    };

    document.querySelectorAll("[src],[href],[poster],[data-src],[data-framer-src]").forEach((el) => {
      push(el.getAttribute("src"));
      push(el.getAttribute("href"));
      push(el.getAttribute("poster"));
      push(el.getAttribute("data-src"));
      push(el.getAttribute("data-framer-src"));
    });

    document.querySelectorAll("[srcset],[data-srcset]").forEach((el) => {
      const srcset = el.getAttribute("srcset") || el.getAttribute("data-srcset") || "";
      srcset.split(",").forEach((part) => push(part.trim().split(/\s+/)[0]));
    });

    performance.getEntriesByType("resource").forEach((entry) => {
      push((entry as PerformanceResourceTiming).name);
    });

    const inlineStyles = Array.from(document.querySelectorAll("style"))
      .map((el) => el.textContent || "")
      .filter((text) => text.trim().length > 0);

    const inlineScripts = Array.from(document.querySelectorAll("script:not([src])"))
      .map((el) => el.textContent || "")
      .filter((text) => text.trim().length > 0);

    const extractedStylesheets: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules;
        if (!rules) continue;
        const cssText = Array.from(rules)
          .map((rule) => rule.cssText)
          .join("\n");
        if (cssText.trim()) extractedStylesheets.push(cssText);
      } catch {
        // cross-origin stylesheet
      }
    }

    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter(Boolean);

    // High-accuracy content map.
    // Framer Text nodes often wrap content in font-size:0 parents, so read leaf nodes.
    const headings: Array<{ tag: string; text: string }> = [];
    const paragraphs: string[] = [];
    const ctas: string[] = [];
    const images: Array<{ src: string; alt: string }> = [];
    const sections: Array<{ name: string; text: string }> = [];

    const leafCandidates = Array.from(
      document.querySelectorAll(
        "h1,h2,h3,h4,h5,p,a,button,li,span,p,div[data-framer-component-type='Text'] span, [data-framer-component-type='Text']",
      ),
    );

    for (const el of leafCandidates) {
      // Prefer leaf-ish nodes (no nested element text containers)
      const childElements = el.querySelectorAll("*");
      const hasNestedTextContainer = Array.from(childElements).some((child) =>
        ["H1", "H2", "H3", "H4", "H5", "P", "SPAN", "A", "BUTTON"].includes(child.tagName),
      );
      if (hasNestedTextContainer && el.tagName !== "A" && el.tagName !== "BUTTON") {
        continue;
      }

      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (Number(style.opacity || "1") < 0.05) continue;

      const raw = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent || "")
        .join(" ");
      const text = clean(raw || el.textContent || "");
      if (!text || text.length < 2) continue;

      let fontSize = Number.parseFloat(style.fontSize || "0");
      let fontWeight = Number.parseInt(style.fontWeight || "400", 10) || 400;
      // Climb to a parent with a real font size when Framer uses font-size:0 wrappers
      if (!fontSize || fontSize < 1) {
        let parent: HTMLElement | null = el.parentElement;
        while (parent) {
          const ps = window.getComputedStyle(parent);
          const size = Number.parseFloat(ps.fontSize || "0");
          if (size >= 1) {
            fontSize = size;
            fontWeight = Number.parseInt(ps.fontWeight || "400", 10) || fontWeight;
            break;
          }
          parent = parent.parentElement;
        }
      }

      const tag = el.tagName.toLowerCase();
      if (["h1", "h2", "h3", "h4", "h5"].includes(tag)) {
        headings.push({ tag, text: text.slice(0, 180) });
      } else if (fontSize >= 26 || (fontSize >= 20 && fontWeight >= 600)) {
        headings.push({
          tag: fontSize >= 40 ? "h1" : fontSize >= 28 ? "h2" : "h3",
          text: text.slice(0, 180),
        });
      } else if (text.length > 35 && fontSize >= 12) {
        paragraphs.push(text.slice(0, 400));
      }

      if (
        (tag === "a" || tag === "button" || el.getAttribute("role") === "button") &&
        text.length < 60
      ) {
        ctas.push(text);
      }
    }

    if (document.title && headings.length === 0) {
      headings.push({ tag: "h1", text: clean(document.title) });
    }

    // Dedicated Framer Text component pass
    document
      .querySelectorAll("[data-framer-component-type='Text']")
      .forEach((el) => {
        const text = clean(el.textContent || "");
        if (!text || text.length < 2) return;
        const style = window.getComputedStyle(el);
        let fontSize = Number.parseFloat(style.fontSize || "0");
        if (!fontSize || fontSize < 1) {
          const span = el.querySelector("span");
          if (span) {
            fontSize = Number.parseFloat(window.getComputedStyle(span).fontSize || "0");
          }
        }
        if (fontSize >= 22 || text.length <= 48) {
          headings.push({
            tag: fontSize >= 36 ? "h1" : "h2",
            text: text.slice(0, 180),
          });
        } else if (text.length > 20) {
          paragraphs.push(text.slice(0, 400));
        } else {
          ctas.push(text);
        }
      });

    document.querySelectorAll("img").forEach((img) => {
      const src = (img as HTMLImageElement).currentSrc || img.getAttribute("src") || "";
      if (!src) return;
      images.push({ src, alt: img.getAttribute("alt") || "" });
    });

    document
      .querySelectorAll("section,header,footer,main,nav,[data-framer-name]")
      .forEach((el) => {
        const name =
          el.getAttribute("data-framer-name") ||
          el.getAttribute("aria-label") ||
          el.tagName.toLowerCase();
        const text = clean(el.textContent || "").slice(0, 500);
        if (text) sections.push({ name, text });
      });

    // Background images from computed styles (Framer often paints media this way)
    document.querySelectorAll("*").forEach((el) => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundImage || "";
      for (const match of bg.matchAll(/url\(["']?(https?:\/\/[^"')]+)["']?\)/gi)) {
        push(match[1]);
      }
    });

    // Named Framer layer blueprint with geometry for high-accuracy rebuild
    const framerLayers = Array.from(document.querySelectorAll("[data-framer-name]"))
      .map((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width < 2 && rect.height < 2) return null;
        const style = window.getComputedStyle(el);
        const bgMatch = (style.backgroundImage || "").match(
          /url\(["']?(https?:\/\/[^"')]+)["']?\)/i,
        );
        return {
          name: el.getAttribute("data-framer-name") || "Layer",
          componentType: el.getAttribute("data-framer-component-type"),
          text: clean(el.textContent || "").slice(0, 240),
          bounds: {
            x: Math.round(rect.x + window.scrollX),
            y: Math.round(rect.y + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          backgroundImage: bgMatch?.[1] || null,
          backgroundColor: style.backgroundColor || null,
          fontFamily: style.fontFamily || null,
          fontSize: style.fontSize || null,
          color: style.color || null,
        };
      })
      .filter(Boolean)
      .slice(0, 250);

    const uniq = <T extends string | { text?: string; src?: string; tag?: string; name?: string }>(
      items: T[],
      key: (item: T) => string,
    ) => {
      const seen = new Set<string>();
      const out: T[] = [];
      for (const item of items) {
        const k = key(item);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(item);
      }
      return out;
    };

    return {
      discoveredUrls: Array.from(discovered),
      inlineStyles,
      inlineScripts,
      extractedStylesheets,
      links,
      framerLayers,
      contentMap: {
        headings: uniq(headings, (h) => h.text).slice(0, 80),
        paragraphs: uniq(paragraphs, (p) => p).slice(0, 80),
        ctas: uniq(ctas, (c) => c).slice(0, 50),
        images: uniq(images, (i) => i.src).slice(0, 100),
        sections: uniq(sections, (s) => `${s.name}:${s.text.slice(0, 80)}`).slice(
          0,
          80,
        ),
      },
    };
  }, pageUrl);
}

export async function captureSiteWithBrowser(args: {
  startUrl: string;
  maxPages?: number;
  onProgress?: (message: string, percent: number) => Promise<void> | void;
}): Promise<{
  pages: CapturedPage[];
  engine: "playwright-cdp";
  allNetworkUrls: string[];
}> {
  const maxPages = args.maxPages ?? 15;
  const start = await assertSafeUrl(args.startUrl);

  let browser: Browser | null = null;
  const pages: CapturedPage[] = [];
  const queue: string[] = [start.toString()];
  const seen = new Set<string>();
  const allNetworkUrls = new Set<string>();

  try {
    browser = await launchBrowser();

    while (queue.length && seen.size < maxPages) {
      const pageUrl = queue.shift()!.split("#")[0];
      if (seen.has(pageUrl)) continue;
      seen.add(pageUrl);

      await args.onProgress?.(
        `Production capturing page ${seen.size}/${maxPages}`,
        Math.min(68, 8 + seen.size * Math.floor(55 / maxPages)),
      );

      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FramerForge/3.0",
        viewport: { width: 1440, height: 1100 },
        javaScriptEnabled: true,
        bypassCSP: true,
        serviceWorkers: "block",
      });

      const page = await context.newPage();
      const resources = new Map<string, CapturedResource>();
      const pending: Promise<void>[] = [];
      const cdpRequestMeta = new Map<
        string,
        { url: string; resourceType: string; mimeType?: string }
      >();

      // CDP: capture EVERY network response body (max accuracy)
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      cdp.on("Network.responseReceived", (event) => {
        const { requestId, response, type } = event;
        allNetworkUrls.add(response.url);
        cdpRequestMeta.set(requestId, {
          url: response.url,
          resourceType: String(type || "other").toLowerCase(),
          mimeType: response.mimeType,
        });
      });
      cdp.on("Network.loadingFinished", (event) => {
        const meta = cdpRequestMeta.get(event.requestId);
        if (!meta) return;
        const task = (async () => {
          try {
            if (!(await shouldKeepUrl(meta.url))) return;
            if (resources.has(meta.url)) return;
            if (SKIP_RESOURCE_TYPES.has(meta.resourceType)) return;

            const result = (await cdp.send("Network.getResponseBody", {
              requestId: event.requestId,
            })) as { body: string; base64Encoded: boolean };

            const body = result.base64Encoded
              ? Buffer.from(result.body, "base64")
              : Buffer.from(result.body, "utf8");
            if (!body.byteLength || body.byteLength > MAX_ASSET_BYTES) return;

            resources.set(meta.url, {
              url: meta.url,
              finalUrl: meta.url,
              status: 200,
              contentType: meta.mimeType || null,
              body,
              resourceType: meta.resourceType,
            });
          } catch {
            // body unavailable (cached/opaque) — Playwright fallback may catch it
          }
        })();
        pending.push(task);
      });

      // Playwright fallback for anything CDP misses
      page.on("response", (response) => {
        const task = (async () => {
          try {
            const request = response.request();
            const resourceType = request.resourceType();
            if (SKIP_RESOURCE_TYPES.has(resourceType)) return;
            const method = request.method().toUpperCase();
            if (method !== "GET" && method !== "POST") return;

            const url = response.url();
            allNetworkUrls.add(url);
            if (resources.has(url)) return;
            if (!(await shouldKeepUrl(url))) return;
            const status = response.status();
            if (status < 200 || status >= 400) return;

            const body = await readResponseBody(response);
            if (!body) return;

            resources.set(url, {
              url,
              finalUrl: url,
              status,
              contentType: response.headers()["content-type"] || null,
              body,
              resourceType,
            });
          } catch {
            // ignore
          }
        })();
        pending.push(task);
      });

      let initialHtml = "";
      try {
        const nav = await page.goto(pageUrl, {
          waitUntil: "domcontentloaded",
          timeout: 90_000,
        });
        if (nav) {
          try {
            initialHtml = (await nav.text()) || "";
          } catch {
            initialHtml = "";
          }
        }

        await page
          .waitForLoadState("networkidle", { timeout: 45_000 })
          .catch(() => undefined);
        await page
          .waitForSelector("#main, [data-framer-hydrate], [data-framer-root], body", {
            timeout: 20_000,
          })
          .catch(() => undefined);
        // Short beat so Appear/Motion start — capture mid-flight BEFORE long waits
        await new Promise((resolve) => setTimeout(resolve, 900));
      } catch (error) {
        await context.close();
        throw new Error(
          `Failed to open ${pageUrl}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }

      // Early animation snapshot (Appear often finishes before deepInteract ends)
      let animatedHtml = await page.content();
      let liveAnimations = await captureLiveAnimations(page);

      try {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        await deepInteract(page);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await page
          .waitForLoadState("networkidle", { timeout: 30_000 })
          .catch(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch {
        // keep early snapshot even if late interaction fails
      }

      await Promise.allSettled(pending);

      // Collect every URL the browser actually requested (for zero-miss backfill)
      const perfUrls = await page.evaluate(() =>
        performance.getEntriesByType("resource").map((e) => e.name),
      );
      for (const url of perfUrls) allNetworkUrls.add(url);

      await page.setViewportSize({ width: 1440, height: 1100 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Merge early + late WAAPI snapshots; refresh HTML after assets load
      const lateLive = await captureLiveAnimations(page);
      const merged = [...liveAnimations, ...lateLive];
      const seenAnim = new Set<string>();
      liveAnimations = merged.filter((item) => {
        const key = [
          item.id,
          item.targetAppearId,
          item.targetName,
          item.targetText,
          item.duration,
          item.playState,
        ].join("|");
        if (seenAnim.has(key)) return false;
        seenAnim.add(key);
        return true;
      });
      animatedHtml = await page.content();

      // Then settle for sharp screenshots + clean conversion HTML
      await settleFramerVisuals(page);
      await new Promise((resolve) => setTimeout(resolve, 600));

      let screenshot: Buffer | null = null;
      let mobileScreenshot: Buffer | null = null;
      try {
        screenshot = await page.screenshot({ fullPage: true, type: "png" });
      } catch {
        screenshot = null;
      }
      try {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => window.scrollTo(0, 0));
        await settleFramerVisuals(page);
        await new Promise((resolve) => setTimeout(resolve, 600));
        mobileScreenshot = await page.screenshot({ fullPage: true, type: "png" });
        await page.setViewportSize({ width: 1440, height: 1100 });
      } catch {
        mobileScreenshot = null;
      }

      const renderedHtml = await page.content();
      const title = await page.title();
      const finalPageUrl = page.url() || pageUrl;
      const extras = await extractDomExtras(page, finalPageUrl);
      for (const url of extras.discoveredUrls) allNetworkUrls.add(url);

      const sameOriginLinks = [
        ...new Set(
          extras.links
            .map((href) => {
              try {
                const absolute = new URL(href, finalPageUrl);
                if (absolute.origin !== start.origin) return null;
                absolute.hash = "";
                return absolute.toString();
              } catch {
                return null;
              }
            })
            .filter((value): value is string => Boolean(value)),
        ),
      ];

      for (const link of sameOriginLinks) {
        if (!seen.has(link) && seen.size + queue.length < maxPages) {
          queue.push(link);
        }
      }

      pages.push({
        url: finalPageUrl,
        title: title || finalPageUrl,
        initialHtml: initialHtml || renderedHtml,
        animatedHtml: animatedHtml || renderedHtml,
        renderedHtml,
        liveAnimations,
        links: sameOriginLinks,
        resources: [...resources.values()],
        inlineStyles: extras.inlineStyles,
        inlineScripts: extras.inlineScripts,
        extractedStylesheets: extras.extractedStylesheets,
        discoveredUrls: [
          ...new Set([...extras.discoveredUrls, ...perfUrls]),
        ],
        screenshot,
        mobileScreenshot,
        contentMap: extras.contentMap,
        framerLayers: (extras.framerLayers || []) as FramerLayer[],
      });

      await context.close();
    }
  } finally {
    await browser?.close();
  }

  if (!pages.length) {
    throw new Error("Browser capture produced no pages");
  }

  return {
    pages,
    engine: "playwright-cdp",
    allNetworkUrls: [...allNetworkUrls].filter((u) => /^https?:\/\//i.test(u)),
  };
}
