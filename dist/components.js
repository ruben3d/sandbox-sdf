export function setupMenuTabs() {
    const tabs = document.querySelectorAll('aside > ul > li');
    const panels = document.querySelectorAll('aside > section');
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tabs[index].classList.add('active');
            panels[index].classList.add('active');
        });
    });
}
export class Component {
    constructor(dom) {
        this.children = [];
        this.dom = dom;
    }
    append(c) {
        this.dom.appendChild(c.dom);
        this.children.push(c);
    }
}
export class TextComponent extends Component {
    constructor(text) {
        const p = TextComponent.build(text);
        super(p);
        this.p = p;
    }
    static build(text) {
        const p = document.createElement('p');
        p.textContent = text;
        return p;
    }
    enable() {
    }
    disable() {
    }
    set(text) {
        this.p.textContent = text;
    }
}
export class InfoBoxComponent extends Component {
    constructor(text) {
        const p = InfoBoxComponent.build(text);
        super(p);
        this.p = p;
    }
    static build(text) {
        const p = document.createElement('p');
        p.classList.add('info');
        p.textContent = text;
        return p;
    }
    enable() {
    }
    disable() {
    }
    set(text) {
        this.p.textContent = text;
    }
}
export class ButtonComponent extends Component {
    constructor(label, fn) {
        const [container, button] = ButtonComponent.build(label, fn);
        super(container);
        this.fn = fn;
        this.button = button;
    }
    static build(labelText, fn) {
        const button = document.createElement('button');
        button.textContent = labelText;
        button.addEventListener('click', fn);
        return [button, button];
    }
    enable() {
    }
    disable() {
    }
}
export class RangeInputComponent extends Component {
    constructor(label, defaultValue, initialValue, min, max, step, fn) {
        const [container, input] = RangeInputComponent.build(label, initialValue, min, max, step, fn);
        super(container);
        this.defaultValue = defaultValue;
        this.fn = fn;
        this.input = input;
    }
    static build(labelText, initialValue, min, max, step, fn) {
        const [strDefault, strMin, strMax, strStep] = [initialValue, min, max, step].map(v => v.toString());
        const container = document.createElement('div');
        container.classList.add('input');
        container.classList.add('range');
        const label = document.createElement('label');
        label.textContent = labelText ? labelText + ': ' : labelText;
        const inputRange = document.createElement('input');
        inputRange.type = 'range';
        inputRange.min = strMin;
        inputRange.max = strMax;
        inputRange.step = strStep;
        inputRange.value = strDefault;
        const inputNumber = document.createElement('input');
        inputNumber.type = 'number';
        inputNumber.min = strMin;
        inputNumber.max = strMax;
        inputNumber.step = strStep;
        inputNumber.value = strDefault;
        container.appendChild(label);
        container.appendChild(inputRange);
        container.appendChild(document.createTextNode(' '));
        container.appendChild(inputNumber);
        const inputAction = () => {
            inputRange.value = inputNumber.value.charAt(0) === '.' ? '0' + inputNumber.value : inputNumber.value;
            inputNumber.value = inputRange.value;
            inputRange.dispatchEvent(new Event('input'));
        };
        inputRange.addEventListener('input', () => inputNumber.value = inputRange.value);
        inputNumber.addEventListener('blur', inputAction);
        inputNumber.addEventListener('keyup', e => {
            if (e.key === 'Enter' || e.code === 'Enter') {
                inputAction();
                inputNumber.select();
            }
        });
        inputNumber.addEventListener('click', () => inputNumber.select());
        inputRange.addEventListener('input', () => fn(parseFloat(inputRange.value)));
        return [container, inputRange];
    }
    enable() {
        this.fn(parseFloat(this.input.value));
    }
    disable() {
        this.fn(this.defaultValue);
    }
}
export class ColorInputComponent extends Component {
    constructor(label, defaultValue, initialValue, fn) {
        const [container, input] = ColorInputComponent.build(label, initialValue, fn);
        super(container);
        this.defaultValue = defaultValue;
        this.fn = fn;
        this.input = input;
    }
    static build(labelText, initialValue, fn) {
        const container = document.createElement('div');
        container.classList.add('input');
        container.classList.add('color');
        const label = document.createElement('label');
        label.textContent = labelText ? labelText + ': ' : labelText;
        const inputText = document.createElement('input');
        inputText.type = 'text';
        inputText.placeholder = 'e.g. #347856';
        inputText.value = initialValue;
        const inputColor = document.createElement('input');
        inputColor.type = 'color';
        inputColor.value = initialValue;
        container.appendChild(label);
        container.appendChild(inputText);
        container.appendChild(document.createTextNode(' '));
        container.appendChild(inputColor);
        const inputAction = () => {
            inputColor.value = inputText.value;
            inputText.value = inputColor.value;
            inputColor.dispatchEvent(new Event('input'));
        };
        inputColor.addEventListener('input', () => inputText.value = inputColor.value);
        inputText.addEventListener('blur', inputAction);
        inputText.addEventListener('keyup', e => {
            if (e.key === 'Enter' || e.code === 'Enter') {
                inputAction();
                inputText.select();
            }
        });
        inputText.addEventListener('click', () => inputText.select());
        inputColor.addEventListener('input', () => fn(inputColor.value));
        return [container, inputColor];
    }
    enable() {
        this.fn(this.input.value);
    }
    disable() {
        this.fn(this.defaultValue);
    }
}
export class TextInputComponent extends Component {
    constructor(label, defaultValue, initialValue, fn) {
        const [container, input] = TextInputComponent.build(label, initialValue, fn);
        super(container);
        this.defaultValue = defaultValue;
        this.fn = fn;
        this.input = input;
    }
    static build(labelText, initialValue, fn) {
        const container = document.createElement('div');
        container.classList.add('input');
        container.classList.add('text');
        const label = document.createElement('label');
        label.textContent = labelText ? labelText + ': ' : labelText;
        const inputText = document.createElement('input');
        inputText.type = 'text';
        inputText.value = initialValue;
        container.appendChild(label);
        container.appendChild(inputText);
        inputText.addEventListener('input', () => fn(inputText.value));
        inputText.addEventListener('click', () => inputText.select());
        return [container, inputText];
    }
    enable() {
        this.fn(this.input.value);
    }
    disable() {
        this.fn(this.defaultValue);
    }
}
export class DropdownInputComponent extends Component {
    constructor(label, options, fn, inline) {
        const [container, input] = DropdownInputComponent.build(label, options, fn, inline || false);
        super(container);
        this.options = options;
        this.fn = fn;
        this.select = input;
    }
    static build(labelText, options, fn, inline) {
        const container = document.createElement('div');
        container.classList.add('input');
        container.classList.add('dropdown');
        if (inline) {
            container.classList.add('inline');
        }
        if (labelText !== undefined) {
            const label = document.createElement('label');
            label.textContent = labelText ? labelText + ': ' : labelText;
            container.appendChild(label);
        }
        const select = document.createElement('select');
        options.forEach(o => {
            const option = document.createElement('option');
            option.value = o[0];
            option.text = o[1];
            select.appendChild(option);
        });
        container.appendChild(select);
        select.addEventListener('input', () => fn(select.value));
        return [container, select];
    }
    enable() {
    }
    disable() {
    }
    set(value) {
        if (this.options.some(([key, _]) => key === value)) {
            this.select.value = value;
            this.select.dispatchEvent(new Event('input'));
        }
    }
}
export class FontInputComponent extends Component {
    constructor(label, fonts, fn) {
        const dropDown = new DropdownInputComponent(label, fonts, fn);
        super(dropDown.dom);
        this.fn = fn;
        this.dropDown = dropDown;
        const options = dropDown.dom.querySelectorAll(':scope option');
        options.forEach(option => {
            option.style.fontFamily = option.value;
            option.style.fontSize = '1.5em';
        });
    }
    enable() {
        this.dropDown.enable();
    }
    disable() {
        this.dropDown.disable();
    }
    set(font) {
        this.dropDown.set(font);
    }
}
export class FieldSetComponent extends Component {
    constructor(legend) {
        super(FieldSetComponent.build(legend));
    }
    static build(text) {
        const fs = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = text;
        fs.appendChild(legend);
        return fs;
    }
    enable() {
        this.children.forEach(c => c.enable());
    }
    disable() {
        this.children.forEach(c => c.disable());
    }
}
export class FieldSetToggleComponent extends Component {
    constructor(legend) {
        const [container, input] = FieldSetToggleComponent.build(legend);
        super(container);
        this.enabled = false;
        input.addEventListener('change', () => {
            this.enabled = input.checked;
            if (this.enabled) {
                this.children.forEach(c => c.enable());
            }
            else {
                this.children.forEach(c => c.disable());
            }
        });
        this.input = input;
    }
    static build(text) {
        const fs = document.createElement('fieldset');
        fs.disabled = true;
        const legend = document.createElement('legend');
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        const labelText = document.createTextNode(' ' + text);
        label.appendChild(input);
        label.appendChild(labelText);
        legend.appendChild(label);
        fs.appendChild(legend);
        input.addEventListener('change', () => fs.disabled = !input.checked);
        return [fs, input];
    }
    enable() {
        if (!this.enabled && this.input.checked) {
            this.enabled = true;
            this.children.forEach(c => c.enable());
        }
    }
    disable() {
        if (this.enabled) {
            this.enabled = false;
            this.children.forEach(c => c.disable());
        }
    }
}
export class FieldSetDropdownComponent extends Component {
    constructor(legend, fn) {
        const [container, select] = FieldSetDropdownComponent.build(legend, fn);
        super(container);
        this.panels = [];
        this.index = 0;
        select.addEventListener('change', () => {
            this.panels[this.index].forEach(c => c.disable());
            this.index = parseInt(select.value);
            this.panels[this.index].forEach(c => c.enable());
        });
    }
    static build(text, fn) {
        const fs = document.createElement('fieldset');
        const legend = document.createElement('legend');
        const label = document.createElement('label');
        const select = document.createElement('select');
        const labelText = document.createTextNode(text + ':');
        label.appendChild(labelText);
        label.appendChild(select);
        legend.appendChild(label);
        fs.appendChild(legend);
        select.addEventListener('change', () => {
            const panels = fs.querySelectorAll(':scope > div.select-panel');
            panels.forEach(p => p.classList.remove('active'));
            const index = parseInt(select.value);
            panels[index].classList.add('active');
            if (fn) {
                fn(index);
            }
        });
        return [fs, select];
    }
    addOption(text, ...components) {
        const select = this.dom.querySelector(':scope > legend > label > select');
        if (!select) {
            console.error('Select missing!');
            return;
        }
        const index = select.childNodes.length || 0;
        this.panels.push(components);
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = text;
        select.appendChild(option);
        const container = document.createElement('div');
        container.classList.add('select-panel');
        if (index === 0) {
            container.classList.add('active');
        }
        components.forEach(c => container.appendChild(c.dom));
        this.dom.appendChild(container);
    }
    enable() {
        this.panels[this.index].forEach(c => c.enable());
    }
    disable() {
        this.panels[this.index].forEach(c => c.disable());
    }
}
//# sourceMappingURL=components.js.map