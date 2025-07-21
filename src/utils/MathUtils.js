/**
 * Math Utilities
 */
export const MathUtils = {
    // Constants
    PI: Math.PI,
    TWO_PI: Math.PI * 2,
    HALF_PI: Math.PI * 0.5,
    DEG_TO_RAD: Math.PI / 180,
    RAD_TO_DEG: 180 / Math.PI,

    // Basic math
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    smoothstep(min, max, value) {
        const x = this.clamp((value - min) / (max - min), 0, 1);
        return x * x * (3 - 2 * x);
    },

    // Random functions
    random(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    randomChoice(array) {
        return array[this.randomInt(0, array.length - 1)];
    },

    // Vector utilities
    distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = (b.z || 0) - (a.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    distanceSquared(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = (b.z || 0) - (a.z || 0);
        return dx * dx + dy * dy + dz * dz;
    },

    magnitude(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y + (vector.z || 0) * (vector.z || 0));
    },

    normalize(vector) {
        const mag = this.magnitude(vector);
        if (mag === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: vector.x / mag,
            y: vector.y / mag,
            z: (vector.z || 0) / mag
        };
    },

    dot(a, b) {
        return a.x * b.x + a.y * b.y + (a.z || 0) * (b.z || 0);
    },

    cross(a, b) {
        return {
            x: a.y * (b.z || 0) - (a.z || 0) * b.y,
            y: (a.z || 0) * b.x - a.x * (b.z || 0),
            z: a.x * b.y - a.y * b.x
        };
    },

    // Angle utilities
    degToRad(degrees) {
        return degrees * this.DEG_TO_RAD;
    },

    radToDeg(radians) {
        return radians * this.RAD_TO_DEG;
    },

    angleBetween(a, b) {
        return Math.acos(this.dot(this.normalize(a), this.normalize(b)));
    },

    // Easing functions
    easeInQuad(t) {
        return t * t;
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    easeInCubic(t) {
        return t * t * t;
    },

    easeOutCubic(t) {
        return 1 + (--t) * t * t;
    },

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
};

/**
 * Color Utilities
 */
export const ColorUtils = {
    // Convert hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : null;
    },

    // Convert RGB to hex
    rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    },

    // HSV to RGB conversion
    hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        
        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        return {
            r: r + m,
            g: g + m,
            b: b + m
        };
    },

    // Lerp between colors
    lerpColor(colorA, colorB, t) {
        return {
            r: MathUtils.lerp(colorA.r, colorB.r, t),
            g: MathUtils.lerp(colorA.g, colorB.g, t),
            b: MathUtils.lerp(colorA.b, colorB.b, t)
        };
    }
};

/**
 * Time Utilities
 */
export const TimeUtils = {
    // Simple timer class
    Timer: class {
        constructor(duration) {
            this.duration = duration;
            this.elapsed = 0;
            this.running = false;
            this.completed = false;
        }

        start() {
            this.running = true;
            this.completed = false;
            this.elapsed = 0;
        }

        stop() {
            this.running = false;
        }

        reset() {
            this.elapsed = 0;
            this.completed = false;
        }

        update(deltaTime) {
            if (!this.running || this.completed) return;
            
            this.elapsed += deltaTime;
            if (this.elapsed >= this.duration) {
                this.elapsed = this.duration;
                this.completed = true;
                this.running = false;
            }
        }

        getProgress() {
            return this.duration > 0 ? this.elapsed / this.duration : 0;
        }

        isCompleted() {
            return this.completed;
        }

        getTimeRemaining() {
            return Math.max(0, this.duration - this.elapsed);
        }
    },

    // Performance measurement
    now() {
        return performance.now();
    },

    // Format time for display
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000) % 60;
        const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
};
