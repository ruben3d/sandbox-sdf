import { ButtonComponent, ColorInputComponent, Component, DropdownInputComponent, FieldSetComponent, FieldSetDropdownComponent, FieldSetToggleComponent, FontInputComponent, InfoBoxComponent, RangeInputComponent, setupMenuTabs, TextComponent, TextInputComponent } from './components.js';
import { InputControl, SDFSource } from './control.js';
import { Scene } from './scene.js';
import { ImageSamplerDistanceMethod } from './sdf.js';
import { TextControl } from './text.js';


export function setupUI(scene: Scene, textControl: TextControl, inputControl: InputControl) {
    setupMenuTabs();

    const tabs = document.querySelectorAll('aside section');
    const inputTab = tabs[0];
    const sceneTab = tabs[1];
    const stylesTab = tabs[2];

    createInputSettings(textControl, inputControl).forEach(c => inputTab.appendChild(c.dom));

    createSceneSettings(scene).forEach(c => sceneTab.appendChild(c.dom));

    const stylesBasicSettingsFS = createStylesBasicSettings(textControl);
    stylesTab.appendChild(stylesBasicSettingsFS.dom);

    const stylesStrokeSettingsFS = createStylesStrokeSettings(textControl);
    stylesTab.appendChild(stylesStrokeSettingsFS.dom);

    const stylesDropShadowFS = createStylesDropShadowSettings(textControl);
    stylesTab.appendChild(stylesDropShadowFS.dom);

    const stylesInnerShadowFS = createStylesInnerShadowSettings(textControl);
    stylesTab.appendChild(stylesInnerShadowFS.dom);

    const stylesBevelFS = createStylesBevelSettings(textControl);
    stylesTab.appendChild(stylesBevelFS.dom);
}

