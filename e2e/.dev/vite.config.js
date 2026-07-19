import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = "mpa";
const templateStr = fs.readFileSync(path.join(__dirname, "template/iframe.ejs"), "utf8");

const outputFile = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

// 替换 ejs 模版格式的字符串，如 <%= title %>: templateStr.replaceEJS("title","replaced title");
String.prototype.replaceEJS = function (regStr, replaceStr) {
  return this.replace(new RegExp(`<%=\\s*${regStr}\\s*%>`, "g"), replaceStr);
};

// clear mpa
fs.rmSync(path.resolve(__dirname, OUT_PATH), { recursive: true, force: true });
fs.mkdirSync(path.resolve(__dirname, OUT_PATH), { recursive: true });

// create mpa
const demoList = fs
  .readdirSync(path.join(__dirname, "../case"))
  .filter((name) => /.ts$/.test(name) && name.indexOf(".") !== 0)
  .map((name) => {
    return {
      file: name.split(".ts")[0]
    };
  });

demoList.forEach(({ file }) => {
  const ejs = templateStr.replaceEJS("url", `./${file}.ts`);

  outputFile(path.resolve(__dirname, OUT_PATH, file + ".ts"), `import "../../case/${file}"`);
  outputFile(path.resolve(__dirname, OUT_PATH, file + ".html"), ejs);
});

// output demolist
const demoSorted = {};
demoList.forEach(({ file }) => {
  if (!demoSorted[file]) {
    demoSorted[file] = [];
  }
  demoSorted[file].push({
    src: file
  });
});

outputFile(path.join(__dirname, OUT_PATH, ".demoList.json"), JSON.stringify(demoSorted));

export default {
  server: {
    open: true,
    host: "0.0.0.0",
    port: 5175,
    strictPort: true
  },
  resolve: {
    dedupe: ["@galacean/engine"]
  },
  optimizeDeps: {
    exclude: [
      "@galacean/engine",
      "@galacean/engine-draco",
      "@galacean/engine-lottie",
      "@galacean/engine-spine",
      "@galacean/engine-shaderlab",
      "@galacean/tools-baker",
      "@galacean/engine-toolkit",
      "@galacean/engine-toolkit-auxiliary-lines",
      "@galacean/engine-toolkit-controls",
      "@galacean/engine-toolkit-framebuffer-picker",
      "@galacean/engine-toolkit-gizmo",
      "@galacean/engine-toolkit-lines",
      "@galacean/engine-toolkit-outline",
      "@galacean/engine-toolkit-planar-shadow-material",
      "@galacean/engine-toolkit-skeleton-viewer",
      "@galacean/engine-toolkit-grid-material",
      "@galacean/engine-toolkit-navigation-gizmo",
      "@galacean/engine-toolkit-geometry-sketch",
      "@galacean/engine-toolkit-stats",
      "@galacean/engine-toolkit-input-logger"
    ]
  }
};
