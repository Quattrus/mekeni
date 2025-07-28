import * as THREE from 'https://esm.sh/three@0.155.0';
import { Engine } from './src/core/Engine.js';
import { World } from './src/core/World.js';
import { RenderingSystem } from './src/systems/RenderingSystem.js';
import { PhysicsSystem } from './src/systems/PhysicsSystem.js';
import { InputSystem } from './src/systems/InputSystem.js';
import { MobileInputSystem } from './src/systems/MobileInputSystem.js';
import { Transform } from './src/components/Transform.js';
import { MeshRenderer } from './src/components/MeshRenderer.js';
import { Physics } from './src/components/Physics.js';
import { Input } from './src/components/Input.js';
import { AssetLoader } from './src/assets/AssetLoader.js';

// Game class that uses the new engine
class Game {
    constructor() {
        this.engine = null;
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.assetLoader = new AssetLoader();
    }

    async init() {
        // Setup canvas and Three.js
        this.setupThreeJS();
        
        // Initialize asset loader
        this.assetLoader.initializeLoaders();
        
        // Create the engine
        this.engine = new Engine({
            canvas: this.canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            targetFPS: 60
        });

        // Add systems to the engine
        this.setupSystems();
        
        // Create some demo entities
        this.createDemoScene();
        
        // Start the engine
        this.engine.start();
        
        console.log('Game initialized with new engine structure!');
        console.log('Engine stats:', {
            entities: this.engine.getEntityCount(),
            fps: this.engine.getFPS()
        });
    }

    setupThreeJS() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        // Create Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    setupSystems() {
        // Add systems in order of execution
        const inputSystem = new InputSystem(this.canvas);
        const mobileInputSystem = new MobileInputSystem(this.canvas);
        const physicsSystem = new PhysicsSystem();
        const renderingSystem = new RenderingSystem(this.scene, this.camera, this.renderer);

