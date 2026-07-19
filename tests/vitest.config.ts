import { defineProject } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineProject({
  resolve: {
    mainFields: ["module", "main", "browser"]
  },
  server: {
    port: 51204
  },
  optimizeDeps: {
    exclude: [
      "@galacean/engine",
      "@galacean/engine-loader",
      "@galacean/engine-rhi-webgl",
      "@galacean/engine-math",
      "@galacean/engine-core"
    ]
  },
  test: {
    clearMocks: true,
    fileParallelism: false,
    isolate: true,
    restoreMocks: true,
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          args:
            process.env.HEADLESS === "true"
              ? ["--use-gl=egl", "--ignore-gpu-blocklist", "--use-gl=angle", "--headless"]
              : ["--use-gl=egl", "--ignore-gpu-blocklist", "--use-gl=angle"]
        }
      }),
      instances: [{ browser: "chromium" }]
    }
  }
});
