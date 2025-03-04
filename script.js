// 
// Importing Utilities 
// 
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import Stats from 'three/addons/libs/stats.module.js';

import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

// DOM Elements
const progressContainer = document.querySelector('.progress-bar-container');
const progressBar = document.querySelector('progress#progress-bar');
const progressText = document.querySelector('label.progress-bar');

// Loading Manager
const manager = new THREE.LoadingManager();
manager.onLoad = () => progressContainer.style.display = 'none';
manager.onProgress = (url, itemsLoaded, itemsTotal) => progressBar.value = itemsLoaded / itemsTotal;

// Loaders
const rgbeLoader = new RGBELoader(manager);
const gltfLoader = new GLTFLoader(manager);
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
gltfLoader.setDRACOLoader(dracoLoader);

// Scene Setup
const canvas = document.querySelector('.webgl');
const scene = new THREE.Scene();
const sizes = { width: window.innerWidth, height: window.innerHeight };
const aspectRatio = sizes.width / sizes.height;
const camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 100);
camera.position.set(3.5, 2.8, 5);
scene.add(camera);

// Lighting
const spotLight = new THREE.SpotLight('white', 10);
spotLight.position.set(0, 10, 0);
spotLight.castShadow = true;
scene.add(spotLight);
const spotLightHelper = new THREE.SpotLightHelper(spotLight);
// scene.add(spotLightHelper);

// Plane
const plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({ color: '#c2c2c2' }));
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Load Assets
let model, envMap;
async function loadAssets() {
    const [hdr, gltf] = await Promise.all([
        rgbeLoader.loadAsync('./envmaps/parking_garage_4k.hdr'),
        gltfLoader.loadAsync('honda_cb_750_f_super_sport_1970.glb')
    ]);
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    envMap = hdr;
    // scene.background = hdr;
    model = gltf.scene;
    model.scale.set(3.5,3.5,3.5);
    scene.add(model);
    updateBikeMaterials();
    spotLight.target = model;
    console.log(model.position);
}
loadAssets();

// Update Bike Materials
function updateBikeMaterials() {
    if (!model) return;
    model.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.material.envMap = objDebug.toggleEnvLight ? envMap : null;
            child.material.envMapIntensity = objDebug.envMapIntensity;
            if (child.name.includes('Object_6')) {
                child.material.color.set(objDebug.bikeColor);
                child.material.metalness = objDebug.bikeMetalness;
                child.material.roughness = objDebug.bikeRoughness;
            }
        }
    });
}

// GUI Controls
const gui = new GUI();
const objDebug = {
    bikeColor: '#ff0000',
    bikeMetalness: 0.5,
    bikeRoughness: 0.5,
    toggleEnvLight: true,
    envMapIntensity: 0.1,
    downloadScreenshot: () => {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'bike-image.png';
        a.click();
    }
};
const bikeMaterialFolder = gui.addFolder('Bike Materials');
bikeMaterialFolder.addColor(objDebug, 'bikeColor').onChange(updateBikeMaterials);
bikeMaterialFolder.add(objDebug, 'bikeMetalness', 0, 1, 0.01).onChange(updateBikeMaterials);
bikeMaterialFolder.add(objDebug, 'bikeRoughness', 0, 1, 0.01).onChange(updateBikeMaterials);
const lightFolder = gui.addFolder('Lighting');
lightFolder.add(objDebug, 'toggleEnvLight').onChange(updateBikeMaterials);
lightFolder.add(objDebug, 'envMapIntensity', 0, 1, 0.01).onChange(updateBikeMaterials);
gui.add(objDebug, 'downloadScreenshot');

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.setSize(sizes.width, sizes.height);

// Orbit Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 2;

// Resize Event
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    renderer.setSize(sizes.width, sizes.height);
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
});


// Animation Loop
const clock = new THREE.Clock();
function animate() {
    spotLight.position.x = Math.sin(clock.getElapsedTime()) * 1.5;
    spotLight.position.z = Math.cos(clock.getElapsedTime()) * 1.5;
    spotLightHelper.update();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();
