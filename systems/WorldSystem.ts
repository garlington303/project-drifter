
import { GAME_CONFIG, Rect, TileType, TILE_DEFS, Vector2D } from '../utils/gameUtils';

export class WorldSystem {
  chunks: Map<string, TileType[][]> = new Map();
  
  constructor() {
    this.getChunk(0, 0);
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
    
    // World Limit Configuration
    const radiusChunks = GAME_CONFIG.worldRadiusChunks;
    const worldRadiusTiles = radiusChunks * size;
    const boundaryStart = worldRadiusTiles - 8; // Start transitioning 8 tiles before max

    for (let y = 0; y < size; y++) {
      const row: TileType[] = [];
      for (let x = 0; x < size; x++) {
        // Global Tile Coordinates
        const wx = cx * size + x;
        const wy = cy * size + y;
        
        // Distance from Center
        const dist = Math.sqrt(wx * wx + wy * wy);
        
        // --- 1. BOUNDARY LOGIC (Rock Containment) ---
        // Add some noise to the boundary radius so it's not a perfect circle
        const boundaryNoise = this.noise(wx * 0.05, wy * 0.05) * 15;
        const limit = boundaryStart + boundaryNoise;

        if (dist > limit) {
            // Far outer edge is Void/Bedrock
            if (dist > limit + 10) {
                row.push(TileType.Bedrock);
            } else {
                // The "Containment Wall"
                row.push(TileType.Cliff);
            }
            continue;
        }

        // --- 2. ROAD GENERATION ---
        // Distorted grid
        const roadWarp = this.noise(wx * 0.03, wy * 0.03) * 20; 
        const roadSpacing = 50; 
        const distToHRoad = Math.abs((wy + roadWarp) % roadSpacing);
        const distToVRoad = Math.abs((wx + roadWarp) % roadSpacing);
        const isRoad = distToHRoad < 2 || distToVRoad < 2;

        // --- 3. BIOME NOISE ---
        // Layer 1: Base Elevation/Moisture (0.05 scale = large features)
        const n1 = this.noise(wx * 0.05, wy * 0.05);
        // Layer 2: Detail (0.15 scale = small details)
        const n2 = this.noise(wx * 0.15 + 100, wy * 0.15 + 100);
        
        const noiseVal = n1 * 0.8 + n2 * 0.2;

        if (isRoad) {
             row.push(TileType.Road);
        } else {
            // Safe spawn area
            if (dist < 10) {
                row.push(TileType.Grass);
            } else {
                // Biome Logic
                if (noiseVal < 0.25) {
                    row.push(TileType.Water); 
                } else if (noiseVal < 0.3) {
                    row.push(TileType.Grass); // Shore/Sand equivalent
                } else if (noiseVal < 0.6) {
                    row.push(TileType.Grass); // Standard Grass
                } else if (noiseVal < 0.75) {
                    row.push(TileType.Forest); // Forest
                } else if (noiseVal < 0.85) {
                    row.push(TileType.DeepForest); // Thick Forest
                } else {
                    row.push(TileType.Wall); // Rocky/Mountainous spots inside map
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

  // Simplified collision check using TILE_DEFS
  isPassable(worldX: number, worldY: number): boolean {
    const tile = this.getTileAt(worldX, worldY);
    return TILE_DEFS[tile].passable;
  }

  // AABB Check
  checkCollision(rect: Rect): boolean {
    const ts = GAME_CONFIG.tileSize;
    const startX = Math.floor(rect.x / ts);
    const endX = Math.floor((rect.x + rect.width) / ts);
    const startY = Math.floor(rect.y / ts);
    const endY = Math.floor((rect.y + rect.height) / ts);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        // Use center of tile for lookup to avoid boundary edge cases
        const tile = this.getTileAt(x * ts + (ts/2), y * ts + (ts/2));
        if (!TILE_DEFS[tile].passable) return true;
      }
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2D, canvasWidth: number, canvasHeight: number) {
    const ts = GAME_CONFIG.tileSize;
    const cs = GAME_CONFIG.chunkSize;
    const chunkSizePx = cs * ts;

    const startCX = Math.floor(camera.x / chunkSizePx) - 1;
    const endCX = Math.floor((camera.x + canvasWidth) / chunkSizePx) + 1;
    const startCY = Math.floor(camera.y / chunkSizePx) - 1;
    const endCY = Math.floor((camera.y + canvasHeight) / chunkSizePx) + 1;

    for (let cy = startCY; cy <= endCY; cy++) {
      for (let cx = startCX; cx <= endCX; cx++) {
        const chunk = this.getChunk(cx, cy);
        const chunkX = cx * chunkSizePx;
        const chunkY = cy * chunkSizePx;

        for (let y = 0; y < cs; y++) {
          for (let x = 0; x < cs; x++) {
            const tile = chunk[y][x];
            const def = TILE_DEFS[tile];
            const posX = chunkX + x * ts;
            const posY = chunkY + y * ts;

            // Base Color
            ctx.fillStyle = def.color;
            
            // Texture Variation (Checkerboard / Noise)
            if ((x + y + cx + cy) % 2 === 0) {
                // Slightly lighter overlay
                ctx.globalAlpha = 0.05;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(posX, posY, ts, ts);
                ctx.fillStyle = def.color; // Reset
                ctx.globalAlpha = 1.0;
            } else {
                ctx.fillRect(posX, posY, ts, ts);
            }

            // --- DECORATION ---
            if (tile === TileType.Cliff) {
                // Rock Wall Effect
                ctx.fillStyle = '#1f2937'; // Darker gray
                ctx.fillRect(posX, posY, ts, ts);
                // Highlight top
                ctx.fillStyle = '#4b5563';
                ctx.fillRect(posX, posY, ts, 10);
                // Shadow bottom
                ctx.fillStyle = '#111827';
                ctx.fillRect(posX, posY + ts - 10, ts, 10);
            }
            else if (tile === TileType.Forest || tile === TileType.DeepForest) {
                // Tree circles
                ctx.fillStyle = tile === TileType.Forest ? '#14532d' : '#022c22';
                ctx.beginPath();
                ctx.arc(posX + ts/2, posY + ts/2, ts/3, 0, Math.PI*2);
                ctx.fill();
            }
            else if (tile === TileType.Water) {
                // Simple animated sparkle placeholder (static for now)
                ctx.fillStyle = '#60a5fa';
                ctx.fillRect(posX + 10, posY + 10, 8, 4);
            }
            else if (tile === TileType.Road) {
                // Road grit
                ctx.fillStyle = '#92400e';
                ctx.fillRect(posX + ts/2 - 2, posY, 4, ts);
            }
          }
        }
      }
    }
  }
}