function createInputSettings(textControl: TextControl, inputControl: InputControl): Component[] {
    const result: Component[] = [];

    const generateText = new TextComponent('Create the Signed Distance Field texture used for rendering based on the settings below.');
    const generateButton = new ButtonComponent('Generate', () => {
        const sdf = inputControl.generateSDF();
        textControl.setSDF(sdf, inputControl.sdfSettings);
    });

    const generateFS = new FieldSetComponent('SDF Generation');
    generateFS.append(generateText);
    generateFS.append(generateButton);
    result.push(generateFS);


    // --------- Source-----------

    const inputSourceSettingsFS = new FieldSetDropdownComponent('Source', index => {
        inputControl.sdfSource = index as SDFSource;
    });


    // --------- Source - Text -----------

    const textInput = new TextInputComponent('Text', 'Aybg3iTpÑl1Á', 'Aybg3iTpÑl1Á',
        t => inputControl.textSettings.text = t);

    const fontInput = new FontInputComponent('Font family',
        [
            ['system-ui, sans-serif', 'System UI'],
            ['Charter, "Bitstream Charter", "Sitka Text", Cambria, serif', 'Transitional'],
            ['"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif', 'Old Style'],
            ['Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif', 'Humanist'],
            ['Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif', 'Geometric Humanist'],
            ['Optima, Candara, "Noto Sans", source-sans-pro, sans-serif', 'Classical Humanist'],
            ['Inter, Roboto, "Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif', 'Neo-Grotesque'],
            ['"Nimbus Mono PS", "Courier New", monospace', 'Monospace Slab Serif'],
            ['ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace', 'Monospace Code'],
            ['Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif', 'Industrial'],
            ['ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT", "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif', 'Rounded Sans'],
            ['Rockwell, "Rockwell Nova", "Roboto Slab", "DejaVu Serif", "Sitka Small", serif', 'Slab Serif'],
            ['Superclarendon, "Bookman Old Style", "URW Bookman", "URW Bookman L", "Georgia Pro", Georgia, serif', 'Antique'],
            ['Didot, "Bodoni MT", "Noto Serif Display", "URW Palladio L", P052, Sylfaen, serif', 'Didone'],
            ['"Segoe Print", "Bradley Hand", Chilanka, TSCu_Comic, casual, cursive', 'Handwritten'],
        ],
        option => inputControl.textSettings.font = option);

    const fontWeightInput = new DropdownInputComponent('Font weight',
        [
            ['100', '100'],
            ['200', '200'],
            ['300', '300'],
            ['400', '400'],
            ['500', '500'],
            ['600', '600'],
            ['700', '700'],
            ['800', '800'],
        ],
        option => inputControl.textSettings.weight = parseInt(option));
    fontWeightInput.set(inputControl.textSettings.weight.toString());

    const distanceMethodInput = new DropdownInputComponent('Distance method',
        [
            ['linear', 'Linear'],
            ['manhattan', 'Manhattan'],
        ],
        option => option === 'linear' ?
            inputControl.imageSamplerSettings.distanceMethod = ImageSamplerDistanceMethod.LINEAR :
            inputControl.imageSamplerSettings.distanceMethod = ImageSamplerDistanceMethod.MANHATTAN
    );

    const sourceSizeInfo = (width: number, height: number) => {
        return `Canvas size: ${width}x${height} 32bit ${width * height * 4 / 1024 / 1024}MB`;
    };
    const sourceSizeInfoComponent = new InfoBoxComponent(sourceSizeInfo(inputControl.textSettings.width, inputControl.textSettings.height));

    const sourceScaleInput = new DropdownInputComponent('Source scale',
        [
            ['2', '2'],
            ['4', '4'],
            ['8', '8'],
            ['16', '16'],
            ['32', '32'],
        ],
        option => {
            const scale = parseInt(option);
            inputControl.textSettings.scale = scale;
            inputControl.textSettings.width = inputControl.sdfSettings.width * scale;
            inputControl.textSettings.height = inputControl.sdfSettings.height * scale;
            sourceSizeInfoComponent.set(sourceSizeInfo(inputControl.textSettings.width, inputControl.textSettings.height));
        }
    );
    sourceScaleInput.set(inputControl.textSettings.scale.toString());

    inputSourceSettingsFS.addOption('Text', textInput, fontInput, fontWeightInput, distanceMethodInput, sourceScaleInput, sourceSizeInfoComponent);


    // --------- Source - Circle -----------

    const circleRadiusInput = new RangeInputComponent('Radius', 0.5, 0.5, 0.25, 0.75, 0.01,
        v => inputControl.circleSamplerSettings.radius = v);
    const circleContourThicknessInput = new RangeInputComponent('Thickness', 0.0, 0.15, 0.01, 0.5, 0.01,
        v => inputControl.circleSamplerSettings.thickness = v);
    const circleContourFS = new FieldSetToggleComponent('Contour');
    circleContourFS.append(circleContourThicknessInput)
    inputSourceSettingsFS.addOption('Circle', circleRadiusInput, circleContourFS);


    // --------- Source - Box -----------

    const boxWidthInput = new RangeInputComponent('Width', 0.6, 0.6, 0.1, 0.75, 0.01,
        v => inputControl.boxSamplerSettings.halfWidth = v);
    const boxHeightInput = new RangeInputComponent('Height', 0.4, 0.4, 0.1, 0.75, 0.01,
        v => inputControl.boxSamplerSettings.halfHeight = v);
    const boxTopLeftRadiusInput = new RangeInputComponent('Top left radius', 0.1, 0.1, 0.0, 0.5, 0.01,
        v => inputControl.boxSamplerSettings.topLeftRadius = v);
    const boxTopRightRadiusInput = new RangeInputComponent('Top right radius', 0.1, 0.1, 0.0, 0.5, 0.01,
        v => inputControl.boxSamplerSettings.topRightRadius = v);
    const boxBottomLeftRadiusInput = new RangeInputComponent('Bottom left radius', 0.1, 0.1, 0.0, 0.5, 0.01,
        v => inputControl.boxSamplerSettings.bottomLeftRadius = v);
    const boxBottomRighttRadiusInput = new RangeInputComponent('Bottom right radius', 0.1, 0.1, 0.0, 0.5, 0.01,
        v => inputControl.boxSamplerSettings.bottomRightRadius = v);
    const boxContourThicknessInput = new RangeInputComponent('Thickness', 0.0, 0.15, 0.01, 0.5, 0.01,
        v => inputControl.boxSamplerSettings.thickness = v);
    const boxContourFS = new FieldSetToggleComponent('Contour');
    boxContourFS.append(boxContourThicknessInput)
    inputSourceSettingsFS.addOption('Box',
        boxWidthInput, boxHeightInput, boxTopLeftRadiusInput, boxTopRightRadiusInput, boxBottomLeftRadiusInput, boxBottomRighttRadiusInput, boxContourFS);


    result.push(inputSourceSettingsFS);


    // --------- SDF Settings -----------

    const sdfSizeInfo = (width: number, height: number) => {
        return `GPU size: ${width}x${height} 8bit ${width * height / 1024 / 1024}MB`;
    };
    const sdfSizeInfoComponent = new InfoBoxComponent(sdfSizeInfo(inputControl.sdfSettings.width, inputControl.sdfSettings.height));

    const spreadInput = new RangeInputComponent('Spread', inputControl.sdfSettings.spread, inputControl.sdfSettings.spread, 2, 32, 1,
        v => inputControl.sdfSettings.spread = v);

    const sdfWidthInput = new DropdownInputComponent('SDF size',
        [
            ['16', '16'],
            ['32', '32'],
            ['64', '64'],
            ['128', '128'],
            ['256', '256'],
            ['512', '512'],
        ],
        option => {
            inputControl.sdfSettings.width = parseInt(option);
            inputControl.textSettings.width = inputControl.sdfSettings.width * inputControl.textSettings.scale;
            inputControl.textSettings.height = inputControl.sdfSettings.height * inputControl.textSettings.scale;
            sdfSizeInfoComponent.set(sdfSizeInfo(inputControl.sdfSettings.width, inputControl.sdfSettings.height));
            sourceSizeInfoComponent.set(sourceSizeInfo(inputControl.textSettings.width, inputControl.textSettings.height));
        },
        true
    );
    sdfWidthInput.set(inputControl.sdfSettings.width.toString());

    const sdfHeightInput = new DropdownInputComponent(undefined,
        [
            ['16', '16'],
            ['32', '32'],
            ['64', '64'],
            ['128', '128'],
            ['256', '256'],
            ['512', '512'],
        ],
        option => {
            inputControl.sdfSettings.height = parseInt(option);
            inputControl.textSettings.width = inputControl.sdfSettings.width * inputControl.textSettings.scale;
            inputControl.textSettings.height = inputControl.sdfSettings.height * inputControl.textSettings.scale;
            sdfSizeInfoComponent.set(sdfSizeInfo(inputControl.sdfSettings.width, inputControl.sdfSettings.height));
            sourceSizeInfoComponent.set(sourceSizeInfo(inputControl.textSettings.width, inputControl.textSettings.height));
        },
        true
    );
    sdfHeightInput.set(inputControl.sdfSettings.height.toString());

    const inputSDFSettingsFS = new FieldSetComponent('SDF settings');
    inputSDFSettingsFS.append(spreadInput);
    inputSDFSettingsFS.append(sdfWidthInput);
    inputSDFSettingsFS.append(sdfHeightInput);
    inputSDFSettingsFS.append(sdfSizeInfoComponent);
    result.push(inputSDFSettingsFS);

    return result;
}

