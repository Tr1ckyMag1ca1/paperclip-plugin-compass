import esbuild from "esbuild";
import { createPluginBundlerPresets } from "@paperclipai/plugin-sdk/bundlers";
import { readFile } from "node:fs/promises";
import path from "node:path";

const rawMarkdownPlugin = {
  name: "raw-markdown",
  setup(build) {
    build.onResolve({ filter: /\.md\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, "")),
      namespace: "raw-md",
    }));
    build.onLoad({ filter: /.*/, namespace: "raw-md" }, async (args) => ({
      contents: await readFile(args.path, "utf8"),
      loader: "text",
    }));
  },
};

const presets = createPluginBundlerPresets({ uiEntry: "src/ui/index.tsx" });
const watch = process.argv.includes("--watch");

const withMd = (cfg) => ({ ...cfg, plugins: [...(cfg.plugins ?? []), rawMarkdownPlugin] });

// Mark react packages as external to prevent bundling.
// Host provides react, react-dom, react/jsx-runtime via browser shims.
// lucide-react depends on react; must mark both as external.
// zod is already external via plugin SDK presets.
const uiPreset = {
  ...presets.esbuild.ui,
  external: [
    ...(presets.esbuild.ui.external || []),
    "react",
    "react-dom",
    "react/jsx-runtime",
    "lucide-react",
  ],
};

const workerCtx = await esbuild.context(withMd(presets.esbuild.worker));
const manifestCtx = await esbuild.context(withMd(presets.esbuild.manifest));
const uiCtx = await esbuild.context(withMd(uiPreset));

if (watch) {
  await Promise.all([workerCtx.watch(), manifestCtx.watch(), uiCtx.watch()]);
  console.log("esbuild watch mode enabled for worker, manifest, and ui");
} else {
  await Promise.all([workerCtx.rebuild(), manifestCtx.rebuild(), uiCtx.rebuild()]);
  await Promise.all([workerCtx.dispose(), manifestCtx.dispose(), uiCtx.dispose()]);
}
