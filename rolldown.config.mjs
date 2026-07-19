import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { replacePlugin } from "rolldown/plugins";

import glsl from "./rolldown-plugin-glsl.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pkgsRoot = path.join(__dirname, "packages");
const pkgs = fs
  .readdirSync(pkgsRoot)
  .map((dir) => path.join(pkgsRoot, dir))
  .filter((dir) => fs.statSync(dir).isDirectory())
  .map((location) => {
    return {
      location: location,
      pkgJson: JSON.parse(fs.readFileSync(path.resolve(location, "package.json"), "utf8"))
    };
  });

function removeVerboseBlocks() {
  return {
    name: "remove-shaderlab-verbose-blocks",
    transform(code, id) {
      if (!id.includes("/packages/shader-lab/src/") || !code.includes("#if _VERBOSE")) {
        return;
      }

      const output = [];
      const stack = [];
      let active = true;

      for (const line of code.split("\n")) {
        if (/^\s*\/\/\s*#if\s+_VERBOSE\s*$/.test(line)) {
          stack.push({ parentActive: active, condition: false });
          active = false;
          continue;
        }

        if (/^\s*\/\/\s*#else\s*$/.test(line) && stack.length > 0) {
          const current = stack.at(-1);
          active = current.parentActive && !current.condition;
          continue;
        }

        if (/^\s*\/\/\s*#endif\s*$/.test(line) && stack.length > 0) {
          active = stack.pop().parentActive;
          continue;
        }

        if (active) {
          output.push(line);
        }
      }

      return { code: output.join("\n"), map: null };
    }
  };
}

function createPlugins(pkgJson) {
  return [
    glsl({
      include: /\.(glsl|gs)$/,
      compress: false
    }),
    removeVerboseBlocks(),
    replacePlugin({
      __buildVersion: pkgJson.version
    })
  ];
}

function config({ location, pkgJson }) {
  const input = path.join(location, "src", "index.ts");
  const dependencies = Object.assign({}, pkgJson.dependencies ?? {}, pkgJson.peerDependencies ?? {});
  const external = Object.keys(dependencies);
  const outputFile = path.join(location, pkgJson.exports["."].import);

  return {
    input,
    external,
    tsconfig: true,
    transform: {
      target: "es2022"
    },
    output: {
      file: outputFile,
      format: "es",
      minify: false,
      sourcemap: true
    },
    plugins: createPlugins(pkgJson)
  };
}

export default pkgs.map(config);
