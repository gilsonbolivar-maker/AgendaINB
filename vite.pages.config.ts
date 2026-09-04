import { copyFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = import.meta.dirname;
const outDir = resolve(projectRoot, "dist-pages");

/**
 * Static build for GitHub Pages (`npm run build:pages`).
 *
 * Deliberately does NOT load the Start/Nitro/auth/PWA plugins from
 * `vite.config.ts`: Pages serves files, not a server, and the agenda needs no
 * server (see `src/entry-static.tsx`). `base` defaults to the project-page
 * path and is overridable with PAGES_BASE for a user/org page or a fork under
 * a different repository name.
 */
const base = process.env.PAGES_BASE ?? "/AgendaINB/";

/** Pages has no SPA rewrite, so an unknown path must fall back to the app. */
function pagesFallbackPlugin(): Plugin {
  return {
    name: "agenda:pages-fallback",
    closeBundle() {
      copyFileSync(join(outDir, "index.html"), join(outDir, "404.html"));
      writeFileSync(join(outDir, ".nojekyll"), "");
    },
  };
}

export default defineConfig({
  base,
  root: resolve(projectRoot, "pages"),
  publicDir: resolve(projectRoot, "public"),
  resolve: {
    alias: { "@": resolve(projectRoot, "src") },
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
  plugins: [tailwindcss(), viteReact(), pagesFallbackPlugin()],
});
