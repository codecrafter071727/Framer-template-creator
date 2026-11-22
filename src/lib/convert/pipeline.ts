import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { generateText } from "ai";
import { updateJob } from "@/lib/jobs/store";
import { jobDir, jobWorkspace, jobZipPath } from "@/lib/paths";
import { persistZip, writeText } from "@/lib/storage";
import { zipDirectory } from "@/lib/extract/zip";
import type { ExtractManifest, Framework } from "@/lib/types";
import {
  buildConversionSystemPrompt,
  buildConversionUserPrompt,
} from "@/lib/convert/prompts";
import { buildFallbackProject } from "@/lib/convert/fallback";

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseFilesJson(
  text: string,
): Array<{ path: string; content: string }> | null {
  try {
    const parsed = JSON.parse(stripCodeFences(text)) as {
      files?: Array<{ path: string; content: string }>;
    };
    if (!parsed.files?.length) return null;
    return parsed.files.filter(
      (file) =>
        typeof file.path === "string" &&
        typeof file.content === "string" &&
        file.path.length > 0 &&
        !file.path.includes(".."),
    );
  } catch {
    return null;
  }
}

async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function loadSourcePackage(sourceJobId: string): Promise<{
  manifest: ExtractManifest;
  pages: Array<{ path: string; html: string }>;
  contentJson?: string;
  designTokensJson?: string;
  structureJson?: string;
  accuracyJson?: string;
  animationsJson?: string;
  allCss?: string;
  animationsCss?: string;
  convertBrief?: string;
}> {
  const workspace = jobWorkspace(sourceJobId);

  const readFromWorkspace = async () => {
    const manifestRaw = await fs.readFile(
      path.join(workspace, "manifest.json"),
      "utf8",
    );
    const manifest = JSON.parse(manifestRaw) as ExtractManifest;
    const pages: Array<{ path: string; html: string }> = [];

    // Prefer rendered/animated HTML for offline visual fidelity, then semantic
    for (const page of manifest.pages.slice(0, 4)) {
      const animated =
        page.animatedLocalPath &&
        (await readTextIfExists(path.join(workspace, page.animatedLocalPath)));
      const rendered =
        page.renderedLocalPath &&
        (await readTextIfExists(path.join(workspace, page.renderedLocalPath)));
      const html =
        rendered ||
        animated ||
        (await readTextIfExists(path.join(workspace, page.localPath)));
      if (html) {
        pages.push({
          path:
            page.renderedLocalPath ||
            page.animatedLocalPath ||
            page.localPath,
          html,
        });
      }
    }

    if (!pages.length) {
      const semanticDir = path.join(workspace, "conversion", "pages");
      try {
        const semanticFiles = (await fs.readdir(semanticDir))
          .filter((name) => name.endsWith(".semantic.html"))
          .slice(0, 6);
        for (const name of semanticFiles) {
          const html = await fs.readFile(path.join(semanticDir, name), "utf8");
          pages.push({ path: `conversion/pages/${name}`, html });
        }
      } catch {
        // fall through
      }
    }

    return {
      manifest,
      pages,
      contentJson:
        (await readTextIfExists(path.join(workspace, "conversion/CONTENT.json"))) ||
        undefined,
      designTokensJson:
        (await readTextIfExists(
          path.join(workspace, "conversion/DESIGN_TOKENS.json"),
        )) || undefined,
      structureJson:
        (await readTextIfExists(
          path.join(workspace, "conversion/STRUCTURE.json"),
        )) || undefined,
      accuracyJson:
        (await readTextIfExists(path.join(workspace, "conversion/ACCURACY.json"))) ||
        undefined,
      animationsJson:
        (await readTextIfExists(
          path.join(workspace, "conversion/ANIMATIONS.json"),
        )) || undefined,
      allCss:
        (await readTextIfExists(path.join(workspace, "conversion/ALL.css"))) ||
        undefined,
      animationsCss:
        (await readTextIfExists(
          path.join(workspace, "conversion/animations.css"),
        )) || undefined,
      convertBrief:
        (await readTextIfExists(
          path.join(workspace, "conversion/CONVERT_PROMPT.md"),
        )) || undefined,
    };
  };

  try {
    return await readFromWorkspace();
  } catch {
    // Fall back to zip if workspace missing
  }

  const zipBuffer = await fs.readFile(jobZipPath(sourceJobId));
  const zip = await JSZip.loadAsync(zipBuffer);
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    throw new Error("Source extract is missing manifest.json");
  }
  const manifest = JSON.parse(await manifestFile.async("string")) as ExtractManifest;

  const pages: Array<{ path: string; html: string }> = [];
  for (const page of manifest.pages.slice(0, 4)) {
    const rendered = page.renderedLocalPath
      ? zip.file(page.renderedLocalPath)
      : null;
    const animated = page.animatedLocalPath
      ? zip.file(page.animatedLocalPath)
      : null;
    const file = rendered || animated || zip.file(page.localPath);
    if (!file) continue;
    pages.push({
      path:
        page.renderedLocalPath || page.animatedLocalPath || page.localPath,
      html: await file.async("string"),
    });
  }
  if (!pages.length) {
    const semanticFiles = Object.keys(zip.files)
      .filter(
        (name) =>
          name.startsWith("conversion/pages/") && name.endsWith(".semantic.html"),
      )
      .slice(0, 6);
    for (const name of semanticFiles) {
      const file = zip.file(name);
      if (!file) continue;
      pages.push({ path: name, html: await file.async("string") });
    }
  }

  return {
    manifest,
    pages,
    contentJson: (await zip.file("conversion/CONTENT.json")?.async("string")) || undefined,
    designTokensJson:
      (await zip.file("conversion/DESIGN_TOKENS.json")?.async("string")) || undefined,
    structureJson:
      (await zip.file("conversion/STRUCTURE.json")?.async("string")) || undefined,
    accuracyJson:
      (await zip.file("conversion/ACCURACY.json")?.async("string")) || undefined,
    animationsJson:
      (await zip.file("conversion/ANIMATIONS.json")?.async("string")) || undefined,
    allCss: (await zip.file("conversion/ALL.css")?.async("string")) || undefined,
    animationsCss:
      (await zip.file("conversion/animations.css")?.async("string")) || undefined,
    convertBrief:
      (await zip.file("conversion/CONVERT_PROMPT.md")?.async("string")) || undefined,
  };
}

