import { System } from '../core/System.js';
import Hammer from 'hammerjs';

export class MobileInputSystem extends System {
    constructor(element) {
        super('MobileInputSystem', 'update');
        this.hammer = new Hammer(element);
        this.inputs = {
            pan: { x: 0, y: 0 },
            swipe: { x: 0, y: 0 },
            tap: false,
            jump: false
        };

        this.hammer.on('pan', (ev) => {
            this.inputs.pan.x = ev.deltaX;
            this.inputs.pan.y = ev.deltaY;
        });

        this.hammer.on('swipe', (ev) => {
            this.inputs.swipe.x = ev.deltaX;
            this.inputs.swipe.y = ev.deltaY;
        });

        this.hammer.on('tap', (ev) => {
            this.inputs.tap = true;
        });

        // A swipe up will be a jump
        this.hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
        this.hammer.on('swipeup', (ev) => {
            this.inputs.jump = true;
        });
    }

    execute(world, deltaTime) {
        // Reset tap and jump after one frame
        this.inputs.tap = false;
        this.inputs.jump = false;
    }

    getInputs() {
        return this.inputs;
    }
}
