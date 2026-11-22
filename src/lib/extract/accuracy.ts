export type AccuracyBreakdown = {
  assetCoverage: number;
  contentRichness: number;
  structureFidelity: number;
  styleCoverage: number;
  visualReference: number;
  conversionReadiness: number;
  overall: number;
  grade: "A" | "B" | "C" | "D" | "A+";
  checklist: string[];
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function grade(score: number): AccuracyBreakdown["grade"] {
  if (score >= 98) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  return "D";
}

/**
 * Scores capture fidelity for production conversion readiness.
 * Sparse authentic pages are not punished when extraction is complete
 * relative to what the published site contains.
 */
export function scoreExtractionAccuracy(input: {
  assetsSaved: number;
  missingCount: number;
  headingCount: number;
  paragraphCount: number;
  sectionCount: number;
  namedLayerCount: number;
  imageCount: number;
  ctaCount?: number;
  cssFileCount: number;
  fontCount: number;
  hasDesktopScreenshot: boolean;
  hasMobileScreenshot: boolean;
  hasSemanticHtml: boolean;
  hasDesignTokens: boolean;
  hasAnimationsPack?: boolean;
  hasPublishedMeta?: boolean;
  hasAnimatedHtml?: boolean;
  keyframeCount?: number;
  motionAssetCount?: number;
  screenshotBytes?: number;
}): AccuracyBreakdown {
  const checklist: string[] = [];

  const assetCoverage = clamp(
    (input.missingCount === 0
      ? 78
      : Math.max(40, 78 - input.missingCount * 5)) +
      Math.min(22, input.assetsSaved / 4),
  );
  if (input.missingCount === 0) {
    checklist.push("No missing essential asset URLs");
  } else {
    checklist.push(`${input.missingCount} essential asset URL(s) still remote`);
  }
  if (input.assetsSaved >= 30) checklist.push("Dense asset capture");

  // Content: reward extraction success; sparse pages still score high if structure exists
  const hasAnyCopy =
    input.headingCount + input.paragraphCount + (input.ctaCount || 0) > 0;
  const contentRichness = clamp(
    (hasAnyCopy ? 60 : input.namedLayerCount > 0 ? 50 : 20) +
      Math.min(15, input.headingCount * 5) +
      Math.min(10, input.paragraphCount * 3) +
      Math.min(8, (input.ctaCount || 0) * 2) +
      Math.min(7, input.imageCount * 2) +
      (input.namedLayerCount > 0 ? 10 : 0),
  );
  if (input.headingCount > 0) checklist.push("Headings extracted from live DOM");
  if (input.paragraphCount > 0) checklist.push("Body copy extracted");
  if ((input.ctaCount || 0) > 0) checklist.push("CTAs extracted");

  const structureFidelity = clamp(
    (input.hasSemanticHtml ? 30 : 0) +
      (input.namedLayerCount > 0 ? 35 : 0) +
      Math.min(25, input.namedLayerCount * 4 + input.sectionCount * 2) +
      (input.hasPublishedMeta ? 10 : 0),
  );
  if (input.namedLayerCount > 0) {
    checklist.push("Framer named layers (data-framer-name) mapped");
  }
  if (input.hasSemanticHtml) checklist.push("Semantic HTML pack present");
  if (input.hasPublishedMeta) checklist.push("Published Framer runtime meta captured");

  const styleCoverage = clamp(
    (input.cssFileCount > 0 ? 35 : 0) +
      Math.min(20, input.cssFileCount) +
      Math.min(20, input.fontCount) +
      (input.hasDesignTokens ? 15 : 0) +
      (input.hasAnimationsPack ? 10 : 0),
  );
  if (input.cssFileCount > 0) checklist.push("CSS captured/consolidated");
  if (input.fontCount > 0) checklist.push("Fonts captured");
  if (input.hasDesignTokens) checklist.push("Design tokens extracted");

  const visualReference = clamp(
    (input.hasDesktopScreenshot ? 50 : 0) +
      (input.hasMobileScreenshot ? 30 : 0) +
      (input.screenshotBytes && input.screenshotBytes > 10_000 ? 20 : 0),
  );
  if (input.hasDesktopScreenshot) checklist.push("Desktop screenshot included");
  if (input.hasMobileScreenshot) checklist.push("Mobile screenshot included");

  const conversionReadiness = clamp(
    (input.missingCount === 0 ? 25 : 10) +
      (input.hasSemanticHtml ? 15 : 0) +
      (input.hasDesignTokens ? 15 : 0) +
      (input.hasDesktopScreenshot && input.hasMobileScreenshot ? 15 : 0) +
      (input.hasAnimationsPack ? 15 : 0) +
      (input.hasAnimatedHtml ? 10 : 0) +
      Math.min(5, (input.keyframeCount || 0)) +
      Math.min(5, (input.motionAssetCount || 0) * 2),
  );
  if (input.hasAnimationsPack) checklist.push("Animations pack present");
  if (input.hasAnimatedHtml) checklist.push("Pre-settle animated HTML preserved");

  const overall = clamp(
    assetCoverage * 0.28 +
      structureFidelity * 0.18 +
      styleCoverage * 0.14 +
      visualReference * 0.14 +
      contentRichness * 0.1 +
      conversionReadiness * 0.16,
  );

  return {
    assetCoverage,
    contentRichness,
    structureFidelity,
    styleCoverage,
    visualReference,
    conversionReadiness,
    overall,
    grade: grade(overall),
    checklist,
  };
}
