/**
 * AssetLoader - Handles loading of game assets with progress tracking
 */

export interface AssetManifest {
  tiles: Record<string, HTMLImageElement>;
}

export const ASSET_PATHS = {
  tiles: {
    grass: '/assets/grass.png',
    dirt1: '/assets/dirt-1.png',
    dirt2: '/assets/dirt-2.png',
    cobblestone: '/assets/cobblestone.png',
    mineralDirt: '/assets/mineral-dirt.png',
    sandyDirt: '/assets/sandy-dirt.png',
    water1: '/assets/water-1.png',
    water2: '/assets/water-2.png',
    // Using grass tileset as a fallback/variant for now if needed, 
    // but we'll stick to individual files for the main mapping first.
    grassTileset: '/assets/Grass-tileset-test.png'
  }
};

export class AssetLoader {
  private assets: AssetManifest = { tiles: {} };
  private totalAssets: number = 0;
  private loadedAssets: number = 0;

  constructor() {
    this.totalAssets = Object.keys(ASSET_PATHS.tiles).length;
  }

  async loadAllAssets(onProgress: (progress: number) => void): Promise<AssetManifest> {
    const tilePromises = Object.entries(ASSET_PATHS.tiles).map(async ([key, path]) => {
      try {
        const image = await this.loadImage(path);
        this.assets.tiles[key] = image;
        this.loadedAssets++;
        onProgress(this.loadedAssets / this.totalAssets);
      } catch (error) {
        console.error(`[AssetLoader] Failed to load asset: ${path}`, error);
        // We could load a placeholder here to prevent crashes
      }
    });

    await Promise.all(tilePromises);
    return this.assets;
  }

  private loadImage(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = path;
    });
  }
}
