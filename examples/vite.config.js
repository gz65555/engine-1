import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_PATH = "playground";
const generatedPath = path.join(__dirname, GENERATED_PATH);
const templateStr = fs.readFileSync(path.join(__dirname, "template/iframe.ejs"), "utf8");

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
      "@galacean/tools-baker"
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
