import * as THREE from 'three';
import { SDFSettings } from './sdf.js';


const VertexShader = `
  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

//                |<-- weight -->|
//              edge         inner edge
// drop shadow    |    border    |   color + bevel + innershadow + innerglow
//             |    |         |     |
//              blur           blur

const FragmentShader = `
    precision highp float;

    uniform sampler2D sdf;
    uniform float weight;
    uniform vec3 color;
    uniform vec3 colorB;
    uniform float colorScale;
    uniform float colorOffset;
    uniform float opacity;
    uniform float blur;
    uniform vec3 borderColor;
    uniform vec3 borderColorB;
    uniform float borderColorScale;
    uniform float borderColorOffset;
    uniform float borderThickness;
    uniform vec3 shadowColor;
    uniform float shadowOpacity;
    uniform float shadowBlur;
    uniform float shadowOffsetX;
    uniform float shadowOffsetY;
    uniform vec3 innerShadowColor;
    uniform float innerShadowOpacity;
    uniform float innerShadowBlur;
    uniform float innerShadowOffsetX;
    uniform float innerShadowOffsetY;
    uniform vec2 bevelLightDir;
    uniform float bevelThickness;
    uniform float bevelOpacity;
    uniform float bevelBlur;

    varying vec2 vUV;

    const float EPSILON = 0.001;

    // https://en.wikipedia.org/wiki/Alpha_compositing
    vec4 blendAoverB(vec4 A, vec4 B) {
        float alpha = A.a + B.a * (1.0 - A.a);
        vec3 c = A.rgb * A.a + B.rgb * B.a * (1.0 - A.a);
        return alpha > 0.0 ? vec4(c / alpha, alpha) : vec4(0.0);
    }

    float reflectOnCenter(float x, float c) {
        return (x <= c) ?
            c + (c - x) * (1.0 - c) / c :
            c - (x - c) * c / (1.0 - c);
    }

    bool isZero(float n) {
        return abs(n) < EPSILON;
    }

    void main() {
        float adjustedShadowBlur = max(shadowBlur, blur);
        float adjustedInnerShadowBlur = max(innerShadowBlur, blur);
        float adjustedBevelBlur = max(bevelBlur, blur);

        float dist = texture2D(sdf, vUV).r;
        vec4 baseColor = vec4(mix(colorB, color, smoothstep((1.0-colorScale) * 0.5, 1.0 - (1.0-colorScale) * 0.5, vUV.y + colorOffset)), dist);

        float edge = min(weight - borderThickness, weight);
        float innerEdge = max(weight - borderThickness, weight);

// START Experimental
        
        // Bevel
        float dx = dFdx(dist);
        float dy = dFdy(dist);
        float adjustedBevelThickness = min(bevelThickness, max(0.01, 1.0 - innerEdge - adjustedBevelBlur));

        if (bevelOpacity > 0.0 && bevelThickness > 0.0 &&
            innerEdge - blur < dist && dist < innerEdge + adjustedBevelThickness + adjustedBevelBlur) {

            float embossAlpha = bevelOpacity * (adjustedBevelBlur > 0.0
                ? smoothstep(innerEdge + adjustedBevelThickness + adjustedBevelBlur, innerEdge + adjustedBevelThickness, dist)
                : 1.0);
            float emboss = (isZero(dx) && isZero(dy)) ? 0.0 : dot(normalize(vec2(dx, dy)), bevelLightDir) * embossAlpha;

            if (emboss >= 0.0) {
                baseColor.xyz = baseColor.xyz + emboss * emboss * emboss;
            } else {
                baseColor.xyz = baseColor.xyz * (1.0 + emboss);
            }
        }

// END Experimental

        // Inner shadow
        if (innerShadowOpacity > 0.0 && innerEdge - blur < dist) {
            float innerShadowDist = reflectOnCenter(texture2D(sdf, vUV + vec2(innerShadowOffsetX, innerShadowOffsetY)).r, innerEdge);
            vec4 innerShadowBaseColor = vec4(innerShadowColor, innerShadowDist);
            innerShadowBaseColor.a = smoothstep(innerEdge - adjustedInnerShadowBlur, innerEdge + adjustedInnerShadowBlur, innerShadowBaseColor.a) * innerShadowOpacity;
            baseColor = blendAoverB(innerShadowBaseColor, baseColor);
        }

        // Border
        if (borderThickness > 0.0 && (weight - borderThickness - blur) <= dist && dist < (weight + blur)) {
            baseColor.rgb = mix(
                mix(borderColorB, borderColor, smoothstep((1.0-borderColorScale) * 0.5, 1.0 - (1.0-borderColorScale) * 0.5, vUV.y + borderColorOffset)),
                baseColor.rgb,
                smoothstep(max(0.0, weight - blur), min(weight + blur, 1.0), dist)
            );
        } else if (borderThickness < 0.0 && (weight - blur) <= dist && dist < (weight - borderThickness + blur)) {
            baseColor.rgb = mix(
                mix(borderColorB, borderColor, smoothstep((1.0-borderColorScale) * 0.5, 1.0 - (1.0-borderColorScale) * 0.5, vUV.y + borderColorOffset)),
                baseColor.rgb,
                smoothstep(max(0.0, weight - borderThickness - blur), min(weight - borderThickness + blur, 1.0), dist)
            );
        }
        baseColor.a = smoothstep(max(0.0, edge - blur), min(edge + blur, 1.0), dist);

        // Drop shadow
        if (shadowOpacity > 0.0 && dist < edge + blur) {
            float shadowDist = texture2D(sdf, vUV + vec2(shadowOffsetX, shadowOffsetY)).r;
            vec4 shadowBaseColor = vec4(shadowColor, shadowDist);
            shadowBaseColor.a = smoothstep(max(0.0, edge - adjustedShadowBlur), min(edge + adjustedShadowBlur, 1.0), shadowBaseColor.a) * shadowOpacity;
            baseColor = blendAoverB(baseColor, shadowBaseColor);
        }

        gl_FragColor = vec4(baseColor.rgb, baseColor.a * opacity);

#include <tonemapping_fragment>
#include <colorspace_fragment>
    }
