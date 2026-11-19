/**
 * Resolve an asset path or rebase a CDN URL onto the selected instance's CDN.
 * Accepts bare paths, /cdn paths, and URLs using /cdn or the configured path prefix.
 * Preserves encoded paths, query parameters (including signatures), and fragments.
 * Non-HTTP URLs and invalid inputs are returned unchanged.
 */
export function resolveCdnUrl(value: string, cdnBase: string): string {
   try {
      const target = new URL(cdnBase);
      const original = new URL(value, "https://cdn.invalid/");
      if (!["http:", "https:"].includes(target.protocol) || !["http:", "https:"].includes(original.protocol)) return value;

      const basePath = target.pathname.replace(/\/+$/, "");
      let path = original.pathname;
      if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
         path = path.slice(basePath.length);
      } else {
         path = path.replace(/^\/cdn(?:\/|$)/, "/");
      }

      target.pathname = `${basePath}/${path.replace(/^\/+/, "")}`;
      target.search = original.search;
      target.hash = original.hash;
      return target.toString();
   } catch {
      return value;
   }
}
