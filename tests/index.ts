import fs from "fs";
import path from "path";
import mocha from "mocha";

function searchTests(root: string) {
  fs.readdirSync(root).forEach((file) => {
    const filePath = path.join(root, file);
    const stat = fs.statSync(filePath);
    // @ts-ignore
    mocha.setup({
      timeout: 5000
    });
    if (stat.isFile() && filePath.endsWith(".test.ts")) {
      require(filePath);
    } else if (stat.isDirectory()) {
      describe(file, () => {
        searchTests(filePath);
      });
    }
  });
}

searchTests(path.join(__dirname, "src"));
