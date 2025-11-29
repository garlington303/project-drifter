/**
 * TextureManager - Manages texture retrieval and variations for tiles
 */

import { TileType } from '../utils/gameUtils';
import { AssetManifest } from './AssetLoader';

interface TileTexture {
  type: TileType;
  variants: HTMLImageElement[];
}

export class TextureManager {
  private textures: Map<TileType, TileTexture> = new Map();
  private initialized: boolean = false;

  initialize(assets: AssetManifest) {
    // Map TileTypes to loaded assets
    // Note: We are mapping the available assets to our TileTypes.
    // Some types might share textures or have multiple variants.

    // Grass
    this.registerTexture(TileType.Grass, [assets.tiles.grass]);
    
    // Forest (using grass for now, maybe darker in rendering or if we had a forest texture)
    // Ideally we'd have a specific forest texture. Let's use grass as base.
    this.registerTexture(TileType.Forest, [assets.tiles.grass]);
    this.registerTexture(TileType.DeepForest, [assets.tiles.grass]); // Placeholder

    // Road/Dirt
    this.registerTexture(TileType.Road, [assets.tiles.dirt1, assets.tiles.dirt2]);

    // Water
    this.registerTexture(TileType.Water, [assets.tiles.water1, assets.tiles.water2]);
    this.registerTexture(TileType.DeepWater, [assets.tiles.water2]);

    // Wall/Rock/Cliff
    this.registerTexture(TileType.Wall, [assets.tiles.cobblestone]);
    this.registerTexture(TileType.Cliff, [assets.tiles.cobblestone]); // Placeholder
    
    // Bedrock/Void
    // Usually just black, but we can use a dark texture if we had one.
    
    this.initialized = true;
  }

  private registerTexture(type: TileType, images: HTMLImageElement[]) {
    // Filter out undefined images in case an asset failed to load
    const validImages = images.filter(img => !!img);
    if (validImages.length > 0) {
      this.textures.set(type, {
        type,
        variants: validImages
      });
    }
  }

  getTexture(type: TileType, seed: number = 0): HTMLImageElement | null {
    if (!this.initialized) return null;

    const textureData = this.textures.get(type);
    if (!textureData) return null;

    // Deterministic random based on seed (position)
    // Simple hash function for the seed
    const index = Math.abs(Math.floor(Math.sin(seed) * 10000)) % textureData.variants.length;
    
    return textureData.variants[index];
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const textureManager = new TextureManager();
