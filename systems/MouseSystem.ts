import { Vector2D } from '../utils/gameUtils';

export interface MouseState {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
}

export class MouseSystem {
  state: MouseState = {
    screenX: 0,
    screenY: 0,
    worldX: 0,
    worldY: 0
  };

  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  cleanup() {
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.state.screenX = e.clientX;
    this.state.screenY = e.clientY;
  };

  /**
   * Updates the world coordinates of the mouse based on the camera position.
   * Call this every frame before game logic updates.
   * @param camera The current camera position (top-left of viewport in world space)
   */
  update(camera: Vector2D) {
    this.state.worldX = this.state.screenX + camera.x;
    this.state.worldY = this.state.screenY + camera.y;
  }
}
