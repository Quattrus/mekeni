// Service for generating realistic terrain
export class ElevationService {
  constructor() {
    // Base coordinates for consistent world generation
    this.worldSeed = 12345;
    this.scale = 0.1; // Scale for terrain features
    this.octaves = 4; // Number of octaves for noise generation
    this.lacunarity = 2.0; // Frequency multiplier for octaves
    this.persistence = 0.5; // Amplitude decay factor for octaves

    //domain warp parameters
    this.domainWarpFrequency = 0.005; //Freq for domain warping
    this.domainWarpAmplitude = 50;

    // Terrain layer amplitudes
    this.largeTerrainAmplitude = 3500; // Large-scale mountains
    this.mediumHillsAmplitude = 1500;  // Medium hills
    this.ridgedAmplitude = 800;        // Sharp ridges
    this.smallDetailAmplitude = 600;   // Small-scale detail
    this.fineDetailAmplitude = 200;    // Fine grit & pebbles

    // Cave carving
    this.caveScale1 = 0.015;
    this.caveScale2 = 0.04;
    this.caveScale3 = 0.08;
    this.caveThreshold = 0.3;
    
    // Depth rules
    this.surfaceCutoff = 45; // No caves above this height
    this.shallowCaveDepth = 25; // No caves in upper underground
    this.midDepthCutoff = 35; // More caves deeper underground
    this.deepCaveDepth = 60; // No caves above this height

    this.baseElevation = 300; // Base height so nothing is flat sea-level
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

  // 2D noise function with improved anti-aliasing
  noise2D(x, y) {
    // Apply stronger non-linear warping to break grid patterns
    const warpStrength = 0.7;
    const jx = x + Math.sin(y * 12.9898 + x * 4.1414) * warpStrength;
    const jy = y + Math.cos(x * 78.233 + y * 7.5175) * warpStrength;

    const ix = Math.floor(jx);
    const iy = Math.floor(jy);
    const fx = jx - ix;
    const fy = jy - iy;

    // Use quintic interpolation instead of cubic for smoother results
    const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
    const v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);

    // Sample with additional offset points to reduce grid artifacts
    const a = this.hash(ix, iy);
    const b = this.hash(ix + 1, iy);
    const c = this.hash(ix, iy + 1);
    const d = this.hash(ix + 1, iy + 1);

    // Add diagonal samples for better isotropy
    const e = this.hash(ix - 1, iy - 1) * 0.1;
    const f = this.hash(ix + 2, iy + 2) * 0.1;

    const i1 = a + u * (b - a);
    const i2 = c + u * (d - c);

    return (i1 + v * (i2 - i1)) + (e - f); // Add diagonal influence
  }

  // 3D noise function for caves with improved isotropy
  noise3D(x, y, z) {
    // Use a more sophisticated skewing system to break axis alignment
    const skew = (x + y + z) * 0.3333333;
    const unskew = skew * 0.1666667;
    
    // Apply rotation matrix-like transformation for better isotropy
    const nx = x + skew + Math.sin(y * 0.1) * 1;
    const ny = y + skew + Math.cos(z * 0.1) * 1;
    const nz = z + skew + Math.sin(x * 0.1) * 1;

    // Sample at multiple rotated orientations and blend
    const layer1 = this.noise2D(nx * 0.8 + nz * 0.2, ny * 0.9 + nx * 0.1);
    const layer2 = this.noise2D(ny * 0.7 + nx * 0.3, nz * 0.8 + ny * 0.2);
    const layer3 = this.noise2D(nz * 0.9 + ny * 0.1, nx * 0.6 + nz * 0.4);
    
    // Add a fourth layer with different frequency to break patterns
    const layer4 = this.noise2D(
      (nx + ny) * 0.5 + nz * 0.3, 
      (ny + nz) * 0.5 + nx * 0.3
    ) * 0.5;

    // Weight the layers differently to avoid uniform blending
    return (layer1 * 0.4 + layer2 * 0.3 + layer3 * 0.2 + layer4 * 0.1);
  }

