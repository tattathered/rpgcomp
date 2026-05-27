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
    
    if (baseName === 'Tabella-abilita_primarie') {
      parsed.data = parsed.data.map(row => {
        if (row) {
          row.nome = row.nome_abilita_primaria;
          row.categoria = row.categoria_abilita_primaria;
          row.tipo = row.tipo_abilita_primaria;
          row['valore iniziale'] = row.abilita_primaria_bonus_valore_iniziale;
          row.calcolo = row.abilita_primaria_bonus_calcolo;
        }
        return row;
      });
    } else if (baseName === 'Tabella-abilita_secondarie') {
      parsed.data = parsed.data.map(row => {
        if (row) {
          row.abilita_secondaria = row.nome_abilita_secondaria;
          row.caratteristica_associata = row.caratteristica_abilita_secondaria;
          row.descrizione = row.abilita_secondaria_descrizione;
          row.categoria = row.categoria_abilita_secondaria;
          row.tipo = row.tipo_abilita_secondaria;
        }
        return row;
      });
    }

    const outPath = path.join(outputDir, `${baseName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(parsed.data, null, 2), 'utf8');
    console.log(`Converted ${file} to ${baseName}.json`);
  }
});
