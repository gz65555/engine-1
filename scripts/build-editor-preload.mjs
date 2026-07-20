#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import config from "./editor-preload-config.mjs";
import { bundlePreload, readPackageEntry, writePackageManifest } from "./preload-utils.mjs";

const args = process.argv.slice(2);
const versionArg = args.find((arg) => arg.startsWith("--version="));
const ecosystemVersion = versionArg ? versionArg.split("=")[1] : "1.0.0";
const useNpm = args.includes("--use-npm");
const buildOfficial = args.includes("--build-official");
const rootDir = process.cwd();
const rootPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const outputDir = path.join(rootDir, "editor-preload-ecosystem");
const outputFile = path.join(outputDir, "dist", "index.js");
const entries = [];

console.log(`Engine version: ${rootPackageJson.version}`);
console.log(`Ecosystem version: ${ecosystemVersion}`);
console.log(`Use npm packages: ${useNpm}`);

execFileSync("pnpm", ["b:all"], { stdio: "inherit", cwd: rootDir });

if (useNpm) {
  const tempDir = path.join(rootDir, "temp-install");
  const dependencies = {};

  for (const pkg of config.secondParty) {
    if (pkg.isMonorepo) {
      for (const subPkg of pkg.packages) {
        dependencies[subPkg.name] = ecosystemVersion;
      }
    } else {
      dependencies[pkg.name] = ecosystemVersion;
    }
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(
    path.join(tempDir, "package.json"),
    `${JSON.stringify({ name: "galacean-preload-temp", private: true, dependencies }, null, 2)}\n`
  );
  execFileSync("npm", ["install", "--legacy-peer-deps"], { stdio: "inherit", cwd: tempDir });

  for (const packageName of Object.keys(dependencies)) {
    entries.push(readPackageEntry(path.join(tempDir, "node_modules", packageName)));
  }
} else {
  for (const pkg of config.secondParty) {
    const repoDir = path.join(rootDir, path.basename(pkg.repo, ".git"));

    if (!fs.existsSync(repoDir)) {
      const cloneArgs = ["clone"];
      if (pkg.branch) {
        cloneArgs.push("-b", pkg.branch);
      }
      cloneArgs.push(pkg.repo, repoDir);
      execFileSync("git", cloneArgs, { stdio: "inherit" });
    }

    execFileSync("pnpm", ["link", "../packages/galacean"], { stdio: "inherit", cwd: repoDir });
    execFileSync("pnpm", ["install"], { stdio: "inherit", cwd: repoDir });
    const [buildCommand, ...buildArgs] = pkg.buildCommand.split(" ");
    execFileSync(buildCommand, buildArgs, { stdio: "inherit", cwd: repoDir });

    if (pkg.isMonorepo) {
      for (const subPkg of pkg.packages) {
        entries.push(readPackageEntry(path.join(repoDir, subPkg.packagePath)));
      }
    } else {
      entries.push(readPackageEntry(path.join(repoDir, pkg.packagePath)));
    }
  }
}

const packageJson = {
  name: "@galacean/editor-preload-ecosystem",
  version: ecosystemVersion,
  description: "ESM ecosystem packages preloaded for Galacean Editor",
  type: "module",
  exports: {
    ".": {
      import: "./dist/index.js",
      default: "./dist/index.js"
    }
  },
  files: ["dist"],
  peerDependencies: {
    "@galacean/engine": rootPackageJson.version
  }
};

writePackageManifest(outputDir, packageJson);

const firstPartyNames = new Set(["@galacean/engine", ...config.firstParty.map((pkg) => pkg.name)]);
await bundlePreload({
  entries,
  outputFile,
  external: (id) => [...firstPartyNames].some((name) => id === name || id.startsWith(`${name}/`))
});

if (buildOfficial) {
  execFileSync("node", ["./scripts/build-official-preload.mjs", `--version=${ecosystemVersion}`], {
    stdio: "inherit",
    cwd: rootDir
  });
}

const stats = fs.statSync(outputFile);
console.log(`Created ${outputFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
