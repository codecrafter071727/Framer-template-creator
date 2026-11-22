import type { ExtractManifest, Framework } from "@/lib/types";

export function buildConversionSystemPrompt(framework: Framework): string {
  const shared = [
    "You convert Framer extracts into production websites with HIGH visual and content accuracy.",
    "Treat conversion/CONTENT.json + semantic HTML + DESIGN_TOKENS.json + ANIMATIONS.json as source of truth.",
    "Preserve section order, heading hierarchy, CTA labels, and image intent.",
    "Recreate appear/motion as Tailwind/CSS transitions or Framer Motion equivalents from ANIMATIONS.json (keyframes, appear nodes, live WAAPI).",
    "Recreate clean semantic components. Do NOT keep Framer runtime bundles.",
    "Use Tailwind utility classes inspired by DESIGN_TOKENS colors/fonts.",
    "Reference local assets under /public/assets when image paths exist.",
    "Return ONLY JSON: { \"files\": [ { \"path\": string, \"content\": string } ] }.",
  ];

  if (framework === "react") {
    return [
      "You are an expert React + Vite engineer.",
      ...shared,
      "Include package.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/components/*, src/styles.css.",
    ].join(" ");
  }

  return [
    "You are an expert Next.js App Router engineer.",
    ...shared,
    "Include package.json, next.config.ts, tsconfig.json, app/layout.tsx, app/page.tsx, app/globals.css, components/*.",
    "Prefer server components. Create one component per major section.",
  ].join(" ");
}

export function buildConversionUserPrompt(args: {
  framework: Framework;
  prompt: string;
  manifest: ExtractManifest;
  htmlSamples: Array<{ path: string; content: string }>;
  contentJson?: string;
  designTokensJson?: string;
  structureJson?: string;
  accuracyJson?: string;
  animationsJson?: string;
  convertBrief?: string;
}): string {
  const pageSummary = args.manifest.pages
    .map((page) => `- ${page.title} (${page.url}) -> ${page.localPath}`)
    .join("\n");

  const assetSummary = args.manifest.assets
    .filter((asset) =>
      /image|font|css|javascript|video/i.test(asset.contentType || asset.localPath),
    )
    .slice(0, 60)
    .map((asset) => `- ${asset.localPath} (${asset.contentType || "unknown"})`)
    .join("\n");

  const samples = args.htmlSamples
    .map(
      (sample) =>
        `### ${sample.path}\n\`\`\`html\n${sample.content.slice(0, 14000)}\n\`\`\``,
    )
    .join("\n\n");

  return [
    `Framework target: ${args.framework}`,
    `User instructions:\n${args.prompt}`,
    ``,
    `Single-prompt goal: rebuild the WHOLE Framer website accurately in one generation.`,
    ``,
    `Source URL: ${args.manifest.sourceUrl}`,
    `Pages:\n${pageSummary || "(none)"}`,
    ``,
    `Conversion brief:\n${(args.convertBrief || "").slice(0, 3000)}`,
    ``,
    `ACCURACY.json:\n${(args.accuracyJson || "{}").slice(0, 2000)}`,
    ``,
    `STRUCTURE.json (Framer named layers):\n${(args.structureJson || "{}").slice(0, 16000)}`,
    ``,
    `CONTENT.json:\n${(args.contentJson || "{}").slice(0, 18000)}`,
    ``,
    `DESIGN_TOKENS.json:\n${(args.designTokensJson || "{}").slice(0, 8000)}`,
    ``,
    `ANIMATIONS.json (keyframes / appear / live WAAPI):\n${(args.animationsJson || "{}").slice(0, 12000)}`,
    ``,
    `Key assets:\n${assetSummary || "(none)"}`,
    ``,
    `Semantic/HTML samples:`,
    samples,
  ].join("\n");
}
