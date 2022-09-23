import { GLTFResource } from "./GLTFResource";
import { GLTFUtil } from "./GLTFUtil";
import { AnimationParser } from "./parser/AnimationParser";
import { BufferParser } from "./parser/BufferParser";
import { EntityParser } from "./parser/EntityParser";
import { MaterialParser } from "./parser/MaterialParser";
import { MeshParser } from "./parser/MeshParser";
import { Parser } from "./parser/Parser";
import { SceneParser } from "./parser/SceneParser";
import { SkinParser } from "./parser/SkinParser";
import { TextureParser } from "./parser/TextureParser";
import { Validator } from "./parser/Validator";

export class GLTFParser {
  static defaultPipeline = new GLTFParser([
    BufferParser,
    Validator,
    TextureParser,
    MaterialParser,
    MeshParser,
    EntityParser,
    SkinParser,
    AnimationParser,
    SceneParser
  ]);

  static texturePipeline = new GLTFParser([BufferParser, TextureParser]);
  static materialPipeline = new GLTFParser([BufferParser, TextureParser, MaterialParser]);
  static animationPipeline = new GLTFParser([BufferParser, EntityParser, AnimationParser]);
  static meshPipeline = new GLTFParser([BufferParser, MeshParser]);

  private _pipes: Parser[] = [];

  private constructor(pipes: (new () => Parser)[]) {
    pipes.forEach((pipe: new () => Parser, index: number) => {
      this._pipes[index] = new pipe();
    });
  }

  parse(context: GLTFResource): Promise<GLTFResource> {
    let lastPipe;

    return new Promise((resolve, reject) => {
      this._pipes.forEach((parser: Parser) => {
        if (lastPipe) {
          lastPipe = lastPipe.then(() => {
            return parser.parse(context);
          });
        } else {
          lastPipe = parser.parse(context);
        }
      });

      if (lastPipe) {
        lastPipe
          .then((customRes) => {
            if(customRes) {
              resolve(customRes);
            } else {
              if(!context.defaultKey) {
                resolve(context);
              } else {
                resolve(context[context.defaultKey]);
              }
            }
          })
          .catch(reject);
      } else {
        if(!context.defaultKey) {
          resolve(context);
        } else {
          resolve(context[context.defaultKey]);
        }
      }
    });
  }
}
