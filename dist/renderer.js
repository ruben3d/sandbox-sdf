import * as THREE from 'three';
export class RendererWrapper {
    constructor(id, scene, loopFn) {
        const container = document.getElementById(id);
        if (!(container instanceof HTMLElement))
            throw Error(id);
        this.container = container;
        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 50.0);
        this.camera = camera;
        const renderer = new THREE.WebGLRenderer({ antialias: false });
        container.appendChild(renderer.domElement);
        this.renderer = renderer;
        this.setViewportSize(container.clientWidth, container.clientHeight, window.devicePixelRatio);
        window.addEventListener('resize', this.refreshSize.bind(this));
        renderer.setAnimationLoop(() => loopFn(renderer, camera, scene));
    }
    setViewportSize(viewportWidth, viewportHeight, pixelRatio) {
        this.camera.aspect = viewportWidth / viewportHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(viewportWidth, viewportHeight);
    }
    refreshSize() {
        this.setViewportSize(this.container.clientWidth, this.container.clientHeight, window.devicePixelRatio);
    }
    getCamera() {
        return this.camera;
    }
    setBackground(color) {
        this.renderer.setClearColor(new THREE.Color(color));
    }
}
//# sourceMappingURL=renderer.js.map