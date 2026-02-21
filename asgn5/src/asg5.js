import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import createRoom from './Room.js';
import { loadBar } from './BarLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const listener = new THREE.AudioListener();
camera.add(listener);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// CAMERA CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, -0.5);

controls.minAzimuthAngle = THREE.MathUtils.degToRad(-45);
controls.maxAzimuthAngle = THREE.MathUtils.degToRad(50);

controls.minDistance = 1.2;
controls.maxDistance = 6.0; 

controls.update();

const room = createRoom({ width: 7, depth: 8, height: 9, scene: scene, });
room.position.set(0, 0, -1);
scene.add(room);

// RECORD
const recordPos = new THREE.Vector3(-2.0, 0.32, -0.45);
let mixer = null;
new GLTFLoader().load("../assets/vinyl.glb", (gltf) => {
    const vinyl = gltf.scene;
    vinyl.scale.setScalar(0.6);
    vinyl.position.copy(recordPos);
    vinyl.traverse((o) => (o.castShadow = true));
    scene.add(vinyl);

    mixer = new THREE.AnimationMixer(vinyl);
    mixer
        .clipAction(
            THREE.AnimationUtils.subclip(gltf.animations[0], "record", 0, 250)
        )
        .setDuration(6)
        .play();
});

// AUDIO
const bgTrack = new THREE.Audio(listener);
new THREE.AudioLoader().load('../audio/piccioni.ogg', buffer => {
  bgTrack.setBuffer(buffer);
  bgTrack.setLoop(true);
  bgTrack.setVolume(0.2);
});
scene.add(bgTrack); 

// LIGHT
const fill = new THREE.AmbientLight(0x610707, 0.8);
scene.add(fill);

const bulbColor = 0xfad873;
const bulbInt = 80;
const bulbLight = new THREE.PointLight(bulbColor, bulbInt, 7);
bulbLight.position.set(1.5, 3, 0);
scene.add(bulbLight);

// const helper = new THREE.PointLightHelper(bulbLight);
// scene.add(helper);

const bulb2 = bulbLight.clone();
bulb2.position.set(-1, 3, 0);
scene.add(bulb2);

(async () => {
    try {
        const bar = await loadBar();
        scene.add(bar);
        console.log('Bar loaded!');
    } catch (err) {
        console.error(err);
    }
})();

const fanPivot = new THREE.Group();
fanPivot.position.set(0, 3.8, -2.0);
scene.add(fanPivot);

const fanLoader = new GLTFLoader();
fanLoader.load('../assets/fan.glb', gltf => {
  const fan = gltf.scene;
  fan.scale.setScalar(1.3);
  fan.rotation.y = 0;
  fan.position.set(0, 0.25, 0);
  fan.traverse(o => (o.castShadow = o.receiveShadow = true));

  fanPivot.add(fan);                // <— key line: attach to pivot
}, undefined, err => console.error('Fan load error:', err));

camera.position.set(0, 1, 5);
camera.lookAt(0, 1.2, 0);

const fanRPM     = 45;                           
const fanRadSec  = fanRPM / 60 * Math.PI * 2;
const clock = new THREE.Clock();

function animate() {
    controls.update();
    const delta = clock.getDelta();

    fanPivot.rotation.y += fanRadSec * delta; 

    if (mixer) {
        mixer.update(delta);
    }
    renderer.render(scene, camera);

}

// ENTRY POINT
const startButton = document.createElement('button');
startButton.textContent = 'Play some jazz :)';
startButton.style.position = 'absolute';
startButton.style.width = '175px';
startButton.style.borderRadius = '10px';
startButton.style.fontSize = '18px';
startButton.style.top = '90%';
startButton.style.left = '50%';
startButton.style.transform = 'translate(-50%, -50%)';

document.body.appendChild(startButton);
startButton.addEventListener('click', () => {
    listener.context.resume();
    bgTrack.play();
    startButton.remove();
})