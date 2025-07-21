# Mekeni Game Engine

A general-purpose 3D game engine built with **Entity-Component-System (ECS)** architecture using Three.js for rendering.

## 🏗️ Architecture Overview

This engine follows a clean ECS architecture that separates data (Components), logic (Systems), and entities for maximum flexibility and reusability.

```
/src
  /core
    Engine.js         ← Main game engine with loop management
    World.js          ← ECS world with entities/components registry
    System.js         ← Base system class and system manager
  /components         ← Data-only objects
    Transform.js      ← Position, rotation, scale
    MeshRenderer.js   ← 3D rendering properties
    Physics.js        ← Physics body properties
    Input.js          ← Input bindings and state
  /systems           ← Logic operating on components
    RenderingSystem.js ← Handles 3D rendering with Three.js
    PhysicsSystem.js   ← Physics simulation
    InputSystem.js     ← Input processing and distribution
  /assets
    AssetLoader.js     ← Asset loading and caching
  /utils
    MathUtils.js       ← Math, color, and time utilities
  index.html
  main.js             ← Game bootstrapping with engine + systems
```

## 🚀 Quick Start

1. **Start the development server:**
   ```bash
   npm start
   # or
   python -m http.server 8000
   ```

2. **Open your browser:**
   Navigate to `http://localhost:8000`

3. **Controls:**
   - **WASD** - Move the red player sphere
   - **SPACE** - Jump
   - **Mouse** - Look around (click to start)

## 🎮 Creating Your First Game

### 1. Initialize the Engine

```javascript
import { Engine } from './src/core/Engine.js';
import { RenderingSystem } from './src/systems/RenderingSystem.js';

const engine = new Engine({
    canvas: myCanvas,
    width: 800,
    height: 600,
    targetFPS: 60
});
```

### 2. Add Systems

```javascript
// Add core systems
const renderingSystem = new RenderingSystem(scene, camera, renderer);
const inputSystem = new InputSystem(canvas);

engine.addSystem(renderingSystem);
engine.addSystem(inputSystem);
```

### 3. Create Entities with Components

```javascript
// Create a player entity
const player = engine.world.createEntity();

// Add components
engine.world.addComponent(player, 'Transform', new Transform({
    position: { x: 0, y: 0, z: 0 }
}));

engine.world.addComponent(player, 'MeshRenderer', new MeshRenderer({
    geometry: new THREE.BoxGeometry(1, 1, 1),
    material: new THREE.MeshBasicMaterial({ color: 0xff0000 })
}));

engine.world.addComponent(player, 'Input', new Input({
    keyBindings: {
        'KeyW': 'move_forward',
        'KeyS': 'move_backward'
    }
}));
```

### 4. Create Custom Systems

```javascript
class PlayerMovementSystem extends System {
    constructor() {
        super('PlayerMovementSystem', 'update');
    }

    execute(world, deltaTime) {
        const entities = world.query('Transform', 'Input');
        
        for (const entity of entities) {
            const transform = entity.Transform;
            const input = entity.Input;
            
            const actions = input.getActiveActions();
            const speed = 5.0 * deltaTime;
            
            if (actions.includes('move_forward')) {
                transform.translate(0, 0, -speed);
            }
        }
    }
}

engine.addSystem(new PlayerMovementSystem());
```

### 5. Start the Engine

```javascript
engine.start();
```

## 📦 Core Components

### Transform
Handles position, rotation, and scale in 3D space with optional parent-child hierarchy.

```javascript
const transform = new Transform({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
});
```

### MeshRenderer
Manages 3D mesh rendering with materials and textures.

```javascript
const renderer = new MeshRenderer({
    geometry: new THREE.BoxGeometry(1, 1, 1),
    material: new THREE.MeshLambertMaterial({ color: 0xff0000 }),
    castShadows: true,
    receiveShadows: true
});
```

### Physics
Handles rigid body physics properties (integrates with physics engines like Cannon.js).

