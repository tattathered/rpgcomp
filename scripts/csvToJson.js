import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const outputDir = path.join(__dirname, '../src/data');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(dataDir).forEach(file => {
  if (path.extname(file) === '.csv') {
    const csvContent = fs.readFileSync(path.join(dataDir, file), 'utf8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    const baseName = path.basename(file, '.csv');
    const outPath = path.join(outputDir, `${baseName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(parsed.data, null, 2), 'utf8');
    console.log(`Converted ${file} to ${baseName}.json`);
  }
});
