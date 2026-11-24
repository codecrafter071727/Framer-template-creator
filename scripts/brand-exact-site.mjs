#!/usr/bin/env node
/**
 * Brands the exact Framer extract HTML as Framely and injects the API bridge.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import { applyFramelyContent, FRAMELY_REPLACEMENTS } from "./framely-content.mjs";
import {
  FRAMELY_CRITICAL_HEAD,
  FRAMELY_PROMO_GUARD_SCRIPT,
  FRAMELY_SPLASH_MARKUP,
} from "./framely-critical-css.mjs";

const FOOTER_PROMO_NAMES = ["Newsletter", "Background CTA", "CTA Card"];

/** Remove newsletter / bottom CTA blocks (live outside Main) so they never paint on SSR. */
function stripFooterPromoHtml(html) {
  const $ = load(html);

  $("div.ssr-variant").each((_, el) => {
    const $el = $(el);
    const hasPromo = FOOTER_PROMO_NAMES.some(
      (name) => $el.find(`[data-framer-name="${name}"]`).length,
    );
    if (!hasPromo) return;
    if ($el.find('[data-framer-name="Copyright"]').length) {
      $el
        .find(
          '[data-framer-name="Newsletter"], [data-framer-name="Newsletter Form "]',
        )
        .each((_, node) => {
          const $node = $(node);
          const drop = $node.closest('[data-framer-name="Container"]');
          (drop.length ? drop : $node).remove();
        });
      return;
    }
    $el.remove();
  });

  for (const name of FOOTER_PROMO_NAMES) {
    $(`[data-framer-name="${name}"]`).each((_, el) => {
      const $el = $(el);
      if ($el.closest('[data-framer-name="Copyright"]').length) return;
      const variant = $el.closest(".ssr-variant");
      if (
        variant.length &&
        variant.find('[data-framer-name="Copyright"]').length
      ) {
        const drop = $el.closest('[data-framer-name="Container"]') || $el;
        drop.remove();
        return;
      }
      const host = $el.closest(".ssr-variant, footer");
      if (host.length) host.remove();
      else $el.remove();
    });
  }

  return $.html();
}

const TESTIMONIAL_CAROUSEL_MARKERS = ["Mobile  1", "Desktop  1"];

/** “Trusted by Innovators” / superpowers quote slider — strip before paint. */
function stripTestimonialsCarouselHtml(html) {
  const $ = load(html);

  $("div.ssr-variant").each((_, el) => {
    const $el = $(el);
    const text = $el.text();
    const hasMarker = TESTIMONIAL_CAROUSEL_MARKERS.some(
      (name) => $el.find(`[data-framer-name="${name}"]`).length,
    );
    const hasEyebrow =
      text.includes("What people are saying") ||
      text.includes("Trusted by Innovators");
    if (hasMarker || hasEyebrow) $el.remove();
  });

  for (const name of TESTIMONIAL_CAROUSEL_MARKERS) {
    $(`[data-framer-name="${name}"]`).each((_, el) => {
      const $el = $(el);
      const host = $el.closest(".ssr-variant");
      if (host.length) host.remove();
      else $el.remove();
    });
  }

  return $.html();
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "public", "site");

const BRIDGE_TAG =
  '<script src="/framely-bridge.js" defer></script>\n</body>';

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function stripCustomFramelyFooter(html) {
  return html.replace(/<footer id="framely-site-footer"[\s\S]*?<\/footer>\s*/gi, "");
}

