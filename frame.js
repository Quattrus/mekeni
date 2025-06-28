export const world = {
    entities: new Set(),
    components: new Map(), //Map component name -> map of entity -> data
    systems: [],
};

let nextEntityId = 0;

export function createEntity() {
  const id = nextEntityId++;
  world.entities.add(id);
  return id;
}

export function addComponent(entity, component, data){
    if(!world.components.has(component)){
        world.components.set(component, new Map());
    }

    world.components.get(component).set(entity, data);
}

export function getAllComponents(component){
    return world.components.get(component) || new Map();
}

export function getComponent(entity, component){
    return world.components.get(component)?.get(entity);
}

export function system(fn){
    world.systems.push(fn);
}

export function tick(dt){
    for(const sys of world.systems){
        sys(dt);
    }
}