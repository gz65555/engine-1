import {
  BaseMaterial,
  BoxColliderShape,
  Collider,
  Color,
  CullMode,
  Engine,
  Entity,
  Matrix,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  Script,
  Shader,
  SphereColliderShape,
  Transform,
  Vector3
} from "@galacean/engine";

// Adapted from @galacean/engine-toolkit auxiliary-lines/custom-material 1.6.0 (MIT).
class PlainColorMaterial extends BaseMaterial {
  get baseColor(): Color {
    return this.shaderData.getColor(PlainColorMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(PlainColorMaterial._baseColorProp);
    if (value !== baseColor) baseColor.copyFrom(value);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("e2e-plain-color"));
    this.shaderData.enableMacro("MATERIAL_OMIT_NORMAL");
    this.shaderData.setColor(PlainColorMaterial._baseColorProp, new Color(1, 1, 1, 1));
    this.renderState.rasterState.cullMode = CullMode.Off;
  }
}

Shader.create(
  "e2e-plain-color",
  `
#include <common>
#include <common_vert>
#include <blendShape_input>

void main() {
    #include <begin_position_vert>
    #include <blendShape_vert>
    #include <skinning_vert>
    #include <position_vert>
}
`,
  `
#include <common>

uniform vec4 material_BaseColor;

void main() {
    vec4 baseColor = material_BaseColor;

    #ifdef MATERIAL_IS_ALPHA_CUTOFF
        if( baseColor.a < material_AlphaCutoff ) {
            discard;
        }
    #endif

    gl_FragColor = baseColor;
}
`
);

interface WireframeElement {
  transform: Transform;
  positionOffset: number;
}

/** Minimal native-class wireframe renderer for the collider e2e cases. */
export class WireframeManager extends Script {
  private static _circleVertexCount = 40;
  private static _tempMatrix = new Matrix();

  private _localPositions: Vector3[] = [];
  private _worldPositions: Vector3[] = [];
  private _indices: number[] = [];
  private _elements: WireframeElement[] = [];
  private _mesh!: ModelMesh;
  private _renderer!: MeshRenderer;
  private _material!: PlainColorMaterial;

  get baseColor(): Color {
    return this._material.baseColor;
  }

  set baseColor(value: Color) {
    this._material.baseColor = value;
  }

  addEntityWireframe(entity: Entity): void {
    const collider = entity.getComponent(Collider);
    if (!collider) return;

    for (const shape of collider.shapes) {
      if (shape instanceof BoxColliderShape) {
        this._addBox(shape);
      } else if (shape instanceof SphereColliderShape) {
        this._addSphere(shape);
      }
    }
  }

  override onAwake(): void {
    const mesh = new ModelMesh(this.engine);
    const material = new PlainColorMaterial(this.engine);
    const renderer = this.entity.getComponent(MeshRenderer);
    renderer.castShadows = false;
    renderer.receiveShadows = false;
    mesh.addSubMesh(0, 0, MeshTopology.Lines);
    renderer.mesh = mesh;
    renderer.setMaterial(material);
    mesh.bounds.min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    mesh.bounds.max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    this._mesh = mesh;
    this._material = material;
    this._renderer = renderer;
  }

  override onEnable(): void {
    this._renderer.enabled = true;
  }

  override onDisable(): void {
    this._renderer.enabled = false;
  }

  override onLateUpdate(): void {
    const { _localPositions: localPositions, _worldPositions: worldPositions } = this;
    worldPositions.length = localPositions.length;
    for (let elementIndex = 0; elementIndex < this._elements.length; elementIndex++) {
      const element = this._elements[elementIndex];
      const end = this._elements[elementIndex + 1]?.positionOffset ?? localPositions.length;
      Matrix.rotationTranslation(
        element.transform.worldRotationQuaternion,
        element.transform.worldPosition,
        WireframeManager._tempMatrix
      );
      for (let i = element.positionOffset; i < end; i++) {
        const position = worldPositions[i] ?? (worldPositions[i] = new Vector3());
        Vector3.transformCoordinate(localPositions[i], WireframeManager._tempMatrix, position);
      }
    }

    this._mesh.setPositions(worldPositions);
    this._mesh.setIndices(new Uint16Array(this._indices));
    this._mesh.uploadData(false);
    this._mesh.subMesh.count = this._indices.length;
  }

