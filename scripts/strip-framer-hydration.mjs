/** Marketing pages use SSR HTML + appear scripts + framely-bridge — no React hydration. */
export function stripFramerHydration(html) {
  let next = html;

  next = next.replace(/\sdata-framer-hydrate-v2="[^"]*"/g, "");
  next = next.replace(/\sdata-framer-generated-page(?:=(?:"[^"]*"|[^\s>]*))?/g, "");

  next = next.replace(/<link\s+rel="modulepreload"[^>]*>\s*/gi, "");

  next = next.replace(
    /<script\s+type="module"\s+[^>]*src="\/assets\/js\/framerusercontent\.com\/[^"]+"[^>]*>\s*<\/script>\s*/gi,
    "",
  );
  next = next.replace(
    /<script[^>]*src="\/assets\/js\/framerusercontent\.com\/[^"]+"[^>]*>\s*<\/script>\s*/gi,
    "",
  );

  // Keep inline animator + data-framer-appear-animation (SSR fade-ins without React).

  next = next.replace(
    /<script>\s*try\s*\{[\s\S]*?framer\.com\/init[\s\S]*?<\/script>\s*/gi,
    "",
  );
  next = next.replace(
    /<script[^>]*src="\/assets\/js\/framer\.com\/init[^"]*"[^>]*>\s*<\/script>\s*/gi,
    "",
  );
  next = next.replace(
    /<script[^>]*src="\/assets\/js\/events\.framer\.com\/[^"]*"[^>]*>\s*<\/script>\s*/gi,
    "",
  );

  return next;
}