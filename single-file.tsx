import React, { useEffect, useRef, useState } from 'react';

/**
 * PROJECT DRIFTER - PHASE 1: FOUNDATION
 * -------------------------------------
 * A top-down extraction RPG foundation.
 * * CORE FEATURES:
 * 1. React 19 + TypeScript + Canvas structure.
 * 2. Twin-stick controls (WASD Move + Mouse Aim).
 * 3. Physics-based movement (Sprint, Dash/Dodge).
 * 4. Edge-wrapping world (Toroidal map).
 * 5. Smooth Camera Follow.
 */

// --- 1. TYPES & INTERFACES (types/GameTypes.ts) ---

interface Vector2D {
  x: number;
  y: number;
}

interface GameConfig {
  worldWidth: number;
  worldHeight: number;
  tileSize: number;
}

interface InputState {
  keys: {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    shift: boolean;
    space: boolean;
  };
  mouse: Vector2D;
}

// --- 2. UTILITIES (utils/Vector2D.ts) ---

const Vec2 = {
  zero: (): Vector2D => ({ x: 0, y: 0 }),
  add: (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
  sub: (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
  scale: (v: Vector2D, s: number): Vector2D => ({ x: v.x * s, y: v.y * s }),
  mag: (v: Vector2D): number => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v: Vector2D): Vector2D => {
    const m = Math.sqrt(v.x * v.x + v.y * v.y);
    return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
  },
  lerp: (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
  },
  lerpVec: (v1: Vector2D, v2: Vector2D, t: number): Vector2D => ({
    x: v1.x + (v2.x - v1.x) * t,
    y: v1.y + (v2.y - v1.y) * t,
  })
};

// --- 3. SYSTEMS (systems/*.ts) ---

class InputSystem {
  state: InputState = {
    keys: { w: false, a: false, s: false, d: false, shift: false, space: false },
    mouse: { x: 0, y: 0 }
  };

  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
    window.addEventListener('mousemove', (e) => this.handleMouse(e));
  }

  handleKey(e: KeyboardEvent, isPressed: boolean) {
    switch (e.key.toLowerCase()) {
      case 'w': this.state.keys.w = isPressed; break;
      case 'a': this.state.keys.a = isPressed; break;
      case 's': this.state.keys.s = isPressed; break;
      case 'd': this.state.keys.d = isPressed; break;
      case 'shift': this.state.keys.shift = isPressed; break;
      case ' ': this.state.keys.space = isPressed; break;
    }
  }

  handleMouse(e: MouseEvent) {
    this.state.mouse.x = e.clientX;
    this.state.mouse.y = e.clientY;
  }

  // Calculate normalized movement vector based on WASD
  getMovementVector(): Vector2D {
    let x = 0;
    let y = 0;
    if (this.state.keys.w) y -= 1;
    if (this.state.keys.s) y += 1;
    if (this.state.keys.a) x -= 1;
    if (this.state.keys.d) x += 1;
    return Vec2.normalize({ x, y });
  }
}

// --- 4. ENTITIES (entities/Player.ts) ---

class PlayerEntity {
  pos: Vector2D;
  velocity: Vector2D;
  rotation: number; // in radians
  
  // Stats
  baseSpeed: number = 200; // pixels per second
  sprintMultiplier: number = 1.6;
  
  // Dash State
  isDashing: boolean = false;
  dashSpeed: number = 800;
  dashDuration: number = 0.2; // seconds
  dashCooldown: number = 1.0; // seconds
  dashTimer: number = 0;
  cooldownTimer: number = 0;

  constructor(startX: number, startY: number) {
    this.pos = { x: startX, y: startY };
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
  }

  update(dt: number, input: InputSystem, cameraPos: Vector2D, canvasCenter: Vector2D) {
    // 1. Rotation (Look at Mouse)
    // We calculate vector from Center of Screen (where player is) to Mouse
    const dx = input.state.mouse.x - canvasCenter.x;
    const dy = input.state.mouse.y - canvasCenter.y;
    this.rotation = Math.atan2(dy, dx);

    // 2. Dash Logic
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.velocity = Vec2.zero();
      }
    } else {
      // Cooldown tick
      if (this.cooldownTimer > 0) this.cooldownTimer -= dt;

      // Check Dash Input
      if (input.state.keys.space && this.cooldownTimer <= 0) {
        const moveDir = input.getMovementVector();
        // Only dash if moving, otherwise dash forward (mouse dir) could be implemented
        if (Vec2.mag(moveDir) > 0) {
          this.startDash(moveDir);
          return; // Skip normal movement this frame
        }
      }

      // 3. Normal Movement
      const moveDir = input.getMovementVector();
      let currentSpeed = this.baseSpeed;
      if (input.state.keys.shift) currentSpeed *= this.sprintMultiplier;

      this.velocity = Vec2.scale(moveDir, currentSpeed);
    }

    // 4. Apply Velocity
    this.pos.x += this.velocity.x * dt;
    this.pos.y += this.velocity.y * dt;
  }

  startDash(dir: Vector2D) {
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.cooldownTimer = this.dashCooldown;
    this.velocity = Vec2.scale(dir, this.dashSpeed);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.rotation);

    // Draw Character Body (Blue Square)
    ctx.fillStyle = this.isDashing ? '#60a5fa' : '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#1d4ed8';
    ctx.fillRect(-16, -16, 32, 32);

    // Draw "Gun" or directional indicator
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(16, -4, 12, 8); // Little rectangle sticking out right

    // Draw Engine/Trail glows if dashing
    if (this.isDashing) {
       ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
       ctx.fillRect(-24, -12, 8, 24);
    }

    ctx.restore();
  }
}

// --- 5. MAIN COMPONENT (components/Canvas.tsx + App.tsx) ---

