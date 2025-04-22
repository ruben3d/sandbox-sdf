import { BoxDistanceSampler, CircleDistanceSampler, ImageDistanceSampler, SDFGenerator } from "./sdf.js";
import { TextImageSource } from "./source.js";
export var SDFSource;
(function (SDFSource) {
    SDFSource[SDFSource["TEXT"] = 0] = "TEXT";
    SDFSource[SDFSource["CIRCLE"] = 1] = "CIRCLE";
    SDFSource[SDFSource["BOX"] = 2] = "BOX";
})(SDFSource || (SDFSource = {}));
export class InputControl {
    constructor(sdfSettings, circleSamplerSettings, boxSamplerSettings, imageSamplerSettings, textSettings, sourceCanvasId, sdfCanvasId) {
        this.sdfSettings = sdfSettings;
        this.circleSamplerSettings = circleSamplerSettings;
        this.boxSamplerSettings = boxSamplerSettings;
        this.imageSamplerSettings = imageSamplerSettings;
        this.textSettings = textSettings;
        this.sdfSource = SDFSource.TEXT;
        this.sdfGenerator = new SDFGenerator(sdfSettings);
        this.textSource = new TextImageSource(textSettings);
        this.sourceCtx = this.getContext(sourceCanvasId, textSettings.width, textSettings.height);
        this.sdfCtx = this.getContext(sdfCanvasId, sdfSettings.width, sdfSettings.height);
    }
    getContext(id, width, height) {
        const canvas = document.getElementById(id);
        if (!(canvas instanceof HTMLCanvasElement))
            throw Error(id);
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: false });
        if (!(context instanceof CanvasRenderingContext2D))
            throw Error('Wrong element type');
        return context;
    }
    generateSDF() {
        const sdf = this.sdfSource == SDFSource.TEXT ? this.textSDF() :
            this.sdfSource == SDFSource.CIRCLE ? this.circleSDF() :
                this.sdfSource == SDFSource.BOX ? this.boxSDF() :
                    this.circleSDF();
        this.sdfCtx.canvas.width = this.sdfSettings.width;
        this.sdfCtx.canvas.height = this.sdfSettings.height;
        this.sdfCtx.putImageData(sdf, 0, 0);
        return sdf;
    }
    textSDF() {
        const source = this.textSource.generate(this.textSettings);
        this.sourceCtx.canvas.width = this.textSettings.width;
        this.sourceCtx.canvas.height = this.textSettings.height;
        this.sourceCtx.putImageData(source, 0, 0);
        const imageSampler = new ImageDistanceSampler(source, this.imageSamplerSettings);
        return this.sdfGenerator.generate(imageSampler, this.sdfSettings);
    }
    circleSDF() {
        this.sourceCtx.canvas.width = 0;
        this.sourceCtx.canvas.height = 0;
        const circle = new CircleDistanceSampler(this.circleSamplerSettings);
        return this.sdfGenerator.generate(circle, this.sdfSettings);
    }
    boxSDF() {
        this.sourceCtx.canvas.width = 0;
        this.sourceCtx.canvas.height = 0;
        const box = new BoxDistanceSampler(this.boxSamplerSettings);
        return this.sdfGenerator.generate(box, this.sdfSettings);
    }
}
//# sourceMappingURL=control.js.map