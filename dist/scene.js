import * as THREE from 'three';
import { RendererWrapper } from './renderer.js';
export class Scene {
    constructor(elementId, textControl) {
        const scene = new THREE.Scene();
        scene.add(textControl.getMesh());
        const renderer = new RendererWrapper(elementId, scene, Scene.loop);
        renderer.getCamera().position.z = 1.25;
        this.renderer = renderer;
    }
    setBackground(color) {
        this.renderer.setBackground(color);
    }
    setViewDistance(d) {
        this.renderer.getCamera().position.z = d;
    }
    setViewX(x) {
        this.renderer.getCamera().position.x = x;
    }
    setViewY(y) {
        this.renderer.getCamera().position.y = y;
    }
    static loop(renderer, camera, scene) {
        renderer.clear();
        renderer.render(scene, camera);
    }
}
//# sourceMappingURL=scene.js.map