import * as THREE from 'https://esm.sh/three@0.155.0';
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


//Create cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// === ENGINE SETUP ===
const cube = createEntity();
addComponent(cube, 'Transform', {mesh});
addComponent(cube, 'Rotator', {speed: 1.5});
addComponent(cube, 'Velocity', {x: 0.5, y: 0, z: 0})

system((dt) => {
  for (const [entity, rotator] of getAllComponents('Rotator') || []) {
    const transform = getComponent(entity, 'Transform');
    if (transform?.mesh) {
      transform.mesh.rotation.x += rotator.speed * dt;
      transform.mesh.rotation.y += rotator.speed * dt;
    }
  }

  for(const [entity, velocity] of getAllComponents('Velocity')){
    const transform = getComponent(entity, 'Transform');
    if(transform?.mesh){
        transform.mesh.position.x += velocity.x * dt;
        transform.mesh.position.y += velocity.y * dt;
        transform.mesh.position.z += velocity.z * dt;
    }
  }

if (input.keys.has('a')) {
    console.log('Key A is pressed');
  }

  if (input.mouse.clicked) {
    console.log(`Mouse clicked at (${input.mouse.x}, ${input.mouse.y})`);
  }
});

// === Animate Loop ===

camera.position.set(0, 0, 5);

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
