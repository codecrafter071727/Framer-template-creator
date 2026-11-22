import { createHash } from "node:crypto";
import path from "node:path";
import * as cheerio from "cheerio";
import { writeBinary, writeText } from "@/lib/storage";
import { scoreExtractionAccuracy, type AccuracyBreakdown } from "@/lib/extract/accuracy";
import type { FramerLayer } from "@/lib/extract/browser-capture";

export type ConversionPackSummary = {
  pageCount: number;
  sectionCount: number;
  imageCount: number;
  headingCount: number;
  paragraphCount: number;
  ctaCount: number;
  screenshotBytes: number;
  tokenColors: number;
  tokenFonts: number;
  namedLayerCount: number;
  accuracy: AccuracyBreakdown;
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function buildConversionPack(args: {
  workspace: string;
  sourceUrl: string;
  pages: Array<{
    url: string;
    title: string;
    renderedHtml: string;
    screenshot?: Buffer | null;
    mobileScreenshot?: Buffer | null;
    contentMap?: {
      headings: Array<{ tag: string; text: string }>;
      paragraphs: string[];
      ctas: string[];
      images: Array<{ src: string; alt: string }>;
      sections: Array<{ name: string; text: string }>;
    };
    framerLayers?: FramerLayer[];
  }>;
  cssFiles: Array<{ localPath: string; content: string }>;
  assetsSaved: number;
  missingCount: number;
  fontCount: number;
}): Promise<ConversionPackSummary> {
  const outDir = path.join(args.workspace, "conversion");
  const colors: string[] = [];
  const fonts: string[] = [];
  const pagesOut: Array<Record<string, unknown>> = [];
  let sectionCount = 0;
  let imageCount = 0;
  let namedLayerCount = 0;
  let headingCount = 0;
  let paragraphCount = 0;
  let ctaCount = 0;
  let screenshotBytes = 0;
  let hasDesktopScreenshot = false;
  let hasMobileScreenshot = false;
  const visualPages: Array<Record<string, unknown>> = [];

  const pngMeta = (buf: Buffer) => {
    if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
      return { width: null as number | null, height: null as number | null, bytes: buf.length, sha1: createHash("sha1").update(buf).digest("hex") };
    }
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      bytes: buf.length,
      sha1: createHash("sha1").update(buf).digest("hex"),
    };
  };

  const allCss = args.cssFiles.map((file) => file.content).join("\n\n");
  for (const match of allCss.matchAll(
    /#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g,
  )) {
    colors.push(match[0].toLowerCase());
  }
  for (const match of allCss.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
    fonts.push(cleanText(match[1].replace(/["']/g, "")));
  }

  // Pull extra colors/fonts from Framer layer styles
  for (const page of args.pages) {
    for (const layer of page.framerLayers || []) {
      if (layer.backgroundColor) colors.push(layer.backgroundColor.toLowerCase());
      if (layer.color) colors.push(layer.color.toLowerCase());
      if (layer.fontFamily) fonts.push(cleanText(layer.fontFamily.replace(/["']/g, "")));
    }
  }

  let consolidatedCss = `/* Consolidated CSS captured from Framer site */\n/* Source: ${args.sourceUrl} */\n\n`;
  for (const file of args.cssFiles) {
    consolidatedCss += `/* ---- ${file.localPath} ---- */\n${file.content}\n\n`;
  }
  await writeText(path.join(outDir, "ALL.css"), consolidatedCss);

  const structurePages: Array<Record<string, unknown>> = [];

  for (const [index, page] of args.pages.entries()) {
    const $ = cheerio.load(page.renderedHtml);
    $("script, noscript, iframe, link[rel='modulepreload'], link[rel='preload']").remove();

    const fromDom = page.contentMap;
    const headings =
      fromDom?.headings?.length
        ? fromDom.headings
        : $("h1,h2,h3,h4")
            .map((_, el) => ({
              tag: el.tagName.toLowerCase(),
              text: cleanText($(el).text()),
            }))
            .get()
            .filter((item) => item.text.length > 0)
            .slice(0, 80);

    const paragraphs =
      fromDom?.paragraphs?.length
        ? fromDom.paragraphs
        : $("p")
            .map((_, el) => cleanText($(el).text()))
            .get()
            .filter((text) => text.length > 20)
            .slice(0, 60);

    const buttons =
      fromDom?.ctas?.length
        ? fromDom.ctas
        : $("a, button")
            .map((_, el) => cleanText($(el).text()))
            .get()
            .filter((text) => text.length > 0 && text.length < 80)
            .slice(0, 40);

    const images =
      fromDom?.images?.length
        ? fromDom.images.map((img) => ({
            src: img.src,
            alt: img.alt,
            width: null as string | null,
            height: null as string | null,
          }))
        : $("img")
            .map((_, el) => ({
              src: $(el).attr("src") || "",
              alt: $(el).attr("alt") || "",
              width: $(el).attr("width") || null,
              height: $(el).attr("height") || null,
            }))
            .get()
            .filter((img) => Boolean(img.src))
            .slice(0, 80);

    const sections =
      fromDom?.sections?.length
        ? fromDom.sections
        : $("section, header, footer, main, [data-framer-name], nav")
            .map((_, el) => {
              const name =
                $(el).attr("data-framer-name") ||
                $(el).attr("aria-label") ||
                el.tagName.toLowerCase();
              const text = cleanText($(el).text()).slice(0, 400);
              return { name, text };
            })
            .get()
            .filter((section) => section.text.length > 0)
            .slice(0, 40);

    // Sparse Framer pages often put copy only in named layers — fold into content
    const layers = page.framerLayers || [];
    if (paragraphs.length < 2) {
      for (const layer of layers) {
        const text = cleanText(layer.text || "");
        if (text.length > 24 && !paragraphs.includes(text)) {
          paragraphs.push(text.slice(0, 400));
        }
      }
    }
    if (headings.length < 1) {
      for (const layer of layers) {
        const text = cleanText(layer.text || "");
        if (text.length >= 4 && text.length <= 80) {
          headings.push({ tag: "h1", text });
          break;
        }
      }
    }

    imageCount += images.length;
    sectionCount += sections.length;
    headingCount += headings.length;
    paragraphCount += paragraphs.length;
    ctaCount += unique(buttons).length;
    namedLayerCount += layers.length;

    const bodyHtml = $("body").html() || $.root().html() || "";
    const semantic = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${page.title.replace(/</g, "")}</title>
  <link rel="stylesheet" href="./ALL.css" />
</head>
<body data-source-url="${page.url}">
${bodyHtml}
</body>
</html>`;

    const pageSlug =
      index === 0
        ? "home"
        : createHash("sha1").update(page.url).digest("hex").slice(0, 8);
    await writeText(path.join(outDir, `pages/${pageSlug}.semantic.html`), semantic);

    const visualEntry: Record<string, unknown> = {
      slug: pageSlug,
      url: page.url,
      desktop: null as null | ReturnType<typeof pngMeta>,
      mobile: null as null | ReturnType<typeof pngMeta>,
    };

    if (page.screenshot?.length) {
      hasDesktopScreenshot = true;
      screenshotBytes += page.screenshot.length;
      visualEntry.desktop = pngMeta(page.screenshot);
      await writeBinary(
        path.join(outDir, `screenshots/${pageSlug}.desktop.png`),
        page.screenshot,
      );
      // Keep legacy name for compatibility
      await writeBinary(
        path.join(outDir, `screenshots/${pageSlug}.png`),
        page.screenshot,
      );
    }
    if (page.mobileScreenshot?.length) {
      hasMobileScreenshot = true;
      screenshotBytes += page.mobileScreenshot.length;
      visualEntry.mobile = pngMeta(page.mobileScreenshot);
      await writeBinary(
        path.join(outDir, `screenshots/${pageSlug}.mobile.png`),
        page.mobileScreenshot,
      );
    }
    visualPages.push(visualEntry);

    pagesOut.push({
      url: page.url,
      title: page.title,
      slug: pageSlug,
      headings,
      paragraphs,
      ctas: unique(buttons),
      images,
      sections,
      namedLayers: layers.slice(0, 160),
      semanticPath: `conversion/pages/${pageSlug}.semantic.html`,
      screenshotPath: page.screenshot?.length
        ? `conversion/screenshots/${pageSlug}.desktop.png`
        : null,
      mobileScreenshotPath: page.mobileScreenshot?.length
        ? `conversion/screenshots/${pageSlug}.mobile.png`
        : null,
    });

    structurePages.push({
      url: page.url,
      title: page.title,
      slug: pageSlug,
      layers: layers.map((layer) => ({
        name: layer.name,
        componentType: layer.componentType,
        text: layer.text,
        bounds: layer.bounds,
        styles: {
          backgroundImage: layer.backgroundImage,
          backgroundColor: layer.backgroundColor,
          fontFamily: layer.fontFamily,
          fontSize: layer.fontSize,
          color: layer.color,
        },
      })),
    });
  }

  const designTokens = {
    sourceUrl: args.sourceUrl,
    colors: unique(colors).slice(0, 100),
    fonts: unique(fonts).slice(0, 40),
    notes: [
      "Tokens extracted from captured/computed CSS + Framer layer styles.",
      "Prefer these colors/fonts when converting to Next.js/React.",
    ],
  };

  const contentMap = {
    sourceUrl: args.sourceUrl,
    generatedAt: new Date().toISOString(),
    purpose:
      "High-accuracy conversion package for single-prompt Framer → website rebuild",
    pages: pagesOut,
    guidance: [
      "Use STRUCTURE.json named layers for section order and layout proportions.",
      "Use CONTENT.json for headings/CTAs/copy fidelity.",
      "Use DESIGN_TOKENS.json + ALL.css for visual fidelity.",
      "Use desktop/mobile screenshots as visual ground truth.",
      "Use ANIMATIONS.json + animations.css to recreate appear/motion/keyframes.",
      "Recreate clean semantic components; do not keep Framer runtime JS.",
    ],
  };

  const accuracy = scoreExtractionAccuracy({
    assetsSaved: args.assetsSaved,
    missingCount: args.missingCount,
    headingCount,
    paragraphCount,
    sectionCount,
    namedLayerCount,
    imageCount,
    ctaCount,
    cssFileCount: args.cssFiles.length,
    fontCount: args.fontCount,
    hasDesktopScreenshot,
    hasMobileScreenshot,
    hasSemanticHtml: pagesOut.length > 0,
    hasDesignTokens: designTokens.colors.length + designTokens.fonts.length > 0,
    screenshotBytes,
  });

  await writeText(
    path.join(outDir, "VISUAL.json"),
    JSON.stringify(
      {
        sourceUrl: args.sourceUrl,
        generatedAt: new Date().toISOString(),
        purpose:
          "Screenshot fingerprints for visual ground-truth during conversion QA",
        pages: visualPages,
        totalScreenshotBytes: screenshotBytes,
      },
      null,
      2,
    ),
  );

  await writeText(
    path.join(outDir, "CONTENT.json"),
    JSON.stringify(contentMap, null, 2),
  );
  await writeText(
    path.join(outDir, "STRUCTURE.json"),
    JSON.stringify(
      {
        sourceUrl: args.sourceUrl,
        generatedAt: new Date().toISOString(),
        note: "Framer named-layer blueprint with geometry for high-accuracy rebuild",
        pages: structurePages,
      },
      null,
      2,
    ),
  );
  await writeText(
    path.join(outDir, "DESIGN_TOKENS.json"),
    JSON.stringify(designTokens, null, 2),
  );
  await writeText(
    path.join(outDir, "ACCURACY.json"),
    JSON.stringify(accuracy, null, 2),
  );
  await writeText(
    path.join(outDir, "CONVERT_PROMPT.md"),
    [
      `# Single-prompt high-accuracy conversion brief`,
      ``,
      `Rebuild this entire Framer website as production Next.js/React in ONE pass.`,
      ``,
      `## Accuracy grade: ${accuracy.grade} (${accuracy.overall}/100)`,
      ``,
      `## Hard rules`,
      `1. Follow STRUCTURE.json layer order and approximate layout proportions`,
      `2. Preserve CONTENT.json headings, CTAs, and copy meaning`,
      `3. Match DESIGN_TOKENS.json colors/fonts closely`,
      `4. Use /public/assets local media paths when available`,
      `5. Use screenshots as visual ground truth (desktop + mobile)`,
      `6. Recreate animations from ANIMATIONS.json / animations.css (appear, keyframes, live WAAPI)`,
      `7. Output clean accessible components — no Framer runtime bundles`,
      ``,
      `## Source`,
      args.sourceUrl,
      ``,
      `## Priority files`,
      `- conversion/STRUCTURE.json`,
      `- conversion/CONTENT.json`,
      `- conversion/DESIGN_TOKENS.json`,
      `- conversion/ALL.css`,
      `- conversion/pages/*.semantic.html`,
      `- conversion/screenshots/*.png`,
      `- conversion/ANIMATIONS.json`,
      `- conversion/animations.css`,
      `- conversion/FRAMER_PUBLISHED.json (published runtime only — no editor/canvas source)`,
      `- conversion/ACCURACY.json`,
      `- pages/*.animated.html (animation state)`,
      ``,
      `## Hard limit`,
      `Framer editor/canvas project files are never available from a published URL.`,
      `This pack maximizes published browser fidelity instead.`,
      ``,
    ].join("\n"),
  );

  return {
    pageCount: pagesOut.length,
    sectionCount,
    imageCount,
    headingCount,
    paragraphCount,
    ctaCount,
    screenshotBytes,
    tokenColors: designTokens.colors.length,
    tokenFonts: designTokens.fonts.length,
    namedLayerCount,
    accuracy,
  };
}
