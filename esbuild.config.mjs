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

// Host shim resolves react / react-dom / react/jsx-runtime only.
// lucide-react is NOT shimmed; bundling it (with react still external) lets esbuild
// tree-shake icon usage while leaving react imports unresolved for the host shim.
// Marking lucide-react external caused "Compass: Compass" placeholder in v1.1.0 —
// browser cannot resolve the bare "lucide-react" specifier at runtime.
const uiPreset = {
  ...presets.esbuild.ui,
  external: [
    ...(presets.esbuild.ui.external || []),
    "react",
    "react-dom",
    "react/jsx-runtime",
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
