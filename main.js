import * as THREE from 'https://esm.sh/three@0.155.0';
import * as CANNON from 'https://esm.sh/cannon-es';
import { PointerLockControls } from 'https://esm.sh/three@0.155.0/examples/jsm/controls/PointerLockControls.js';
import {createEntity , addComponent, getAllComponents, getComponent, system, tick} from './frame.js';
import { input, setupInput } from './input.js';
import { VoxelChunk } from './voxelChunk.js';
import { ChunkManager } from './chunkManager.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const chunkManager = new ChunkManager(scene);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x222222);
renderer.render(scene, camera);
document.body.appendChild(renderer.domElement);

// Add controls instruction overlay
const controlsDiv = document.createElement('div');
controlsDiv.className = 'controls-overlay';
controlsDiv.style.pointerEvents = 'none';
controlsDiv.innerHTML = `
  <div style="
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 1000;
    max-width: 250px;
  ">
    <h3 style="margin: 0 0 10px 0; color: #4CAF50;">🎮 Controls</h3>
    <div><strong>Click anywhere</strong> to start exploring</div>
    <div style="margin-top: 8px;">
      <div><strong>W A S D</strong> - Move around</div>
      <div><strong>R</strong> - Fly up</div>
      <div><strong>F</strong> - Fly down</div>
      <div><strong>Mouse</strong> - Look around</div>
    </div>
    <div style="margin-top: 10px; font-size: 12px; color: #aaa;">
      🏔️ Explore mountains and caves!<br>
      💡 Fly underground to find caves
    </div>
  </div>
`;
document.body.appendChild(controlsDiv);

setupInput(renderer.domElement);

//Cannon-es physworld
const physWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

//Ground plane
const groundBody = new CANNON.Body({mass: 0});
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
physWorld.addBody(groundBody);

// Setup pointer lock controls
const controls = new PointerLockControls(camera, renderer.domElement);
document.body.addEventListener('click', () => controls.lock());
// Add the control object to the scene and set initial position
scene.add(controls.getObject());
controls.getObject().position.set(10, 10, 10);
// Add better lighting to the scene
scene.add(new THREE.HemisphereLight(0x87CEEB, 0x362d1d, 0.8)); // Sky blue to earth brown
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);

system((dt) => {
  const speed = 5;
  let move = new THREE.Vector3();
  if (input.keys.has('w')) move.z += 1;
  if (input.keys.has('s')) move.z -= 1;
  if (input.keys.has('a')) move.x -= 1;
  if (input.keys.has('d')) move.x += 1;
  if(input.keys.has('r')) move.y += 1;
  if(input.keys.has('f')) move.y -= 1;
  move.normalize().multiplyScalar(speed * dt);
  controls.moveRight(move.x);
  controls.moveForward(move.z);
  // Apply vertical (up/down) movement on the control object instead of the camera
  controls.getObject().position.y += move.y;
  
  // Load/generate chunks around the player
  const playerPos = controls.getObject().position;
  chunkManager.loadChunksAround(playerPos.x, playerPos.z);
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
