import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformAsync } from "@babel/core";
import transformClassProperties from "@babel/plugin-transform-class-properties";
import transformClassStaticBlock from "@babel/plugin-transform-class-static-block";
import transformClasses from "@babel/plugin-transform-classes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_PATH = "playground";
const generatedPath = path.join(__dirname, GENERATED_PATH);
const packagesPath = path.resolve(__dirname, "../packages") + path.sep;
const templateStr = fs.readFileSync(path.join(__dirname, "template/iframe.ejs"), "utf8");

// Toolkit 1.x/2.x is published with ES5-style inheritance (`Base.apply(this)`),
// which cannot extend the engine's native ES2022 classes. Downlevel classes only
// while serving/building examples; the published engine output remains ES2022.
const toolkitClassInterop = {
  name: "toolkit-class-interop",
  enforce: "post",
  async transform(code, id) {
    const filename = id.split("?", 1)[0];
    if (!filename.startsWith(packagesPath) || !/\.[cm]?[jt]sx?$/.test(filename)) {
      return null;
    }

    const result = await transformAsync(code, {
      filename,
      babelrc: false,
      configFile: false,
      assumptions: {
        constantSuper: true,
        noClassCalls: true,
        setClassMethods: true,
        superIsCallableConstructor: true
      },
      plugins: [transformClassStaticBlock, transformClassProperties, transformClasses],
      sourceMaps: true
    });

    return result?.code ? { code: result.code, map: result.map } : null;
  }
};

const outputFile = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

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

fs.rmSync(generatedPath, { recursive: true, force: true });
fs.mkdirSync(generatedPath, { recursive: true });

demoList.forEach(({ title, file }) => {
  const titledTemplate = replaceTemplateValue(templateStr, "title", title);
  const html = replaceTemplateValue(titledTemplate, "url", `./${file}.ts`);

  outputFile(path.resolve(generatedPath, file + ".ts"), `import "../src/${file}"`);
  outputFile(path.resolve(generatedPath, file + ".html"), html);
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

outputFile(path.join(generatedPath, ".demoList.json"), JSON.stringify(demoSorted));

export default {
  root: __dirname,
  plugins: [toolkitClassInterop],
  server: {
    open: true,
    host: "0.0.0.0",
    port: 3000
  },
  resolve: {
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
    target: "es2022",
    rolldownOptions: {
      input: [
        path.resolve(__dirname, "index.html"),
        ...demoList.map(({ file }) => path.resolve(generatedPath, `${file}.html`))
      ]
    }
  }
};