function brandHtml(html) {
  let next = stripCustomFramelyFooter(
    stripFooterPromoHtml(
      stripTestimonialsCarouselHtml(applyFramelyContent(html)),
    ),
  );

  next = next.replace(
    /<title>.*?<\/title>/i,
    "<title>Framely — Framer to Next.js</title>",
  );

  next = next.replace(
    /<link href="\/assets\/images\/framerusercontent\.com\/[^"]+" rel="icon"[^>]*>/g,
    '<link href="/brand/framely-icon.png" rel="icon" type="image/png">',
  );
  next = next.replace(
    /<link rel="apple-touch-icon" href="\/assets\/images\/framerusercontent\.com\/[^"]+">/g,
    '<link rel="apple-touch-icon" href="/brand/framely-icon.png">',
  );
  next = next.replace(
    /content="https:\/\/framerusercontent\.com\/images\/[^"]+"/g,
    'content="/brand/framely-banner.png"',
  );
  next = next.replace(
    /property="og:title" content="[^"]*"/g,
    'property="og:title" content="Framely — Framer to Next.js"',
  );
  next = next.replace(
    /name="twitter:title" content="[^"]*"/g,
    'name="twitter:title" content="Framely — Framer to Next.js"',
  );

  next = next.replace(
    /\/assets\/images\/framerusercontent\.com\/hofmq5gUf5i5thCwxG7fnDhzL8-[^"'\s]+/g,
    "/brand/framely-banner.png",
  );
  next = next.replace(
    /\/assets\/images\/framerusercontent\.com\/jEdLYTzGeRHmLrNr9VhoDJl8ZY4-[^"'\s]+/g,
    "/brand/framely-banner.png",
  );
  next = next.replace(
    /\/assets\/images\/framerusercontent\.com\/mBmrUBypuHFkhhz42OM4ZotDnJM-[^"'\s]+/g,
    "/brand/anshul-bhathija.jpg",
  );
  next = next.replace(/alt="Alex Rivera"/g, 'alt="Anshul Bhathija"');

  next = next.replace(
    /<div class="framer-1k941ea-container">[\s\S]*?<!--\/\$--><\/div>\s*/g,
    "",
  );
  next = next.replace(
    /<div id="__framer-badge-container">[\s\S]*?<!--\/\$--><!--\/\$--><!--\/\$--><\/div>\s*/g,
    "",
  );
  next = next.replace(
    /\t<div class="framer-19yaanm"[\s\S]*?<!--\/\$--><!--\/\$--><!--\/\$--><\/div>\s*/g,
    "",
  );

  if (next.includes('id="framely-critical"')) {
    next = next.replace(
      /(?:<link rel="preload" as="image" href="\/brand\/framely-icon\.png">\s*)?(?:<link rel="preload" as="image" href="\/brand\/framely-banner\.png">\s*<link rel="preload" as="image" href="\/brand\/anshul-bhathija\.jpg">\s*)?<style id="framely-critical">[\s\S]*?<\/style>\s*(?:<script id="framely-promo-guard">[\s\S]*?<\/script>\s*)?/,
      FRAMELY_CRITICAL_HEAD,
    );
  } else if (/<head[^>]*>/i.test(next)) {
    next = next.replace(/<head[^>]*>/i, (match) => `${match}\n${FRAMELY_CRITICAL_HEAD}`);
  } else {
    next = `${FRAMELY_CRITICAL_HEAD}\n${next}`;
  }

  if (!next.includes('id="framely-promo-guard"') && /<!doctype/i.test(next)) {
    next = next.replace(/<body([^>]*)>/i, (match) => `${FRAMELY_PROMO_GUARD_SCRIPT}\n${match}`);
  }

  if (next.includes('id="framely-splash"')) {
    next = next.replace(
      /<div id="framely-splash"[\s\S]*?<\/div>\s*<script id="framely-splash-boot">[\s\S]*?<\/script>\s*/,
      `${FRAMELY_SPLASH_MARKUP}\n`,
    );
  } else if (/<body[^>]*>/i.test(next)) {
    next = next.replace(/<body([^>]*)>/i, (match) => `${match}\n${FRAMELY_SPLASH_MARKUP}`);
  }

  if (!next.includes("/framely-bridge.js")) {
    if (next.includes("</body>")) {
      next = next.replace("</body>", BRIDGE_TAG);
    } else {
      next += `\n${BRIDGE_TAG}`;
    }
  }

  return next;
}

async function main() {
  await fs.writeFile(
    path.join(ROOT, "public", "framely-replacements.json"),
    JSON.stringify(FRAMELY_REPLACEMENTS),
  );

  const files = await walk(SITE);
  for (const file of files) {
    const html = await fs.readFile(file, "utf8");
    await fs.writeFile(file, brandHtml(html));
    console.log("branded", path.relative(ROOT, file));
  }
  console.log(`Done · ${files.length} pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});