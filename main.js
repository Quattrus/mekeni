import * as THREE from 'https://esm.sh/three@0.155.0';
import {createEntity , addComponent, getComponent, system, tick} from './frame.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
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
  for (const [entity, rotator] of world.components.get('Rotator') || []) {
    const transform = getComponent(entity, 'Transform');
    if (transform?.mesh) {
      transform.mesh.rotation.x += rotator.speed * dt;
      transform.mesh.rotation.y += rotator.speed * dt;
    }
  }
});

// === Animate Loop ===

camera.position.z = 3;
let last = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = (now - last) / 1000;
  last = now;
  tick(dt);
  renderer.render(scene, camera);
}

animate();

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
