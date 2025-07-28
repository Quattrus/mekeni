/**
 * Transform Component
 * Handles position, rotation, and scale in 3D space
 */
export class Transform {
    constructor({
        position = { x: 0, y: 0, z: 0 },
        rotation = { x: 0, y: 0, z: 0 },
        scale = { x: 1, y: 1, z: 1 }
    } = {}) {
        this.position = { ...position };
        this.rotation = { ...rotation };
        this.scale = { ...scale };
        this.dirty = true;
        
        // Optional parent-child hierarchy
        this.parent = null;
        this.children = [];
    }

    // Position methods
    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        this.dirty = true;
    }

    translate(x, y, z) {
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;
        this.dirty = true;
    }

    // Rotation methods (in radians)
    setRotation(x, y, z) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
        this.dirty = true;
    }

    rotate(x, y, z) {
        this.rotation.x += x;
        this.rotation.y += y;
        this.rotation.z += z;
        this.dirty = true;
    }

    // Scale methods
    setScale(x, y, z) {
        this.scale.x = x;
        this.scale.y = y;
        this.scale.z = z;
        this.dirty = true;
    }

    // Hierarchy methods
    addChild(childTransform) {
        if (childTransform.parent) {
            childTransform.parent.removeChild(childTransform);
        }
        
        this.children.push(childTransform);
        childTransform.parent = this;
    }

    removeChild(childTransform) {
        const index = this.children.indexOf(childTransform);
        if (index !== -1) {
            this.children.splice(index, 1);
            childTransform.parent = null;
        }
    }

    // Get world transform (accounting for parent hierarchy)
    getWorldPosition() {
        if (!this.parent) {
            return { ...this.position };
        }
        
        const parentWorld = this.parent.getWorldPosition();
        return {
            x: parentWorld.x + this.position.x,
            y: parentWorld.y + this.position.y,
            z: parentWorld.z + this.position.z
        };
    }

    clone() {
        return new Transform({
            position: { ...this.position },
            rotation: { ...this.rotation },
            scale: { ...this.scale }
        });
    }
}