`;

type Uniforms = { [uniform: string]: THREE.IUniform };

export class TextControl {

    static readonly WeightDefault: number = 0.5;
    static readonly ColorDefault: string = '#ffffff';
    static readonly ColorBDefault: string = '#ffffff';
    static readonly ColorScaleDefault: number = 0.5;
    static readonly ColorOffsetDefault: number = 0.0;
    static readonly OpacityDefault: number = 1.0;
    static readonly BlurDefault: number = 0.02;
    static readonly BorderColorDefault: string = '#ff0000';
    static readonly BorderColorBDefault: string = '#ff0000';
    static readonly BorderColorScaleDefault: number = 0.5;
    static readonly BorderColorOffsetDefault: number = 0.0;
    static readonly BorderThicknessDefault: number = 0.0;
    static readonly ShadowColorDefault: string = '#222222';
    static readonly ShadowOpacityDefault: number = 0.0;
    static readonly ShadowBlurDefault: number = 0.25;
    static readonly ShadowOffsetXDefault: number = 0.0;
    static readonly ShadowOffsetYDefault: number = 0.0;
    static readonly InnerShadowColorDefault: string = '#222222';
    static readonly InnerShadowOpacityDefault: number = 0.0;
    static readonly InnerShadowBlurDefault: number = 0.25;
    static readonly InnerShadowOffsetXDefault: number = 0.0;
    static readonly InnerShadowOffsetYDefault: number = 0.0;
    static readonly BevelLightDirDefault: [number, number] = [0, -1];
    static readonly BevelOpacityDefault: number = 0.0;
    static readonly BevelBlurDefault: number = 0.0;
    static readonly BevelThicknessDefault: number = 0.2;


    private sdfSettings: SDFSettings
    private mesh: THREE.Mesh;
    private material: THREE.ShaderMaterial;
    private uniforms: Uniforms;

    constructor(sdf: ImageData, sdfSettings: SDFSettings) {
        this.sdfSettings = structuredClone(sdfSettings);

        const material = new THREE.ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            transparent: true,
        });
        this.material = material;

        const uniforms: Uniforms = {
            sdf: { value: this.createTexture(sdf) },
            weight: { value: TextControl.WeightDefault },
            color: { value: new THREE.Color(TextControl.ColorDefault) },
            colorB: { value: new THREE.Color(TextControl.ColorBDefault) },
            colorScale: { value: TextControl.ColorScaleDefault },
            colorOffset: { value: TextControl.ColorOffsetDefault },
            opacity: { value: TextControl.OpacityDefault },
            blur: { value: TextControl.BlurDefault },
            borderColor: { value: new THREE.Color(TextControl.BorderColorDefault) },
            borderColorB: { value: new THREE.Color(TextControl.BorderColorBDefault) },
            borderColorScale: { value: TextControl.BorderColorScaleDefault },
            borderColorOffset: { value: TextControl.BorderColorOffsetDefault },
            borderThickness: { value: TextControl.BorderThicknessDefault },
            shadowColor: { value: new THREE.Color(TextControl.ShadowColorDefault) },
            shadowOpacity: { value: TextControl.ShadowOpacityDefault },
            shadowBlur: { value: TextControl.ShadowBlurDefault },
            shadowOffsetX: { value: TextControl.ShadowOffsetXDefault },
            shadowOffsetY: { value: TextControl.ShadowOffsetYDefault },
            innerShadowColor: { value: new THREE.Color(TextControl.InnerShadowColorDefault) },
            innerShadowOpacity: { value: TextControl.InnerShadowOpacityDefault },
            innerShadowBlur: { value: TextControl.InnerShadowBlurDefault },
            innerShadowOffsetX: { value: TextControl.InnerShadowOffsetXDefault },
            innerShadowOffsetY: { value: TextControl.InnerShadowOffsetYDefault },
            bevelLightDir: { value: new THREE.Vector2(TextControl.BevelLightDirDefault[0], TextControl.BevelLightDirDefault[1]) },
            bevelOpacity: { value: TextControl.BevelOpacityDefault },
            bevelBlur: { value: TextControl.BevelBlurDefault },
            bevelThickness: { value: TextControl.BevelThicknessDefault },
        };
        material.uniforms = uniforms;
        this.uniforms = uniforms;

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
        this.mesh = TextControl.setScale(mesh, sdf.width, sdf.height);
    }

    private createTexture(sdf: ImageData): THREE.Texture {
        const texture = new THREE.Texture(sdf);
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        texture.format = THREE.RedFormat;
        texture.needsUpdate = true;
        return texture;
    }

    private static setScale(mesh: THREE.Mesh, width: number, height: number): THREE.Mesh {
        const scaleRatio = width / height;
        mesh.scale.set(scaleRatio > 1.0 ? scaleRatio : 1.0, scaleRatio < 1.0 ? 1.0 / scaleRatio : 1.0, 1);
        return mesh;
    }

    getMesh(): THREE.Mesh {
        return this.mesh;
    }

    setSDF(sdf: ImageData, sdfSettings: SDFSettings) {
        this.sdfSettings = sdfSettings;
        const oldTexture = this.uniforms['sdf'].value as THREE.Texture;
        oldTexture.dispose();
        this.uniforms['sdf'].value = this.createTexture(sdf);
        this.material.needsUpdate = true;
        this.mesh = TextControl.setScale(this.mesh, sdf.width, sdf.height);
    }

    setWeight(value: number) {
        this.uniforms['weight'].value = value;
        this.material.needsUpdate = true;
    }

    setColor(color: string) {
        (this.uniforms['color'].value as THREE.Color).setStyle(color);
        this.material.needsUpdate = true;
    }

    setColorB(color: string) {
        (this.uniforms['colorB'].value as THREE.Color).setStyle(color);
        this.material.needsUpdate = true;
    }

    setColorScale(value: number) {
        this.uniforms['colorScale'].value = value;
        this.material.needsUpdate = true;
    }

    setColorOffset(value: number) {
        this.uniforms['colorOffset'].value = value;
        this.material.needsUpdate = true;
    }

    setOpacity(value: number) {
        this.uniforms['opacity'].value = value;
        this.material.needsUpdate = true;
    }

    setBlur(value: number) {
        this.uniforms['blur'].value = value / 2.0;
        this.material.needsUpdate = true;
    }

    setBorderColor(color: string) {
        (this.uniforms['borderColor'].value as THREE.Color).setStyle(color);
        this.material.needsUpdate = true;
    }

    setBorderColorB(color: string) {
        (this.uniforms['borderColorB'].value as THREE.Color).setStyle(color);
        this.material.needsUpdate = true;
    }

    setBorderColorScale(value: number) {
        this.uniforms['borderColorScale'].value = value;
        this.material.needsUpdate = true;
    }

    setBorderColorOffset(value: number) {
        this.uniforms['borderColorOffset'].value = value;
        this.material.needsUpdate = true;
    }

    setBorderThickness(value: number) {
        this.uniforms['borderThickness'].value = value;
        this.material.needsUpdate = true;
    }

    setShadowColor(color: string) {
        (this.uniforms['shadowColor'].value as THREE.Color).setStyle(color);
        this.material.needsUpdate = true;
    }

    setShadowOpacity(value: number) {
        this.uniforms['shadowOpacity'].value = value;
        this.material.needsUpdate = true;
    }

    setShadowBlur(value: number) {
        this.uniforms['shadowBlur'].value = value / 2.0;
        this.material.needsUpdate = true;
    }

    setShadowOffsetX(value: number) {
        this.uniforms['shadowOffsetX'].value = -value * this.sdfSettings.spread / Math.min(this.sdfSettings.width, this.sdfSettings.height);
        this.material.needsUpdate = true;
    }

    setShadowOffsetY(value: number) {
        this.uniforms['shadowOffsetY'].value = value * this.sdfSettings.spread / Math.min(this.sdfSettings.width, this.sdfSettings.height);
        this.material.needsUpdate = true;
    }

    setInnerShadowColor(color: string) {
        (this.uniforms['innerShadowColor'].value as THREE.Color).setStyle(color);
        this.material.needsUpdate = true;
    }

    setInnerShadowOpacity(value: number) {
        this.uniforms['innerShadowOpacity'].value = value;
        this.material.needsUpdate = true;
    }

    setInnerShadowBlur(value: number) {
        this.uniforms['innerShadowBlur'].value = value / 2.0;
        this.material.needsUpdate = true;
    }

    setInnerShadowOffsetX(value: number) {
        this.uniforms['innerShadowOffsetX'].value = -value * this.sdfSettings.spread / this.sdfSettings.height;
        this.material.needsUpdate = true;
    }

    setInnerShadowOffsetY(value: number) {
        this.uniforms['innerShadowOffsetY'].value = value * this.sdfSettings.spread / this.sdfSettings.height;
        this.material.needsUpdate = true;
    }

    // 0deg at the top, increasing CW
    setBevelLightDir(degrees: number) {
        const radians = degrees * Math.PI / 180.0;
        const x = -Math.sin(radians);
        const y = -Math.cos(radians);
        (this.uniforms['bevelLightDir'].value as THREE.Vector2).set(x, y);
        this.material.needsUpdate = true;
    }

    setBevelOpacity(value: number) {
        this.uniforms['bevelOpacity'].value = value;
        this.material.needsUpdate = true;
    }

    setBevelBlur(value: number) {
        this.uniforms['bevelBlur'].value = value / 2.0;
        this.material.needsUpdate = true;
    }

    setBevelThickness(value: number) {
        this.uniforms['bevelThickness'].value = value;
        this.material.needsUpdate = true;
    }
}
