import * as CoreObjects from "@oasishub/engine-core";
import { Loader } from "@oasishub/engine-core";
//@ts-ignore
export const version = `__buildVersion`;

console.log(`Oasishub Engine Version: ${version}`);

export * from "@oasishub/engine-core";
export * from "@oasishub/engine-loader";
export * from "@oasishub/engine-math";
export * from "@oasishub/engine-rhi-webgl";

for (let key in CoreObjects) {
  Loader.registerClass(key, CoreObjects[key]);
}