  private _addBox(shape: BoxColliderShape): void {
    const transform = shape.collider.entity.transform;
    const scale = transform.lossyWorldScale;
    const offset = this._localPositions.length;
    const halfWidth = (scale.x * shape.size.x) / 2;
    const halfHeight = (scale.y * shape.size.y) / 2;
    const halfDepth = (scale.z * shape.size.z) / 2;
    const positions = this._localPositions;

    const faces = [
      [-halfWidth, halfHeight, -halfDepth],
      [halfWidth, halfHeight, -halfDepth],
      [halfWidth, halfHeight, halfDepth],
      [-halfWidth, halfHeight, halfDepth],
      [-halfWidth, -halfHeight, -halfDepth],
      [halfWidth, -halfHeight, -halfDepth],
      [halfWidth, -halfHeight, halfDepth],
      [-halfWidth, -halfHeight, halfDepth],
      [-halfWidth, halfHeight, -halfDepth],
      [-halfWidth, halfHeight, halfDepth],
      [-halfWidth, -halfHeight, halfDepth],
      [-halfWidth, -halfHeight, -halfDepth],
      [halfWidth, halfHeight, -halfDepth],
      [halfWidth, halfHeight, halfDepth],
      [halfWidth, -halfHeight, halfDepth],
      [halfWidth, -halfHeight, -halfDepth],
      [-halfWidth, halfHeight, halfDepth],
      [halfWidth, halfHeight, halfDepth],
      [halfWidth, -halfHeight, halfDepth],
      [-halfWidth, -halfHeight, halfDepth],
      [-halfWidth, halfHeight, -halfDepth],
      [halfWidth, halfHeight, -halfDepth],
      [halfWidth, -halfHeight, -halfDepth],
      [-halfWidth, -halfHeight, -halfDepth]
    ];
    for (const [x, y, z] of faces) positions.push(new Vector3(x, y, z));
    for (let face = 0; face < 6; face++) {
      const start = offset + face * 4;
      this._indices.push(start, start + 1, start + 1, start + 2, start + 2, start + 3, start + 3, start);
    }
    this._applyShapeOffset(offset, shape.position, scale);
    this._elements.push({ transform, positionOffset: offset });
  }

  private _addSphere(shape: SphereColliderShape): void {
    const transform = shape.collider.entity.transform;
    const scale = transform.lossyWorldScale;
    const radius = Math.max(scale.x, scale.y, scale.z) * shape.radius;
    const offset = this._localPositions.length;
    for (let axis = 0; axis < 3; axis++) this._addCircle(radius, axis);
    this._applyShapeOffset(offset, shape.position, scale);
    this._elements.push({ transform, positionOffset: offset });
  }

  private _addCircle(radius: number, axis: number): void {
    const offset = this._localPositions.length;
    const vertexCount = WireframeManager._circleVertexCount;
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const cosine = radius * Math.cos(angle);
      const sine = radius * Math.sin(angle);
      switch (axis) {
        case 0:
          this._localPositions.push(new Vector3(0, cosine, sine));
          break;
        case 1:
          this._localPositions.push(new Vector3(cosine, 0, sine));
          break;
        default:
          this._localPositions.push(new Vector3(cosine, sine, 0));
          break;
      }
      this._indices.push(offset + i, offset + ((i + 1) % vertexCount));
    }
  }

  private _applyShapeOffset(positionOffset: number, shapePosition: Vector3, worldScale: Vector3): void {
    const offset = new Vector3();
    Vector3.multiply(shapePosition, worldScale, offset);
    for (let i = positionOffset; i < this._localPositions.length; i++) this._localPositions[i].add(offset);
  }
}
