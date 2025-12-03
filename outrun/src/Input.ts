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
    return this.keys["KeyW"] || this.keys["ArrowUp"] || false;
  }

  get isBrake(): boolean {
    return this.keys["KeyS"] || this.keys["ArrowDown"] || false;
  }

  get isLeft(): boolean {
    return this.keys["KeyA"] || this.keys["ArrowLeft"] || false;
  }

  get isRight(): boolean {
    return this.keys["KeyD"] || this.keys["ArrowRight"] || false;
  }

  get isReverse(): boolean {
    return this.keys["KeyX"] || false;
  }
}
