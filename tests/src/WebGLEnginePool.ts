import { WebGLEngine } from "@oasishub/engine-rhi-webgl";

const canvasDOM = document.createElement("canvas");
canvasDOM.width = 1024;
canvasDOM.height = 1024;

export const defaultEngine = WebGLEngine.create({ canvas: canvasDOM });