        this.engine.addSystem(inputSystem);
        this.engine.addSystem(mobileInputSystem);
        this.engine.addSystem(physicsSystem);
        this.engine.addSystem(renderingSystem);
    }

    createDemoScene() {
        // Create a simple demo scene to show the engine working
        
        // 1. Create a ground platform (finite, so you can fall off!)
        const groundEntity = this.engine.world.createEntity();
        const groundGeometry = new THREE.BoxGeometry(20, 0.2, 20); // Match physics: 20x20 platform
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.position.set(0, -0.1, 0); // Match physics position
        groundMesh.receiveShadow = true;

        this.engine.world.addComponent(groundEntity, 'Transform', new Transform({
            position: { x: 0, y: -0.1, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }));

        this.engine.world.addComponent(groundEntity, 'MeshRenderer', new MeshRenderer({
            geometry: groundGeometry,
            material: groundMaterial,
            mesh: groundMesh,
            receiveShadows: true,
            castShadows: false
        }));
        this.engine.getSystem('RenderingSystem').addMeshToScene(groundMesh);

        // 2. Create some cubes
        for (let i = 0; i < 5; i++) {
            const cubeEntity = this.engine.world.createEntity();
            
            const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
            const cubeMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(i / 5, 0.8, 0.6) 
            });
            const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cubeMesh.castShadow = true;

            this.engine.world.addComponent(cubeEntity, 'Transform', new Transform({
                position: { x: (i - 2) * 2, y: 1, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            }));

            this.engine.world.addComponent(cubeEntity, 'MeshRenderer', new MeshRenderer({
                geometry: cubeGeometry,
                material: cubeMaterial,
                mesh: cubeMesh,
                castShadows: true,
                receiveShadows: true
            }));

            // Add some basic physics (conceptual - would need actual physics implementation)
            this.engine.world.addComponent(cubeEntity, 'Physics', new Physics({
                mass: 1.0,
                useGravity: true
            }));

            this.engine.getSystem('RenderingSystem').addMeshToScene(cubeMesh);
        }

        // 3. Create a player entity with input
        const playerEntity = this.engine.world.createEntity();
        
        const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
        const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
        playerMesh.castShadow = true;

        this.engine.world.addComponent(playerEntity, 'Transform', new Transform({
            position: { x: 0, y: 2, z: 5 }
        }));

        this.engine.world.addComponent(playerEntity, 'MeshRenderer', new MeshRenderer({
            geometry: playerGeometry,
            material: playerMaterial,
            mesh: playerMesh,
            castShadows: true
        }));

        this.engine.world.addComponent(playerEntity, 'Input', new Input({
            keyBindings: {
                'KeyW': 'move_forward',
                'KeyS': 'move_backward',
                'KeyA': 'move_left',
                'KeyD': 'move_right',
                'Space': 'jump'
            }
        }));

        // Add physics to the player for realistic movement and jumping!
        this.engine.world.addComponent(playerEntity, 'Physics', new Physics({
            mass: 1.0,
            useGravity: true,
            collisionRadius: 0.5,
            groundY: 0.5, // Ground plane is at y=0, sphere radius is 0.5
            jumpForce: 8.0, // Good jump force for Cannon.js
            drag: 0.92, // Less drag for better air control
            friction: 0.85, // Good ground friction for stopping
            isGrounded: true // Start as grounded
        }));

        this.engine.getSystem('RenderingSystem').addMeshToScene(playerMesh);

        // Add a simple movement system (inline for demo)
        this.engine.addSystem({
            name: 'PlayerMovementSystem',
            phase: 'update',
            enabled: true,
            priority: 0,
            execute: (world, deltaTime) => {
                const entities = world.query('Transform', 'Input', 'Physics');
                const mobileInputSystem = this.engine.getSystem('MobileInputSystem');
                const mobileInputs = mobileInputSystem.getInputs();
                
                for (const entity of entities) {
                    const transform = entity.Transform;
                    const input = entity.Input;
                    const physics = entity.Physics;
                    
                    // Different movement speeds for ground vs air
                    const groundMoveSpeed = 12.0; // Strong ground movement
                    const airMoveSpeed = 3.0;     // Weaker air control
                    const maxGroundSpeed = 8.0;   // Cap ground speed
                    const maxAirSpeed = 5.0;      // Cap air speed
                    
                    const moveSpeed = physics.isGrounded ? groundMoveSpeed : airMoveSpeed;
                    const maxSpeed = physics.isGrounded ? maxGroundSpeed : maxAirSpeed;
                    const actions = input.getActiveActions();

                    // Apply keyboard movement forces
                    for (const action of actions) {
                        switch (action) {
                            case 'move_forward':
                                // Only apply force if we haven't reached max speed in this direction
                                if (Math.abs(physics.velocity.z) < maxSpeed) {
                                    physics.addForce(0, 0, -moveSpeed);
                                }
                                break;
                            case 'move_backward':
                                if (Math.abs(physics.velocity.z) < maxSpeed) {
                                    physics.addForce(0, 0, moveSpeed);
                                }
                                break;
                            case 'move_left':
                                if (Math.abs(physics.velocity.x) < maxSpeed) {
                                    physics.addForce(-moveSpeed, 0, 0);
                                }
                                break;
                            case 'move_right':
                                if (Math.abs(physics.velocity.x) < maxSpeed) {
                                    physics.addForce(moveSpeed, 0, 0);
                                }
                                break;
                            case 'jump':
                                // Use proper physics jumping!
                                physics.jump();
                                break;
                        }
                    }

                    // Apply mobile movement forces
                    if (mobileInputs.pan.x !== 0 || mobileInputs.pan.y !== 0) {
                        const panX = mobileInputs.pan.x / 20;
                        const panY = mobileInputs.pan.y / 20;

                        if (Math.abs(physics.velocity.x) < maxSpeed) {
                            physics.addForce(panX, 0, 0);
                        }
                        if (Math.abs(physics.velocity.z) < maxSpeed) {
                            physics.addForce(0, 0, panY);
                        }
                    }

                    if (mobileInputs.jump) {
                        physics.jump();
                    }
                }
            }
        });

        // Add cube rotation system for visual effect (only for cubes, not player)
        this.engine.addSystem({
            name: 'CubeRotationSystem',
            phase: 'update',
            enabled: true,
            priority: 10,
            execute: (world, deltaTime) => {
                const entities = world.query('Transform', 'MeshRenderer', 'Physics');
                
                for (const entity of entities) {
                    const transform = entity.Transform;
                    const renderer = entity.MeshRenderer;
                    
                    // Only rotate cubes (boxes), not spheres (player)
                    if (renderer.geometry && renderer.geometry.type === 'BoxGeometry') {
                        transform.rotate(0, deltaTime * 0.5, 0);
                    }
                }
            }
        });

        // Add fall-off-world reset system
        this.engine.addSystem({
            name: 'FallResetSystem',
            phase: 'update',
            enabled: true,
            priority: 15,
            execute: (world, deltaTime) => {
                const entities = world.query('Transform', 'Physics');
                
                for (const entity of entities) {
                    const transform = entity.Transform;
                    const physics = entity.Physics;
                    
                    // If entity falls below -10, reset to spawn position
                    if (transform.position.y < -10) {
                        console.log('Entity fell off world! Resetting...');
                        
                        // Reset position
                        if (physics.body) {
                            physics.body.position.set(0, 3, 0);
                            physics.body.velocity.set(0, 0, 0);
                            physics.body.angularVelocity.set(0, 0, 0);
                        } else {
                            transform.position.x = 0;
                            transform.position.y = 3;
                            transform.position.z = 0;
                            physics.velocity.x = 0;
                            physics.velocity.y = 0;
                            physics.velocity.z = 0;
                        }
                    }
                }
            }
        });

        console.log('Demo scene created with', this.engine.world.getEntityCount(), 'entities');
    }
}

