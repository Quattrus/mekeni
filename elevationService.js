// Service for generating realistic terrain
export class ElevationService {
  constructor() {
    // Base coordinates for consistent world generation
    this.worldSeed = 12345; // Change this for different worlds
    this.scale = 0.01; // Scale for terrain features
  }

  // Simple hash function for consistent random values
  hash(x, y) {
    let h = this.worldSeed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    return (h ^ (h >>> 16)) / 2147483648.0;
  }

  // Smooth interpolation
  smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  // 2D noise function
  noise2D(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const a = this.hash(ix, iy);
    const b = this.hash(ix + 1, iy);
    const c = this.hash(ix, iy + 1);
    const d = this.hash(ix + 1, iy + 1);

    const i1 = a + this.smoothstep(fx) * (b - a);
    const i2 = c + this.smoothstep(fx) * (d - c);

    return i1 + this.smoothstep(fy) * (i2 - i1);
  }

  // 3D noise function for caves
  noise3D(x, y, z) {
    // Simple 3D noise by combining 2D noise at different "layers"
    const layer1 = this.noise2D(x + z * 0.1, y);
    const layer2 = this.noise2D(y + x * 0.1, z);
    const layer3 = this.noise2D(z + y * 0.1, x);
    
    return (layer1 + layer2 + layer3) / 3;
  }

  // Check if a block should be carved out for caves
  shouldCarveBlock(worldX, worldY, worldZ) {
    // No caves near the surface to prevent floating islands
    if (worldY > 45) return false; // No caves in top ~30% of world
    
    // Multiple cave systems at different scales
    const caveScale1 = 0.015; // Large cave systems (reduced)
    const caveScale2 = 0.04;  // Medium caves (reduced)
    const caveScale3 = 0.08;  // Small tunnels (reduced)
    
    // Cave density - higher values = fewer caves (more conservative)
    let caveThreshold = 0.3; // Much lower threshold = fewer caves
    
    // Make caves more common at certain depths
    const depth = worldY;
    if (depth < 15) return false; // No caves near surface at all
    if (depth < 25) caveThreshold = 0.2; // Very few caves in upper underground
    if (depth > 35) caveThreshold = 0.35; // More caves deeper underground
    
    // Sample 3D noise at different scales
    const cave1 = Math.abs(this.noise3D(worldX * caveScale1, worldY * caveScale1, worldZ * caveScale1));
    const cave2 = Math.abs(this.noise3D(worldX * caveScale2, worldY * caveScale2, worldZ * caveScale2));
    const cave3 = Math.abs(this.noise3D(worldX * caveScale3, worldY * caveScale3, worldZ * caveScale3));
    
    // Combine cave systems (more conservative combination)
    const combinedCave = (cave1 + cave2 * 0.3 + cave3 * 0.1) / 1.4;
    
    // Carve if noise is below threshold
    return combinedCave < caveThreshold;
  }
  async getElevation(lat, lng) {
    // Convert lat/lng to world coordinates for consistent terrain
    const x = lng * 2000; // Increased scale for more dramatic terrain
    const y = lat * 2000;

    // Multiple octaves for realistic terrain
    let elevation = 0;
    let amplitude = 1;
    let frequency = 0.002; // Reduced frequency for larger features
    
    // Base terrain (large mountains and valleys)
    elevation += this.noise2D(x * frequency, y * frequency) * amplitude * 4000;
    
    // Medium features (hills and ridges)
    frequency *= 2.5;
    amplitude *= 0.6;
    elevation += this.noise2D(x * frequency, y * frequency) * amplitude * 2000;
    
    // Small details (local variations)
    frequency *= 2.5;
    amplitude *= 0.4;
    elevation += this.noise2D(x * frequency, y * frequency) * amplitude * 800;
    
    // Very fine details
    frequency *= 2;
    amplitude *= 0.3;
    elevation += this.noise2D(x * frequency, y * frequency) * amplitude * 200;

    // Add some base elevation and ensure it's not negative
    elevation += 300;
    return Math.max(0, Math.abs(elevation)); // Use abs for more dramatic terrain
  }

  // Get elevation for chunk coordinates
  async getElevationForChunk(chunkX, chunkZ, localX, localZ) {
    // Convert chunk coordinates to world coordinates
    const worldX = (chunkX * 32 + localX) * this.scale;
    const worldZ = (chunkZ * 32 + localZ) * this.scale;
    
    return await this.getElevation(worldZ, worldX); // Note: Z->lat, X->lng
  }

  // Check if a block should exist (considering both terrain and caves)
  shouldBlockExist(chunkX, chunkZ, localX, localY, localZ, surfaceHeight) {
    // Convert to world coordinates
    const worldX = chunkX * 32 + localX;
    const worldY = localY;
    const worldZ = chunkZ * 32 + localZ;
    
    // Block exists if it's below surface height
    if (worldY >= surfaceHeight) return false;
    
    // But might be carved out by caves
    return !this.shouldCarveBlock(worldX, worldY, worldZ);
  }
}
