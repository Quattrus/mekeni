/**
 * Base System class for ECS architecture
 * All systems should extend this class
 */
export class System {
    constructor(name, phase = 'update') {
        this.name = name;
        this.phase = phase; // 'update', 'render', 'physics', etc.
        this.enabled = true;
        this.priority = 0; // Lower numbers run first
    }

    // Override this method in derived systems
    execute(world, deltaTime) {
        throw new Error(`System ${this.name} must implement execute() method`);
    }

    // Optional lifecycle methods
    onInit(world) {
        // Called when system is first added to engine
    }

    onResize(width, height) {
        // Called when window/canvas is resized
    }

    onDestroy() {
        // Called when system is removed or engine is shut down
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    // Helper method for querying entities with required components
    queryEntities(world, ...componentNames) {
        return world.query(...componentNames);
    }
}

/**
 * System Manager - handles system registration and execution order
 */
export class SystemManager {
    constructor() {
        this.systems = [];
        this.systemsByPhase = new Map();
    }

    addSystem(system) {
        this.systems.push(system);
        
        if (!this.systemsByPhase.has(system.phase)) {
            this.systemsByPhase.set(system.phase, []);
        }
        
        this.systemsByPhase.get(system.phase).push(system);
        
        // Sort by priority (lower numbers first)
        this.systemsByPhase.get(system.phase).sort((a, b) => a.priority - b.priority);
        
        return system;
    }

    removeSystem(systemName) {
        const index = this.systems.findIndex(s => s.name === systemName);
        if (index !== -1) {
            const system = this.systems[index];
            this.systems.splice(index, 1);
            
            const phaseArray = this.systemsByPhase.get(system.phase);
            const phaseIndex = phaseArray.findIndex(s => s.name === systemName);
            if (phaseIndex !== -1) {
                phaseArray.splice(phaseIndex, 1);
            }
            
            system.onDestroy();
        }
    }

    getSystemsByPhase(phase) {
        return this.systemsByPhase.get(phase) || [];
    }

    executePhase(phase, world, deltaTime) {
        const systems = this.getSystemsByPhase(phase);
        for (const system of systems) {
            if (system.enabled) {
                system.execute(world, deltaTime);
            }
        }
    }

    onResize(width, height) {
        for (const system of this.systems) {
            if (system.onResize) {
                system.onResize(width, height);
            }
        }
    }

    initializeSystems(world) {
        for (const system of this.systems) {
            if (system.onInit) {
                system.onInit(world);
            }
        }
    }
}
