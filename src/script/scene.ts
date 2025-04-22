import * as THREE from 'three';
import { TextControl } from "./text.js";
import { RendererWrapper } from './renderer.js';


export class Scene {
    private renderer: RendererWrapper;

    constructor(elementId: string, textControl: TextControl) {
        const scene = new THREE.Scene();
        scene.add(textControl.getMesh());

        const renderer = new RendererWrapper(elementId, scene, Scene.loop);
        renderer.getCamera().position.z = 1.25;
        this.renderer = renderer;
    }

    setBackground(color: string) {
        this.renderer.setBackground(color);
    }

    setViewDistance(d: number) {
        this.renderer.getCamera().position.z = d;
    }

    setViewX(x: number) {
        this.renderer.getCamera().position.x = x;
    }

    setViewY(y: number) {
        this.renderer.getCamera().position.y = y;
    }

    private static loop(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        renderer.clear();
        renderer.render(scene, camera);
    }
}
