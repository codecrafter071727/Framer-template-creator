import type { ExtractManifest, Framework } from "@/lib/types";

type ContentPack = {
  pages?: Array<{
    title?: string;
    headings?: Array<{ tag: string; text: string }>;
    paragraphs?: string[];
    ctas?: string[];
    sections?: Array<{ name: string; text: string }>;
    images?: Array<{ src: string; alt: string }>;
  }>;
};

type TokenPack = {
  colors?: string[];
  fonts?: string[];
};

type StructurePack = {
  pages?: Array<{
    title?: string;
    layers?: Array<{
      name?: string;
      type?: string | null;
      text?: string;
      rect?: { x: number; y: number; w: number; h: number } | null;
    }>;
  }>;
};

type AnimationsPack = {
  keyframes?: Array<{ name: string; css: string }>;
  appearNodes?: Array<{ appearId: string | null; name: string | null; text: string }>;
  notes?: string[];
};

function escapeJsxText(html: string): string {
  return html.replace(/^\uFEFF/, "").replace(/&/g, "&amp;");
}

function parseJson<T>(raw?: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function rewriteAssetPaths(html: string): string {
  return html
    .replace(/(["'(])(?:\.\.\/)+assets\//g, "$1/assets/")
    .replace(/(["'(])\.\/assets\//g, "$1/assets/")
    .replace(/(["'(])assets\//g, "$1/assets/")
    .replace(/(["'(])\/?pages\/[^"']*?\/assets\//g, "$1/assets/")
    .replace(/srcset="([^"]+)"/gi, (_, value: string) => {
      const next = value
        .split(",")
        .map((part) => {
          const [url, dens] = part.trim().split(/\s+/, 2);
          const rewritten = url
            .replace(/^(?:\.\.\/)+assets\//, "/assets/")
            .replace(/^\.\/assets\//, "/assets/")
            .replace(/^assets\//, "/assets/");
          return dens ? `${rewritten} ${dens}` : rewritten;
        })
        .join(", ");
      return `srcset="${next}"`;
    });
}

function extractBody(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = rewriteAssetPaths(bodyMatch?.[1] || html);
  // Drop remote scripts that break offline convert; keep local asset refs
  body = body.replace(
    /<script\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>\s*<\/script>/gi,
    "",
  );
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (block) =>
    /src=["']\/assets\//i.test(block) ? block : "",
  );
  return body;
}

function buildTokenCss(tokens: TokenPack | null, animationsCss?: string): string {
  const bg = tokens?.colors?.[0] || "#0b1220";
  const ink = tokens?.colors?.[1] || "#f5f1ea";
  const accent = tokens?.colors?.[2] || "#e8a15a";
  const font = tokens?.fonts?.[0] || "Georgia, 'Times New Roman', serif";
  const fontAlt = tokens?.fonts?.[1] || "system-ui, sans-serif";

  return `:root {
  --ff-bg: ${bg};
  --ff-ink: ${ink};
  --ff-accent: ${accent};
  --ff-font-display: ${font};
  --ff-font-body: ${fontAlt};
}
html, body { margin: 0; min-height: 100%; background: var(--ff-bg); color: var(--ff-ink); font-family: var(--ff-font-body); }
.ff-shell { min-height: 100vh; }
.ff-hero, .ff-block, .ff-gallery, .ff-banner { padding: 3rem clamp(1rem, 4vw, 3rem); }
.ff-eyebrow { letter-spacing: .12em; text-transform: uppercase; opacity: .7; font-size: .75rem; font-family: var(--ff-font-body); }
.ff-hero h1 { font-family: var(--ff-font-display); font-size: clamp(2.4rem, 7vw, 4.8rem); line-height: .95; max-width: 14ch; margin: .4rem 0 1rem; }
.ff-lede { max-width: 40rem; opacity: .88; line-height: 1.55; }
.ff-cta-row { display: flex; flex-wrap: wrap; gap: .7rem; margin-top: 1.25rem; }
.ff-cta { display: inline-flex; padding: .75rem 1.1rem; border-radius: .35rem; background: var(--ff-accent); color: #1a120a; text-decoration: none; font-weight: 700; }
.ff-block { border-top: 1px solid color-mix(in oklab, var(--ff-ink) 16%, transparent); }
.ff-block h2 { font-family: var(--ff-font-display); font-size: 1.7rem; margin: 0 0 .7rem; }
.ff-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .75rem; }
.ff-gallery img { width: 100%; height: 180px; object-fit: cover; }
.ff-banner { background: color-mix(in oklab, var(--ff-bg) 70%, #000); }
.ff-fidelity { overflow-x: hidden; }
.ff-fidelity img, .ff-fidelity video { max-width: 100%; height: auto; }
.ff-appear { opacity: 0; transform: translateY(12px); animation: ff-appear .7s ease forwards; }
@keyframes ff-appear { to { opacity: 1; transform: none; } }
${animationsCss || ""}
`;
}

function buildStructuredSections(
  content: ContentPack | null,
  structure: StructurePack | null,
  prompt: string,
): string {
  const page = content?.pages?.[0];
  const layers = structure?.pages?.[0]?.layers || [];

  if (!page && !layers.length) {
    return `<section className="ff-banner"><p>${prompt.slice(0, 160)}</p></section>`;
  }

  const allHeadings = page?.headings || [];
  const heading =
    allHeadings.find((h) => h.tag === "h1" && h.text.length > 8)?.text ||
    allHeadings.find((h) => h.text.length > 8)?.text ||
    page?.title ||
    layers.find((l) => (l.text || "").length > 8)?.text ||
    "Imported Framer site";

  const intro = page?.paragraphs?.[0] || "";
  const shortLabels = allHeadings
    .map((h) => h.text)
    .filter((text) => text.length <= 24 && text !== heading);
  const ctas = [...(page?.ctas || []), ...shortLabels].slice(0, 6);
  const sections = (page?.sections || [])
    .filter((section) => !/^(links|navigation)$/i.test(section.name))
    .slice(0, 10);
  const images = (page?.images || []).slice(0, 8);
  const layerBlocks = layers
    .filter((layer) => layer.name && (layer.text || "").length > 0)
    .slice(0, 12);

  return `
      <header className="ff-hero ff-appear">
        <p className="ff-eyebrow">FramerForge high-accuracy port</p>
        <h1>${heading.replace(/`/g, "'")}</h1>
        ${intro ? `<p className="ff-lede">${intro.replace(/`/g, "'").slice(0, 320)}</p>` : ""}
        <div className="ff-cta-row">
          ${ctas
            .map(
              (cta) =>
                `<a className="ff-cta" href="#">${cta.replace(/`/g, "'").slice(0, 40)}</a>`,
            )
            .join("\n")}
        </div>
      </header>
      ${sections
        .map(
          (section, index) => `
      <section className="ff-block ff-appear" id="section-${index}" style={{animationDelay:'${index * 0.05}s'}}>
        <h2>${String(section.name || `Section ${index + 1}`).replace(/`/g, "'")}</h2>
        <p>${section.text.replace(/`/g, "'").slice(0, 420)}</p>
      </section>`,
        )
        .join("\n")}
      ${
        layerBlocks.length
          ? `<section className="ff-block"><h2>Structure layers</h2>${layerBlocks
              .map(
                (layer) =>
                  `<div className="ff-appear"><strong>${String(layer.name || "").replace(/`/g, "'")}</strong><p>${String(layer.text || "").replace(/`/g, "'").slice(0, 220)}</p></div>`,
              )
              .join("\n")}</section>`
          : ""
      }
      ${
        images.length
          ? `<section className="ff-gallery">${images
              .map(
                (img) =>
                  `<img src="${(img.src || "").replace(/"/g, "")}" alt="${(img.alt || "").replace(/"/g, "")}" />`,
              )
              .join("\n")}</section>`
          : ""
      }
`;
}

export function buildFallbackProject(args: {
  framework: Framework;
  prompt: string;
  manifest: ExtractManifest;
  pages: Array<{ path: string; html: string }>;
  contentJson?: string;
  designTokensJson?: string;
  structureJson?: string;
  animationsJson?: string;
  allCss?: string;
  animationsCss?: string;
}): Array<{ path: string; content: string }> {
  const content = parseJson<ContentPack>(args.contentJson);
  const tokens = parseJson<TokenPack>(args.designTokensJson);
  const structure = parseJson<StructurePack>(args.structureJson);
  const animations = parseJson<AnimationsPack>(args.animationsJson);

  const primary = args.pages[0];
  const fidelityHtml = primary?.html ? extractBody(primary.html) : "";
  // Highest non-AI accuracy: ship captured semantic/rendered HTML + extracted CSS
  const useFidelity = fidelityHtml.length > 400;
  const sectionJsx = buildStructuredSections(content, structure, args.prompt);

  const keyframeCss =
    args.animationsCss ||
    (animations?.keyframes || []).map((k) => k.css).join("\n");
  const tokenCss = buildTokenCss(tokens, keyframeCss);
  const globalsCss = [
    "/* FramerForge high-accuracy convert (offline fidelity + tokens) */",
    args.allCss ? `/* Captured ALL.css */\n${args.allCss.slice(0, 400_000)}` : "",
    tokenCss,
  ]
    .filter(Boolean)
    .join("\n\n");

  const modeLabel = useFidelity
    ? "offline-fidelity (captured HTML + CSS)"
    : content?.pages?.length
      ? "structured pack fallback"
      : "html embed fallback";

  const nextPage = useFidelity
    ? `const html = ${JSON.stringify(escapeJsxText(fidelityHtml))};

export default function Page() {
  return (
    <main className="ff-shell ff-fidelity">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
`
    : `export default function Page() {
  return (
    <main className="ff-shell">
${sectionJsx}
    </main>
  );
}
`;

  const reactApp = useFidelity
    ? `const html = ${JSON.stringify(fidelityHtml)};

export default function App() {
  return (
    <main className="ff-shell ff-fidelity">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
`
    : `export default function App() {
  return (
    <main className="ff-shell">
${sectionJsx}
    </main>
  );
}
`;

  const readme = `# Framer → ${args.framework === "react" ? "React" : "Next.js"} port

Source: ${args.manifest.sourceUrl}
Mode: ${modeLabel}

## Accuracy strategy
- Prefer captured semantic/rendered HTML + \`ALL.css\` + \`animations.css\` for visual fidelity when AI Gateway is unavailable.
- Structured CONTENT/STRUCTURE packs used when HTML samples are thin.
- Framer editor/canvas source is not available from published sites — this rebuild uses published browser assets only.

## Prompt
${args.prompt}
`;

  if (args.framework === "react") {
    return [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "framer-react-port",
            private: true,
            type: "module",
            scripts: {
              dev: "vite",
              build: "tsc -b && vite build",
              preview: "vite preview",
            },
            dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
            devDependencies: {
              "@types/react": "^19.0.0",
              "@types/react-dom": "^19.0.0",
              "@vitejs/plugin-react": "^4.3.4",
              typescript: "^5.7.0",
              vite: "^6.0.0",
            },
          },
          null,
          2,
        ),
      },
      {
        path: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Framer React Port</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      },
      {
        path: "vite.config.ts",
        content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
      },
      {
        path: "src/main.tsx",
        content: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
      },
      { path: "src/App.tsx", content: reactApp },
      { path: "src/styles.css", content: globalsCss },
      { path: "README.md", content: readme },
    ];
  }

  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "framer-next-port",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            next: "^15.1.0",
            react: "^19.0.0",
            "react-dom": "^19.0.0",
          },
          devDependencies: {
            "@types/node": "^20.0.0",
            "@types/react": "^19.0.0",
            "@types/react-dom": "^19.0.0",
            typescript: "^5.7.0",
          },
        },
        null,
        2,
      ),
    },
    {
      path: "next.config.ts",
      content: `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default nextConfig;
`,
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
          exclude: ["node_modules"],
        },
        null,
        2,
      ),
    },
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Framer Next Port",
  description: "Converted from ${args.manifest.sourceUrl}",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    },
    { path: "app/page.tsx", content: nextPage },
    { path: "app/globals.css", content: globalsCss },
    { path: "README.md", content: readme },
  ];
}
