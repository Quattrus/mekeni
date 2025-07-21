import { VoxelChunk } from "./voxelChunk.js";
import { createEntity, addComponent } from './frame.js';
import { ElevationService } from './elevationService.js';

const CHUNK_SIZE = 32;
const CHUNK_HEIGHT = 64;
const VIEW_DISTANCE = 2;

export class ChunkManager {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map(); // key: "cx,cz" -> {entity, chunk, mesh}
        this.elevationService = new ElevationService();
        this.loadingChunks = new Set(); // Track chunks currently being generated
    }

    chunkKey(cx, cz) {
        return `${cx},${cz}`;
    }

    async loadChunksAround(x, z) {
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);

        //Load/generate visible chunks
        for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
            for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
                const key = this.chunkKey(cx + dx, cz + dz);
                if (!this.chunks.has(key) && !this.loadingChunks.has(key)) {
                    this.loadingChunks.add(key);
                    this._generateChunk(cx + dx, cz + dz, key);
                }
            }
        }

        // Unload distant chunks
        for (const [key, { entity, mesh }] of this.chunks) {
            const [ccx, ccz] = key.split(',').map(Number);
            if (Math.abs(ccx - cx) > VIEW_DISTANCE || Math.abs(ccz - cz) > VIEW_DISTANCE) {
                this.scene.remove(mesh);
                this.chunks.delete(key);
            }
        }
    }

    async _generateChunk(chunkX, chunkZ, key) {
        try {
            const chunk = new VoxelChunk(CHUNK_SIZE, CHUNK_HEIGHT, this.elevationService, chunkX, chunkZ);
            await chunk._initTerrain(); // Wait for terrain generation
            const mesh = chunk.buildMesh();
            // Position the chunk at its world coordinates
            mesh.position.set(chunkX * CHUNK_SIZE, 0, chunkZ * CHUNK_SIZE);
            const entity = createEntity();
            addComponent(entity, 'Transform', { mesh });
            addComponent(entity, 'VoxelData', { chunk });

            this.chunks.set(key, { entity, chunk, mesh });
            this.scene.add(mesh);
        } catch (error) {
            console.error('Failed to generate chunk:', error);
        } finally {
            this.loadingChunks.delete(key);
        }
    }

    reset() {
        // remove all existing meshes
        for(const {mesh} of this.chunks.values()) {
            this.scene.remove(mesh);
        }

        this.chunks.clear();
    }

}