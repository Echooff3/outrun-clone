export class InputHandler {
  keys: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }

  get isGas(): boolean {
    return this.keys["KeyW"] || false;
  }

  get isBrake(): boolean {
    return this.keys["KeyS"] || false;
  }

  get isLeft(): boolean {
    return this.keys["KeyA"] || false;
  }

  get isRight(): boolean {
    return this.keys["KeyD"] || false;
  }

  get isReverse(): boolean {
    return this.keys["KeyX"] || false;
  }
}
