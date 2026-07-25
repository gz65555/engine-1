## Installation

To install, use:

```sh
npm install @oasishub/engine-physics-lite
```

This will allow you to import engine entirely using:

```javascript
import * as PHYSICS_LITE from "@oasishub/engine-physics-lite";
```

or individual classes using:

```javascript
import { LitePhysics } from "@oasishub/engine-physics-lite";
```

## Usage

```typescript
// Create engine by passing in the HTMLCanvasElement id and adjust canvas size
const engine = await WebGLEngine.create({ canvas: "canvas-id" });

// Initialize physics manager with LitePhysics.
engine.physicsManager.initialize(LitePhysics);

......

// Run engine.
engine.run();
```