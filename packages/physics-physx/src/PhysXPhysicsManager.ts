import { IPhysicsManager } from "@oasishub/engine-design";
import { TriggerEvent } from "./PhysXPhysicsScene";

export class PhysXPhysicsManager implements IPhysicsManager {
  /** @internal */
  _eventMap: Record<number, Record<number, TriggerEvent>> = {};
}