```javascript
const physics = new Physics({
    mass: 1.0,
    velocity: { x: 0, y: 0, z: 0 },
    useGravity: true
});
```

### Input
Manages input bindings and state for entities.

```javascript
const input = new Input({
    keyBindings: {
        'KeyW': 'move_forward',
        'KeyA': 'move_left',
        'KeyD': 'move_right',
        'KeyS': 'move_backward'
    },
    mouseBindings: {
        0: 'primary_action',    // Left click
        2: 'secondary_action'   // Right click
    }
});
```

## 🔧 Core Systems

### RenderingSystem
- Updates mesh transforms from Transform components
- Handles visibility and shadow settings
- Renders the scene using Three.js
- Supports post-processing and render targets

### PhysicsSystem
- Simulates physics using Cannon.js (or other physics engines)
- Syncs physics bodies with Transform components
- Handles collision detection and response

### InputSystem
- Captures keyboard and mouse input
- Distributes input state to Input components
- Supports mouse lock for FPS-style controls

## 🎯 Entity Queries

The World provides powerful querying capabilities:

```javascript
// Get all entities with Transform and MeshRenderer components
const renderableEntities = world.query('Transform', 'MeshRenderer');

// Get entities with specific components
const playerEntities = world.query('Transform', 'Input', 'Physics');

// Process the results
for (const entity of renderableEntities) {
    const transform = entity.Transform;
    const renderer = entity.MeshRenderer;
    // Process entity...
}
```

## 🛠️ Asset Loading

```javascript
import { AssetLoader } from './src/assets/AssetLoader.js';

const assetLoader = new AssetLoader();
assetLoader.setBasePath('./assets/');

// Load individual assets
const texture = await assetLoader.loadAsset('textures/stone.jpg');
const model = await assetLoader.loadAsset('models/player.gltf');

// Preload multiple assets
await assetLoader.preloadAssets([
    'textures/grass.jpg',
    'textures/stone.jpg',
    'models/tree.gltf'
]);
```

## 🧮 Utilities

The engine includes helpful utilities:

```javascript
import { MathUtils, ColorUtils, TimeUtils } from './src/utils/MathUtils.js';

// Math utilities
const distance = MathUtils.distance(pointA, pointB);
const interpolated = MathUtils.lerp(start, end, 0.5);
const clamped = MathUtils.clamp(value, 0, 100);

// Color utilities
const rgb = ColorUtils.hexToRgb('#ff0000');
const blended = ColorUtils.lerpColor(colorA, colorB, 0.5);

// Timer utilities
const timer = new TimeUtils.Timer(5.0); // 5 second timer
timer.start();
```

## 🔄 Engine Lifecycle

1. **Initialization** - Engine creates World and SystemManager
2. **System Registration** - Add systems with priorities and phases
3. **Game Loop** - Fixed timestep for physics/logic, variable for rendering
4. **Update Phase** - Systems process entities and components
5. **Render Phase** - RenderingSystem draws the scene

## 📈 Performance Features

- **Fixed timestep physics** prevents simulation instability
- **System priorities** control execution order
- **Component queries** are cached for performance
- **Asset loading** with caching and disposal
- **Object pooling** ready architecture

## 🔌 Extensibility

The engine is designed to be easily extended:

1. **Create new components** by defining data structures
2. **Add custom systems** by extending the System base class
3. **Integrate new libraries** through the asset loader
4. **Add new phases** to the game loop as needed

## 🎮 Example Projects

This structure supports many types of games:

- **3D Platformers** - Use Transform, Physics, and Input components
- **Racing Games** - Add Vehicle and Wheel components
- **RPGs** - Add Inventory, Stats, and Dialog components  
- **Strategy Games** - Add Unit, Selection, and AI components
- **Puzzle Games** - Add Grid, Piece, and Animation components

## 📄 License

ISC License - Feel free to use this engine for your projects!

---

*Happy game development! 🎮*