const PROJECT_CONFIG: GameConfig = {
  worldWidth: 1920,
  worldHeight: 1080,
  tileSize: 64, // Grid size for background
};

export default function ProjectDrifter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable state outside React render cycle)
  const playerRef = useRef(new PlayerEntity(PROJECT_CONFIG.worldWidth / 2, PROJECT_CONFIG.worldHeight / 2));
  const inputRef = useRef(new InputSystem());
  const cameraRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);

  // UI State for React Overlay
  const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0, fps: 0 });

  // Initialize Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // GAME LOOP
    const animate = (time: number) => {
      if (previousTimeRef.current === undefined) previousTimeRef.current = time;
      const deltaTime = (time - previousTimeRef.current) / 1000;
      previousTimeRef.current = time;

      // Cap dt to prevent huge jumps if tab is inactive
      const safeDt = Math.min(deltaTime, 0.1);

      update(safeDt, canvas);
      render(ctx, canvas);

      // Update Debug UI roughly every 10 frames to save React renders
      if (Math.floor(time) % 10 === 0) {
        setDebugInfo({
            x: Math.round(playerRef.current.pos.x),
            y: Math.round(playerRef.current.pos.y),
            fps: Math.round(1 / safeDt)
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // UPDATE LOGIC
  const update = (dt: number, canvas: HTMLCanvasElement) => {
    const player = playerRef.current;
    const input = inputRef.current;
    const camera = cameraRef.current;
    const center = { x: canvas.width / 2, y: canvas.height / 2 };

    // 1. Update Player
    player.update(dt, input, camera, center);

    // 2. Edge Wrapping (Toroidal World)
    // If player goes off right, teleport to left, etc.
    let teleported = false;

    if (player.pos.x > PROJECT_CONFIG.worldWidth) {
        player.pos.x = 0;
        teleported = true;
    } else if (player.pos.x < 0) {
        player.pos.x = PROJECT_CONFIG.worldWidth;
        teleported = true;
    }

    if (player.pos.y > PROJECT_CONFIG.worldHeight) {
        player.pos.y = 0;
        teleported = true;
    } else if (player.pos.y < 0) {
        player.pos.y = PROJECT_CONFIG.worldHeight;
        teleported = true;
    }

    // 3. Camera System
    // Target position is centered on player
    const targetX = player.pos.x - center.x;
    const targetY = player.pos.y - center.y;

    if (teleported) {
        // If we teleported, snap camera instantly to avoid "flying" across map
        camera.x = targetX;
        camera.y = targetY;
    } else {
        // Smooth Lerp
        const lerpFactor = 0.1;
        // Simple lerp: current + (target - current) * factor
        camera.x = camera.x + (targetX - camera.x) * lerpFactor;
        camera.y = camera.y + (targetY - camera.y) * lerpFactor;
    }
  };

  // RENDER LOGIC
  const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Clear Screen
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const camera = cameraRef.current;

    ctx.save();
    // Move world relative to camera
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Background (Tiled)
    // Optimization: Only draw tiles visible on screen? 
    // For Phase 1 simplicity, we draw the defined world boundary.
    // To make it look "infinite" during the wrap, we draw the floor pattern.
    
    // Draw World Boundary (Darker floor)
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, PROJECT_CONFIG.worldWidth, PROJECT_CONFIG.worldHeight);
    
    // Draw Grid Lines / Tiles
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x <= PROJECT_CONFIG.worldWidth; x += PROJECT_CONFIG.tileSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, PROJECT_CONFIG.worldHeight);
    }
    for (let y = 0; y <= PROJECT_CONFIG.worldHeight; y += PROJECT_CONFIG.tileSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(PROJECT_CONFIG.worldWidth, y);
    }
    ctx.stroke();

    // 2. Draw World Border (Red Line) to indicate where wrapping happens
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, PROJECT_CONFIG.worldWidth, PROJECT_CONFIG.worldHeight);

    // 3. Draw Player
    playerRef.current.draw(ctx);

    ctx.restore();

    // 4. Draw HUD / Overlay (Screen Space)
    // Reticle (Mouse Cursor)
    const mouse = inputRef.current.state.mouse;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    // Crosshair dot
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cooldown Bar (if dashing/cooldown active)
    const player = playerRef.current;
    if (player.cooldownTimer > 0) {
        const barWidth = 40;
        const barHeight = 4;
        const pct = player.cooldownTimer / player.dashCooldown;
        
        ctx.fillStyle = '#444';
        ctx.fillRect(mouse.x - barWidth/2, mouse.y + 20, barWidth, barHeight);
        
        ctx.fillStyle = '#fbbf24'; // Warning color
        ctx.fillRect(mouse.x - barWidth/2, mouse.y + 20, barWidth * (1 - pct), barHeight);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', cursor: 'none' }}>
      <canvas 
        ref={canvasRef} 
        style={{ display: 'block' }}
      />
      
      {/* React UI Overlay */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: '#fff',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        textShadow: '1px 1px 0 #000'
      }}>
        <h2 style={{ margin: 0, color: '#22c55e' }}>PROJECT DRIFTER</h2>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>PHASE 1: MOVEMENT PROTOYPE</div>
        <br/>
        <div>POS: {debugInfo.x}, {debugInfo.y}</div>
        <div>FPS: {debugInfo.fps}</div>
        <br/>
        <div style={{ color: '#60a5fa' }}>CONTROLS:</div>
        <div>WASD : Move</div>
        <div>SHIFT: Sprint</div>
        <div>SPACE: Dash</div>
        <div>MOUSE: Aim</div>
        <br/>
        <div style={{ color: '#ef4444' }}>NOTE: Map wraps at edges (1920x1080)</div>
      </div>
    </div>
  );
}