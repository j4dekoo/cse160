import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadBar({ path = 'assets/' } = {}) {
    const loader = new GLTFLoader();
    loader.setPath(path);

    const assets = [
        {file: 'stereo.glb', scale: 2.2, pos: [2.6, -0.5, -4], rot: [0, Math.PI, 0]},
        {file: 'stereo.glb', scale: 2.2, pos: [-2.6, -0.5, -4], rot: [0, Math.PI, 0]},
        {file: 'beer.glb', scale: 0.2, pos: [0, 0.5, 0.1], rot: [0, Math.PI, 0]},
        {file: 'martini.glb', scale: 1.7, pos: [1, 0.5, 0.1], rot: [0, Math.PI, 0]},
        {file: 'recordplayer.glb', scale: 0.0012, pos: [-2.4, 0, 1.6], rot: [0, 2, 0]},
        {file: 'ashtray.glb', scale: 1.0, pos: [1.5, 0.1, -0.5], rot: [0, 0, 0]},
        {file: 'radio.glb', scale: 0.6, pos: [-3.1, 2.5, -2], rot: [0, 1.3, 0]},
        {file: 'shelf.glb', scale: 2.0, pos: [-3.1, 1, -2.5], rot: [0, Math.PI / 2, 0]},
        {file: 'shelf.glb', scale: 2.0, pos: [-3.1, 2.5, -2.5], rot: [0, Math.PI / 2, 0]},
        {file: 'soju.glb', scale: 1.0, pos: [-3.1, 1.3, -1.8], rot: [0, 3.8 , 0]},
        {file: 'lightbulb.glb', scale: 0.2, pos: [-1, 3, 0], rot: [0, 0, 0]},
        {file: 'lightbulb.glb', scale: 0.2, pos: [1.5, 3, 0], rot: [0, 0, 0]},
        {file: 'speakers.glb', scale: 0.2, pos: [-2.7, 1.3, -4.5], rot: [0, 0, 0]},
        {file: 'speakers.glb', scale: 0.2, pos: [2.7, 1.3, -4.5], rot: [0, 0, 0]},
        {file: 'glass.glb', scale: 0.3, pos: [0.5, 0.4, -0.5], rot: [0, 0, 0]},
        {file: 'sake.glb', scale: 1.0, pos: [-3.1, 1.2, -2.5], rot: [0, 0, 0]},
        {file: 'bamboo.glb', scale: 0.8, pos: [3.5, 2.4, -1.8], rot: [0, 1.55, 0]},
        {file: 'corkboard.glb', scale: 4.0, pos: [3.4, 0.5, -0.5], rot: [0, - Math.PI / 2, 0]},
    ] 

    function loadAsset({file, scale, pos, rot}) {
        return new Promise((resolve, reject) => {
            loader.load(file, (gltf) => {
                const obj = gltf.scene;
                obj.scale.set(scale, scale, scale);
                obj.rotation.set(...rot);
                obj.position.set(...pos);
                obj.traverse(n => (n.isMesh) && (n.castShadow = n.receiveShadow = true));
                resolve(gltf.scene);
            }, undefined, (error) => {
                console.error('An error happened loading the model:', error);
                reject(error);
            });
        });
    }

    const barObjects = new THREE.Group();
    barObjects.name = 'barObjects';

    const objects = await Promise.all(assets.map(loadAsset));
    objects.forEach(o => barObjects.add(o));

    return barObjects;
}