import {
  Camera,
  Canvas,
  InputManager,
  Keys,
  MathUtil,
  Matrix,
  PointerButton,
  Script,
  Transform,
  Vector2,
  Vector3
} from "@oasishub/engine";

// Adapted from @oasishub/engine-toolkit-controls 1.6.0 (MIT).
enum ControlHandlerType {
  None = 0,
  ROTATE = 1,
  ZOOM = 2,
  PAN = 4,
  All = 7
}

interface IControlInput {
  onUpdateHandler(input: InputManager): ControlHandlerType;
  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void;
}

const EPSILON = MathUtil.zeroTolerance;

class Spherical {
  private static _xAxis = new Vector3();
  private static _yAxis = new Vector3();
  private static _zAxis = new Vector3();

  private _matrix = new Matrix();
  private _matrixInv = new Matrix();

  constructor(
    public radius = 1,
    public phi = 0,
    public theta = 0
  ) {}

  makeSafe(): Spherical {
    const count = Math.floor(this.phi / Math.PI);
    this.phi = MathUtil.clamp(this.phi, count * Math.PI + EPSILON, (count + 1) * Math.PI - EPSILON);
    return this;
  }

  set(radius: number, phi: number, theta: number): Spherical {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
    return this;
  }

  setYAxis(up: Vector3): void {
    const { _xAxis: xAxis, _yAxis: yAxis, _zAxis: zAxis } = Spherical;
    if (Vector3.equals(xAxis.set(1, 0, 0), yAxis.copyFrom(up).normalize())) {
      xAxis.set(0, 1, 0);
    }
    Vector3.cross(xAxis, yAxis, zAxis);
    zAxis.normalize();
    Vector3.cross(yAxis, zAxis, xAxis);

    const { elements } = this._matrix;
    elements[0] = xAxis.x;
    elements[1] = xAxis.y;
    elements[2] = xAxis.z;
    elements[4] = yAxis.x;
    elements[5] = yAxis.y;
    elements[6] = yAxis.z;
    elements[8] = zAxis.x;
    elements[9] = zAxis.y;
    elements[10] = zAxis.z;

    const { elements: inverseElements } = this._matrixInv;
    inverseElements[0] = xAxis.x;
    inverseElements[4] = xAxis.y;
    inverseElements[8] = xAxis.z;
    inverseElements[1] = yAxis.x;
    inverseElements[5] = yAxis.y;
    inverseElements[9] = yAxis.z;
    inverseElements[2] = zAxis.x;
    inverseElements[6] = zAxis.y;
    inverseElements[10] = zAxis.z;
  }

  setFromVec3(value: Vector3, atTheBack = false): Spherical {
    value.transformNormal(this._matrixInv);
    this.radius = value.length();
    if (this.radius === 0) {
      this.theta = 0;
      this.phi = 0;
    } else if (atTheBack) {
      this.phi = 2 * Math.PI - Math.acos(MathUtil.clamp(value.y / this.radius, -1, 1));
      this.theta = Math.atan2(-value.x, -value.z);
    } else {
      this.phi = Math.acos(MathUtil.clamp(value.y / this.radius, -1, 1));
      this.theta = Math.atan2(value.x, value.z);
    }
    return this;
  }

  setToVec3(value: Vector3): boolean {
    const { radius, phi, theta } = this;
    const sinPhiRadius = Math.sin(phi) * radius;
    this.phi -= Math.floor(this.phi / Math.PI / 2) * Math.PI * 2;
    value.set(sinPhiRadius * Math.sin(theta), radius * Math.cos(phi), sinPhiRadius * Math.cos(theta));
    value.transformNormal(this._matrix);
    return this.phi > Math.PI;
  }
}

