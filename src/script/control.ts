import { BoxDistanceSampler, BoxSamplerSettings, CircleDistanceSampler, CircleSamplerSettings, ImageDistanceSampler, ImageSamplerSettings, SDFGenerator, SDFSettings } from "./sdf.js";
import { TextDataSourceSettings, TextImageSource } from "./source.js";

export enum SDFSource {
    TEXT,
    CIRCLE,
    BOX,
}

export class InputControl {
    private sdfGenerator: SDFGenerator;
    private textSource: TextImageSource;
    private sourceCtx: CanvasRenderingContext2D;
    private sdfCtx: CanvasRenderingContext2D;

    public sdfSource: SDFSource = SDFSource.TEXT;

    constructor(public sdfSettings: SDFSettings,
        public circleSamplerSettings: CircleSamplerSettings,
        public boxSamplerSettings: BoxSamplerSettings,
        public imageSamplerSettings: ImageSamplerSettings,
        public textSettings: TextDataSourceSettings,
        sourceCanvasId: string, sdfCanvasId: string) {

        this.sdfGenerator = new SDFGenerator(sdfSettings);
        this.textSource = new TextImageSource(textSettings);
        this.sourceCtx = this.getContext(sourceCanvasId, textSettings.width, textSettings.height);
        this.sdfCtx = this.getContext(sdfCanvasId, sdfSettings.width, sdfSettings.height);
    }

    private getContext(id: string, width: number, height: number): CanvasRenderingContext2D {
        const canvas = document.getElementById(id);
        if (!(canvas instanceof HTMLCanvasElement)) throw Error(id);
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { alpha: false });
        if (!(context instanceof CanvasRenderingContext2D)) throw Error('Wrong element type');

        return context;
    }

    generateSDF() {
        const sdf = this.sdfSource == SDFSource.TEXT ? this.textSDF() : // TEXT
            this.sdfSource == SDFSource.CIRCLE ? this.circleSDF() : // CIRCLE
                this.sdfSource == SDFSource.BOX ? this.boxSDF() : // BOX
                    this.circleSDF()

        this.sdfCtx.canvas.width = this.sdfSettings.width;
        this.sdfCtx.canvas.height = this.sdfSettings.height;
        this.sdfCtx.putImageData(sdf, 0, 0);

        return sdf;
    }

    private textSDF(): ImageData {
        const source = this.textSource.generate(this.textSettings);
        this.sourceCtx.canvas.width = this.textSettings.width;
        this.sourceCtx.canvas.height = this.textSettings.height;
        this.sourceCtx.putImageData(source, 0, 0);

        const imageSampler = new ImageDistanceSampler(source, this.imageSamplerSettings);
        return this.sdfGenerator.generate(imageSampler, this.sdfSettings);
    }

    private circleSDF(): ImageData {
        this.sourceCtx.canvas.width = 0;
        this.sourceCtx.canvas.height = 0;

        const circle = new CircleDistanceSampler(this.circleSamplerSettings);
        return this.sdfGenerator.generate(circle, this.sdfSettings);
    }

    private boxSDF(): ImageData {
        this.sourceCtx.canvas.width = 0;
        this.sourceCtx.canvas.height = 0;

        const box = new BoxDistanceSampler(this.boxSamplerSettings);
        return this.sdfGenerator.generate(box, this.sdfSettings);
    }
}
