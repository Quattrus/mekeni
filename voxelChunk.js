import * as THREE from 'https://esm.sh/three@0.155.0';
import { createNoise2D } from 'https://esm.sh/simplex-noise@4.0.1';


export class VoxelChunk {
  constructor(size = 16, maxHeight = 8, elevationService = null, chunkX = 0, chunkZ = 0) {
    this.size = size;
    this.maxHeight = maxHeight;
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.elevationService = elevationService;
    this.noise = createNoise2D();
    // 1D array: x + y*size + z*size*size
    this.data = new Uint8Array(size * maxHeight * size);
    this.mesh = null;
    this.material = new THREE.MeshLambertMaterial({ vertexColors: true });
    this._initTerrain();
  }

  async _initTerrain() {
    // Fill data based on real elevation data or noise fallback
    for (let z = 0; z < this.size; z++) {
      for (let x = 0; x < this.size; x++) {
        let elevation;
        
        if (this.elevationService) {
          try {
            elevation = await this.elevationService.getElevationForChunk(this.chunkX, this.chunkZ, x, z);
            // Scale elevation much better for voxel world - convert from meters to blocks
            elevation = Math.max(1, Math.min(this.maxHeight - 1, Math.floor(elevation / 100) + 5));
          } catch (error) {
            console.warn('Failed to get elevation, using noise:', error);
            elevation = this._getNoiseHeight(x, z);
          }
        } else {
          elevation = this._getNoiseHeight(x, z);
        }
        
        // Fill blocks up to the elevation height, but consider caves
        for(let y = 0; y < elevation; y++){
          if (this.elevationService && this.elevationService.shouldBlockExist) {
            // Use cave system
            if (this.elevationService.shouldBlockExist(this.chunkX, this.chunkZ, x, y, z, elevation)) {
              this.setBlock(x, y, z, 1);
            }
          } else {
            // No cave system, fill normally
            this.setBlock(x, y, z, 1);
          }
        }
      }
    }
  }

  _getNoiseHeight(x, z) {
    const n = this.noise((this.chunkX * this.size + x) / 20, (this.chunkZ * this.size + z) / 20);
    return Math.floor(((n + 1) / 2) * (this.maxHeight - 1)) + 1;
  }

  setBlock(x, y, z, id) {
    this.data[x + (y * this.size) + (z * this.size * this.size)] = id;
  }

  getBlock(x, y, z) {
    if (
      x < 0 || x >= this.size ||
      y < 0 || y >= this.maxHeight ||
      z < 0 || z >= this.size
    ) return 0;
    return this.data[x + (y * this.size) + (z * this.size * this.size)];
  }

  buildMesh() {
    const vertices = [];
    const normals  = [];
    const colors   = [];
    const indices  = [];
    let indexCount = 0;
    const c = new THREE.Color();

    // For each block, if non-zero, emit quads for any empty neighbor
    const faceDirs = [
      { dir:[ 1, 0, 0], corners:[[1,1,0],[1,1,1],[1,0,1],[1,0,0]] },
      { dir:[-1, 0, 0], corners:[[0,1,1],[0,1,0],[0,0,0],[0,0,1]] },
      { dir:[ 0, 1, 0], corners:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
      { dir:[ 0,-1, 0], corners:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
      { dir:[ 0, 0, 1], corners:[[1,1,1],[0,1,1],[0,0,1],[1,0,1]] },
      { dir:[ 0, 0,-1], corners:[[0,1,0],[1,1,0],[1,0,0],[0,0,0]] },
    ];

    for (let y = 0; y < this.maxHeight; y++) {
      for (let z = 0; z < this.size; z++) {
        for (let x = 0; x < this.size; x++) {
          if (!this.getBlock(x,y,z)) continue;
          for (const f of faceDirs) {
            const nx = x + f.dir[0], ny = y + f.dir[1], nz = z + f.dir[2];
            if (this.getBlock(nx,ny,nz) === 0) {
              // emit a face with better colors based on height and face direction
              const normal = new THREE.Vector3(...f.dir);
              
              // Create more realistic colors based on elevation and cave detection
              let hue, saturation, lightness;
              const heightRatio = y / this.maxHeight;
              
              // Check if this block is likely inside a cave (surrounded by air)
              const surroundingBlocks = [
                this.getBlock(x+1, y, z), this.getBlock(x-1, y, z),
                this.getBlock(x, y+1, z), this.getBlock(x, y-1, z),
                this.getBlock(x, y, z+1), this.getBlock(x, y, z-1)
              ].filter(block => block > 0).length;
              
              const isInCave = surroundingBlocks < 4; // Less than 4 neighbors = likely cave wall
              
              if (isInCave) {
                // Cave walls - darker stone colors
                hue = 0.05 + Math.random() * 0.05; // Brown-gray
                saturation = 0.2;
                lightness = 0.2 + Math.random() * 0.2;
              } else if (heightRatio < 0.2) {
                // Low areas - water/grass (blue-green)
                hue = 0.45 + Math.random() * 0.1;
                saturation = 0.7;
                lightness = 0.4 + heightRatio * 0.3;
              } else if (heightRatio < 0.6) {
                // Mid areas - forest/grass (green)
                hue = 0.25 + Math.random() * 0.15;
                saturation = 0.6;
                lightness = 0.3 + heightRatio * 0.4;
              } else if (heightRatio < 0.8) {
                // High areas - rock/stone (brown-gray)
                hue = 0.1 + Math.random() * 0.1;
                saturation = 0.3;
                lightness = 0.3 + heightRatio * 0.3;
              } else {
                // Very high - snow/ice (white)
                hue = 0.6;
                saturation = 0.1;
                lightness = 0.8 + Math.random() * 0.2;
              }
              
              // Adjust lightness based on face direction (lighting effect)
              if (f.dir[1] > 0) lightness *= 1.2; // Top faces brighter
              if (f.dir[1] < 0) lightness *= 0.6; // Bottom faces darker
              if (f.dir[0] !== 0 || f.dir[2] !== 0) lightness *= 0.8; // Side faces medium
              
              c.setHSL(hue, saturation, Math.min(1, lightness));
              for (let i = 0; i < 4; i++) {
                const corner = f.corners[i];
                vertices.push(x + corner[0], y + corner[1], z + corner[2]);
                normals .push(normal.x, normal.y, normal.z);
                colors  .push(c.r, c.g, c.b);
              }
              // two triangles
              indices.push(
                indexCount, indexCount+1, indexCount+2,
                indexCount, indexCount+2, indexCount+3
              );
              indexCount += 4;
            }
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position' , new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal'   , new THREE.Float32BufferAttribute(normals , 3));
    geo.setAttribute('color'    , new THREE.Float32BufferAttribute(colors  , 3));
    geo.setIndex(indices);
    geo.computeBoundingSphere();

    if (this.mesh) this.dispose();  
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    return this.mesh;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
