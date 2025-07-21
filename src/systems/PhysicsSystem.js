import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@latest/dist/cannon-es.js'; 
import { System } from '../core/System.js';

/**
 * Physics System
 * Handles physics simulation using Cannon.js
 */
export class PhysicsSystem extends System {
    constructor(world = null) {
        super('PhysicsSystem', 'physics');
        this.physicsWorld = world;
        this.gravity = { x: 0, y: -9.82, z: 0 };
        this.timeStep = 1/60;
        this.maxSubSteps = 3;
        
        this.priority = -10; // Run physics early
        
        if (!this.physicsWorld) {
            this.createPhysicsWorld();
        }
    }

    createPhysicsWorld() {
        console.log('Creating physics world...');
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(this.gravity.x, this.gravity.y, this.gravity.z);
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
        this.physicsWorld.solver.iterations = 10;

        // Create a finite ground platform instead of infinite plane
        const groundBody = new CANNON.Body({mass: 0});
        const groundShape = new CANNON.Box(new CANNON.Vec3(10, 0.1, 10)); // 20x20 platform, 0.2 thick
        groundBody.addShape(groundShape);
        groundBody.position.set(0, -0.1, 0); // Position it just below y=0
        this.physicsWorld.addBody(groundBody);
        
        console.log('Created finite ground platform: 20x20 units');
    }

    onInit(world) {
        console.log('PhysicsSystem initialized');
    }

    execute(world, deltaTime) {
        // If we have Cannon.js physics world, use it for all entities
        if (this.physicsWorld) {
            this.updatePhysicsBodies(world);
            this.stepSimulation(deltaTime);
            this.updateTransformsFromPhysics(world);
        } else {
            // Fallback to basic physics simulation
            this.simulateBasicPhysics(world, deltaTime);
        }
    }

    // Basic physics simulation (our own implementation)
    simulateBasicPhysics(world, deltaTime) {
        const entities = world.query('Transform', 'Physics');
        
        for (const entity of entities) {
            const transform = entity.Transform;
            const physics = entity.Physics;
            
            // Skip if using external physics body
            if (physics.body) continue;
            
            // Run our basic physics integration
            physics.integrate(transform, deltaTime, this.gravity.y);
        }
    }

    updatePhysicsBodies(world) {
        const entities = world.query('Transform', 'Physics');

        for(const {Transform: t, Physics: p} of entities) {
            if(!p.body){
                const shape = new CANNON.Sphere(p.collisionRadius || 0.5);
                const body = new CANNON.Body({
                    mass: p.isStatic ? 0 : p.mass,
                    position: new CANNON.Vec3(t.position.x, t.position.y, t.position.z),
                    material: new CANNON.Material({ friction: p.friction, restitution: p.restitution })
                });
                body.addShape(shape);
                body.type = p.isKinematic ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC;
                
                // Store reference to physics component for collision detection
                body.userData = p;
                
                // Add collision detection for ground checking
                body.addEventListener('collide', (e) => {
                    const contact = e.contact;
                    const other = e.target === body ? e.body : e.target;
                    
                    console.log('Collision detected! Other body mass:', other.mass, 'Contact normal:', contact.ni);
                    
                    // Check if colliding with ground (static body with mass 0) OR any other body
                    if (other.mass === 0 || other.mass > 0) {
                        // Check if contact normal points upward (we're on top)
                        const normalY = Math.abs(contact.ni.y);
                        console.log('Collision! Normal Y:', normalY);
                        
                        // If the normal is pointing up/down, we're touching ground/ceiling
                        if (normalY > 0.3) {
                            p.isGrounded = true;
                            console.log('Set isGrounded = true');
                        }
                    }
                });
                
                this.physicsWorld.addBody(body);
                p.body = body;
                
                // Start as grounded if close to ground level
                if (t.position.y <= 1.0) {
                    p.isGrounded = true;
                    console.log('Starting as grounded for entity at y:', t.position.y);
                }
            }
        }
        
        for (const entity of entities) {
            const transform = entity.Transform;
            const physics = entity.Physics;
            
            if (physics.body) {
                // Robust ground detection: check position + small velocity
                const isNearGround = physics.body.position.y <= (physics.collisionRadius + 0.1);
                const hasSmallVerticalVelocity = Math.abs(physics.body.velocity.y) < 0.5;
                
                if (isNearGround && hasSmallVerticalVelocity) {
                    physics.isGrounded = true;
                } else if (physics.body.velocity.y > 0.5) {
                    // Definitely in the air if moving up fast
                    physics.isGrounded = false;
                }
                
                // Update body position from transform if kinematic
                if (physics.isKinematic) {
                    physics.body.position.set(
                        transform.position.x,
                        transform.position.y,
                        transform.position.z
                    );
                }
                
                // Apply forces
                for (const force of physics.forces) {
                    physics.body.force.x += force.x;
                    physics.body.force.y += force.y;
                    physics.body.force.z += force.z;
                }
                
                // Apply torques
                for (const torque of physics.torques) {
                    physics.body.torque.x += torque.x;
                    physics.body.torque.y += torque.y;
                    physics.body.torque.z += torque.z;
                }
                
                // Clear forces for next frame
                physics.clearForces();
            }
        }
    }

    stepSimulation(deltaTime) {
        // Step the physics world
        this.physicsWorld.step(this.timeStep, deltaTime, this.maxSubSteps);
    }

    updateTransformsFromPhysics(world) {
        const entities = world.query('Transform', 'Physics');

        for(const entity of entities){
            const transform = entity.Transform;
            const physics = entity.Physics;
            
            if(physics.body && !physics.isKinematic){
                // Copy position from physics body
                transform.position.x = physics.body.position.x;
                transform.position.y = physics.body.position.y;
                transform.position.z = physics.body.position.z;
                
                // Copy rotation from physics body (quaternion to euler)
                const quat = physics.body.quaternion;
                const euler = new CANNON.Vec3();
                quat.toEuler(euler);
                transform.rotation.x = euler.x;
                transform.rotation.y = euler.y;
                transform.rotation.z = euler.z;
                
                // Update velocity component
                physics.velocity.x = physics.body.velocity.x;
                physics.velocity.y = physics.body.velocity.y;
                physics.velocity.z = physics.body.velocity.z;
            }
        }
    }

    // Utility methods
    setGravity(x, y, z) {
        this.gravity.x = x;
        this.gravity.y = y;
        this.gravity.z = z;
        
        if (this.physicsWorld) {
            this.physicsWorld.gravity.set(x, y, z);
        }
    }

    addRigidBody(body) {
        if (this.physicsWorld) {
            this.physicsWorld.add(body);
        }
    }

    removeRigidBody(body) {
        if (this.physicsWorld) {
            this.physicsWorld.remove(body);
        }
    }

    // Ray casting
    raycast(from, to, callback) {
        if (this.physicsWorld) {
            // Implementation would depend on physics library
            // const result = this.physicsWorld.raycastFirst(from, to);
            // callback(result);
        }
    }
}
