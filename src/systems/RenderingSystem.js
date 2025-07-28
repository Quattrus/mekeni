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
        this.sceneGraph = new THREE.Group();
        this.scene.add(this.sceneGraph);
        
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
        
        // Cull meshes
        this.cullMeshes(world);
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    updateMeshTransforms(world) {
        const entities = world.query('Transform', 'MeshRenderer');
        
        for (const entity of entities) {
            const transform = entity.Transform;
            const renderer = entity.MeshRenderer;
            
            if (renderer.mesh && transform.dirty) {
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

                transform.dirty = false;
            }
        }
    }

    cullMeshes(world) {
        const frustum = new THREE.Frustum();
        const camera = this.camera;
        const projScreenMatrix = new THREE.Matrix4();

        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        const entities = world.query('MeshRenderer');

        for (const entity of entities) {
            const renderer = entity.MeshRenderer;

            if (renderer.mesh) {
                const boundingBox = new THREE.Box3().setFromObject(renderer.mesh);
                renderer.mesh.visible = frustum.intersectsBox(boundingBox);
            }
        }
    }


    // Add mesh to scene
    addMeshToScene(mesh) {
        this.sceneGraph.add(mesh);
    }

    // Remove mesh from scene
    removeMeshFromScene(mesh) {
        this.sceneGraph.remove(mesh);
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

    dispose() {
        // Dispose of renderer
        this.renderer.dispose();

        // Dispose of scene and its children
        this.scene.traverse(object => {
            if (object.isMesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (object.material.isMaterial) {
                        this.disposeMaterial(object.material);
                    } else {
                        // For multi-material objects
                        for (const material of object.material) {
                            this.disposeMaterial(material);
                        }
                    }
                }
            }
        });

        this.sceneGraph.clear();
        this.scene.clear();
    }

    disposeMaterial(material) {
        material.dispose();
        // Dispose of textures
        for (const key in material) {
            if (material[key] && typeof material[key].dispose === 'function') {
                material[key].dispose();
            }
        }
    }
}
