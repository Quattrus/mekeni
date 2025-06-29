import * as THREE from 'https://esm.sh/three@0.155.0';
import * as CANNON from 'https://esm.sh/cannon-es';
import { PointerLockControls } from 'https://esm.sh/three@0.155.0/examples/jsm/controls/PointerLockControls.js';
import {createEntity , addComponent, getAllComponents, getComponent, system, tick} from './frame.js';
import { input, setupInput } from './input.js';
import { VoxelChunk } from './voxelChunk.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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


const chunkEnt = createEntity();
const chunk = new VoxelChunk(16, 8);
const chunkMesh = chunk.buildMesh();

scene.add(chunkMesh);
addComponent(chunkEnt, 'Transform', { mesh: chunkMesh });
addComponent(chunkEnt, 'VoxelData', { chunk });

const controls = new PointerLockControls(camera, renderer.domElement);
document.body.addEventListener('click', () => controls.lock());
scene.add(new THREE.HemisphereLight(0xbbbbff, 0x444422, 1));

system((dt) => {
  const speed = 5;
  let move = new THREE.Vector3();
  if (input.keys.has('w')) move.z -= 1;
  if (input.keys.has('s')) move.z += 1;
  if (input.keys.has('a')) move.x -= 1;
  if (input.keys.has('d')) move.x += 1;
  move.normalize().multiplyScalar(speed * dt);
  controls.moveRight(move.x);
  controls.moveForward(move.z);
});

system((dt) => {
  physWorld.step(1/60, dt, 3);
  for (const [eid, phys] of getAllComponents('Physics')) {
    const t = getComponent(eid, 'Transform');
    if (t?.mesh) {
      t.mesh.position.copy(phys.body.position);
      t.mesh.quaternion.copy(phys.body.quaternion);
    }
  }
});


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
