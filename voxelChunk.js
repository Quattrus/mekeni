import * as THREE from 'https://esm.sh/three@0.155.0';
import { SimplexNoise } from 'https://cdn.skypack.dev/simplex-noise';


export class VoxelChunk {
  constructor(size = 16, maxHeight = 8, noiseScale = 20) {
    this.size = size;
    this.maxHeight = maxHeight;
    this.noiseScale = noiseScale;
    this.noise = new  SimplexNoise();
    // 1D array: x + y*size + z*size*size
    this.data = new Uint8Array(size * maxHeight * size);
    this.mesh = null;
    this.material = new THREE.MeshLambertMaterial({ vertexColors: true });
    this._initTerrain();
  }

  _initTerrain() {
    //Fill data based on 2d noise heightmap
    for (let z = 0; z < this.size; z++) {
      for (let x = 0; x < this.size; x++) {
        const n = this.noise.noise(x / this.noiseScale, z / this.noiseScale);
        const h = Math.floor(((n + 1) / 2) * (this.maxHeight - 1)) + 1;
        for(let y = 0; y < h; y++){
            this.setBlock(x,y,z,1);
        }
      }
    }
  }

  setBlock(x, y, z, id) {
    this.data[x + (y * this.size) + (z * this.size * this.size)] = id;
  }

  getBlock(x, y, z) {
    if (
      x < 0 || x >= this.size ||
      y < 0 || y >= this.height ||
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

    for (let y = 0; y < this.height; y++) {
      for (let z = 0; z < this.size; z++) {
        for (let x = 0; x < this.size; x++) {
          if (!this.getBlock(x,y,z)) continue;
          for (const f of faceDirs) {
            const nx = x + f.dir[0], ny = y + f.dir[1], nz = z + f.dir[2];
            if (this.getBlock(nx,ny,nz) === 0) {
              // emit a face
              const normal = new THREE.Vector3(...f.dir);
              c.setHSL((y/this.height)*0.3 + 0.1, 0.6, 0.5);
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