class ControlKeyboard implements IControlInput {
  onUpdateHandler(input: InputManager): ControlHandlerType {
    return input.isKeyHeldDown(Keys.ArrowLeft) ||
      input.isKeyHeldDown(Keys.ArrowRight) ||
      input.isKeyHeldDown(Keys.ArrowUp) ||
      input.isKeyHeldDown(Keys.ArrowDown)
      ? ControlHandlerType.PAN
      : ControlHandlerType.None;
  }

  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    const { keyPanSpeed, input } = control;
    outDelta.x = outDelta.y = 0;
    if (input.isKeyHeldDown(Keys.ArrowLeft)) outDelta.x += keyPanSpeed;
    if (input.isKeyHeldDown(Keys.ArrowRight)) outDelta.x -= keyPanSpeed;
    if (input.isKeyHeldDown(Keys.ArrowUp)) outDelta.y += keyPanSpeed;
    if (input.isKeyHeldDown(Keys.ArrowDown)) outDelta.y -= keyPanSpeed;
  }
}

enum DeltaType {
  Moving,
  Distance,
  None
}

class ControlPointer implements IControlInput {
  private _deltaType = DeltaType.None;
  private _handlerType = ControlHandlerType.None;
  private _frameIndex = 0;
  private _lastUsefulFrameIndex = -1;
  private _distanceOfPointers = 0;

  onUpdateHandler(input: InputManager): ControlHandlerType {
    ++this._frameIndex;
    const { pointers } = input;
    switch (pointers.length) {
      case 1:
        if (input.isPointerHeldDown(PointerButton.Secondary)) {
          this._updateType(ControlHandlerType.PAN, DeltaType.Moving);
        } else if (input.isPointerHeldDown(PointerButton.Auxiliary)) {
          this._updateType(ControlHandlerType.ZOOM, DeltaType.Moving);
        } else if (input.isPointerHeldDown(PointerButton.Primary)) {
          this._updateType(ControlHandlerType.ROTATE, DeltaType.Moving);
        } else {
          const { deltaPosition } = pointers[0];
          if (deltaPosition.x !== 0 && deltaPosition.y !== 0) {
            if (input.isPointerUp(PointerButton.Secondary)) {
              this._updateType(ControlHandlerType.PAN, DeltaType.Moving);
            } else if (input.isPointerUp(PointerButton.Auxiliary)) {
              this._updateType(ControlHandlerType.ZOOM, DeltaType.Moving);
            } else if (input.isPointerUp(PointerButton.Primary)) {
              this._updateType(ControlHandlerType.ROTATE, DeltaType.Moving);
            } else {
              this._updateType(ControlHandlerType.None, DeltaType.None);
            }
          } else {
            this._updateType(ControlHandlerType.None, DeltaType.None);
          }
        }
        break;
      case 2:
        this._updateType(ControlHandlerType.ZOOM, DeltaType.Distance);
        break;
      case 3:
        this._updateType(ControlHandlerType.PAN, DeltaType.Moving);
        break;
      default:
        this._updateType(ControlHandlerType.None, DeltaType.None);
        break;
    }
    return this._handlerType;
  }

  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    const frameIndex = this._frameIndex;
    switch (this._deltaType) {
      case DeltaType.Moving: {
        outDelta.x = 0;
        outDelta.y = 0;
        if (this._lastUsefulFrameIndex === frameIndex - 1) {
          const { pointers } = control.input;
          const { length } = pointers;
          for (let i = length - 1; i >= 0; i--) {
            const { deltaPosition } = pointers[i];
            outDelta.x += deltaPosition.x;
            outDelta.y += deltaPosition.y;
          }
          outDelta.x /= length;
          outDelta.y /= length;
        }
        break;
      }
      case DeltaType.Distance: {
        const { pointers } = control.input;
        const currentDistance = Vector2.distance(pointers[0].position, pointers[1].position);
        if (this._lastUsefulFrameIndex === frameIndex - 1) {
          outDelta.set(0, this._distanceOfPointers - currentDistance, 0);
        } else {
          outDelta.set(0, 0, 0);
        }
        this._distanceOfPointers = currentDistance;
        break;
      }
    }
    this._lastUsefulFrameIndex = frameIndex;
  }

  private _updateType(handlerType: ControlHandlerType, deltaType: DeltaType): void {
    if (this._handlerType !== handlerType || this._deltaType !== deltaType) {
      this._handlerType = handlerType;
      this._deltaType = deltaType;
      this._lastUsefulFrameIndex = -1;
    }
  }
}

