import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readPdf(filePath) {
    const absolutePath = path.resolve(__dirname, filePath);
    const dataBuffer = fs.readFileSync(absolutePath);
    try {
        const data = await pdf(dataBuffer);
        console.log(`--- TEXT FOR ${path.basename(filePath)} ---`);
        console.log(data.text);
        console.log(`-------------------------------------------`);
    } catch (e) {
        console.error('Error reading PDF', e);
    }
}

async function main() {
    await readPdf('../docu/merp-char_sheet-v2-Anóriel-esempio.pdf');
    await readPdf('../docu/merp-char_sheet-v1-empty.pdf');
}

main();
