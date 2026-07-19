#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import config from "./editor-preload-config.mjs";
import { bundlePreload, readPackageEntry, writePackageManifest } from "./preload-utils.mjs";

// Parse command line arguments
const args = process.argv.slice(2);
const versionArg = args.find((arg) => arg.startsWith("--version="));
const packageVersion = versionArg ? versionArg.split("=")[1] : null; // If null, we'll use the engine version

// Get engine version from package.json
const enginePackageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
const engineVersion = enginePackageJson.version;

// Use specified version or fallback to engine version
const finalVersion = packageVersion || engineVersion;

// Fixed package name
const packageName = "@galacean/editor-preload-official";

console.log(`Engine version: ${engineVersion}`);
console.log(`Package name: ${packageName}`);
console.log(`Package version: ${finalVersion}`);
console.log("Building official preload package...");

// Paths
const rootDir = process.cwd();
const outputOfficialDir = path.join(rootDir, "editor-preload-official");
const outputOfficialFile = path.join(outputOfficialDir, "dist", "index.js");

// Create package.json for official package
const officialPackageJson = {
  name: packageName,
  version: finalVersion,
  description: "Official packages preloaded for Galacean Editor",
  type: "module",
  exports: {
    ".": {
      import: "./dist/index.js",
      default: "./dist/index.js"
    }
  },
  files: ["dist"],
  peerDependencies: {
    "@galacean/engine": engineVersion
  }
};

writePackageManifest(outputOfficialDir, officialPackageJson);

const entries = config.firstParty.map((pkg) => readPackageEntry(path.join(rootDir, pkg.path)));
await bundlePreload({
  entries,
  outputFile: outputOfficialFile,
  external: (id) => id === "@galacean/engine" || id.startsWith("@galacean/engine/")
});

// Output file stats
const officialStats = fs.statSync(outputOfficialFile);
console.log(`Created ${outputOfficialFile} (${(officialStats.size / 1024 / 1024).toFixed(2)} MB)`);
console.log("Done!");
