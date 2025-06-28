import * as THREE from 'https://esm.sh/three@0.155.0';
import * as CANNON from 'https://esm.sh/cannon-es';
import {createEntity , addComponent, getAllComponents, getComponent, system, tick} from './frame.js';
import { input, setupInput } from './input.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x222222);

renderer.render(scene, camera);
document.body.appendChild(renderer.domElement);

setupInput(renderer.domElement);
camera.position.set(0, 0, 5);

//Cannon-es physworld
const physWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

//Ground plane
const groundBody = new CANNON.Body({mass: 0});
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
physWorld.addBody(groundBody);


//Create cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// === ENGINE SETUP ===
const cube = createEntity();
addComponent(cube, 'Transform', {mesh});
addComponent(cube, 'PlayerControlled', true);

const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5);
const boxShape = new CANNON.Box(halfExtents);
const body = new CANNON.Body({mass: 1});
body.addShape(boxShape);
body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
physWorld.addBody(body);

addComponent(cube, 'Physics', {body});

//Player input
system((dt) =>{
    for(const[entity] of getAllComponents('PlayerControlled')){
        const physics = getComponent(entity, 'Physics');
        if(!physics) continue;

        physics.body.velocity.set(0, physics.body.velocity.y, 0);
        const force = 5;
        if (input.keys.has('a') || input.keys.has('ArrowLeft')) physics.body.velocity.x = -force;
        if (input.keys.has('d') || input.keys.has('ArrowRight')) physics.body.velocity.x = force;
        if(input.keys.has('w') || input.keys.has('ArrowUp')) physics.body.velocity.z = -force;
        if(input.keys.has('s') || input.keys.has('ArrowDown')) physics.body.velocity.z = force;
    }
})

//PhysicsSystem 
system((dt) => {
    physWorld.step(1/60, dt, 3);
    for(const [entity, physics] of getAllComponents('Physics')){
        const transform = getComponent(entity, 'Transform');
        if(!transform?.mesh)  continue;
        transform.mesh.position.copy(physics.body.position);
        transform.mesh.quaternion.copy(physics.body.quaternion);
    }
})


// === Animate Loop ===

let last = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = (now - last) / 1000;
  last = now;
  tick(dt);
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
