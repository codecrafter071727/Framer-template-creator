/**
 * Maximize published-site Framer metadata.
 * Editor/canvas source is never available from a published URL — this captures
 * everything the browser runtime exposes instead.
 */

export type FramerPublishedMeta = {
  note: string;
  editorSourceAvailable: false;
  publishedCapture: {
    namedLayers: number;
    appearIds: string[];
    componentTypes: string[];
    modulePreloads: string[];
    scripts: string[];
    stylesheets: string[];
    dataAttributes: string[];
    breakpoints: string[];
  };
  guidance: string[];
};

export function buildFramerPublishedMeta(args: {
  html: string;
  namedLayerCount: number;
}): FramerPublishedMeta {
  const appearIds = [
    ...new Set(
      [...args.html.matchAll(/data-framer-appear-id="([^"]+)"/g)].map((m) => m[1]),
    ),
  ].slice(0, 200);

  const componentTypes = [
    ...new Set(
      [...args.html.matchAll(/data-framer-component-type="([^"]+)"/g)].map(
        (m) => m[1],
      ),
    ),
  ].slice(0, 100);

  const modulePreloads = [
    ...new Set(
      [
        ...args.html.matchAll(
          /rel=["']modulepreload["'][^>]*href=["']([^"']+)["']/gi,
        ),
        ...args.html.matchAll(
          /href=["']([^"']+)["'][^>]*rel=["']modulepreload["']/gi,
        ),
      ].map((m) => m[1]),
    ),
  ].slice(0, 200);

  const scripts = [
    ...new Set(
      [...args.html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(
        (m) => m[1],
      ),
    ),
  ].slice(0, 200);

  const stylesheets = [
    ...new Set(
      [
        ...args.html.matchAll(
          /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi,
        ),
        ...args.html.matchAll(
          /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi,
        ),
      ].map((m) => m[1]),
    ),
  ].slice(0, 200);

  const dataAttributes = [
    ...new Set(
      [...args.html.matchAll(/\s(data-framer-[a-z0-9-]+)=/gi)].map((m) =>
        m[1].toLowerCase(),
      ),
    ),
  ].slice(0, 100);

  const breakpoints = [
    ...new Set(
      [...args.html.matchAll(/data-framer-breakpoint[^"=]*=["']([^"']+)["']/gi)].map(
        (m) => m[1],
      ),
    ),
  ].slice(0, 40);

  return {
    note: "Framer editor/canvas project source cannot be extracted from a published site. This file inventories everything the published browser runtime exposes.",
    editorSourceAvailable: false,
    publishedCapture: {
      namedLayers: args.namedLayerCount,
      appearIds,
      componentTypes,
      modulePreloads,
      scripts,
      stylesheets,
      dataAttributes,
      breakpoints,
    },
    guidance: [
      "Use pages/*.animated.html + assets/js framer/motion chunks for runtime fidelity.",
      "Use conversion/STRUCTURE.json + CONTENT.json + DESIGN_TOKENS.json for rebuild.",
      "Use conversion/ANIMATIONS.json + animations.css for appear/motion recreation.",
      "Do not expect .framer project files, canvas nodes, or unpublished variants.",
    ],
  };
}
