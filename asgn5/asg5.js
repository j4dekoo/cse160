import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import createRoom from './src/Room.js';
import { loadBar } from './src/BarLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.update();

const room = createRoom({ width: 7, depth: 8, height: 9, scene: scene, });
room.position.set(0, 0, -1);
scene.add(room);

// RECORD
const recordPos = new THREE.Vector3(-1.6, 0.27, -0.3);
let mixer = null;
new GLTFLoader().load("assets/vinyl.glb", (gltf) => {
    const vinyl = gltf.scene;
    vinyl.scale.setScalar(0.5);
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

// LIGHT
const fill = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(fill);

const bulbColor = 0xfad873;
const bulbInt = 100;
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

camera.position.set(0, 1, 5);
camera.lookAt(0, 1.2, 0);

const clock = new THREE.Clock();

function animate() {

    controls.update();
    const delta = clock.getDelta();

    if (mixer) {
        mixer.update(delta);
    }
    renderer.render(scene, camera);

}