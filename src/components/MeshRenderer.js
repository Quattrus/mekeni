
/**
 * MeshRenderer Component
 * Handles 3D mesh rendering with materials and textures
 */
export class MeshRenderer {
    constructor({
        geometry = null,
        material = null,
        mesh = null,
        visible = true,
        castShadows = true,
        receiveShadows = true,
        renderOrder = 0
    } = {}) {
        this.geometry = geometry;
        this.material = material;
        this.mesh = mesh; // Three.js mesh object
        this.visible = visible;
        this.castShadows = castShadows;
        this.receiveShadows = receiveShadows;
        this.renderOrder = renderOrder;
        
        // Material properties
        this.color = { r: 1, g: 1, b: 1 };
        this.opacity = 1.0;
        this.wireframe = false;
        
        // Animation properties
        this.animating = false;
        this.animationSpeed = 1.0;
    }

    // Visibility
    setVisible(visible) {
        this.visible = visible;
        if (this.mesh) {
            this.mesh.visible = visible;
        }
    }

    // Material properties
    setColor(r, g, b) {
        this.color.r = r;
        this.color.g = g;
        this.color.b = b;
        
        if (this.material && this.material.color) {
            this.material.color.setRGB(r, g, b);
        }
    }

    setOpacity(opacity) {
        this.opacity = opacity;
        
        if (this.material) {
            this.material.opacity = opacity;
            this.material.transparent = opacity < 1.0;
        }
    }

    setWireframe(wireframe) {
        this.wireframe = wireframe;
        
        if (this.material) {
            this.material.wireframe = wireframe;
        }
    }

    // Shadow settings
    setCastShadows(cast) {
        this.castShadows = cast;
        if (this.mesh) {
            this.mesh.castShadow = cast;
        }
    }

    setReceiveShadows(receive) {
        this.receiveShadows = receive;
        if (this.mesh) {
            this.mesh.receiveShadow = receive;
        }
    }

    // Utility methods
    clone() {
        return new MeshRenderer({
            geometry: this.geometry, // Note: This shares geometry reference
            material: this.material?.clone(), // Clone material if it exists
            visible: this.visible,
            castShadows: this.castShadows,
            receiveShadows: this.receiveShadows,
            renderOrder: this.renderOrder
        });
    }

    dispose() {
        if (this.geometry && this.geometry.dispose) {
            this.geometry.dispose();
        }
        if (this.material && this.material.dispose) {
            this.material.dispose();
        }
    }
}
