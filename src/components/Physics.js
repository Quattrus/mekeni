
/**
 * Physics Component
 * Handles rigid body physics properties and collision
 */
export class Physics {
    constructor({
        mass = 1.0,
        velocity = { x: 0, y: 0, z: 0 },
        acceleration = { x: 0, y: 0, z: 0 },
        friction = 0.1,
        restitution = 0.5,
        isKinematic = false,
        isStatic = false,
        useGravity = true,
        body = null, // Cannon.js body reference
        // Basic physics properties
        gravityScale = 1.0,
        drag = 0.98,
        angularDrag = 0.95,
        // Collision properties
        collisionRadius = 0.5,
        groundY = 0.5, // Y position considered "ground"
        isGrounded = false,
        // Jump properties
        jumpForce = 8.0, // Reasonable jump force for Cannon.js
        canJump = true
    } = {}) {
        this.mass = mass;
        this.velocity = { ...velocity };
        this.acceleration = { ...acceleration };
        this.friction = friction;
        this.restitution = restitution;
        this.isKinematic = isKinematic;
        this.isStatic = isStatic;
        this.useGravity = useGravity;
        this.body = body;
        
        // Enhanced physics properties
        this.gravityScale = gravityScale;
        this.drag = drag;
        this.angularDrag = angularDrag;
        
        // Collision properties
        this.collisionRadius = collisionRadius;
        this.groundY = groundY;
        this.isGrounded = isGrounded;
        
        // Jump properties
        this.jumpForce = jumpForce;
        this.canJump = canJump;
        
        // Forces
        this.forces = [];
        this.torques = [];
        
        // Previous position for collision resolution
        this.previousPosition = { x: 0, y: 0, z: 0 };
    }

    // Force application
    addForce(x, y, z) {
        this.forces.push({ x, y, z });
    }

    addTorque(x, y, z) {
        this.torques.push({ x, y, z });
    }

    clearForces() {
        this.forces.length = 0;
        this.torques.length = 0;
    }

    // Jump method
    jump() {
        console.log('Jump attempted - canJump:', this.canJump, 'isGrounded:', this.isGrounded, 'hasBody:', !!this.body);
        
        if (this.canJump) {
            if (this.body) {
                // Using Cannon.js physics - check if grounded using physics body
                console.log('Cannon.js body velocity before jump:', this.body.velocity.y);
                if (this.isGrounded) {
                    // Apply upward impulse to Cannon.js body
                    this.body.velocity.y = this.jumpForce;
                    this.isGrounded = false;
                    console.log('Jump applied! New velocity:', this.body.velocity.y);
                } else {
                    console.log('Cannot jump - not grounded');
                }
            } else {
                // Using custom physics
                if (this.isGrounded) {
                    this.velocity.y = this.jumpForce;
                    this.isGrounded = false;
                    console.log('Custom physics jump applied!');
                }
            }
        }
    }

    // Ground check method
    checkGroundCollision(transform) {
        const willBeGrounded = transform.position.y - this.collisionRadius <= this.groundY;
        
        if (willBeGrounded && !this.isGrounded) {
            // Landing
            transform.position.y = this.groundY + this.collisionRadius;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else if (!willBeGrounded) {
            this.isGrounded = false;
        }
        
        return this.isGrounded;
    }

    // Apply basic physics integration
    integrate(transform, deltaTime, gravity = -9.81) {
        if (this.isStatic) return;

        this.previousPosition.x = transform.position.x;
        this.previousPosition.y = transform.position.y;
        this.previousPosition.z = transform.position.z;
        
        // Apply gravity
        if (this.useGravity && !this.isGrounded) {
            this.acceleration.y = gravity * this.gravityScale;
        }
        else{
            this.acceleration.y = 0;
        }
        
        // Apply accumulated forces
        for (const force of this.forces) {
            this.acceleration.x += force.x / this.mass;
            this.acceleration.y += force.y / this.mass;
            this.acceleration.z += force.z / this.mass;
        }
        
        // Integrate velocity
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.velocity.z += this.acceleration.z * deltaTime;
        
        // Apply drag
        if (this.isGrounded) {
            // Strong drag on ground for responsive stopping
            this.velocity.x *= this.drag;
            this.velocity.z *= this.drag;
        } else {
            // Less drag in air for better air control
            this.velocity.x *= (this.drag + 0.02); // Slightly less drag in air
            this.velocity.z *= (this.drag + 0.02);
        }
        
        // Apply friction when grounded
        if (this.isGrounded) {
            this.velocity.x *= (1 - this.friction);
            this.velocity.z *= (1 - this.friction);
        }
        
        // Integrate position
        transform.position.x += this.velocity.x * deltaTime;
        transform.position.y += this.velocity.y * deltaTime;
        transform.position.z += this.velocity.z * deltaTime;
        
        // Check ground collision
        this.checkGroundCollision(transform);
        
        // Clear forces for next frame
        this.clearForces();
    }

    // Velocity methods
    setVelocity(x, y, z) {
        this.velocity.x = x;
        this.velocity.y = y;
        this.velocity.z = z;
        
        if (this.body) {
            this.body.velocity.set(x, y, z);
        }
    }

    addVelocity(x, y, z) {
        this.velocity.x += x;
        this.velocity.y += y;
        this.velocity.z += z;
        
        if (this.body) {
            this.body.velocity.set(this.velocity.x, this.velocity.y, this.velocity.z);
        }
    }

    clone() {
        return new Physics({
            mass: this.mass,
            velocity: { ...this.velocity },
            acceleration: { ...this.acceleration },
            friction: this.friction,
            restitution: this.restitution,
            isKinematic: this.isKinematic,
            isStatic: this.isStatic,
            useGravity: this.useGravity,
            gravityScale: this.gravityScale,
            drag: this.drag,
            angularDrag: this.angularDrag,
            collisionRadius: this.collisionRadius,
            groundY: this.groundY,
            jumpForce: this.jumpForce
        });
    }
}
