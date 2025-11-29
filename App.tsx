
import React, { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from './utils/gameUtils';
import { InputSystem } from './systems/InputSystem';
import { MouseSystem } from './systems/MouseSystem';
import { ProjectileSystem } from './systems/ProjectileSystem';
import { WorldSystem } from './systems/WorldSystem';
import { InventorySystem } from './systems/InventorySystem';
import { EquipmentSystem } from './systems/EquipmentSystem';
import { PlayerEntity } from './entities/PlayerEntity';
import { UnifiedMenuUI } from './components/UnifiedMenuUI';
import { AssetLoader } from './systems/AssetLoader';
import { textureManager } from './systems/TextureManager';
import { LoadingScreen } from './components/LoadingScreen';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game Systems with Side Effects (Input/Mouse)
  // We lazy initialize these in a useEffect to avoid constructor side effects during render
  const inputRef = useRef<InputSystem | null>(null);
  const mouseRef = useRef<MouseSystem | null>(null);
  
  // Logic Systems & Entities (Safe to keep as Refs)
  const playerRef = useRef(new PlayerEntity(0, 0));
  const projectileSystemRef = useRef(new ProjectileSystem());
  const worldSystemRef = useRef(new WorldSystem());
  const inventorySystemRef = useRef(new InventorySystem());
  const equipmentSystemRef = useRef(new EquipmentSystem());
  const cameraRef = useRef({ x: 0, y: 0 });
  
  // Loop State
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);

  // React UI State
  const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0, fps: 0, rot: 0, bullets: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [systemsReady, setSystemsReady] = useState(false);

  // 1. SYSTEM LIFECYCLE MANAGEMENT
  // Initialize input listeners once on mount, cleanup on unmount.
  useEffect(() => {
    // Load Assets
    const loadGameAssets = async () => {
      const loader = new AssetLoader();
      const assets = await loader.loadAllAssets((progress) => {
        setLoadProgress(progress);
      });
      textureManager.initialize(assets);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };
    loadGameAssets();
  }, []);

  useEffect(() => {
    inputRef.current = new InputSystem();
    mouseRef.current = new MouseSystem();
    setSystemsReady(true);
    return () => {
      inputRef.current?.cleanup();
      mouseRef.current?.cleanup();
    };
  }, []);

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

    // Animation Loop
    const animate = (time: number) => {
      // console.log("[App] Frame", time); // Uncomment for spammy debug
      if (previousTimeRef.current === undefined || previousTimeRef.current === 0) previousTimeRef.current = time;
      const deltaTime = (time - previousTimeRef.current) / 1000;
      previousTimeRef.current = time;

      const safeDt = Math.min(deltaTime, 0.1);

      // Input Checking
      if (inputRef.current!.isJustPressed('tab')) {
         setIsMenuOpen(prev => !prev);
      }
      if (inputRef.current!.isJustPressed('escape')) {
         setIsMenuOpen(false);
      }

      // Update Logic (Only if not paused)
      if (!isMenuOpen) {
          update(safeDt, canvas);
      }

      // Render (Always)
      render(ctx, canvas);

      // Input Cleanup (End of frame)
      inputRef.current!.updatePreviousState();

      // UI Update (Throttled)
      if (Math.floor(time) % 10 === 0) {
        setDebugInfo({
            x: Math.round(playerRef.current.pos.x),
            y: Math.round(playerRef.current.pos.y),
            fps: Math.round(1 / (safeDt || 0.016)),
            rot: Math.round(playerRef.current.rotation * (180/Math.PI)),
            bullets: projectileSystemRef.current.projectiles.length
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [isMenuOpen, systemsReady]);

  const update = (dt: number, canvas: HTMLCanvasElement) => {
    if (!inputRef.current || !mouseRef.current) return;

    const player = playerRef.current;
    const input = inputRef.current;
    const mouse = mouseRef.current;
    const projectiles = projectileSystemRef.current;
    const world = worldSystemRef.current;
    const equipment = equipmentSystemRef.current;
    const camera = cameraRef.current;
    const center = { x: canvas.width / 2, y: canvas.height / 2 };

    // Update Input
    mouse.update(camera);

    // Update Player
    player.update(dt, input, mouse.state, projectiles, world, equipment);

    // Update Projectiles
    projectiles.update(dt, world);

    // Update Camera
    camera.x = player.pos.x - center.x;
    camera.y = player.pos.y - center.y;
  };

  const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!mouseRef.current) return;

    const player = playerRef.current;
    const mouse = mouseRef.current;
    const projectiles = projectileSystemRef.current;
    const world = worldSystemRef.current;
    const camera = cameraRef.current;

    // Clear
    ctx.fillStyle = '#09090b'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    world.draw(ctx, camera, canvas.width, canvas.height);

    // Aim Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.lineTo(mouse.state.worldX, mouse.state.worldY);
    ctx.stroke();
    ctx.setLineDash([]);

    projectiles.draw(ctx);
    player.draw(ctx);

    // Mouse Cursor (In World)
    if (!isMenuOpen) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(mouse.state.worldX, mouse.state.worldY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouse.state.worldX, mouse.state.worldY, 12, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();

    // HUD
    if (!isMenuOpen) {
        const screenMouseX = mouse.state.screenX;
        const screenMouseY = mouse.state.screenY;

        const chargeBarWidth = 24;
        const chargeBarHeight = 6;
        const chargeSpacing = 4;
        const totalWidth = (chargeBarWidth * player.maxDashCharges) + (chargeSpacing * (player.maxDashCharges - 1));
        const startX = screenMouseX - totalWidth / 2;
        const startY = screenMouseY + 24;

        for (let i = 0; i < player.maxDashCharges; i++) {
            const x = startX + i * (chargeBarWidth + chargeSpacing);
            ctx.fillStyle = '#333';
            ctx.fillRect(x, startY, chargeBarWidth, chargeBarHeight);
            if (i < player.dashCharges) {
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(x, startY, chargeBarWidth, chargeBarHeight);
            } else if (i === player.dashCharges) {
                const pct = player.dashRechargeTimer / player.dashRechargeTime;
                ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
                ctx.fillRect(x, startY, chargeBarWidth * pct, chargeBarHeight);
            }
        }
    }
  };

  if (!systemsReady) return <div className="bg-black w-screen h-screen" />;

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-black ${isMenuOpen ? 'cursor-default' : 'cursor-none'}`}>
      {isLoading && <LoadingScreen progress={loadProgress} />}
      
      <canvas ref={canvasRef} className="block" />
      
      {!isMenuOpen && (
        <div className="absolute top-5 left-5 pointer-events-none select-none">
            <h2 className="m-0 text-emerald-400 font-bold text-lg font-mono">PROJECT DRIFTER</h2>
            <div className="text-sm text-neutral-400 font-mono">PHASE 2: PROCEDURAL WORLD</div>
            
            <div className="mt-4 font-mono text-sm text-neutral-300 bg-neutral-900/80 p-3 rounded border border-neutral-800 backdrop-blur-sm">
                <div>POS: {debugInfo.x}, {debugInfo.y}</div>
                <div>ROT: {debugInfo.rot}°</div>
                <div>FPS: {debugInfo.fps}</div>
                <div className="text-amber-400 mt-1">DASH: {playerRef.current.dashCharges}/{playerRef.current.maxDashCharges}</div>
            </div>

            <div className="mt-4 font-mono text-sm text-neutral-300">
                <div className="text-blue-400 font-bold mb-1">CONTROLS</div>
                <div className="flex items-center gap-2"><span className="w-12 text-neutral-500">TAB</span> MENU</div>
            </div>
        </div>
      )}

      {/* Unified Menu Overlay */}
      {inputRef.current && (
          <UnifiedMenuUI 
            isOpen={isMenuOpen}
            inventory={inventorySystemRef.current}
            equipment={equipmentSystemRef.current}
            player={playerRef.current}
            input={inputRef.current}
          />
      )}

    </div>
  );
};

export default App;
