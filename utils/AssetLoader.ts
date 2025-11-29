
export const ASSET_PATHS = {
  tiles: {
    grass: '/textures/grass.png',
    stone: '/textures/cobblestone.png',
    dirt: '/textures/dirt-1.png',
    water: '/textures/water-1.png',
    sand: '/textures/sandy-dirt.png',
  }
};

export class AssetLoader {
  private assets: Record<string, HTMLImageElement> = {};
  private totalAssets: number = 0;
  private loadedAssets: number = 0;

  async loadAllAssets(onProgress: (progress: number) => void): Promise<Record<string, HTMLImageElement>> {
    const tileKeys = Object.keys(ASSET_PATHS.tiles);
    this.totalAssets = tileKeys.length;

    // Simulate a small delay or check for cached images to ensure UI updates
    const promises = tileKeys.map(key => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = ASSET_PATHS.tiles[key as keyof typeof ASSET_PATHS.tiles];
        
        img.onload = () => {
          this.assets[key] = img;
          this.loadedAssets++;
          onProgress(this.loadedAssets / this.totalAssets);
          resolve();
        };
        
        img.onerror = () => {
            console.warn(`Failed to load asset: ${img.src}. Using fallback color.`);
            // Resolve anyway to allow game to start without crashing
            resolve();
        }
      });
    });

    await Promise.all(promises);
    return this.assets;
  }
}
