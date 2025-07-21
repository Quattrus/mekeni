import { System } from '../core/System.js';
import * as THREE from 'https://esm.sh/three@0.155.0';

/**
 * Rendering System
 * Handles all 3D rendering using Three.js
 */
export class RenderingSystem extends System {
    constructor(scene, camera, renderer) {
        super('RenderingSystem', 'render');
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        // Render targets and post-processing
        this.renderTargets = [];
        this.postProcessingPasses = [];
        
        // Performance settings
        this.enableShadows = true;
        this.enableFog = false;
        this.clearColor = 0x000000;
        
        this.priority = 100; // Render last
    }

    onInit(world) {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(this.clearColor);
        this.renderer.shadowMap.enabled = this.enableShadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        console.log('RenderingSystem initialized');
    }

    execute(world, deltaTime) {
        // Update mesh transforms from Transform components
        this.updateMeshTransforms(world);
        
        // Update visibility
        this.updateVisibility(world);
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    updateMeshTransforms(world) {
        const entities = world.query('Transform', 'MeshRenderer');
        
        for (const entity of entities) {
            const transform = entity.Transform;
            const renderer = entity.MeshRenderer;
            
            if (renderer.mesh) {
                // Update position
                renderer.mesh.position.set(
                    transform.position.x,
                    transform.position.y,
                    transform.position.z
                );
                
                // Update rotation
                renderer.mesh.rotation.set(
                    transform.rotation.x,
                    transform.rotation.y,
                    transform.rotation.z
                );
                
                // Update scale
                renderer.mesh.scale.set(
                    transform.scale.x,
                    transform.scale.y,
                    transform.scale.z
                );
            }
        }
    }

    updateVisibility(world) {
        const entities = world.query('MeshRenderer');
        
        for (const entity of entities) {
            const renderer = entity.MeshRenderer;
            
            if (renderer.mesh) {
                renderer.mesh.visible = renderer.visible;
                renderer.mesh.castShadow = renderer.castShadows;
                renderer.mesh.receiveShadow = renderer.receiveShadows;
                renderer.mesh.renderOrder = renderer.renderOrder;
            }
        }
    }

    // Add mesh to scene
    addMeshToScene(mesh) {
        this.scene.add(mesh);
    }

    // Remove mesh from scene
    removeMeshFromScene(mesh) {
        this.scene.remove(mesh);
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // Lighting controls
    setShadowsEnabled(enabled) {
        this.enableShadows = enabled;
        this.renderer.shadowMap.enabled = enabled;
    }

    setFogEnabled(enabled, color = 0xffffff, near = 1, far = 1000) {
        this.enableFog = enabled;
        if (enabled) {
            this.scene.fog = new THREE.Fog(color, near, far);
        } else {
            this.scene.fog = null;
        }
    }

    setClearColor(color) {
        this.clearColor = color;
        this.renderer.setClearColor(color);
    }
}
