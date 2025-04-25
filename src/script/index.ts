import { InputControl } from './control.js';
import { setupUI } from './interface.js';
import { Scene } from './scene.js';
import { BoxSamplerSettings, CircleSamplerSettings, ImageSamplerDistanceMethod, ImageSamplerSettings, SDFSettings } from './sdf.js';
import { TextDataSourceSettings } from './source.js';
import { TextControl } from './text.js';


const spread = 6; // Texels in the SDF
const sourceScale = 4;
const fieldSize = [512, 128];
const srcSize = [fieldSize[0] * sourceScale, fieldSize[1] * sourceScale];


function run() {
    // console.log(`window.navigator.hardwareConcurrency: ${window.navigator.hardwareConcurrency}`);
    // const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    // worker.onmessage = e => {
    //     console.log(`Received: ${e.data}`);
    // };
    // worker.postMessage('Ping?');


    const textSourceSettings: TextDataSourceSettings = {
        width: srcSize[0],
        height: srcSize[1],
        text: 'Aybg3iTpÑl1Á',
        font: 'system-ui, sans-serif',
        weight: 400,
        scale: sourceScale,
    };

    const imageSamplerSettings: ImageSamplerSettings = {
        distanceMethod: ImageSamplerDistanceMethod.LINEAR,
    }

    const circleSamplerSettings: CircleSamplerSettings = {
        thickness: 0.0,
        radius: 0.5,
    }

    const boxSamplerSettings: BoxSamplerSettings = {
        thickness: 0.0,
        halfWidth: 0.6,
        halfHeight: 0.4,
        topLeftRadius: 0.1,
        topRightRadius: 0.1,
        bottomLeftRadius: 0.1,
        bottomRightRadius: 0.05,
    }

    const sdfSettings: SDFSettings = {
        width: fieldSize[0],
        height: fieldSize[1],
        spread: spread,
    };

    const inputControl = new InputControl(sdfSettings, circleSamplerSettings, boxSamplerSettings, imageSamplerSettings, textSourceSettings, 'source', 'field');
    const sdf = inputControl.generateSDF();
    const textControl = new TextControl(sdf, sdfSettings);
    const scene = new Scene('output', textControl);
    setupUI(scene, textControl, inputControl);
}

window.addEventListener('load', run);
