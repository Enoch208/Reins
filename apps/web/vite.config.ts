import { fileURLToPath, URL } from "node:url";
import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function socialImage(siteUrl: string | undefined): Plugin {
  return {
    name: "reins-social-image",
    transformIndexHtml(): HtmlTagDescriptor[] {
      if (siteUrl === undefined || siteUrl.length === 0) return [];
      const image = new URL("/og.png", siteUrl).href;
      const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({
        tag: "meta",
        attrs,
        injectTo: "head",
      });
      return [
        meta({ property: "og:url", content: new URL("/", siteUrl).href }),
        meta({ property: "og:image", content: image }),
        meta({ property: "og:image:width", content: "1200" }),
        meta({ property: "og:image:height", content: "630" }),
        meta({
          property: "og:image:alt",
          content: "Reins: one job, one budget, across every agent",
        }),
        meta({ name: "twitter:image", content: image }),
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), socialImage(process.env.REINS_SITE_URL)],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
