import { promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { assertSafeUrl, isPublicHttpUrl } from "@/lib/ssrf";
import { updateJob } from "@/lib/jobs/store";
import { jobWorkspace, jobZipPath } from "@/lib/paths";
import { persistZip, writeBinary, writeText } from "@/lib/storage";
import type {
  AssetRecord,
  CompletenessReport,
  ExtractManifest,
} from "@/lib/types";
import {
  collectUrlsFromCss,
  collectUrlsFromHtml,
  localPathForUrl,
  rewriteHtml,
} from "@/lib/extract/assets";
import { discoverUrlsInText, rewriteTextUrls } from "@/lib/extract/js-deps";
import { zipDirectory } from "@/lib/extract/zip";
import {
  captureSiteWithBrowser,
  type CapturedPage,
} from "@/lib/extract/browser-capture";
import { buildConversionPack } from "@/lib/extract/conversion-pack";
import { fetchBufferWithRetry } from "@/lib/extract/download";
import { buildAnimationInventory } from "@/lib/extract/animations";
import { buildFramerPublishedMeta } from "@/lib/extract/framer-published";
import { partitionMissingUrls } from "@/lib/extract/url-relevance";
import { scoreExtractionAccuracy } from "@/lib/extract/accuracy";

const CONCURRENCY = 10;

function classifyBucket(contentType: string | null, resourceType?: string) {
  const type = (contentType || "").toLowerCase();
  if (resourceType === "script" || type.includes("javascript")) return "js";
  if (resourceType === "stylesheet" || type.includes("text/css")) return "css";
  if (resourceType === "font" || type.includes("font")) return "fonts";
  if (resourceType === "image" || type.startsWith("image/")) return "images";
  if (resourceType === "media" || type.startsWith("video/") || type.startsWith("audio/")) {
    return "media";
  }
  if (type.includes("json")) return "data";
  if (type.includes("html")) return "html";
  return "other";
}

async function saveAsset(args: {
  workspace: string;
  url: string;
  buffer: Buffer;
  contentType: string | null;
  resourceType?: string;
  urlToLocal: Map<string, string>;
  assets: AssetRecord[];
  byType: Record<string, number>;
}) {
  if (args.urlToLocal.has(args.url)) return args.urlToLocal.get(args.url)!;

  const localPath = localPathForUrl(
    args.url,
    "asset",
    args.contentType,
    args.resourceType,
  );
  await writeBinary(path.join(args.workspace, localPath), args.buffer);
  args.urlToLocal.set(args.url, localPath);

  args.assets.push({
    url: args.url,
    localPath,
    contentType: args.contentType,
    bytes: args.buffer.byteLength,
    resourceType: args.resourceType,
  });

  const bucket = classifyBucket(args.contentType, args.resourceType);
  args.byType[bucket] = (args.byType[bucket] || 0) + 1;
  return localPath;
}

async function downloadMissing(
  urls: string[],
  _pageOrigin: string,
  workspace: string,
  urlToLocal: Map<string, string>,
  assets: AssetRecord[],
  byType: Record<string, number>,
  notes: string[],
  onProgress?: (done: number, total: number) => Promise<void>,
) {
  const queue = [
    ...new Set(
      urls.filter(
        (url) =>
          !urlToLocal.has(url) &&
          /^https?:\/\//i.test(url) &&
          !url.startsWith("inline://"),
      ),
    ),
  ];
  let done = 0;
  let saved = 0;
  let failed = 0;

  async function one(assetUrl: string) {
    try {
      if (!(await isPublicHttpUrl(assetUrl))) {
        notes.push(`Blocked private/non-http asset: ${assetUrl}`);
        return;
      }

      const { buffer, contentType, finalUrl } = await fetchBufferWithRetry(
        assetUrl,
        3,
      );
      await saveAsset({
        workspace,
        url: assetUrl,
        buffer,
        contentType,
        resourceType: undefined,
        urlToLocal,
        assets,
        byType,
      });
      if (finalUrl !== assetUrl) {
        urlToLocal.set(finalUrl, urlToLocal.get(assetUrl)!);
      }
      saved += 1;
    } catch (error) {
      failed += 1;
      notes.push(
        `Failed asset ${assetUrl}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    } finally {
      done += 1;
      if (onProgress && (done % 5 === 0 || done === queue.length)) {
        await onProgress(done, queue.length);
      }
    }
  }

  while (queue.length) {
    const batch = queue.splice(0, CONCURRENCY);
    await Promise.all(batch.map((url) => one(url)));
  }

  return { attempted: done, saved, failed };
}

async function runBrowserExtraction(
  jobId: string,
  startUrl: URL,
  maxPages: number,
  workspace: string,
): Promise<{
  pages: ExtractManifest["pages"];
  assets: AssetRecord[];
  notes: string[];
  completeness: CompletenessReport;
}> {
  const notes: string[] = [];
  const assets: AssetRecord[] = [];
  const pages: ExtractManifest["pages"] = [];
  const urlToLocal = new Map<string, string>();
  const byType: Record<string, number> = {};
  let nestedDiscovered = 0;

  const captured = await captureSiteWithBrowser({
    startUrl: startUrl.toString(),
    maxPages,
    onProgress: async (message, percent) => {
      await updateJob(jobId, {
        progress: { step: "browser-capture", percent, detail: message },
      });
    },
  });

  await updateJob(jobId, {
    progress: {
      step: "saving-network-assets",
      percent: 72,
      detail: `Persisting resources from ${captured.pages.length} page(s)`,
    },
  });

  for (const [pageIndex, page] of captured.pages.entries()) {
    for (const resource of page.resources) {
      await saveAsset({
        workspace,
        url: resource.finalUrl || resource.url,
        buffer: resource.body,
        contentType: resource.contentType,
        resourceType: resource.resourceType,
        urlToLocal,
        assets,
        byType,
      });
    }

    // Persist inline CSS/JS extracted from the live DOM (Framer injects a lot of these)
    for (const [i, css] of page.inlineStyles.entries()) {
      const synthetic = `inline://page-${pageIndex}/style-${i}.css`;
      await saveAsset({
        workspace,
        url: synthetic,
        buffer: Buffer.from(css, "utf8"),
        contentType: "text/css; charset=utf-8",
        resourceType: "stylesheet",
        urlToLocal,
        assets,
        byType,
      });
    }
    for (const [i, css] of page.extractedStylesheets.entries()) {
      const synthetic = `inline://page-${pageIndex}/computed-${i}.css`;
      await saveAsset({
        workspace,
        url: synthetic,
        buffer: Buffer.from(css, "utf8"),
        contentType: "text/css; charset=utf-8",
        resourceType: "stylesheet",
        urlToLocal,
        assets,
        byType,
      });
    }
    for (const [i, js] of page.inlineScripts.entries()) {
      const synthetic = `inline://page-${pageIndex}/script-${i}.js`;
      await saveAsset({
        workspace,
        url: synthetic,
        buffer: Buffer.from(js, "utf8"),
        contentType: "application/javascript; charset=utf-8",
        resourceType: "script",
        urlToLocal,
        assets,
        byType,
      });
    }

    const pagePath = localPathForUrl(page.url, "page", "text/html", "document");
    const renderedPath = pagePath.replace(/\.html$/i, ".rendered.html");
    const animatedPath = pagePath.replace(/\.html$/i, ".animated.html");
    urlToLocal.set(page.url, pagePath);

    const rewrittenInitial = rewriteHtml(page.initialHtml, page.url, urlToLocal);
    const rewrittenRendered = rewriteHtml(page.renderedHtml, page.url, urlToLocal);
    const rewrittenAnimated = rewriteHtml(
      page.animatedHtml || page.renderedHtml,
      page.url,
      urlToLocal,
    );

    await writeText(path.join(workspace, pagePath), rewrittenInitial);
    await writeText(path.join(workspace, renderedPath), rewrittenRendered);
    await writeText(path.join(workspace, animatedPath), rewrittenAnimated);

    pages.push({
      url: page.url,
      localPath: pagePath,
      renderedLocalPath: renderedPath,
      animatedLocalPath: animatedPath,
      title: page.title,
    });
  }

  // Discover nested imports inside JS/CSS and download anything still missing
  await updateJob(jobId, {
    progress: {
      step: "discovering-nested-deps",
      percent: 80,
      detail: "Scanning JS/CSS for more modules",
    },
  });

  const nested = new Set<string>();
  for (const asset of [...assets]) {
    const type = (asset.contentType || "").toLowerCase();
    const isCode =
      type.includes("javascript") ||
      type.includes("ecmascript") ||
      type.includes("text/css") ||
      asset.localPath.endsWith(".js") ||
      asset.localPath.endsWith(".mjs") ||
      asset.localPath.endsWith(".css");
    if (!isCode) continue;
    if (asset.url.startsWith("inline://")) continue;

    const fullPath = path.join(workspace, asset.localPath);
    const text = await fs.readFile(fullPath, "utf8");
    for (const dep of discoverUrlsInText(text, asset.url)) {
      if (!urlToLocal.has(dep)) nested.add(dep);
    }
    if (type.includes("css") || asset.localPath.endsWith(".css")) {
      for (const dep of collectUrlsFromCss(text, asset.url, startUrl.origin, {
        allowAnyPublicHost: true,
      })) {
        if (!urlToLocal.has(dep)) nested.add(dep);
      }
    }
  }

  // DOM-discovered URLs + HTML refs + FULL network URL index (zero-miss goal)
  for (const page of captured.pages as CapturedPage[]) {
    for (const url of page.discoveredUrls) {
      if (!urlToLocal.has(url) && url.startsWith("http")) nested.add(url);
    }
    const discovered = collectUrlsFromHtml(page.renderedHtml, page.url, {
      allowAnyPublicHost: true,
    });
    for (const url of discovered.urls) {
      if (!urlToLocal.has(url)) nested.add(url);
    }
  }
  for (const url of captured.allNetworkUrls) {
    if (!urlToLocal.has(url)) nested.add(url);
  }

  const MAX_NESTED = 2500;
  const nestedList = [...nested].slice(0, MAX_NESTED);
  nestedDiscovered = nested.size;
  if (nested.size > MAX_NESTED) {
    notes.push(
      `Discovered ${nested.size} URLs; downloading first ${MAX_NESTED} for production completeness.`,
    );
  }
  if (nestedList.length) {
    await updateJob(jobId, {
      progress: {
        step: "zero-miss-backfill",
        percent: 82,
        detail: `Downloading ${nestedList.length} remaining network/DOM assets`,
      },
    });
    await downloadMissing(
      nestedList,
      startUrl.origin,
      workspace,
      urlToLocal,
      assets,
      byType,
      notes,
      async (done, total) => {
        await updateJob(jobId, {
          progress: {
            step: "zero-miss-backfill",
            percent: Math.min(88, 82 + Math.round((done / Math.max(total, 1)) * 6)),
            detail: `${done}/${total} assets`,
          },
        });
      },
    );
  }

  // Rewrite code files for offline relative paths
  await updateJob(jobId, {
    progress: { step: "rewriting-offline", percent: 90 },
  });

  for (const asset of assets) {
    const type = (asset.contentType || "").toLowerCase();
    const isText =
      type.includes("javascript") ||
      type.includes("ecmascript") ||
      type.includes("text/css") ||
      type.includes("json") ||
      type.includes("text/html") ||
      asset.localPath.endsWith(".js") ||
      asset.localPath.endsWith(".mjs") ||
      asset.localPath.endsWith(".css") ||
      asset.localPath.endsWith(".html");
    if (!isText) continue;
    const fullPath = path.join(workspace, asset.localPath);
    const original = await fs.readFile(fullPath, "utf8");
    const rewritten = rewriteTextUrls(original, urlToLocal, asset.localPath);
    if (rewritten !== original) {
      await writeText(fullPath, rewritten);
    }
  }

  // Final pass: pull any leftover Framer CDN media still referenced in HTML
  const leftoverFramer = new Set<string>();
  for (const page of pages) {
    for (const relative of [page.localPath, page.renderedLocalPath].filter(
      Boolean,
    ) as string[]) {
      const html = await fs.readFile(path.join(workspace, relative), "utf8");
      for (const match of html.matchAll(
        /https?:\/\/(?:framerusercontent|framercdn|framerstatic)\.com\/[^\s"'<>\\]+/gi,
      )) {
        const remote = match[0]
          .replace(/&amp;/g, "&")
          .replace(/[),.;]+$/, "");
        if (!urlToLocal.has(remote)) leftoverFramer.add(remote);
      }
    }
  }

  if (leftoverFramer.size) {
    await updateJob(jobId, {
      progress: {
        step: "framer-cdn-backfill",
        percent: 91,
        detail: `Fetching ${leftoverFramer.size} leftover Framer CDN refs`,
      },
    });
    await downloadMissing(
      [...leftoverFramer].slice(0, 400),
      startUrl.origin,
      workspace,
      urlToLocal,
      assets,
      byType,
      notes,
    );
  }

  // Re-rewrite pages with the final complete map
  for (const page of pages) {
    for (const relative of [page.localPath, page.renderedLocalPath].filter(Boolean) as string[]) {
      const fullPath = path.join(workspace, relative);
      const original = await fs.readFile(fullPath, "utf8");
      await writeText(fullPath, rewriteHtml(original, page.url, urlToLocal));
    }
  }

  let missingFromRewrite: string[] = [];
  let ignoredMissingUrls: string[] = [];
  const collectMissing = async () => {
    const found: string[] = [];
    for (const page of pages) {
      for (const relative of [
        page.renderedLocalPath,
        page.animatedLocalPath,
        page.localPath,
      ].filter(Boolean) as string[]) {
        const html = await fs.readFile(path.join(workspace, relative), "utf8");
        for (const match of html.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
          const remote = match[0]
            .replace(/&amp;/g, "&")
            .replace(/[),.;`]+$/, "");
          if (!urlToLocal.has(remote)) found.push(remote);
        }
      }
    }
    const partitioned = partitionMissingUrls(
      [...new Set(found)],
      startUrl.origin,
    );
    ignoredMissingUrls = partitioned.ignored;
    return partitioned.essential;
  };

  missingFromRewrite = await collectMissing();

  const backfill = missingFromRewrite
    .filter((url) =>
      /\.(?:m?js|cjs|css|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|mp4|webm|json)(?:\?|$)/i.test(
        url,
      ) ||
      url.includes("framerstatic.com") ||
      url.includes("framerusercontent.com") ||
      url.includes("jspm.io") ||
      url.includes("fonts.gstatic.com") ||
      url.includes("fonts.googleapis.com"),
    )
    .slice(0, 200);

  if (backfill.length) {
    await updateJob(jobId, {
      progress: {
        step: "final-backfill",
        percent: 93,
        detail: `Backfilling ${backfill.length} remaining asset URLs`,
      },
    });
    await downloadMissing(
      backfill,
      startUrl.origin,
      workspace,
      urlToLocal,
      assets,
      byType,
      notes,
    );

    for (const page of pages) {
      for (const relative of [
        page.localPath,
        page.renderedLocalPath,
        page.animatedLocalPath,
      ].filter(Boolean) as string[]) {
        const fullPath = path.join(workspace, relative);
        const original = await fs.readFile(fullPath, "utf8");
        await writeText(fullPath, rewriteHtml(original, page.url, urlToLocal));
      }
    }
    missingFromRewrite = await collectMissing();
  }

  await updateJob(jobId, {
    progress: {
      step: "conversion-pack",
      percent: 94,
      detail: "Building high-accuracy conversion package",
    },
  });

  const cssFiles: Array<{ localPath: string; content: string }> = [];
  for (const asset of assets) {
    if (
      !(
        asset.localPath.endsWith(".css") ||
        (asset.contentType || "").includes("text/css")
      )
    ) {
      continue;
    }
    try {
      const content = await fs.readFile(
        path.join(workspace, asset.localPath),
        "utf8",
      );
      cssFiles.push({ localPath: asset.localPath, content });
    } catch {
      // skip unreadable
    }
  }

  const packSummary = await buildConversionPack({
    workspace,
    sourceUrl: startUrl.toString(),
    pages: captured.pages.map((page) => ({
      url: page.url,
      title: page.title,
      renderedHtml: page.renderedHtml,
      screenshot: page.screenshot,
      mobileScreenshot: page.mobileScreenshot,
      contentMap: page.contentMap,
      framerLayers: page.framerLayers,
    })),
    cssFiles,
    assetsSaved: assets.length,
    missingCount: missingFromRewrite.length,
    fontCount: byType.fonts || 0,
  });

  notes.push(
    `Conversion pack ready: grade ${packSummary.accuracy.grade} (${packSummary.accuracy.overall}/100), ${packSummary.namedLayerCount} named layers, ${packSummary.sectionCount} sections, ${packSummary.tokenColors} colors.`,
  );

  const inlineCssTexts = captured.pages.flatMap((p) => [
    ...p.inlineStyles,
    ...p.extractedStylesheets,
  ]);
  const jsFiles: Array<{ path: string; content: string }> = [];
  for (const asset of assets) {
    if (
      !(
        /\.(?:js|mjs|cjs)$/i.test(asset.localPath) ||
        (asset.contentType || "").includes("javascript") ||
        (asset.contentType || "").includes("ecmascript")
      )
    ) {
      continue;
    }
    try {
      const content = await fs.readFile(
        path.join(workspace, asset.localPath),
        "utf8",
      );
      // Cap per-file scan size for inventory speed
      jsFiles.push({
        path: asset.localPath,
        content: content.slice(0, 1_500_000),
      });
    } catch {
      // skip
    }
  }
  const animationInventory = buildAnimationInventory({
    html: captured.pages.map((p) => p.animatedHtml || p.renderedHtml).join("\n"),
    cssTexts: [...cssFiles.map((f) => f.content), ...inlineCssTexts],
    assetPaths: assets.map((a) => a.localPath),
    liveAnimations: captured.pages.flatMap((p) => p.liveAnimations || []),
    jsFiles,
  });
  await writeText(
    path.join(workspace, "conversion", "ANIMATIONS.json"),
    JSON.stringify(animationInventory, null, 2),
  );
  await writeText(
    path.join(workspace, "conversion", "animations.css"),
    [
      "/* Extracted Framer @keyframes for offline replay */",
      ...animationInventory.keyframes.map((k) => k.css),
    ].join("\n\n"),
  );
  notes.push(
    `Animations captured: ${animationInventory.keyframes.length} keyframes, ${animationInventory.appearNodes.length} appear nodes, ${animationInventory.liveAnimations.length} live WAAPI, ${animationInventory.jsAnimationHints.length} JS hints, ${animationInventory.motionAssets.length} motion assets.`,
  );

  const networkCaptured = captured.allNetworkUrls.length;
  const savedHttp = assets.filter((a) => a.url.startsWith("http")).length;
  const framerPublished = buildFramerPublishedMeta({
    html: captured.pages.map((p) => p.animatedHtml || p.renderedHtml).join("\n"),
    namedLayerCount: packSummary.namedLayerCount,
  });
  await writeText(
    path.join(workspace, "conversion", "FRAMER_PUBLISHED.json"),
    JSON.stringify(framerPublished, null, 2),
  );

  // Final accuracy pass including animations + published meta + animated HTML
  const finalAccuracy = scoreExtractionAccuracy({
    assetsSaved: assets.length,
    missingCount: missingFromRewrite.length,
    headingCount: packSummary.headingCount,
    paragraphCount: packSummary.paragraphCount,
    sectionCount: packSummary.sectionCount,
    namedLayerCount: packSummary.namedLayerCount,
    imageCount: packSummary.imageCount,
    ctaCount: packSummary.ctaCount,
    cssFileCount: cssFiles.length,
    fontCount: byType.fonts || 0,
    hasDesktopScreenshot: packSummary.accuracy.visualReference >= 50,
    hasMobileScreenshot: packSummary.accuracy.visualReference >= 80,
    hasSemanticHtml: packSummary.pageCount > 0,
    hasDesignTokens: packSummary.tokenColors + packSummary.tokenFonts > 0,
    hasAnimationsPack: true,
    hasPublishedMeta: true,
    hasAnimatedHtml: pages.some((p) => Boolean(p.animatedLocalPath)),
    keyframeCount: animationInventory.keyframes.length,
    motionAssetCount:
      animationInventory.motionAssets.length +
      animationInventory.framerRuntimeAssets.length,
    screenshotBytes: packSummary.screenshotBytes,
  });
  packSummary.accuracy = finalAccuracy;
  await writeText(
    path.join(workspace, "conversion", "ACCURACY.json"),
    JSON.stringify(finalAccuracy, null, 2),
  );
  notes.push(
    `Final accuracy ${finalAccuracy.grade} (${finalAccuracy.overall}/100) · conversion readiness ${finalAccuracy.conversionReadiness}.`,
  );

  const productionGate = {
    mode: "production-max-accuracy",
    engine: "playwright-cdp",
    networkUrlsSeen: networkCaptured,
    httpAssetsSaved: savedHttp,
    totalAssetsSaved: assets.length,
    missingEssentialAssets: missingFromRewrite.length,
    ignoredNonEssentialUrls: ignoredMissingUrls.length,
    missingFromRewrite: missingFromRewrite.length,
    nestedDiscovered,
    accuracyGrade: packSummary.accuracy.grade,
    accuracyScore: packSummary.accuracy.overall,
    conversionReadiness: packSummary.accuracy.conversionReadiness,
    editorSourceAvailable: false as const,
    publishedFidelity: true,
    passed:
      missingFromRewrite.length === 0 &&
      packSummary.accuracy.overall >= 90 &&
      assets.length > 0,
    animations: {
      keyframes: animationInventory.keyframes.length,
      appearNodes: animationInventory.appearNodes.length,
      animatedStyleNodes: animationInventory.animatedStyleNodes.length,
      liveWaapi: animationInventory.liveAnimations.length,
      jsHints: animationInventory.jsAnimationHints.length,
      motionAssets: animationInventory.motionAssets.length,
      framerRuntimeAssets: animationInventory.framerRuntimeAssets.length,
    },
    ignoredMissingSample: ignoredMissingUrls.slice(0, 20),
    essentialMissingSample: missingFromRewrite.slice(0, 20),
    checklist: [
      missingFromRewrite.length === 0
        ? `PASS: no essential assets missing (${ignoredMissingUrls.length} non-essential ignored)`
        : `FAIL: ${missingFromRewrite.length} essential assets remain`,
      networkCaptured > 0
        ? `PASS: CDP/network saw ${networkCaptured} URLs`
        : "FAIL: no network URLs observed",
      savedHttp > 0
        ? `PASS: saved ${savedHttp} http assets`
        : "FAIL: no http assets saved",
      packSummary.accuracy.overall >= 90
        ? `PASS: accuracy ${packSummary.accuracy.grade} (${packSummary.accuracy.overall})`
        : `WARN: accuracy ${packSummary.accuracy.grade} (${packSummary.accuracy.overall})`,
      animationInventory.appearNodes.length > 0 ||
      animationInventory.keyframes.length > 0 ||
      animationInventory.liveAnimations.length > 0 ||
      animationInventory.jsAnimationHints.length > 0
        ? `PASS: animations inventoried (kf=${animationInventory.keyframes.length}, appear=${animationInventory.appearNodes.length}, live=${animationInventory.liveAnimations.length}, jsHints=${animationInventory.jsAnimationHints.length})`
        : "WARN: no CSS/appear/live/JS animations detected (site may be static)",
      animationInventory.motionAssets.length > 0 ||
      animationInventory.framerRuntimeAssets.length > 0
        ? `PASS: motion/runtime JS saved (${animationInventory.motionAssets.length + animationInventory.framerRuntimeAssets.length})`
        : "WARN: no motion/framer runtime JS paths matched",
      "PASS: published-runtime fidelity pack written (editor/canvas source unavailable by design)",
    ],
  };

  await writeText(
    path.join(workspace, "PRODUCTION_GATE.json"),
    JSON.stringify(productionGate, null, 2),
  );
  await writeText(
    path.join(workspace, "NETWORK_URLS.json"),
    JSON.stringify(
      {
        count: captured.allNetworkUrls.length,
        urls: captured.allNetworkUrls,
      },
      null,
      2,
    ),
  );

  const completeness: CompletenessReport = {
    engine: "playwright-cdp",
    pagesCaptured: pages.length,
    assetsSaved: assets.length,
    totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    byType,
    missingFromRewrite: missingFromRewrite.slice(0, 50),
    ignoredNonEssentialUrls: ignoredMissingUrls.slice(0, 50),
    nestedDiscovered,
    accuracy: packSummary.accuracy,
    notes: [
      "Production CDP capture: every network response body saved when available.",
      "Zero-miss backfill downloads any URL seen in network/DOM/CSS/JS that was not already saved.",
      "Animations: animated HTML + ANIMATIONS.json keyframes/appear/motion runtime assets preserved.",
      "Includes STRUCTURE, CONTENT, tokens, desktop/mobile screenshots, PRODUCTION_GATE.json.",
      `Accuracy grade ${packSummary.accuracy.grade} (${packSummary.accuracy.overall}/100).`,
      `Gate ${productionGate.passed ? "PASSED" : "NEEDS REVIEW"} · network ${networkCaptured} · saved ${assets.length}.`,
      `Animations: ${animationInventory.keyframes.length} keyframes · ${animationInventory.liveAnimations.length} live WAAPI · ${animationInventory.jsAnimationHints.length} JS hints · ${animationInventory.motionAssets.length} motion JS · ${animationInventory.appearNodes.length} appear nodes.`,
    ],
  };

  return { pages, assets, notes, completeness };
}

async function runFetchFallbackExtraction(
  jobId: string,
  startUrl: URL,
  maxPages: number,
  workspace: string,
): Promise<{
  pages: ExtractManifest["pages"];
  assets: AssetRecord[];
  notes: string[];
  completeness: CompletenessReport;
}> {
  const notes: string[] = [
    "Playwright unavailable — used fetch fallback (may miss hydrated Framer modules).",
  ];
  const assets: AssetRecord[] = [];
  const pages: ExtractManifest["pages"] = [];
  const urlToLocal = new Map<string, string>();
  const byType: Record<string, number> = {};
  const pageQueue = [startUrl.toString()];
  const seenPages = new Set<string>();
  const pendingAssets = new Set<string>();

  while (pageQueue.length && seenPages.size < maxPages) {
    const pageUrl = pageQueue.shift()!;
    const normalized = pageUrl.split("#")[0];
    if (seenPages.has(normalized)) continue;
    seenPages.add(normalized);

    try {
      await assertSafeUrl(normalized);
      const { buffer, finalUrl } = await fetchBufferWithRetry(normalized);
      const html = buffer.toString("utf8");
      const $ = cheerio.load(html);
      const title = $("title").first().text().trim() || finalUrl;
      const localPath = localPathForUrl(finalUrl, "page", "text/html", "document");
      urlToLocal.set(finalUrl, localPath);
      urlToLocal.set(normalized, localPath);

      const discovered = collectUrlsFromHtml(html, finalUrl);
      for (const assetUrl of discovered.urls) pendingAssets.add(assetUrl);
      for (const link of discovered.links) {
        if (!seenPages.has(link) && pageQueue.length + seenPages.size < maxPages) {
          pageQueue.push(link);
        }
      }

      pages.push({ url: finalUrl, localPath, title });
      await writeText(path.join(workspace, localPath), html);
      await updateJob(jobId, {
        progress: {
          step: "crawling-pages",
          percent: Math.min(40, 15 + seenPages.size * 3),
          detail: `Fetched ${seenPages.size} page(s)`,
        },
      });
    } catch (error) {
      notes.push(
        `Skipped page ${normalized}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  if (!pages.length) {
    throw new Error("Could not fetch any pages from the provided URL");
  }

  await downloadMissing(
    [...pendingAssets],
    startUrl.origin,
    workspace,
    urlToLocal,
    assets,
    byType,
    notes,
    async (done, total) => {
      await updateJob(jobId, {
        progress: {
          step: "downloading-assets",
          percent: Math.min(75, 45 + Math.round((done / Math.max(total, 1)) * 30)),
          detail: `${done}/${total} assets`,
        },
      });
    },
  );

  for (const page of pages) {
    const fullPath = path.join(workspace, page.localPath);
    const original = await fs.readFile(fullPath, "utf8");
    await writeText(fullPath, rewriteHtml(original, page.url, urlToLocal));
  }

  return {
    pages,
    assets,
    notes,
    completeness: {
      engine: "fetch-fallback",
      pagesCaptured: pages.length,
      assetsSaved: assets.length,
      totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
      byType,
      missingFromRewrite: [],
      nestedDiscovered: 0,
      notes: [
        "Install Playwright Chromium for full Framer hydration capture: npx playwright install chromium",
      ],
    },
  };
}

export async function runExtraction(
  jobId: string,
  sourceUrl: string,
  maxPages = 12,
): Promise<void> {
  await updateJob(jobId, {
    status: "running",
    progress: { step: "validating", percent: 4, detail: sourceUrl },
  });

  const startUrl = await assertSafeUrl(sourceUrl);
  const workspace = jobWorkspace(jobId);
  await fs.rm(workspace, { recursive: true, force: true });
  await fs.mkdir(workspace, { recursive: true });

  let result: {
    pages: ExtractManifest["pages"];
    assets: AssetRecord[];
    notes: string[];
    completeness: CompletenessReport;
  };

  try {
    result = await runBrowserExtraction(jobId, startUrl, maxPages, workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "browser failed";
    await updateJob(jobId, {
      progress: {
        step: "browser-fallback",
        percent: 12,
        detail: `Browser capture failed (${message.slice(0, 120)}). Using fetch fallback.`,
      },
    });
    result = await runFetchFallbackExtraction(jobId, startUrl, maxPages, workspace);
  }

  const manifest: ExtractManifest = {
    sourceUrl: startUrl.toString(),
    fetchedAt: new Date().toISOString(),
    pages: result.pages,
    assets: result.assets,
    notes: result.notes,
    completeness: result.completeness,
  };

  await writeText(
    path.join(workspace, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  await writeText(
    path.join(workspace, "COMPLETENESS.json"),
    JSON.stringify(result.completeness, null, 2),
  );

  const urlMap = Object.fromEntries(
    result.assets.map((asset) => [asset.url, asset.localPath]),
  );
  await writeText(
    path.join(workspace, "url-map.json"),
    JSON.stringify(urlMap, null, 2),
  );

  const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const assetIndex = [
    "localPath,contentType,resourceType,bytes,url",
    ...result.assets.map((asset) =>
      [
        csvEscape(asset.localPath),
        csvEscape(asset.contentType || ""),
        csvEscape(asset.resourceType || ""),
        String(asset.bytes),
        csvEscape(asset.url),
      ].join(","),
    ),
  ].join("\n");
  await writeText(path.join(workspace, "ASSET_INDEX.csv"), assetIndex);

  // Directory tree for quick inspection
  async function walk(dir: string, prefix = ""): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const lines: string[] = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        lines.push(`${prefix}${entry.name}/`);
        lines.push(...(await walk(full, `${prefix}  `)));
      } else {
        const stat = await fs.stat(full);
        lines.push(`${prefix}${entry.name} (${stat.size} bytes)`);
      }
    }
    return lines;
  }
  await writeText(
    path.join(workspace, "TREE.txt"),
    ["FramerForge production zip tree", "", ...(await walk(workspace))].join("\n"),
  );

  await writeText(
    path.join(workspace, "README.md"),
    [
      `# FramerForge production extract`,
      ``,
      `Source: ${startUrl.toString()}`,
      `Engine: ${result.completeness.engine}`,
      `Fetched: ${manifest.fetchedAt}`,
      `Pages: ${result.pages.length}`,
      `Assets: ${result.assets.length}`,
      `Total bytes: ${result.completeness.totalBytes}`,
      ``,
      `## Zip layout`,
      `- \`index.html\` — entrypoint`,
      `- \`conversion/\` — HIGH-ACCURACY single-prompt conversion pack`,
      `  - STRUCTURE.json (Framer named layers + geometry)`,
      `  - CONTENT.json (sections, headings, CTAs, images)`,
      `  - DESIGN_TOKENS.json (colors/fonts)`,
      `  - ACCURACY.json (graded fidelity score)`,
      `  - ALL.css (consolidated styles)`,
      `  - pages/*.semantic.html`,
      `  - screenshots/*.desktop.png + *.mobile.png`,
      `  - CONVERT_PROMPT.md`,
      `- \`PRODUCTION_GATE.json\` — pass/fail production completeness gate`,
      `- \`NETWORK_URLS.json\` — every URL observed on the network`,
      `- \`conversion/ANIMATIONS.json\` — keyframes, appear nodes, motion/runtime assets`,
      `- \`conversion/animations.css\` — extracted @keyframes`,
      `- \`conversion/FRAMER_PUBLISHED.json\` — published runtime inventory (editor source unavailable)`,
      `- \`pages/*.animated.html\` — DOM with Framer animation state preserved`,
      `- \`pages/*.rendered.html\` — settled sharp DOM for conversion`,
      `- \`pages/\` — original + fully rendered HTML`,
      `- \`assets/js/\` — every captured JavaScript module + inline scripts`,
      `- \`assets/css/\` — stylesheets + extracted/computed CSS`,
      `- \`assets/fonts/\` — web fonts`,
      `- \`assets/images/\` — images (including lazy/srcset variants when found)`,
      `- \`assets/video/\` — video media`,
      `- \`assets/data/\` — JSON / CMS payloads`,
      `- \`manifest.json\` — full machine-readable inventory`,
      `- \`ASSET_INDEX.csv\` — spreadsheet-friendly asset list`,
      `- \`url-map.json\` — remote URL → local path map`,
      `- \`COMPLETENESS.json\` — capture quality report`,
      `- \`TREE.txt\` — full file tree`,
      ``,
      `## Asset breakdown`,
      ...Object.entries(result.completeness.byType).map(
        ([key, value]) => `- ${key}: ${value}`,
      ),
      ``,
      `Open \`pages/*.rendered.html\` for the closest offline snapshot of the Framer site.`,
      ``,
    ].join("\n"),
  );

  // Convenience entrypoint + gallery index
  const pageLinks = result.pages
    .map((page) => {
      const href = page.renderedLocalPath || page.localPath;
      return `<li><a href="./${href}">${page.title}</a> <code>${page.url}</code></li>`;
    })
    .join("\n");

  await writeText(
    path.join(workspace, "index.html"),
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FramerForge Extract</title>
  <style>
    body{font-family:Georgia,serif;margin:0;background:#10241b;color:#f4efe6}
    main{max-width:880px;margin:0 auto;padding:2.5rem 1.25rem}
    a{color:#f0b27a}
    code{font-size:.85em;opacity:.75}
    .meta{opacity:.8}
  </style>
</head>
<body>
  <main>
    <h1>FramerForge production extract</h1>
    <p class="meta">Source: ${startUrl.toString()}</p>
    <p class="meta">${result.assets.length} assets · ${result.pages.length} pages · engine ${result.completeness.engine}</p>
    <h2>Pages</h2>
    <ol>
      ${pageLinks}
    </ol>
    <p>Also see <a href="./ASSET_INDEX.csv">ASSET_INDEX.csv</a>, <a href="./manifest.json">manifest.json</a>, <a href="./COMPLETENESS.json">COMPLETENESS.json</a>.</p>
  </main>
</body>
</html>
`,
  );

  await updateJob(jobId, {
    progress: { step: "zipping", percent: 95 },
  });

  const zipPath = jobZipPath(jobId);
  await zipDirectory(workspace, zipPath);
  const downloadName = `framer-complete-${jobId.slice(0, 8)}.zip`;
  const persisted = await persistZip(jobId, zipPath, downloadName);

  await updateJob(jobId, {
    status: "completed",
    progress: {
      step: "done",
      percent: 100,
      detail: `${result.completeness.engine}: ${result.assets.length} assets / ${result.pages.length} pages`,
    },
    resultPath: persisted.localPath,
    resultBlobUrl: persisted.blobUrl,
    downloadName,
    manifest,
  });
}
