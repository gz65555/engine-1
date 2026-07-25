import "@oasishub/engine";
import "@oasishub/engine-loader";
import { AssetType } from "@oasishub/engine-core";
import { WebGLEngine } from "@oasishub/engine-rhi-webgl";
import { describe, beforeAll, afterAll, expect, it } from "vitest";

let engine: WebGLEngine;

beforeAll(async function () {
  const canvasDOM = document.createElement("canvas");
  canvasDOM.width = 1024;
  canvasDOM.height = 1024;
  engine = await WebGLEngine.create({ canvas: canvasDOM });
});

afterAll(() => {
  engine?.destroy();
});

describe("ProjectLoader Tests", function () {
  it("should load a core-only project successfully", async () => {
    await engine.resourceManager.load({
      type: AssetType.Project,
      url: "https://mdn.alipayobjects.com/huamei_aftkdx/afts/file/A*_Ao1QZtL9fMAAAAAAAAAAAAADteEAQ/mock-project.json"
    });
    const scene = engine.sceneManager.scenes[0];

    const entities = scene.rootEntities;
    expect(entities.length).eq(3);
  });
});
