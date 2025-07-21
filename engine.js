/**
 * Mekeni Game Engine - Main Export File
 * Import everything you need from here for convenience
 */

// Core Engine
export { Engine } from './src/core/Engine.js';
export { World } from './src/core/World.js';
export { System, SystemManager } from './src/core/System.js';

// Components
export { Transform } from './src/components/Transform.js';
export { MeshRenderer } from './src/components/MeshRenderer.js';
export { Physics } from './src/components/Physics.js';
export { Input } from './src/components/Input.js';

// Systems
export { RenderingSystem } from './src/systems/RenderingSystem.js';
export { PhysicsSystem } from './src/systems/PhysicsSystem.js';
export { InputSystem } from './src/systems/InputSystem.js';

// Assets & Utilities
export { AssetLoader } from './src/assets/AssetLoader.js';
export { MathUtils, ColorUtils, TimeUtils } from './src/utils/MathUtils.js';

/**
 * Quick Start Example:
 * 
 * import { 
 *   Engine, 
 *   RenderingSystem, 
 *   InputSystem,
 *   Transform,
 *   MeshRenderer 
 * } from './engine.js';
 * 
 * const engine = new Engine({ canvas, width, height });
 * engine.addSystem(new RenderingSystem(scene, camera, renderer));
 * engine.addSystem(new InputSystem(canvas));
 * 
 * const entity = engine.world.createEntity();
 * engine.world.addComponent(entity, 'Transform', new Transform());
 * engine.world.addComponent(entity, 'MeshRenderer', new MeshRenderer());
 * 
 * engine.start();
 */