function createSceneSettings(scene: Scene): Component[] {
    const result: Component[] = [];

    const backgroundInput = new ColorInputComponent('Background', '#000000', '#000000',
        c => scene.setBackground(c));

    const settingsFS = new FieldSetComponent('Settings');
    settingsFS.append(backgroundInput);
    result.push(settingsFS);

    const viewDistanceInput = new RangeInputComponent('Distance', 1.25, 1.25, 0.25, 20.0, 0.01,
        v => scene.setViewDistance(v));
    const viewXInput = new RangeInputComponent('Horizontal offset', 0.0, 0.0, -1.0, 1.0, 0.01,
        v => scene.setViewX(-v));
    const viewYInput = new RangeInputComponent('Vertical offset', 0.0, 0.0, -1.0, 1.0, 0.01,
        v => scene.setViewY(-v));

    const viewFS = new FieldSetComponent('View');
    viewFS.append(viewDistanceInput);
    viewFS.append(viewXInput);
    viewFS.append(viewYInput);
    result.push(viewFS);

    return result;
}

function createStylesBasicSettings(textControl: TextControl): Component {
    const fontWeightInput = new RangeInputComponent('Weight', TextControl.WeightDefault, TextControl.WeightDefault, 0.3, 0.6, 0.01,
        v => textControl.setWeight(v));
    const opacityInput = new RangeInputComponent('Opacity', TextControl.OpacityDefault, TextControl.OpacityDefault, 0.0, 1.0, 0.01,
        v => textControl.setOpacity(v));
    const blurInput = new RangeInputComponent('Blur', TextControl.BlurDefault * 2.0, TextControl.BlurDefault * 2.0, 0.0, 1.0, 0.01,
        v => textControl.setBlur(v));

    const fillColorInput = new ColorInputComponent('', TextControl.ColorDefault, TextControl.ColorDefault,
        c => {
            textControl.setColor(c);
            textControl.setColorB(c);
        });
    const fillGradientTopInput = new ColorInputComponent('Top', TextControl.ColorDefault, TextControl.ColorDefault,
        c => textControl.setColor(c));
    const fillGradientBottomInput = new ColorInputComponent('Bottom', TextControl.ColorBDefault, TextControl.ColorBDefault,
        c => textControl.setColorB(c));
    const fillGradientScaleInput = new RangeInputComponent('Scale', TextControl.ColorScaleDefault, TextControl.ColorScaleDefault, 0.0, 1.0, 0.01,
        v => textControl.setColorScale(v));
    const fillGradientOffsetInput = new RangeInputComponent('Offset', TextControl.ColorOffsetDefault, TextControl.ColorOffsetDefault, -0.5, 0.5, 0.01,
        v => textControl.setColorOffset(v));

    const fillFS = new FieldSetDropdownComponent('Fill');
    fillFS.addOption('Color', fillColorInput);
    fillFS.addOption('Gradient', fillGradientTopInput, fillGradientBottomInput, fillGradientScaleInput, fillGradientOffsetInput);

    const container = new FieldSetComponent('Basic settings');
    container.append(fontWeightInput);
    container.append(fillFS);
    container.append(opacityInput);
    container.append(blurInput);
    return container;
}

