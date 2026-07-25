# Oasishub Engine

Oasishub is a **web-first** and **mobile-first** high-performance real-time interactive engine. Use **component system design** and pursue ease of use and light weight. Developers can independently use and write Typescript scripts to develop projects using pure code.

## Features

- 🖥  &nbsp;**Platform** - Suppport HTML5 and wechat minigame
- 🔮  &nbsp;**Graphics** - Advanced 2D + 3D graphics engine
- 🏃  &nbsp;**Animation** - Powerful animation system
- 🧱  &nbsp;**Physics** - Powerful and easy-to-use physical features
- 👆  &nbsp;**Input** - Easy-to-use interactive capabilities
- 📑  &nbsp;**Scripts** - Use TypeScript to write logic efficiently

## Installation

To install, use:

```sh
npm install @oasishub/engine
```

This will allow you to import engine entirely using:

```javascript
import * as OASISHUB from "@oasishub/engine";
```

or individual classes using:

```javascript
import { Engine, Scene, Entity } from "@oasishub/engine";
```

## Usage

```typescript
// Create engine by passing in the HTMLCanvasElement id and adjust canvas size
const engine = await WebGLEngine.create({ canvas: "canvas-id" });
engine.canvas.resizeByClientSize();

// Get scene and create root entity
const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity("Root");

// Create light
const lightEntity = rootEntity.createChild("Light");
const directLight = lightEntity.addComponent(DirectLight);
lightEntity.transform.setRotation(-45, -45, 0);
directLight.intensity = 0.4;

// Create camera
const cameraEntity = rootEntity.createChild("Camera");
cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(0, 0, 12);

// Create sphere
const meshEntity = rootEntity.createChild("Sphere");
const meshRenderer = meshEntity.addComponent(MeshRenderer);
const material = new BlinnPhongMaterial(engine);
meshRenderer.setMaterial(material);
meshRenderer.mesh = PrimitiveMesh.createSphere(engine, 1);

// Run engine
engine.run();
```

## Links

- [Official Site](https://oasisengine.cn)
- [Examples](https://oasisengine.cn/#/examples/latest)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License 

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.