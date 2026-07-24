import fs from "node:fs";
import path from "node:path";

import { rolldown } from "rolldown";

export function readPackageEntry(packageDir) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
  const rootExport = packageJson.exports?.["."];
  const entry =
    (typeof rootExport === "string" ? rootExport : (rootExport?.import ?? rootExport?.default)) ??
    packageJson.module ??
    packageJson.main;

  if (!entry) {
    throw new Error(`No ESM entry found for ${packageJson.name ?? packageDir}`);
  }

  return path.resolve(packageDir, entry);
}

export async function bundlePreload({ entries, outputFile, external }) {
  const virtualId = "\0oasishub-preload-entry";
  const bundle = await rolldown({
    input: virtualId,
    external,
    transform: {
      target: "es2022"
    },
    plugins: [
      {
        name: "oasishub-preload-entry",
        resolveId(id) {
          if (id === virtualId) {
            return virtualId;
          }
        },
        load(id) {
          if (id === virtualId) {
            return entries.map((entry) => `import ${JSON.stringify(entry)};`).join("\n");
          }
        }
      }
    ]
  });

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  await bundle.write({
    file: outputFile,
    format: "es",
    minify: true,
    sourcemap: true
  });
  await bundle.close();
}

export function writePackageManifest(outputDir, packageJson) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
}
