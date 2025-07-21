import { System } from '../core/System.js';

/**
 * Input System
 * Handles input collection and distribution to entities
 */
export class InputSystem extends System {
    constructor(canvas) {
        super('InputSystem', 'update');
        this.canvas = canvas;
        
        // Input state
        this.keys = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.previousMousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.mouseButtons = new Set();
        
        // Settings
        this.enableMouseLock = false;
        this.mouseSensitivity = 1.0;
        
        this.priority = -20; // Process input very early
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
            e.preventDefault();
        });

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseButtons.add(e.button);
            e.preventDefault();
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseButtons.delete(e.button);
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
            e.preventDefault();
        });

        // Mouse lock events
        document.addEventListener('pointerlockchange', () => {
            this.enableMouseLock = document.pointerLockElement === this.canvas;
        });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Focus events
        window.addEventListener('blur', () => {
            this.keys.clear();
            this.mouseButtons.clear();
        });
    }

    updateMousePosition(event) {
        if (this.enableMouseLock && document.pointerLockElement === this.canvas) {
            // Use movement delta when pointer is locked
            this.mouseDelta.x = event.movementX * this.mouseSensitivity;
            this.mouseDelta.y = event.movementY * this.mouseSensitivity;
        } else {
            // Calculate position and delta normally
            const rect = this.canvas.getBoundingClientRect();
            this.previousMousePosition.x = this.mousePosition.x;
            this.previousMousePosition.y = this.mousePosition.y;
            
            this.mousePosition.x = event.clientX - rect.left;
            this.mousePosition.y = event.clientY - rect.top;
            
            this.mouseDelta.x = this.mousePosition.x - this.previousMousePosition.x;
            this.mouseDelta.y = this.mousePosition.y - this.previousMousePosition.y;
        }
    }

    onInit(world) {
        console.log('InputSystem initialized');
    }

    execute(world, deltaTime) {
        // Update all Input components with current input state
        this.updateInputComponents(world);
        
        // Reset mouse delta for next frame
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }

    updateInputComponents(world) {
        const entities = world.query('Input');
        
        for (const entity of entities) {
            const input = entity.Input;
            input.updateInputState(
                this.keys,
                this.mousePosition,
                this.mouseDelta,
                this.mouseButtons
            );
        }
    }

    // Mouse lock controls
    requestPointerLock() {
        this.canvas.requestPointerLock();
    }

    exitPointerLock() {
        document.exitPointerLock();
    }

    // Input queries (for systems that need direct input access)
    isKeyPressed(key) {
        return this.keys.has(key);
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons.has(button);
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    getMouseDelta() {
        return { ...this.mouseDelta };
    }

    // Settings
    setMouseSensitivity(sensitivity) {
        this.mouseSensitivity = sensitivity;
    }

    // Cleanup
    onDestroy() {
        // Remove event listeners if needed
        // (Note: in a real implementation, you'd want to store references to remove them)
    }
}
