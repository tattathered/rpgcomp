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

const IGNORED_CSVS = new Set([
  'TB_4.1-avanzamento_abilita',
  'TB_4.2-sviluppo_bonus_professione',
  'TS_1-lingue_della_terra_di_mezzo-v2'
]);

fs.readdirSync(dataDir).forEach(file => {
  if (path.extname(file) === '.csv') {
    const baseName = path.basename(file, '.csv');
    if (IGNORED_CSVS.has(baseName)) {
      console.log(`Skipping legacy file ${file}`);
      return;
    }
    
    const csvContent = fs.readFileSync(path.join(dataDir, file), 'utf8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
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
    } else if (baseName === 'TGP-5-sviluppo_abilita_adolescenza') {
      const POPOLO_MAP = {
        'Nani':                            'nani',
        'Umli':                            'umli',
        'Elfi Noldor':                     'elfi_noldor',
        'Elfi Sindar':                     'elfi_sindar',
        'Elfi Silvani':                    'elfi_silvani',
        'Mezzelfi':                        'mezzelfi',
        'Hobbit':                          'hobbit',
        'Beorniani':                       'beorniani',
        'Númenóreani Neri':                'numenoreani_neri',
        'Corsari':                         'corsari',
        'Dorwinrim':                       'dorwinrim',
        'Dúnedain':                        'dunedain',
        'Dunlandiani':                     'dunlandiani',
        'Esterling':                       'esterling',
        'Haradrim':                        'haradrim',
        'Lossoth':                         'lossoth',
        'Uomini delle Città Rohirrim':     'uomini_citta_rohirrim',
        'Uomini delle Campagne Rohirrim':  'uomini_campagna_rohirrim',
        'Uomini delle Città Eriadoriani':  'uomini_citta_eriadoriani',
        'Uomini delle Campagne Eriadoriani':'uomini_campagna_eriadoriani',
        'Uomini delle Città Gondoriani':   'uomini_citta_gondoriani',
        'Uomini delle Campagne Gondoriani':'uomini_campagna_gondoriani',
        'Variag':                          'variag',
        'Uomini dei Boschi':               'uomini_dei_boschi',
        'Wose':                            'wose',
        'Orchetti':                        'orchi',
        'Uruk-hai':                        'uruk_hai',
        'Mezzorchi':                       'mezzorchi',
        'Troll':                           'troll',
        'Olog-hai':                        'olog_hai',
        'Mezzotroll':                      'mezzitroll',
      };

      const ABILITA_MAP = {
        'Nessuna Armatura':          'nessuna_armatura',
        'Cuoio Grezzo':              'cuoio_grezzo',
        'Cuoio Rinforzato':          'cuoio_rinforzato',
        'Cotta di Maglia':           'armatura_maglia',
        'Armi Da Taglio a 1 mano':   'taglio_una_mano',
        'Armi Contundenti a 1 mano': 'contundenti_una_mano',
        'Armi A 2 mani':             'armi_a_due_mani',
        'Armi Da Lancio':            'armi_da_lancio',
        'Armi Da Tiro':              'armi_da_tiro',
        'Armi con Asta':             'armi_con_asta',
        'Arrampicarsi':              'arrampicarsi',
        'Cavalcare':                 'cavalcare',
        'Nuotare':                   'nuotare',
        'Colpire alle spalle':       'imboscata',
        'Muov. Silenz. / Nasc.':     'nascondersi',
        'Scassinare':                'scassinare',
        'Disattivare Trappole':      'disarmare_trappole',
        'Lettura Rune':              'leggere_runes',
        'Uso di Oggetti Magici':     'usare_oggetti',
        'Resistenza Fisica':         'sviluppo_fisico',
        'Percezione':                'percezione',
      };

      const flatData = [];
      parsed.data.forEach(row => {
        const rawAbilita = row['abilità'] || row['abilit&#224;'] || row['abilit\u00e0'] || row['abilit\u00e0'] || row['categoria abilità'];
        if (!rawAbilita) return;
        const trimAbilita = String(rawAbilita).trim();
        const jsonAbilitaId = ABILITA_MAP[trimAbilita];
        if (!jsonAbilitaId) return;

        Object.keys(POPOLO_MAP).forEach(popName => {
          const jsonPopoloId = POPOLO_MAP[popName];
          const gradi = parseInt(row[popName] || '0', 10);
          flatData.push({
            id_popolo: jsonPopoloId,
            id_abilita: jsonAbilitaId,
            gradi: isNaN(gradi) ? 0 : gradi
          });
        });
      });
      parsed.data = flatData;
    }

    const outPath = path.join(outputDir, `${baseName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(parsed.data, null, 2), 'utf8');
    console.log(`Converted ${file} to ${baseName}.json`);
  }
});
