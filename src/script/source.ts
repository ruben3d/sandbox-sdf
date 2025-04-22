
export interface TextDataSourceSettings {
    width: number;
    height: number;
    text: string;
    font: string;
    weight: number;
    scale: number;
}

export class TextImageSource {
    private canvas: OffscreenCanvas;
    private context: OffscreenCanvasRenderingContext2D;

    constructor(private settings: TextDataSourceSettings) {
        this.canvas = new OffscreenCanvas(settings.width, settings.height);
        this.context = this.canvas.getContext('2d', { willReadFrequently: true })!; // TODO: Performance with and without the flag
    }

    generate(settings?: TextDataSourceSettings): ImageData {
        const cfg = settings || this.settings;
        this.canvas.width = cfg.width;
        this.canvas.height = cfg.height;

        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, cfg.width, cfg.height);
        this.context.fillStyle = 'white';
        this.context.font = `${cfg.weight} ${cfg.height / 2}px ${cfg.font}`;
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fontKerning = 'normal';
        this.context.fillText(cfg.text, cfg.width / 2, cfg.height / 2);

        return this.context.getImageData(0, 0, cfg.width, cfg.height);
    }
}
