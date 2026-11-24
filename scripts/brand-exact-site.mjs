#!/usr/bin/env node
/**
 * Brands the exact Framer extract HTML as Framely and injects the API bridge.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyFramelyContent, FRAMELY_REPLACEMENTS } from "./framely-content.mjs";

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

function brandHtml(html) {
  let next = applyFramelyContent(html);

  next = next.replace(
    /<title>.*?<\/title>/i,
    "<title>Framely — Framer to Next.js</title>",
  );

  // Favicons → Framely F
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

  // Footer “Brand Logo” wordmark PNG still spells Saino in the extract.
  next = next.replace(
    /\/assets\/images\/framerusercontent\.com\/hofmq5gUf5i5thCwxG7fnDhzL8-[^"'\s]+/g,
    "/brand/framely-banner.png",
  );

  // Hero / CTA “logo badge” PNG is still Saino artwork in the extract.
  next = next.replace(
    /\/assets\/images\/framerusercontent\.com\/jEdLYTzGeRHmLrNr9VhoDJl8ZY4-[^"'\s]+/g,
    "/brand/framely-banner.png",
  );

  // Benefits testimonial avatar → Anshul Bhathija
  next = next.replace(
    /\/assets\/images\/framerusercontent\.com\/mBmrUBypuHFkhhz42OM4ZotDnJM-[^"'\s]+/g,
    "/brand/anshul-bhathija.jpg",
  );
  next = next.replace(/alt="Alex Rivera"/g, 'alt="Anshul Bhathija"');

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