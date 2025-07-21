/**
 * World - Entity Component System Registry
 * Manages entities, components, and provides querying capabilities
 */
export class World {
    constructor() {
        this.entities = new Set();
        this.components = new Map(); // Map<componentName, Map<entityId, componentData>>
        this.nextEntityId = 0;
        this.entityComponents = new Map(); // Map<entityId, Set<componentName>>
    }

    // Entity Management
    createEntity() {
        const id = this.nextEntityId++;
        this.entities.add(id);
        this.entityComponents.set(id, new Set());
        return id;
    }

    destroyEntity(entityId) {
        if (!this.entities.has(entityId)) return;

        // Remove all components for this entity
        const entityComps = this.entityComponents.get(entityId);
        for (const componentName of entityComps) {
            this.components.get(componentName)?.delete(entityId);
        }

        // Clean up entity references
        this.entities.delete(entityId);
        this.entityComponents.delete(entityId);
    }

    // Component Management
    addComponent(entityId, componentName, data = {}) {
        if (!this.entities.has(entityId)) {
            throw new Error(`Entity ${entityId} does not exist`);
        }

        if (!this.components.has(componentName)) {
            this.components.set(componentName, new Map());
        }

        this.components.get(componentName).set(entityId, data);
        this.entityComponents.get(entityId).add(componentName);
    }

    removeComponent(entityId, componentName) {
        this.components.get(componentName)?.delete(entityId);
        this.entityComponents.get(entityId)?.delete(componentName);
    }

    getComponent(entityId, componentName) {
        return this.components.get(componentName)?.get(entityId);
    }

    hasComponent(entityId, componentName) {
        return this.components.get(componentName)?.has(entityId) || false;
    }

    // Query Methods
    getAllComponents(componentName) {
        return this.components.get(componentName) || new Map();
    }

    query(...componentNames) {
        const results = [];
        for (const entityId of this.entities) {
            if (componentNames.every(name => this.hasComponent(entityId, name))) {
                const entityData = { id: entityId };
                for (const componentName of componentNames) {
                    entityData[componentName] = this.getComponent(entityId, componentName);
                }
                results.push(entityData);
            }
        }
        return results;
    }

    // Get all entities with specific components
    getEntitiesWith(...componentNames) {
        const entities = [];
        for (const entityId of this.entities) {
            if (componentNames.every(name => this.hasComponent(entityId, name))) {
                entities.push(entityId);
            }
        }
        return entities;
    }

    // Utility methods
    getEntityCount() {
        return this.entities.size;
    }

    getComponentNames() {
        return Array.from(this.components.keys());
    }

    // Debug methods
    debugEntity(entityId) {
        if (!this.entities.has(entityId)) {
            console.log(`Entity ${entityId} does not exist`);
            return;
        }

        const components = this.entityComponents.get(entityId);
        console.log(`Entity ${entityId}:`);
        for (const componentName of components) {
            console.log(`  - ${componentName}:`, this.getComponent(entityId, componentName));
        }
    }

    debugWorld() {
        console.log(`World contains ${this.entities.size} entities:`);
        for (const entityId of this.entities) {
            this.debugEntity(entityId);
        }
    }
}
