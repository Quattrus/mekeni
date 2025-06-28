export const input = {
    keys: new Set(),
    mouse: {
        x: 0,
        y: 0,
        clicked: false,
    },
}

export function setupInput(canvas){
    window.addEventListener('keydown', (e) => {
        input.keys.add(e.key);
    });

    window.addEventListener('keyup', (e) =>{
        input.keys.delete(e.key);
    });

    canvas.addEventListener('pointermove', () => {
        input.mouse.clicked = true;
    });

    canvas.addEventListener('pointerup', () =>{
        input.mouse.clicked = false;
    })
}