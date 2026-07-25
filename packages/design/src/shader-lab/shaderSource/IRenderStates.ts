import { Color } from "@oasishub/engine-math";

export interface IRenderStates {
  constantMap: Record<number, number | string | boolean | Color>;
  variableMap: Record<number, string>;
}