// Start the game when page loads
window.addEventListener('load', async () => {
    const game = new Game();
    await game.init();

    const joystick = document.getElementById('joystick');
    const joystickHandle = document.getElementById('joystick-handle');
    let joystickRect;
    let dragging = false;

    const handleDown = (e) => {
        dragging = true;
        joystickRect = joystick.getBoundingClientRect();
    };

    const mobileInputSystem = game.engine.getSystem('MobileInputSystem');
    const handleMove = (e) => {
        if (dragging) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const x = clientX - joystickRect.left - joystickRect.width / 2;
            const y = clientY - joystickRect.top - joystickRect.height / 2;
            const distance = Math.min(Math.sqrt(x * x + y * y), joystickRect.width / 2);
            const angle = Math.atan2(y, x);

            joystickHandle.style.left = `${joystickRect.width / 2 + Math.cos(angle) * distance - joystickHandle.offsetWidth / 2}px`;
            joystickHandle.style.top = `${joystickRect.height / 2 + Math.sin(angle) * distance - joystickHandle.offsetHeight / 2}px`;

            mobileInputSystem.inputs.pan.x = (Math.cos(angle) * distance) * PAN_MULTIPLIER;
            mobileInputSystem.inputs.pan.y = (Math.sin(angle) * distance) * PAN_MULTIPLIER;
        }
    };

    const handleUp = () => {
        dragging = false;
        if (joystickRect) {
            joystickHandle.style.left = `${joystickRect.width / 2 - joystickHandle.offsetWidth / 2}px`;
            joystickHandle.style.top = `${joystickRect.height / 2 - joystickHandle.offsetHeight / 2}px`;
        }
        mobileInputSystem.inputs.pan.x = 0;
        mobileInputSystem.inputs.pan.y = 0;
    };

    const events = {
        down: ['mousedown', 'touchstart'],
        move: ['mousemove', 'touchmove'],
        up: ['mouseup', 'touchend']
    };

    events.down.forEach(event => joystickHandle.addEventListener(event, handleDown));
    events.move.forEach(event => window.addEventListener(event, handleMove));
    events.up.forEach(event => window.addEventListener(event, handleUp));

    const jumpButton = document.getElementById('jump-button');
    const jumpDown = () => {
        mobileInputSystem.inputs.jump = true;
    };

    const jumpUp = () => {
        mobileInputSystem.inputs.jump = false;
    };

    events.down.forEach(event => jumpButton.addEventListener(event, jumpDown));
    events.up.forEach(event => jumpButton.addEventListener(event, jumpUp));
    
    // Add some debug info to the page
    const info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.left = '10px';
    info.style.color = 'white';
    info.style.fontFamily = 'monospace';
    info.style.backgroundColor = 'rgba(0,0,0,0.5)';
    info.style.padding = '10px';
    info.innerHTML = `
        <h3>General Purpose Game Engine Demo</h3>
        <p>🎮 WASD to move player (red sphere)</p>
        <p>🚀 SPACE to jump (with real physics!)</p>
        <p>🏝️ Try to push cubes off the platform!</p>
        <p>📦 ${game.engine.world.getEntityCount()} entities in scene</p>
        <p>🔧 Engine running with ECS architecture</p>
        <p>⚡ Real-time physics: gravity, friction, jumping!</p>
        <p>💀 Fall too far? Auto-reset to spawn!</p>
    `;
    document.body.appendChild(info);
});

    destroy() {
        this.engine.stop();
        this.engine.getSystem('RenderingSystem').dispose();
    }
}

// Export for potential external use
export { Game };
