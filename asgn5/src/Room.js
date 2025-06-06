// Room.js
import * as THREE from 'three';

export default function createRoom({
  width  = 10,
  depth  = 10,
  height = 4,
  floorColor   = 0x3a2a1e,
  wallColor    = 0x290101,
  ceilingColor = 0x290101,
  scene
} = {}) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mats = [
    new THREE.MeshStandardMaterial({ color: wallColor,    side: THREE.BackSide, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: wallColor,    side: THREE.BackSide, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: ceilingColor, side: THREE.BackSide, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: floorColor,   side: THREE.BackSide, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: wallColor,    side: THREE.BackSide, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: wallColor,    side: THREE.BackSide, roughness: 0.9 }),
  ];
  const room = new THREE.Mesh(geo, mats);
  room.name = 'bar';

  // add counter 
  const geometry = new THREE.BoxGeometry( 6, 0.5, 2 );
  const material = new THREE.MeshPhongMaterial( { color: 0x210e02 } );
  const counter = new THREE.Mesh( geometry, material );
  counter.position.set(0, -0.25, -0.5);
  scene.add( counter );

  // add record wall
  const loader = new THREE.TextureLoader();
  loader.load('assets/recordwall.jpg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0x80573d,
    });
    const wall = new THREE.Mesh(geometry, material);
    wall.scale.set(0.75, 5, 0.1);
    wall.position.set(0, 3.2, -4.5);
    scene.add(wall);
    const wall2 = wall.clone();
    wall2.position.set(0, 0.7, -4.5);
    wall2.rotation.x = Math.PI;
    scene.add(wall2);
  });

  loader.load('assets/moodposter.jpg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0x80573d,
    });
    const poster = new THREE.Mesh(geometry, material);
    poster.scale.set(0.375, 6, 0.001);
    poster.position.set(-3.5, 2.0, 0.2);
    poster.rotation.y = Math.PI / 2;
    scene.add(poster);
  });

  loader.load('assets/motoposter.jpg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0x80573d,
    });
    const poster2 = new THREE.Mesh(geometry, material);
    poster2.scale.set(0.3, 5.5, 0.001);
    poster2.position.set(-3.4, 1.5, 1.8);
    poster2.rotation.y = Math.PI / 2;
    scene.add(poster2);
  });

  return room;
}
