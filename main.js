import * as THREE from 'https://esm.sh/three@0.155.0';
import {createEntity , addComponent, getAllComponents, getComponent, system, tick} from './frame.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x222222);
document.body.appendChild(renderer.domElement);

//Create cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// === ENGINE SETUP ===
const cube = createEntity();
addComponent(cube, 'Transform', {mesh});
addComponent(cube, 'Rotator', {speed: 1.5});

system((dt) => {
  for (const [entity, rotator] of getAllComponents('Rotator') || []) {
    const transform = getComponent(entity, 'Transform');
    if (transform?.mesh) {
      transform.mesh.rotation.x += rotator.speed * dt;
      transform.mesh.rotation.y += rotator.speed * dt;
      console.log(transform.mesh.rotation);
    }
  }
});

// === Animate Loop ===

camera.position.set(0, 0, 5);
console.log('Camera Pos:', camera.position);
console.log('Mesh Pos:', mesh.position);

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