function createStylesStrokeSettings(textControl: TextControl): Component {

    const fillColorInput = new ColorInputComponent('', TextControl.BorderColorDefault, TextControl.BorderColorDefault,
        c => {
            textControl.setBorderColor(c);
            textControl.setBorderColorB(c);
        });
    const fillGradientTopInput = new ColorInputComponent('Top', TextControl.BorderColorDefault, TextControl.BorderColorDefault,
        c => textControl.setBorderColor(c));
    const fillGradientBottomInput = new ColorInputComponent('Bottom', TextControl.BorderColorBDefault, TextControl.BorderColorBDefault,
        c => textControl.setBorderColorB(c));
    const fillGradientScaleInput = new RangeInputComponent('Scale', TextControl.BorderColorScaleDefault, TextControl.BorderColorScaleDefault, 0.0, 1.0, 0.01,
        v => textControl.setBorderColorScale(v));
    const fillGradientOffsetInput = new RangeInputComponent('Offset', TextControl.BorderColorOffsetDefault, TextControl.BorderColorOffsetDefault, -0.5, 0.5, 0.01,
        v => textControl.setBorderColorOffset(v));

    const fillFS = new FieldSetDropdownComponent('Fill');
    fillFS.addOption('Color', fillColorInput);
    fillFS.addOption('Gradient', fillGradientTopInput, fillGradientBottomInput, fillGradientScaleInput, fillGradientOffsetInput);

    const thicknessInput = new RangeInputComponent('Thickness', TextControl.BorderThicknessDefault, TextControl.BorderThicknessDefault, -0.5, 0.5, 0.01,
        v => textControl.setBorderThickness(v));

    const container = new FieldSetToggleComponent('Stroke');
    container.append(fillFS);
    container.append(thicknessInput);
    return container;
}

