
import { Vector2D, Vec2 } from '../utils/gameUtils';

export interface InputKeys {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  shift: boolean;
  space: boolean;
  tab: boolean;
  escape: boolean;
  mouseDown: boolean;
  num1: boolean;
  num2: boolean;
  num3: boolean;
  num4: boolean;
}

export class InputSystem {
  keys: InputKeys = { 
    w: false, a: false, s: false, d: false, 
    shift: false, space: false, tab: false, escape: false,
    mouseDown: false,
    num1: false, num2: false, num3: false, num4: false
  };

  // Track previous frame state for "just pressed" logic
  private prevKeys: Partial<InputKeys> = {};

  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  // Call this at the END of the game frame updates
  updatePreviousState() {
    this.prevKeys = { ...this.keys };
  }

  // Returns true only on the frame the key was pressed down
  isJustPressed(key: keyof InputKeys): boolean {
    return this.keys[key] && !this.prevKeys[key];
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
        e.preventDefault();
    }
    this.setKey(e.key, true);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.setKey(e.key, false);
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) { // Left Click
        this.keys.mouseDown = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
        this.keys.mouseDown = false;
    }
  };

  private setKey(key: string, isPressed: boolean) {
    switch (key.toLowerCase()) {
      case 'w': this.keys.w = isPressed; break;
      case 'a': this.keys.a = isPressed; break;
      case 's': this.keys.s = isPressed; break;
      case 'd': this.keys.d = isPressed; break;
      case 'shift': this.keys.shift = isPressed; break;
      case ' ': this.keys.space = isPressed; break;
      case 'tab': this.keys.tab = isPressed; break;
      case 'escape': this.keys.escape = isPressed; break;
      case '1': this.keys.num1 = isPressed; break;
      case '2': this.keys.num2 = isPressed; break;
      case '3': this.keys.num3 = isPressed; break;
      case '4': this.keys.num4 = isPressed; break;
    }
  }

  getMovementVector(): Vector2D {
    let x = 0;
    let y = 0;
    if (this.keys.w) y -= 1;
    if (this.keys.s) y += 1;
    if (this.keys.a) x -= 1;
    if (this.keys.d) x += 1;
    return Vec2.normalize({ x, y });
  }
}
