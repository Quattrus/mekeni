import * as THREE from 'https://esm.sh/three@0.155.0';
import * as CANNON from 'https://esm.sh/cannon-es';
import {createEntity , addComponent, getAllComponents, getComponent, system, tick} from './frame.js';
import { input, setupInput } from './input.js';

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

const dragState = {
    eid: null,
    offset: new THREE.Vector3(),
    plane: new THREE.Plane(),
    intersectPoint: new THREE.Vector3()
};

const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);

function getMouseNDC(event){
  return {
    x: (event.clientX / window.innerWidth) * 2 - 1,
    y: - (event.clientY / window.innerHeight) * 2 + 1
  };
}

function onPointerDown(event){
  const ndc = getMouseNDC(event);
  mouse.x = ndc.x; mouse.y = ndc.y;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  if(!hits.length) return;

  const meshHit = hits[0].object;

    let clickedEid = null;
  for(const [eid, t] of getAllComponents('Transform')){
    if(t.mesh === meshHit){
      clickedEid = eid;
      break;
    }
  }

  if(clickedEid === null) return;

    // start dragging
  dragState.eid = clickedEid;
  const phys = getComponent(clickedEid, 'Physics').body;

    phys.type = CANNON.Body.KINEMATIC;
  phys.updateMassProperties();
  phys.velocity.set(0,0,0);
  phys.angularVelocity.set(0,0,0);

 const hitPoint = hits[0].point;
  camera.getWorldDirection(dragState.plane.normal);
  dragState.plane.constant = -dragState.plane.normal.dot(hitPoint);

  dragState.offset.copy(phys.position).sub(hitPoint);
}


function onPointerMove(event){
  if(dragState.eid === null) return;
  const ndc = getMouseNDC(event);
  mouse.x = ndc.x; mouse.y = ndc.y;
  raycaster.setFromCamera(mouse, camera);
  // intersect ray with plane
  if(!raycaster.ray.intersectPlane(dragState.plane, dragState.intersectPoint)) return;

  // move the body
  const phys = getComponent(dragState.eid, 'Physics').body;
  const targetPos = dragState.intersectPoint.clone().add(dragState.offset);
  phys.position.copy(targetPos);
  phys.velocity.set(0,0,0); // zero any leftover vel
}

function onPointerUp(){
  if(dragState.eid === null) return;
  const phys = getComponent(dragState.eid, 'Physics').body;
  // back to dynamic
  phys.type = CANNON.Body.DYNAMIC;
  phys.updateMassProperties();
  // optionally, you could set phys.velocity to some value
  dragState.eid = null;
}

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
