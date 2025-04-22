import * as THREE from 'three';
const VertexShader = `
  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
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
export class TextControl {
    constructor(sdf, sdfSettings) {
        this.sdfSettings = structuredClone(sdfSettings);
        const material = new THREE.ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            transparent: true,
        });
        this.material = material;
        const uniforms = {
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
    createTexture(sdf) {
        const texture = new THREE.Texture(sdf);
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        texture.format = THREE.RedFormat;
        texture.needsUpdate = true;
        return texture;
    }
    static setScale(mesh, width, height) {
        const scaleRatio = width / height;
        mesh.scale.set(scaleRatio > 1.0 ? scaleRatio : 1.0, scaleRatio < 1.0 ? 1.0 / scaleRatio : 1.0, 1);
        return mesh;
    }
    getMesh() {
        return this.mesh;
    }
    setSDF(sdf, sdfSettings) {
        this.sdfSettings = sdfSettings;
        const oldTexture = this.uniforms['sdf'].value;
        oldTexture.dispose();
        this.uniforms['sdf'].value = this.createTexture(sdf);
        this.material.needsUpdate = true;
        this.mesh = TextControl.setScale(this.mesh, sdf.width, sdf.height);
    }
    setWeight(value) {
        this.uniforms['weight'].value = value;
        this.material.needsUpdate = true;
    }
    setColor(color) {
        this.uniforms['color'].value.setStyle(color);
        this.material.needsUpdate = true;
    }
    setColorB(color) {
        this.uniforms['colorB'].value.setStyle(color);
        this.material.needsUpdate = true;
    }
    setColorScale(value) {
        this.uniforms['colorScale'].value = value;
        this.material.needsUpdate = true;
    }
    setColorOffset(value) {
        this.uniforms['colorOffset'].value = value;
        this.material.needsUpdate = true;
    }
    setOpacity(value) {
        this.uniforms['opacity'].value = value;
        this.material.needsUpdate = true;
    }
    setBlur(value) {
        this.uniforms['blur'].value = value / 2.0;
        this.material.needsUpdate = true;
    }
    setBorderColor(color) {
        this.uniforms['borderColor'].value.setStyle(color);
        this.material.needsUpdate = true;
    }
    setBorderColorB(color) {
        this.uniforms['borderColorB'].value.setStyle(color);
        this.material.needsUpdate = true;
    }
    setBorderColorScale(value) {
        this.uniforms['borderColorScale'].value = value;
        this.material.needsUpdate = true;
    }
    setBorderColorOffset(value) {
        this.uniforms['borderColorOffset'].value = value;
        this.material.needsUpdate = true;
    }
    setBorderThickness(value) {
        this.uniforms['borderThickness'].value = value;
        this.material.needsUpdate = true;
    }
    setShadowColor(color) {
        this.uniforms['shadowColor'].value.setStyle(color);
        this.material.needsUpdate = true;
    }
    setShadowOpacity(value) {
        this.uniforms['shadowOpacity'].value = value;
        this.material.needsUpdate = true;
    }
    setShadowBlur(value) {
        this.uniforms['shadowBlur'].value = value / 2.0;
        this.material.needsUpdate = true;
    }
    setShadowOffsetX(value) {
        this.uniforms['shadowOffsetX'].value = -value * this.sdfSettings.spread / Math.min(this.sdfSettings.width, this.sdfSettings.height);
        this.material.needsUpdate = true;
    }
    setShadowOffsetY(value) {
        this.uniforms['shadowOffsetY'].value = value * this.sdfSettings.spread / Math.min(this.sdfSettings.width, this.sdfSettings.height);
        this.material.needsUpdate = true;
    }
    setInnerShadowColor(color) {
        this.uniforms['innerShadowColor'].value.setStyle(color);
        this.material.needsUpdate = true;
    }
    setInnerShadowOpacity(value) {
        this.uniforms['innerShadowOpacity'].value = value;
        this.material.needsUpdate = true;
    }
    setInnerShadowBlur(value) {
        this.uniforms['innerShadowBlur'].value = value / 2.0;
        this.material.needsUpdate = true;
    }
    setInnerShadowOffsetX(value) {
        this.uniforms['innerShadowOffsetX'].value = -value * this.sdfSettings.spread / this.sdfSettings.width;
        this.material.needsUpdate = true;
    }
    setInnerShadowOffsetY(value) {
        this.uniforms['innerShadowOffsetY'].value = value * this.sdfSettings.spread / this.sdfSettings.height;
        this.material.needsUpdate = true;
    }
    setBevelLightDir(degrees) {
        const radians = degrees * Math.PI / 180.0;
        const x = -Math.sin(radians);
        const y = -Math.cos(radians);
        this.uniforms['bevelLightDir'].value.set(x, y);
        this.material.needsUpdate = true;
    }
    setBevelOpacity(value) {
        this.uniforms['bevelOpacity'].value = value;
        this.material.needsUpdate = true;
    }
    setBevelBlur(value) {
        this.uniforms['bevelBlur'].value = value / 2.0;
        this.material.needsUpdate = true;
    }
    setBevelThickness(value) {
        this.uniforms['bevelThickness'].value = value;
        this.material.needsUpdate = true;
    }
}
TextControl.WeightDefault = 0.5;
TextControl.ColorDefault = '#ffffff';
TextControl.ColorBDefault = '#ffffff';
TextControl.ColorScaleDefault = 0.5;
TextControl.ColorOffsetDefault = 0.0;
TextControl.OpacityDefault = 1.0;
TextControl.BlurDefault = 0.02;
TextControl.BorderColorDefault = '#ff0000';
TextControl.BorderColorBDefault = '#ff0000';
TextControl.BorderColorScaleDefault = 0.5;
TextControl.BorderColorOffsetDefault = 0.0;
TextControl.BorderThicknessDefault = 0.0;
TextControl.ShadowColorDefault = '#222222';
TextControl.ShadowOpacityDefault = 0.0;
TextControl.ShadowBlurDefault = 0.25;
TextControl.ShadowOffsetXDefault = 0.0;
TextControl.ShadowOffsetYDefault = 0.0;
TextControl.InnerShadowColorDefault = '#222222';
TextControl.InnerShadowOpacityDefault = 0.0;
TextControl.InnerShadowBlurDefault = 0.25;
TextControl.InnerShadowOffsetXDefault = 0.0;
TextControl.InnerShadowOffsetYDefault = 0.0;
TextControl.BevelLightDirDefault = [0, -1];
TextControl.BevelOpacityDefault = 0.0;
TextControl.BevelBlurDefault = 0.0;
TextControl.BevelThicknessDefault = 0.2;
//# sourceMappingURL=text.js.map