class ControlWheel implements IControlInput {
  onUpdateHandler(input: InputManager): ControlHandlerType {
    const { wheelDelta } = input;
    return wheelDelta.x === 0 && wheelDelta.y === 0 && wheelDelta.z === 0
      ? ControlHandlerType.None
      : ControlHandlerType.ZOOM;
  }

  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    outDelta.copyFrom(control.input.wheelDelta);
  }
}

/** Camera orbit controller used by the examples. */
export class OrbitControl extends Script {
  canvas!: Canvas;
  input!: InputManager;
  inputDevices: IControlInput[] = [new ControlKeyboard(), new ControlPointer(), new ControlWheel()];
  camera!: Camera;
  cameraTransform!: Transform;

  autoRotate = false;
  autoRotateSpeed = Math.PI;
  enableDamping = true;
  rotateSpeed = 1;
  zoomSpeed = 1;
  keyPanSpeed = 7;
  dampingFactor = 0.1;
  zoomFactor = 0.2;
  minDistance = 0.1;
  maxDistance = Infinity;
  minZoom = 0;
  maxZoom = Infinity;
  minPolarAngle = (1 / 180) * Math.PI;
  maxPolarAngle = (179 / 180) * Math.PI;
  minAzimuthAngle = -Infinity;
  maxAzimuthAngle = Infinity;

  private _enableKeys = true;
  private _up = new Vector3(0, 1, 0);
  private _target = new Vector3();
  private _atTheBack = false;
  private _spherical = new Spherical();
  private _sphericalDelta = new Spherical();
  private _sphericalDump = new Spherical();
  private _zoomFrag = 0;
  private _scale = 1;
  private _panOffset = new Vector3();
  private _tempVec3 = new Vector3();
  private _enableHandler: number = ControlHandlerType.All;

  get enableKeys(): boolean {
    return this._enableKeys;
  }

  set enableKeys(value: boolean) {
    if (this._enableKeys === value) return;
    this._enableKeys = value;
    if (value) {
      this.inputDevices.push(new ControlKeyboard());
    } else {
      const keyboardIndex = this.inputDevices.findIndex((input) => input instanceof ControlKeyboard);
      if (keyboardIndex !== -1) this.inputDevices.splice(keyboardIndex, 1);
    }
  }

  get up(): Vector3 {
    return this._up;
  }

  set up(value: Vector3) {
    this._up.copyFrom(value);
    this._spherical.setYAxis(value);
    this._atTheBack = false;
  }

  get target(): Vector3 {
    return this._target;
  }

  set target(value: Vector3) {
    this._target.copyFrom(value);
    this._atTheBack = false;
  }

  get enableRotate(): boolean {
    return (this._enableHandler & ControlHandlerType.ROTATE) !== 0;
  }

  set enableRotate(value: boolean) {
    this._setHandlerEnabled(ControlHandlerType.ROTATE, value);
  }

  get enableZoom(): boolean {
    return (this._enableHandler & ControlHandlerType.ZOOM) !== 0;
  }

  set enableZoom(value: boolean) {
    this._setHandlerEnabled(ControlHandlerType.ZOOM, value);
  }

  get enablePan(): boolean {
    return (this._enableHandler & ControlHandlerType.PAN) !== 0;
  }

  set enablePan(value: boolean) {
    this._setHandlerEnabled(ControlHandlerType.PAN, value);
  }

  override onAwake(): void {
    const { engine, entity } = this;
    this.canvas = engine.canvas;
    this.input = engine.inputManager;
    this.camera = entity.getComponent(Camera);
    this.cameraTransform = entity.transform;
    this._spherical.setYAxis(this._up);
    this._atTheBack = false;
  }

  override onLateUpdate(deltaTime: number): void {
    this._updateInputDelta(deltaTime);
    this._updateTransform();
  }

  private _setHandlerEnabled(type: ControlHandlerType, enabled: boolean): void {
    if (enabled) {
      this._enableHandler |= type;
    } else {
      this._enableHandler &= ~type;
    }
  }

