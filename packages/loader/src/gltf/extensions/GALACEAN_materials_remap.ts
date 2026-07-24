import { AssetPromise, Material } from "@oasishub/engine-core";
import { registerGLTFExtension } from "../parser/GLTFParser";
import { GLTFParserContext } from "../parser/GLTFParserContext";
import { GLTFExtensionMode, GLTFExtensionParser } from "./GLTFExtensionParser";
import { IOasishubMaterialRemap } from "./GLTFExtensionSchema";

@registerGLTFExtension("GALACEAN_materials_remap", GLTFExtensionMode.CreateAndParse)
class GALACEAN_materials_remap extends GLTFExtensionParser {
  override createAndParse(context: GLTFParserContext, schema: IOasishubMaterialRemap): AssetPromise<Material> {
    const { engine } = context.glTFResource;
    // @ts-ignore
    const promise = engine.resourceManager.getResourceByRef<Material>(schema);
    context._addTaskCompletePromise(promise);

    return promise;
  }
}