  // Warp coords before sampling to add organic distortion
  domainWarp(x, y) {
    const wx = x + this.noise2D(x * this.domainWarpFrequency, y * this.domainWarpFrequency) * this.domainWarpAmplitude;
    const wy = y + this.noise2D((x + 100) * this.domainWarpFrequency, (y + 100) * this.domainWarpFrequency) * this.domainWarpAmplitude;
    return [wx, wy];
  }

  // Ridged/fbm noise – great for sharp mountain crests
  ridgedNoise2D(x, y) {
    // basic ridged function: invert abs(noise) & square for sharper peaks
    const n = this.noise2D(x, y);
    const ridge = 1.0 - Math.abs(n);
    return ridge * ridge;
  }

  // Check if a block should be carved out for caves
  shouldCarveBlock(worldX, worldY, worldZ) {
    // No caves near the surface to prevent floating islands
    if (worldY > this.surfaceCutoff) return false; // No caves in top of surface cut off
    
    // Multiple cave systems at different scales
    const caveScale1 = this.caveScale1; // Large cave systems (reduced)
    const caveScale2 = this.caveScale2;  // Medium caves (reduced)
    const caveScale3 = this.caveScale3;  // Small tunnels (reduced)
    
    // Cave density - higher values = fewer caves (more conservative)
    let caveThreshold = this.caveThreshold; // Much lower threshold = fewer caves

    // Make caves more common at certain depths
    const depth = worldY;
    if (depth < this.shallowCaveDepth) return false; // No caves near surface at all
    if (depth < this.midDepthCutoff) caveThreshold = 0.2; // Very few caves in upper underground
    if (depth > this.deepCaveDepth) caveThreshold = 0.35; // More caves deeper underground

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
    const x = lng * 2000;
    const y = lat * 2000;

    let elevation = 0;

    // **1) Large-scale terrain with fractal octaves** – domain-warped for organic mountain ranges
    {
      let layerElevation = 0;
      let amplitude = 1;
      let frequency = this.scale;
      
      for (let octave = 0; octave < this.octaves; octave++) {
        const [wx, wy] = this.domainWarp(x, y);
        layerElevation += this.noise2D(wx * frequency, wy * frequency) * amplitude;
        
        frequency *= this.lacunarity;
        amplitude *= this.persistence;
      }
      elevation += layerElevation * this.largeTerrainAmplitude;
    }

    // **2) Medium hills & ridges** – mix in ridged noise for sharper peaks
    {
      let layerElevation = 0;
      let amplitude = 0.6;
      let frequency = this.scale * 0.12;
      
      for (let octave = 0; octave < Math.max(1, this.octaves - 1); octave++) {
        layerElevation += this.noise2D(x * frequency, y * frequency) * amplitude;
        layerElevation += this.ridgedNoise2D(x * frequency * 1.3, y * frequency * 1.3) * amplitude;
        
        frequency *= this.lacunarity;
        amplitude *= this.persistence;
      }
      elevation += layerElevation * this.mediumHillsAmplitude * 0.5; // Scale down since we're adding ridged too
    }

    // **3) Small-scale detail** – tighter fractures & stones
    {
      let layerElevation = 0;
      let amplitude = 0.4;
      let frequency = this.scale * 0.12 * 3;
      
      for (let octave = 0; octave < Math.max(1, this.octaves - 2); octave++) {
        layerElevation += this.noise2D(x * frequency, y * frequency) * amplitude;
        
        frequency *= this.lacunarity;
        amplitude *= this.persistence;
      }
      elevation += layerElevation * this.smallDetailAmplitude;
    }

    // **4) Fine grit & pebble detail**
    {
      let layerElevation = 0;
      let amplitude = 0.25;
      let frequency = this.scale * 0.12 * 6;
      
      // Only use 1-2 octaves for fine detail to avoid over-detailing
      for (let octave = 0; octave < Math.max(1, this.octaves - 3); octave++) {
        layerElevation += this.noise2D(x * frequency, y * frequency) * amplitude;
        
        frequency *= this.lacunarity;
        amplitude *= this.persistence;
      }
      elevation += layerElevation * this.fineDetailAmplitude;
    }

    // Base height so nothing is flat sea-level
    elevation += this.baseElevation;

    return Math.max(0, elevation);
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
