import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __scriptDir = path.dirname(__filename);
const projectRoot = path.resolve(__scriptDir, '..');

const filesToCopy = [
    {
        src: path.join(projectRoot, 'src', 'index.html'),
        dest: path.join(projectRoot, 'dist', 'index.html')
    },
    {
        src: path.join(projectRoot, 'node_modules', 'three', 'build', 'three.module.js'),
        dest: path.join(projectRoot, 'dist', 'three.module.js')
    },
    ,
    {
        src: path.join(projectRoot, 'node_modules', 'three', 'build', 'three.core.js'),
        dest: path.join(projectRoot, 'dist', 'three.core.js')
    }
];

function copyFile(source, destination) {
    const destDir = path.dirname(destination);

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(source, destination);
    console.log(`Copied ${source} -> ${destination}`);
}

filesToCopy.forEach(file => {
    copyFile(file.src, file.dest);
});