/**
 * Input Component
 * Handles input state and bindings for entities
 */
export class Input {
    constructor({
        keyBindings = {},
        mouseBindings = {},
        enabled = true
    } = {}) {
        this.keyBindings = { ...keyBindings };
        this.mouseBindings = { ...mouseBindings };
        this.enabled = enabled;
        
        // Current input state
        this.currentKeys = new Set();
        this.previousKeys = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.mouseButtons = new Set();
        this.previousMouseButtons = new Set();
    }

    // Key binding methods
    bindKey(key, action) {
        this.keyBindings[key] = action;
    }

    unbindKey(key) {
        delete this.keyBindings[key];
    }

    // Mouse binding methods
    bindMouse(button, action) {
        this.mouseBindings[button] = action;
    }

    unbindMouse(button) {
        delete this.mouseBindings[button];
    }

    // Input state queries
    isKeyPressed(key) {
        return this.currentKeys.has(key);
    }

    isKeyJustPressed(key) {
        return this.currentKeys.has(key) && !this.previousKeys.has(key);
    }

    isKeyJustReleased(key) {
        return !this.currentKeys.has(key) && this.previousKeys.has(key);
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons.has(button);
    }

    isMouseButtonJustPressed(button) {
        return this.mouseButtons.has(button) && !this.previousMouseButtons.has(button);
    }

    isMouseButtonJustReleased(button) {
        return !this.mouseButtons.has(button) && this.previousMouseButtons.has(button);
    }

    // Get bound actions
    getActiveActions() {
        const actions = [];
        
        // Check key bindings
        for (const [key, action] of Object.entries(this.keyBindings)) {
            if (this.isKeyPressed(key)) {
                actions.push(action);
            }
        }
        
        // Check mouse bindings
        for (const [button, action] of Object.entries(this.mouseBindings)) {
            if (this.isMouseButtonPressed(parseInt(button))) {
                actions.push(action);
            }
        }
        
        return actions;
    }

    // Update method (called by InputSystem)
    updateInputState(keys, mousePos, mouseDelta, mouseButtons) {
        if (!this.enabled) return;
        
        // Update previous state
        this.previousKeys = new Set(this.currentKeys);
        this.previousMouseButtons = new Set(this.mouseButtons);
        
        // Update current state
        this.currentKeys = new Set(keys);
        this.mousePosition = { ...mousePos };
        this.mouseDelta = { ...mouseDelta };
        this.mouseButtons = new Set(mouseButtons);
    }

    clone() {
        return new Input({
            keyBindings: { ...this.keyBindings },
            mouseBindings: { ...this.mouseBindings },
            enabled: this.enabled
        });
    }
}
