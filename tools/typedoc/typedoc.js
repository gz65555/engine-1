const fs = require("fs");
const path = require("path");

fs.rmdirSync(path.join(process.cwd(), "api"), { recursive: true });

const entryPoints = fs.readdirSync(path.join(process.cwd(), "packages")).map((pkg) => {
  return `./packages/${pkg}/src/index.ts`;
});

module.exports = {
  name: "Oasis Engine",
  // mode: "modules",
  out: `api/`,
  // theme: "./node_modules/@oasis-engine/typedoc-theme/bin/default",
  entryPoints: entryPoints,
  // ignoreCompilerErrors: true,
  // preserveConstEnums: true,
  // stripInternal: true,
  // excludeProtected: true,
  // "external-modulemap": "packages/([\\w\\-_]+)/",
  // exclude: [
  //   "**/+(dev-packages|examples|typings)/**/*",
  //   "**/*test.ts",
  //   "packages/adapter-miniprogram/**/*",
  //   "packages/component-miniprogram/**/*",
  //   "packages/**/src/global.d.ts",
  //   "packages/**/shaderLib/global.d.ts",
  //   "scripts/**/*"
  // ],
  // plugin: ["typedoc-plugin-remove-references"]
};