async function copyPublicAssets(
  sourceJobId: string,
  outDir: string,
): Promise<void> {
  const sourceAssets = path.join(jobWorkspace(sourceJobId), "assets");
  try {
    await fs.cp(sourceAssets, path.join(outDir, "public", "assets"), {
      recursive: true,
    });
  } catch {
    // assets may be absent
  }

  // Also copy screenshots for reference
  const shots = path.join(jobWorkspace(sourceJobId), "conversion", "screenshots");
  try {
    await fs.cp(shots, path.join(outDir, "public", "screenshots"), {
      recursive: true,
    });
  } catch {
    // optional
  }
}

export async function runConversion(args: {
  jobId: string;
  sourceJobId: string;
  prompt: string;
  framework: Framework;
}): Promise<void> {
  const { jobId, sourceJobId, prompt, framework } = args;

  await updateJob(jobId, {
    status: "running",
    progress: { step: "loading-source", percent: 10 },
  });

  const {
    manifest,
    pages,
    contentJson,
    designTokensJson,
    structureJson,
    accuracyJson,
    animationsJson,
    allCss,
    animationsCss,
    convertBrief,
  } = await loadSourcePackage(sourceJobId);

  const outDir = path.join(jobDir(jobId), "project");
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  await updateJob(jobId, {
    progress: {
      step: "generating",
      percent: 35,
      detail: contentJson
        ? `${framework} high-accuracy pack`
        : `${framework} structural`,
    },
  });

  let files = buildFallbackProject({
    framework,
    prompt,
    manifest,
    pages,
    contentJson,
    designTokensJson,
    structureJson,
    animationsJson,
    allCss,
    animationsCss,
  });
  let mode: "ai" | "fallback" = "fallback";

  if (process.env.AI_GATEWAY_API_KEY || process.env.FORCE_AI_CONVERT === "1") {
    try {
      const model =
        process.env.AI_CONVERT_MODEL || "anthropic/claude-sonnet-4.5";
      const { text } = await generateText({
        model,
        system: buildConversionSystemPrompt(framework),
        prompt: buildConversionUserPrompt({
          framework,
          prompt,
          manifest,
          htmlSamples: pages.map((page) => ({
            path: page.path,
            content: page.html,
          })),
          contentJson,
          designTokensJson,
          structureJson,
          accuracyJson,
          animationsJson,
          convertBrief,
        }),
        maxOutputTokens: 24_000,
      });

      const parsed = parseFilesJson(text);
      if (parsed?.length) {
        files = parsed;
        mode = "ai";
      }
    } catch (error) {
      await updateJob(jobId, {
        progress: {
          step: "ai-fallback",
          percent: 55,
          detail:
            error instanceof Error
              ? error.message.slice(0, 180)
              : "AI conversion failed; using structural fallback",
        },
      });
    }
  }

  await updateJob(jobId, {
    progress: {
      step: "writing-files",
      percent: 70,
      detail: mode === "ai" ? "AI high-accuracy rewrite" : "Structural fallback",
    },
  });

  for (const file of files) {
    const target = path.join(outDir, file.path);
    await writeText(target, file.content);
  }

  await copyPublicAssets(sourceJobId, outDir);
  await writeText(
    path.join(outDir, "CONVERSION_META.json"),
    JSON.stringify(
      {
        sourceJobId,
        sourceUrl: manifest.sourceUrl,
        framework,
        prompt,
        mode,
        usedHighAccuracyPack: Boolean(contentJson),
        usedOfflineFidelity: Boolean(allCss || pages[0]?.html),
        editorSourceAvailable: false,
        convertedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  await updateJob(jobId, {
    progress: { step: "zipping", percent: 88 },
  });

  const zipPath = jobZipPath(jobId);
  await zipDirectory(outDir, zipPath);
  const downloadName = `${framework}-from-framer-${jobId.slice(0, 8)}.zip`;
  const persisted = await persistZip(jobId, zipPath, downloadName);

  await updateJob(jobId, {
    status: "completed",
    progress: {
      step: "done",
      percent: 100,
      detail:
        mode === "ai"
          ? "High-accuracy AI conversion ready"
          : "High-accuracy fallback conversion ready",
    },
    resultPath: persisted.localPath,
    resultBlobUrl: persisted.blobUrl,
    downloadName,
    framework,
    prompt,
    sourceJobId,
  });
}
