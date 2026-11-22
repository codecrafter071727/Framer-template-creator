import * as cheerio from "cheerio";
import type { LiveAnimationSnapshot } from "@/lib/extract/browser-capture";

export type AnimationInventory = {
  keyframes: Array<{ name: string; css: string }>;
  cssAnimations: Array<{ selectorHint: string; declaration: string }>;
  cssTransitions: Array<{ declaration: string }>;
  appearNodes: Array<{
    appearId: string | null;
    name: string | null;
    text: string;
  }>;
  animatedStyleNodes: Array<{
    name: string | null;
    appearId: string | null;
    styles: string;
  }>;
  liveAnimations: LiveAnimationSnapshot[];
  jsAnimationHints: Array<{ path: string; hint: string }>;
  motionAssets: string[];
  framerRuntimeAssets: string[];
  notes: string[];
};

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function extractBalancedKeyframes(css: string): Array<{ name: string; css: string }> {
  const out: Array<{ name: string; css: string }> = [];
  const re = /@keyframes\s+([A-Za-z0-9_-]+)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) {
    const name = match[1];
    let i = match.index + match[0].length;
    let depth = 1;
    while (i < css.length && depth > 0) {
      const ch = css[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      i += 1;
    }
    const body = css.slice(match.index + match[0].length, i - 1);
    out.push({ name, css: `@keyframes ${name}{${body}}` });
    re.lastIndex = i;
  }
  return out;
}

function extractKeyframesFromCss(
  css: string,
  keyframes: AnimationInventory["keyframes"],
  cssAnimations: AnimationInventory["cssAnimations"],
  cssTransitions: AnimationInventory["cssTransitions"],
) {
  for (const kf of extractBalancedKeyframes(css)) {
    keyframes.push(kf);
  }
  for (const match of css.matchAll(
    /([^{}]+)\{[^}]*\banimation(?:-name)?\s*:[^;]+;[^}]*\}/gi,
  )) {
    const block = match[0];
    if (!/animation/i.test(block)) continue;
    cssAnimations.push({
      selectorHint: match[1].trim().slice(0, 120),
      declaration: block.slice(0, 500),
    });
  }
  for (const match of css.matchAll(/transition\s*:\s*([^;]+);/gi)) {
    cssTransitions.push({ declaration: `transition:${match[1]}` });
  }
}

function scanJsForAnimationHints(
  jsFiles: Array<{ path: string; content: string }>,
): AnimationInventory["jsAnimationHints"] {
  const hints: AnimationInventory["jsAnimationHints"] = [];
  const patterns = [
    /@keyframes\s+[A-Za-z0-9_-]+/g,
    /appearsFrom["']?\s*:\s*["'][^"']+["']/g,
    /type\s*:\s*["']spring["']/g,
    /type\s*:\s*["']keyframes["']/g,
    /AnimatePresence/g,
    /data-framer-appear-id/g,
    /transition\s*:\s*\{[^}]{0,120}\}/g,
    /initial\s*:\s*\{[^}]{0,120}\}/g,
    /animate\s*:\s*\{[^}]{0,120}\}/g,
    /exit\s*:\s*\{[^}]{0,120}\}/g,
  ];

  for (const file of jsFiles) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const matches = file.content.match(pattern) || [];
      for (const match of matches.slice(0, 8)) {
        hints.push({
          path: file.path,
          hint: match.replace(/\s+/g, " ").slice(0, 160),
        });
      }
    }
  }
  return uniqueBy(hints, (h) => `${h.path}:${h.hint}`).slice(0, 300);
}

export function buildAnimationInventory(args: {
  html: string;
  cssTexts: string[];
  assetPaths: string[];
  liveAnimations?: LiveAnimationSnapshot[];
  jsFiles?: Array<{ path: string; content: string }>;
}): AnimationInventory {
  const keyframes: AnimationInventory["keyframes"] = [];
  const cssAnimations: AnimationInventory["cssAnimations"] = [];
  const cssTransitions: AnimationInventory["cssTransitions"] = [];

  for (const css of args.cssTexts) {
    extractKeyframesFromCss(css, keyframes, cssAnimations, cssTransitions);
  }

  const $ = cheerio.load(args.html);
  $("style").each((_, el) => {
    const css = $(el).html() || "";
    if (css.trim()) {
      extractKeyframesFromCss(css, keyframes, cssAnimations, cssTransitions);
    }
  });

  const appearNodes = $("[data-framer-appear-id], [data-framer-name]")
    .map((_, el) => {
      const appearId = $(el).attr("data-framer-appear-id") || null;
      const name = $(el).attr("data-framer-name") || null;
      const text = ($(el).text() || "").replace(/\s+/g, " ").trim().slice(0, 120);
      if (!appearId && !name) return null;
      return { appearId, name, text };
    })
    .get()
    .filter(Boolean) as AnimationInventory["appearNodes"];

  const animatedStyleNodes = $("[style]")
    .map((_, el) => {
      const style = ($(el).attr("style") || "").trim();
      if (
        !/(opacity|transform|filter|transition|animation|translate|scale|rotate)/i.test(
          style,
        )
      ) {
        return null;
      }
      return {
        name: $(el).attr("data-framer-name") || null,
        appearId: $(el).attr("data-framer-appear-id") || null,
        styles: style.slice(0, 280),
      };
    })
    .get()
    .filter(Boolean) as AnimationInventory["animatedStyleNodes"];

  const motionAssets = args.assetPaths.filter((path) =>
    /motion|animate|framer-motion|appear|transition|spring/i.test(path),
  );
  const framerRuntimeAssets = args.assetPaths.filter((path) =>
    /framer\.(?:[A-Z0-9]+)\.|\/framer\.|chunk-.*\.mjs|react-dom|scheduler/i.test(
      path,
    ),
  );

  const jsAnimationHints = scanJsForAnimationHints(args.jsFiles || []);

  // Also pull @keyframes embedded inside JS strings
  for (const file of args.jsFiles || []) {
    extractKeyframesFromCss(
      file.content,
      keyframes,
      cssAnimations,
      cssTransitions,
    );
  }

  return {
    keyframes: uniqueBy(keyframes, (k) => k.name).slice(0, 200),
    cssAnimations: uniqueBy(cssAnimations, (a) => a.declaration).slice(0, 200),
    cssTransitions: uniqueBy(cssTransitions, (t) => t.declaration).slice(0, 200),
    appearNodes: uniqueBy(
      appearNodes,
      (n) => `${n.appearId || ""}:${n.name || ""}:${n.text}`,
    ).slice(0, 200),
    animatedStyleNodes: uniqueBy(
      animatedStyleNodes,
      (n) => `${n.name || ""}:${n.appearId || ""}:${n.styles}`,
    ).slice(0, 200),
    liveAnimations: (args.liveAnimations || []).slice(0, 300),
    jsAnimationHints,
    motionAssets: [...new Set(motionAssets)].slice(0, 200),
    framerRuntimeAssets: [...new Set(framerRuntimeAssets)].slice(0, 200),
    notes: [
      "Framer animations live in CSS keyframes/transitions + runtime JS (Motion/Appear).",
      "pages/*.animated.html preserves pre-settle DOM; screenshots use settled sharp state.",
      "liveAnimations is a Web Animations API snapshot (early hydrate + late merge).",
      "jsAnimationHints mines motion/appear/spring configs from saved JS bundles.",
      "Keep assets/js motion/framer chunks to replay interactions in the extracted site.",
      "conversion/animations.css holds extracted @keyframes for offline replay.",
    ],
  };
}
