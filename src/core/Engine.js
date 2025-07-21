
import { World } from './World.js';
import { SystemManager } from './System.js';

/**
 * Main Game Engine
 * Manages the game loop, world state, and system execution
 */
export class Engine {
    constructor({ canvas, width, height, targetFPS = 60 }) {
        this.canvas = canvas;
        this.width = width || window.innerWidth;
        this.height = height || window.innerHeight;
        this.targetFPS = targetFPS;
        this.world = new World();
        this.systemManager = new SystemManager();
        
        // Timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1000 / targetFPS; // ms
        this.maxFrameTime = 250; // Cap frame time to prevent spiral of death
        
        // State
        this.running = false;
        this.paused = false;
        
        // Stats
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastFPSUpdate: 0
        };
        
        // Bind methods to preserve context
        this.loop = this.loop.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    // System Management
    addSystem(system) {
        return this.systemManager.addSystem(system);
    }

    removeSystem(systemName) {
        this.systemManager.removeSystem(systemName);
    }

    // Engine Lifecycle
    start() {
        if (this.running) return;
        
        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        
        // Initialize systems
        this.systemManager.initializeSystems(this.world);
        
        // Setup event listeners
        window.addEventListener('resize', this.onResize);
        
        // Start the game loop
        requestAnimationFrame(this.loop);
        
        console.log('Engine started');
    }

    stop() {
        this.running = false;
        window.removeEventListener('resize', this.onResize);
        console.log('Engine stopped');
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
        this.lastTime = performance.now(); // Reset timing
    }

    // Main Game Loop
    loop(currentTime) {
        if (!this.running) return;
        
        // Calculate frame time and clamp it
        let frameTime = currentTime - this.lastTime;
        if (frameTime > this.maxFrameTime) {
            frameTime = this.maxFrameTime;
        }
        
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        if (!this.paused) {
            // Fixed timestep for physics/logic updates
            this.accumulator += frameTime;
            
            while (this.accumulator >= this.fixedTimeStep) {
                // Fixed update phase (physics, logic)
                this.systemManager.executePhase('physics', this.world, this.fixedTimeStep / 1000);
                this.systemManager.executePhase('update', this.world, this.fixedTimeStep / 1000);
                
                this.accumulator -= this.fixedTimeStep;
            }
            
            // Variable timestep for rendering
            const deltaTime = frameTime / 1000;
            this.systemManager.executePhase('render', this.world, deltaTime);
        }
        
        // Continue the loop
        requestAnimationFrame(this.loop);
    }

    updateFPS(currentTime) {
        this.stats.frameCount++;
        
        if (currentTime - this.stats.lastFPSUpdate >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastFPSUpdate = currentTime;
        }
    }

    // Event Handlers
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.systemManager.onResize(this.width, this.height);
    }

    // Utility Methods
    getFPS() {
        return this.stats.fps;
    }

    getEntityCount() {
        return this.world.getEntityCount();
    }

    // Debug Methods
    debugWorld() {
        this.world.debugWorld();
    }
}
