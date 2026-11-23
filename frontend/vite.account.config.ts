import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const output = "../accountclient/ui";
export default defineConfig({
  publicDir: false,
  plugins: [react(), tailwindcss(), {
    name: "account-resources",
    closeBundle() {
      copyFileSync(`${output}/account.html`, `${output}/index.html`);
      mkdirSync(`${output}/locales`, { recursive: true });
      copyFileSync("public/appicon.png", `${output}/appicon.png`);
      for (const f of readdirSync("public/locales").filter(name => name.endsWith(".json")))
        copyFileSync(`public/locales/${f}`, `${output}/locales/${f}`);
    },
  }],
  resolve: { tsconfigPaths: true },
  build: { outDir: output, emptyOutDir: false, rollupOptions: { input: "account.html" } },
});