function createStylesDropShadowSettings(textControl: TextControl): Component {
    const colorInput = new ColorInputComponent('Color', TextControl.ShadowColorDefault, TextControl.ShadowColorDefault,
        c => textControl.setShadowColor(c));
    const opacityInput = new RangeInputComponent('Opacity', TextControl.ShadowOpacityDefault, 0.5, 0.0, 1.0, 0.01,
        v => textControl.setShadowOpacity(v));
    const blurInput = new RangeInputComponent('Blur', TextControl.ShadowBlurDefault * 2.0, TextControl.ShadowBlurDefault * 2.0, 0.0, 1.0, 0.01,
        v => textControl.setShadowBlur(v));
    const horizontalOffsetInput = new RangeInputComponent('H. offset', TextControl.ShadowOffsetXDefault, TextControl.ShadowOffsetXDefault, -1.0, 1.0, 0.02,
        v => textControl.setShadowOffsetX(v));
    const verticalOffsetInput = new RangeInputComponent('V. offset', TextControl.ShadowOffsetYDefault, TextControl.ShadowOffsetYDefault, -1.0, 1.0, 0.02,
        v => textControl.setShadowOffsetY(v));

    const container = new FieldSetToggleComponent('Drop shadow');
    container.append(colorInput);
    container.append(opacityInput);
    container.append(blurInput);
    container.append(horizontalOffsetInput);
    container.append(verticalOffsetInput);
    return container;
}

function createStylesInnerShadowSettings(textControl: TextControl): Component {
    const colorInput = new ColorInputComponent('Color', TextControl.InnerShadowColorDefault, TextControl.InnerShadowColorDefault,
        c => textControl.setInnerShadowColor(c));
    const opacityInput = new RangeInputComponent('Opacity', TextControl.InnerShadowOpacityDefault, 0.5, 0.0, 1.0, 0.01,
        v => textControl.setInnerShadowOpacity(v));
    const blurInput = new RangeInputComponent('Blur', TextControl.InnerShadowBlurDefault * 2.0, TextControl.InnerShadowBlurDefault * 2.0, 0.0, 1.0, 0.01,
        v => textControl.setInnerShadowBlur(v));
    const horizontalOffsetInput = new RangeInputComponent('H. offset', TextControl.InnerShadowOffsetXDefault, TextControl.InnerShadowOffsetXDefault, -1.0, 1.0, 0.02,
        v => textControl.setInnerShadowOffsetX(v));
    const verticalOffsetInput = new RangeInputComponent('V. offset', TextControl.InnerShadowOffsetYDefault, TextControl.InnerShadowOffsetYDefault, -1.0, 1.0, 0.02,
        v => textControl.setInnerShadowOffsetY(v));

    const container = new FieldSetToggleComponent('Inner shadow');
    container.append(colorInput);
    container.append(opacityInput);
    container.append(blurInput);
    container.append(horizontalOffsetInput);
    container.append(verticalOffsetInput);
    return container;
}

function createStylesBevelSettings(textControl: TextControl): Component {
    const warning = new InfoBoxComponent('Experimental feature');

    const lightDirInput = new RangeInputComponent('Light direction', 0, 0, 0, 359, 1,
        v => textControl.setBevelLightDir(v));
    const opacityInput = new RangeInputComponent('Opacity', TextControl.BevelOpacityDefault, 0.5, 0.0, 1.0, 0.01,
        v => textControl.setBevelOpacity(v));
    const blurInput = new RangeInputComponent('Blur', TextControl.BevelBlurDefault * 2.0, TextControl.BevelBlurDefault * 2.0, 0.0, 1.0, 0.01,
        v => textControl.setBevelBlur(v));
    const thicknessInput = new RangeInputComponent('Thickness', TextControl.BevelThicknessDefault, 0.1, 0.0, 0.45, 0.01,
        v => textControl.setBevelThickness(v));

    const container = new FieldSetToggleComponent('Bevel');
    container.append(warning);
    container.append(lightDirInput);
    container.append(opacityInput);
    container.append(blurInput);
    container.append(thicknessInput);
    return container;
}
