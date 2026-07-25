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

function createPlugins(pkgJson) {
  return [
    glsl({
      include: /\.(glsl|gs)$/,
      compress: false
    }),
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
