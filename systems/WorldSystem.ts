
import { GAME_CONFIG, Rect, TileType, TILE_DEFS, Vector2D } from '../utils/gameUtils';

export class WorldSystem {
  chunks: Map<string, TileType[][]> = new Map();
  // Chunk Cache stores the pre-rendered canvas for a chunk
  private chunkCache: Map<string, HTMLCanvasElement> = new Map();
  private textureAtlas: Record<string, HTMLImageElement> = {};
  
  constructor() {
    this.getChunk(0, 0);
  }

  setTextures(textures: Record<string, HTMLImageElement>) {
    this.textureAtlas = textures;
    // Clear cache when textures change (or initially load)
    this.chunkCache.clear();
  }

  getChunk(cx: number, cy: number): TileType[][] {
    const key = `${cx},${cy}`;
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!;
    }
    const chunk = this.generateChunk(cx, cy);
    this.chunks.set(key, chunk);
    return chunk;
  }

  private generateChunk(cx: number, cy: number): TileType[][] {
    const tiles: TileType[][] = [];
    const size = GAME_CONFIG.chunkSize;
    
    const radiusChunks = GAME_CONFIG.worldRadiusChunks;
    const worldRadiusTiles = radiusChunks * size;
    const boundaryStart = worldRadiusTiles - 8; 

    for (let y = 0; y < size; y++) {
      const row: TileType[] = [];
      for (let x = 0; x < size; x++) {
        const wx = cx * size + x;
        const wy = cy * size + y;
        
        const dist = Math.sqrt(wx * wx + wy * wy);
        
        // --- BOUNDARY LOGIC ---
        const boundaryNoise = this.noise(wx * 0.05, wy * 0.05) * 15;
        const limit = boundaryStart + boundaryNoise;

        if (dist > limit) {
            if (dist > limit + 10) {
                row.push(TileType.Bedrock);
            } else {
                row.push(TileType.Cliff);
            }
            continue;
        }

        // --- ROAD GENERATION ---
        const roadWarp = this.noise(wx * 0.03, wy * 0.03) * 20; 
        const roadSpacing = 50; 
        const distToHRoad = Math.abs((wy + roadWarp) % roadSpacing);
        const distToVRoad = Math.abs((wx + roadWarp) % roadSpacing);
        const isRoad = distToHRoad < 2 || distToVRoad < 2;

        // --- BIOME NOISE ---
        const n1 = this.noise(wx * 0.05, wy * 0.05);
        const n2 = this.noise(wx * 0.15 + 100, wy * 0.15 + 100);
        const noiseVal = n1 * 0.8 + n2 * 0.2;

        if (isRoad) {
             row.push(TileType.Road);
        } else {
            if (dist < 10) {
                row.push(TileType.Grass);
            } else {
                if (noiseVal < 0.25) {
                    row.push(TileType.Water); 
                } else if (noiseVal < 0.3) {
                    row.push(TileType.Sand);
                } else if (noiseVal < 0.6) {
                    row.push(TileType.Grass);
                } else if (noiseVal < 0.75) {
                    row.push(TileType.Forest);
                } else if (noiseVal < 0.85) {
                    row.push(TileType.DeepForest);
                } else {
                    row.push(TileType.Wall); 
                }
            }
        }
      }
      tiles.push(row);
    }
    return tiles;
  }

  // --- UTILS ---
  private noise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    
    const a = this.pseudoRandom(ix, iy);
    const b = this.pseudoRandom(ix + 1, iy);
    const c = this.pseudoRandom(ix, iy + 1);
    const d = this.pseudoRandom(ix + 1, iy + 1);
    
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    
    return this.lerp(this.lerp(a, b, ux), this.lerp(c, d, ux), uy);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private pseudoRandom(x: number, y: number): number {
    const dot = x * 12.9898 + y * 78.233;
    const sin = Math.sin(dot) * 43758.5453;
    return sin - Math.floor(sin);
  }

  getTileAt(worldX: number, worldY: number): TileType {
    const ts = GAME_CONFIG.tileSize;
    const cs = GAME_CONFIG.chunkSize;
    
    const tx = Math.floor(worldX / ts);
    const ty = Math.floor(worldY / ts);
    const cx = Math.floor(tx / cs);
    const cy = Math.floor(ty / cs);

    let lx = tx % cs;
    let ly = ty % cs;
    if (lx < 0) lx += cs;
    if (ly < 0) ly += cs;

    const chunk = this.getChunk(cx, cy);
    return chunk[ly][lx];
  }

  isPassable(worldX: number, worldY: number): boolean {
    const tile = this.getTileAt(worldX, worldY);
    return TILE_DEFS[tile].passable;
  }

  checkCollision(rect: Rect): boolean {
    const ts = GAME_CONFIG.tileSize;
    const startX = Math.floor(rect.x / ts);
    const endX = Math.floor((rect.x + rect.width) / ts);
    const startY = Math.floor(rect.y / ts);
    const endY = Math.floor((rect.y + rect.height) / ts);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = this.getTileAt(x * ts + (ts/2), y * ts + (ts/2));
        if (!TILE_DEFS[tile].passable) return true;
      }
    }
    return false;
  }

  /**
   * Renders a single chunk to an off-screen canvas and returns it.
   */
  private renderChunkToCache(cx: number, cy: number): HTMLCanvasElement {
    const size = GAME_CONFIG.chunkSize;
    const ts = GAME_CONFIG.tileSize;
    const canvas = document.createElement('canvas');
    canvas.width = size * ts;
    canvas.height = size * ts;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return canvas;

    const chunk = this.getChunk(cx, cy);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tile = chunk[y][x];
        const def = TILE_DEFS[tile];
        const posX = x * ts;
        const posY = y * ts;

        // 1. Base Texture / Color
        if (def.texture && this.textureAtlas[def.texture]) {
            ctx.drawImage(this.textureAtlas[def.texture], posX, posY, ts, ts);
        } else {
            ctx.fillStyle = def.color;
            ctx.fillRect(posX, posY, ts, ts);
        }

        // 2. Procedural Overlays (Baked into cache)
        
        // Checkerboard variation
        if ((x + y + cx + cy) % 2 === 0) {
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#000000';
            ctx.fillRect(posX, posY, ts, ts);
            ctx.globalAlpha = 1.0;
        }

        if (tile === TileType.Cliff || tile === TileType.Wall) {
            // Shadow base
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000000';
            ctx.fillRect(posX, posY + ts - 10, ts, 10);
            ctx.globalAlpha = 1.0;
            // Highlight top
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(posX, posY, ts, 5);
        }
        else if (tile === TileType.Bedrock) {
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = 0.8;
            ctx.fillRect(posX, posY, ts, ts);
            ctx.globalAlpha = 1.0;
        }
        else if (tile === TileType.Forest || tile === TileType.DeepForest) {
            ctx.fillStyle = tile === TileType.Forest ? '#14532d' : '#022c22';
            ctx.beginPath();
            ctx.arc(posX + ts/2, posY + ts/2, ts/3, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(posX + ts/2 + 3, posY + ts/2 + 3, ts/3, 0, Math.PI*2);
            ctx.fill();
        }
        else if (tile === TileType.Water || tile === TileType.DeepWater) {
             ctx.fillStyle = tile === TileType.DeepWater ? 'rgba(30, 58, 138, 0.4)' : 'rgba(59, 130, 246, 0.2)';
             ctx.fillRect(posX, posY, ts, ts);
        }
      }
    }
    return canvas;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2D, canvasWidth: number, canvasHeight: number) {
    const cs = GAME_CONFIG.chunkSize;
    const ts = GAME_CONFIG.tileSize;
    const chunkSizePx = cs * ts;

    const startCX = Math.floor(camera.x / chunkSizePx) - 1;
    const endCX = Math.floor((camera.x + canvasWidth) / chunkSizePx) + 1;
    const startCY = Math.floor(camera.y / chunkSizePx) - 1;
    const endCY = Math.floor((camera.y + canvasHeight) / chunkSizePx) + 1;

    for (let cy = startCY; cy <= endCY; cy++) {
      for (let cx = startCX; cx <= endCX; cx++) {
        const key = `${cx},${cy}`;
        let cachedCanvas = this.chunkCache.get(key);

        if (!cachedCanvas) {
            cachedCanvas = this.renderChunkToCache(cx, cy);
            this.chunkCache.set(key, cachedCanvas);
        }

        ctx.drawImage(cachedCanvas, cx * chunkSizePx, cy * chunkSizePx);
      }
    }
  }
}
