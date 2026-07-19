const path = require("path");
const fs = require("fs-extra");
const GENERATED_PATH = "playground";
const generatedPath = path.join(__dirname, GENERATED_PATH);
const templateStr = fs.readFileSync(path.join(__dirname, "template/iframe.ejs"), "utf8");

const replaceTemplateValue = (template, key, value) => template.replace(new RegExp(`<%=\\s*${key}\\s*%>`, "g"), value);

const demoList = fs
  .readdirSync(path.join(__dirname, "./src"))
  .filter((name) => /.ts$/.test(name))
  .map((name) => {
    const content = fs.readFileSync(path.join(__dirname, "./src", name), "utf8");
    const title = /@title\s+(.+)\b/.exec(content);
    const category = /@category\s+(.+)\b/.exec(content);

    if (!title || !category) {
      throw new Error(`title and category must be set in playground[${name}]`);
    }

    return {
      title: title[1],
      category: category[1],
      file: name.split(".ts")[0]
    };
  });

fs.emptyDirSync(generatedPath);

demoList.forEach(({ title, file }) => {
  const titledTemplate = replaceTemplateValue(templateStr, "title", title);
  const html = replaceTemplateValue(titledTemplate, "url", `./${file}.ts`);

  fs.outputFileSync(path.resolve(generatedPath, file + ".ts"), `import "../src/${file}"`);
  fs.outputFileSync(path.resolve(generatedPath, file + ".html"), html);
});

// output demolist
const demoSorted = {};
demoList.forEach(({ title, category, file }) => {
  if (!demoSorted[category]) {
    demoSorted[category] = [];
  }
  demoSorted[category].push({
    src: file,
    label: title
  });
});

fs.outputJSONSync(path.join(generatedPath, ".demoList.json"), demoSorted);

module.exports = {
  root: __dirname,
  server: {
    open: true,
    host: "0.0.0.0",
    port: 3000
  },
  resolve: {
    mainFields: ["module", "main", "browser"],
    dedupe: ["@galacean/engine"]
  },
  optimizeDeps: {
    exclude: [
      "@galacean/engine",
      "@galacean/engine-physics-physx",
      "@galacean/engine-physics-lite",
      "@galacean/engine-draco",
      "@galacean/engine-lottie",
      "@galacean/engine-spine",
      "@galacean/engine-shaderlab",
      "@galacean/engine-shader",
      "@galacean/engine-ui",
      "@galacean/engine-xr",
      "@galacean/engine-xr-webxr",
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
      "@galacean/engine-toolkit-input-logger",
      "@galacean/engine-toolkit-custom-material"
    ]
  },
  build: {
    rolldownOptions: {
      input: [
        path.resolve(__dirname, "index.html"),
        ...demoList.map(({ file }) => path.resolve(generatedPath, `${file}.html`))
      ]
    }
  }
};
