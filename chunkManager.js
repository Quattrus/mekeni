import { VoxelChunk } from "./voxelChunk.js";
import { createEntity, addComponent } from './frame.js';

const CHUNK_SIZE = 32;
const CHUNK_HEIGHT = 64;
const VIEW_DISTANCE = 2;

export class ChunkManager {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map(); // key: "cx,cz" -> {entity, chunk, mesh}
    }

    chunkKey(cx, cz) {
        return `${cx},${cz}`;
    }

    loadChunksAround(x, z) {
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);

        //Load/generate visbule chunks
        for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
            for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
                const key = this.chunkKey(cx + dx, cz + dz);
                if (!this.chunks.has(key)) {
                    const chunk = new VoxelChunk(CHUNK_SIZE, CHUNK_HEIGHT);
                    const mesh = chunk.buildMesh();
                    // Position the chunk at its world coordinates
                    mesh.position.set((cx + dx) * CHUNK_SIZE, 0, (cz + dz) * CHUNK_SIZE);
                    const entity = createEntity();
                    addComponent(entity, 'Transform', { mesh });
                    addComponent(entity, 'VoxelData', { chunk });

                    this.chunks.set(key, { entity, chunk, mesh });
                    this.scene.add(mesh);
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

}