  private _updateInputDelta(deltaTime: number): void {
    let currentHandlerType = ControlHandlerType.None;
    const delta = this._tempVec3;
    for (let i = this.inputDevices.length - 1; i >= 0; i--) {
      const handler = this.inputDevices[i];
      const handlerType = handler.onUpdateHandler(this.input);
      if (handlerType & this._enableHandler) {
        currentHandlerType |= handlerType;
        handler.onUpdateDelta(this, delta);
        switch (handlerType) {
          case ControlHandlerType.ROTATE:
            this._rotate(delta);
            break;
          case ControlHandlerType.ZOOM:
            this._zoom(delta);
            break;
          case ControlHandlerType.PAN:
            this._pan(delta);
            break;
        }
      }
    }

    if (this.enableDamping) {
      if (
        (this._enableHandler & ControlHandlerType.ZOOM) !== 0 &&
        (currentHandlerType & ControlHandlerType.ZOOM) === 0
      ) {
        this._zoomFrag *= 1 - this.zoomFactor;
      }
      if (
        (this._enableHandler & ControlHandlerType.ROTATE) !== 0 &&
        (currentHandlerType & ControlHandlerType.ROTATE) === 0
      ) {
        this._sphericalDelta.theta = this._sphericalDump.theta *= 1 - this.dampingFactor;
        this._sphericalDelta.phi = this._sphericalDump.phi *= 1 - this.dampingFactor;
      }
    }
    if (currentHandlerType === ControlHandlerType.None && this.autoRotate) {
      this._sphericalDelta.theta -= this.autoRotateSpeed * deltaTime;
    }
  }

  private _rotate(delta: Vector3): void {
    const radianLeft = ((2 * Math.PI * delta.x) / this.canvas.width) * this.rotateSpeed;
    const radianUp = ((2 * Math.PI * delta.y) / this.canvas.height) * this.rotateSpeed;
    this._sphericalDelta.theta -= radianLeft;
    this._sphericalDelta.phi -= radianUp;
    if (this.enableDamping) {
      this._sphericalDump.theta = -radianLeft;
      this._sphericalDump.phi = -radianUp;
    }
  }

  private _zoom(delta: Vector3): void {
    if (delta.y > 0) {
      this._scale /= Math.pow(0.95, this.zoomSpeed);
    } else if (delta.y < 0) {
      this._scale *= Math.pow(0.95, this.zoomSpeed);
    }
  }

  private _pan(delta: Vector3): void {
    const { elements } = this.cameraTransform.worldMatrix;
    const targetDistance =
      Vector3.distance(this.cameraTransform.position, this.target) * (this.camera.fieldOfView / 2) * (Math.PI / 180);
    const distanceLeft = -2 * delta.x * (targetDistance / this.canvas.height);
    const distanceUp = 2 * delta.y * (targetDistance / this.canvas.height);
    this._panOffset.x += elements[0] * distanceLeft + elements[4] * distanceUp;
    this._panOffset.y += elements[1] * distanceLeft + elements[5] * distanceUp;
    this._panOffset.z += elements[2] * distanceLeft + elements[6] * distanceUp;
  }

  private _updateTransform(): void {
    const { cameraTransform, target, _tempVec3, _spherical, _sphericalDelta, _panOffset } = this;
    _tempVec3.copyFrom(cameraTransform.worldUp);
    this._atTheBack = _tempVec3.y <= 0;
    Vector3.subtract(cameraTransform.position, target, _tempVec3);
    _spherical.setFromVec3(_tempVec3, this._atTheBack);
    _spherical.theta += _sphericalDelta.theta;
    _spherical.phi += _sphericalDelta.phi;
    _spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, _spherical.theta));
    _spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, _spherical.phi));
    _spherical.makeSafe();
    if (this._scale !== 1) this._zoomFrag = _spherical.radius * (this._scale - 1);
    _spherical.radius += this._zoomFrag;
    _spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, _spherical.radius));
    this._atTheBack = _spherical.setToVec3(_tempVec3);
    Vector3.add(target.add(_panOffset), _tempVec3, cameraTransform.worldPosition);
    cameraTransform.lookAt(target, _tempVec3.copyFrom(this.up).scale(this._atTheBack ? -1 : 1));
    this._zoomFrag = 0;
    this._scale = 1;
    _sphericalDelta.set(0, 0, 0);
    _panOffset.set(0, 0, 0);
  }
}
