#!/usr/bin/env node
/**
 * Verifica il disallineamento tra i CSV sorgenti e i JSON ricostruiti.
 * Controlla:
 *  - TGP_5-sviluppo_abilita_adolescenza-v2.csv  ↔  TGP-5-sviluppo_abilita_adolescenza.json
 *  - TB_6-professioni_bonus_abilita-3.csv         ↔  TB-6-professioni_bonus_abilita-3.json
 */

const fs = require('fs');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(filePath, separator = ',') {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0].split(separator).map(h => h.trim());
  return lines.slice(1).map(line => {
    // naive split that ignores quoted commas (good enough for these files)
    const cells = line.split(separator).map(c => c.replace(/^"|"$/g, '').trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ''; });
    return obj;
  });
}

const ROOT = path.resolve(__dirname, '..');
const DATA_CSV = path.join(ROOT, 'data');
const DATA_JSON = path.join(ROOT, 'src', 'data');

let errors = [];
let warnings = [];

// ── 1. TGP-5 ─────────────────────────────────────────────────────────────────

const TGP5_CSV = path.join(DATA_CSV, 'TGP_5-sviluppo_abilita_adolescenza-v2.csv');
const TGP5_JSON = path.join(DATA_JSON, 'TGP-5-sviluppo_abilita_adolescenza.json');

const tgp5Json = JSON.parse(fs.readFileSync(TGP5_JSON, 'utf8'));

// Population column → JSON id_popolo mapping (same order as CSV header)
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

// Skill name → JSON id_abilita mapping
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
  'Muov. Silenz. / Nasc.':     'nascondersi',   // includes stalking too — see below
  'Scassinare':                'scassinare',
  'Disattivare Trappole':      'disarmare_trappole',
  'Lettura Rune':              'leggere_runes',
  'Uso di Oggetti Magici':     'usare_oggetti',
  'Resistenza Fisica':         'sviluppo_fisico',
  'Percezione':                'percezione',
};

// Skills to skip (not primary development skills)
const SKIP_ABILITA = new Set([
  '% Probabilità di Imparare una Lista di Incantesimi',
  'Punti Lingue Addizionali',
  'Punti Background ',
  'Punti Background',
]);

const tgp5Rows = parseCSV(TGP5_CSV);
const popoliCols = Object.keys(POPOLO_MAP);

tgp5Rows.forEach(row => {
  const abilita = row['abilità'] || row['abilit&#224;'] || row['abilit\u00e0'];
  if (!abilita || SKIP_ABILITA.has(abilita.trim())) return;

  const abilitaTrimmed = abilita.trim();
  const jsonAbilitaId = ABILITA_MAP[abilitaTrimmed];
  if (!jsonAbilitaId) {
    warnings.push(`[TGP-5] Abilità CSV non mappata: "${abilitaTrimmed}"`);
    return;
  }

  popoliCols.forEach(popColName => {
    const jsonPopoloId = POPOLO_MAP[popColName];
    const csvVal = parseInt(row[popColName] || '0', 10);

    const jsonEntry = tgp5Json.find(e => e.id_popolo === jsonPopoloId && e.id_abilita === jsonAbilitaId);
    const jsonVal = jsonEntry ? jsonEntry.gradi : 0;

    if (csvVal !== jsonVal) {
      errors.push(`[TGP-5] DISALLINEAMENTO: popolo="${jsonPopoloId}" abilità="${jsonAbilitaId}" | CSV=${csvVal} | JSON=${jsonVal}`);
    }
  });
});

// ── 2. TB-6 ──────────────────────────────────────────────────────────────────

const TB6_CSV = path.join(DATA_CSV, 'TB_6-professioni_bonus_abilita-3.csv');
const TB6_JSON = path.join(DATA_JSON, 'TB-6-professioni_bonus_abilita-3.json');

const tb6Json = JSON.parse(fs.readFileSync(TB6_JSON, 'utf8'));
const tb6Rows = parseCSV(TB6_CSV, ';');

const TB6_SKILLS = [
  'resistenza fisica', 'abilità armi', 'abilità generiche',
  'abilità sotterfugio', 'abilità magiche', 'lettura rune',
  'uso oggetti magici', 'incantesimi diretti', 'incantesimi base', 'percezione',
];

tb6Rows.forEach(row => {
  const profCsv = (row['professione'] || '').trim();
  const jsonEntry = tb6Json.find(e => e.professione.toLowerCase() === profCsv.toLowerCase());

  if (!jsonEntry) {
    errors.push(`[TB-6] Professione in CSV non trovata in JSON: "${profCsv}"`);
    return;
  }

  TB6_SKILLS.forEach(skill => {
    const csvRaw = row[skill] !== undefined ? row[skill] : row[skill.replace('à', 'à')];
    const csvVal = parseInt(csvRaw || '0', 10);
    const jsonRaw = jsonEntry[skill];
    const jsonVal = typeof jsonRaw === 'string' ? parseInt(jsonRaw.replace('+',''), 10) : (typeof jsonRaw === 'number' ? jsonRaw : 0);

    if (csvVal !== jsonVal) {
      errors.push(`[TB-6] DISALLINEAMENTO: professione="${profCsv}" skill="${skill}" | CSV=${csvVal} | JSON=${jsonVal}`);
    }
  });

  // Controlla anche liste incantesimi e limite
  const csvListe = (row['liste incantesimi'] || '').trim();
  const jsonListe = (jsonEntry['liste incantesimi'] || '').trim();
  if (csvListe !== jsonListe) {
    errors.push(`[TB-6] liste incantesimi: professione="${profCsv}" | CSV="${csvListe}" | JSON="${jsonListe}"`);
  }

  const csvLimite = (row['limite incantesimi'] || '').trim();
  const jsonLimite = (jsonEntry['limite incantesimi'] || '').trim();
  if (csvLimite !== jsonLimite) {
    errors.push(`[TB-6] limite incantesimi: professione="${profCsv}" | CSV="${csvLimite}" | JSON="${jsonLimite}"`);
  }
});

// ── 3. profession_level_bonuses.json vs TB-6 CSV ─────────────────────────────
// Questo JSON denormalizzato viene usato in getSpecificTb6Ranks e getTb6PoolSize.
// Verifica che i valori coincidano con TB-6.

const PLB_JSON = path.join(DATA_JSON, 'profession_level_bonuses.json');
const plbJson = JSON.parse(fs.readFileSync(PLB_JSON, 'utf8'));

const PLB_SKILL_MAP = {
  'resistenza_fisica':    'resistenza fisica',
  'abilita_armi':         'abilità armi',
  'abilita_generiche':    'abilità generiche',
  'abilita_sotterfugio':  'abilità sotterfugio',
  'abilita_magiche':      'abilità magiche',
  'lettura_runes':        'lettura rune',
  'uso_oggetti_magici':   'uso oggetti magici',
  'incantesimi_diretti':  'incantesimi diretti',
  'incantesimi_base':     'incantesimi base',
  'percezione':           'percezione',
};

const PLB_PROF_MAP = {
  'guerriero': 'Guerriero',
  'scout': 'Scout',
  'ranger': 'Ranger',
  'bardo': 'Bardo',
  'mago': 'Mago',
  'animista': 'Animista',
};

plbJson.forEach(entry => {
  const tb6SkillName = PLB_SKILL_MAP[entry.skill_id];
  if (!tb6SkillName) {
    // skill_id not in PLB_SKILL_MAP means it's a TGP-4 category pool entry, skip
    return;
  }
  const profName = PLB_PROF_MAP[entry.profession_id];
  if (!profName) {
    warnings.push(`[PLB] profession_id sconosciuto: "${entry.profession_id}"`);
    return;
  }
  const tb6Row = tb6Rows.find(r => r['professione'].trim().toLowerCase() === profName.toLowerCase());
  if (!tb6Row) {
    errors.push(`[PLB] Professione non trovata nel CSV TB-6: "${profName}"`);
    return;
  }
  const csvVal = parseInt(tb6Row[tb6SkillName] || '0', 10);
  if (csvVal !== entry.bonus) {
    errors.push(`[PLB] DISALLINEAMENTO: profession="${entry.profession_id}" skill="${entry.skill_id}" | TB-6 CSV=${csvVal} | profession_level_bonuses.json=${entry.bonus}`);
  }
});

// Verifica che PLB non abbia voci abilità con bonus > 0 mancanti rispetto a TB-6
tb6Rows.forEach(row => {
  const profId = row['professione'].trim().toLowerCase();
  Object.entries(PLB_SKILL_MAP).forEach(([plbSkillId, tb6SkillName]) => {
    const csvVal = parseInt(row[tb6SkillName] || '0', 10);
    if (csvVal > 0) {
      const found = plbJson.find(e => e.profession_id === profId && e.skill_id === plbSkillId);
      if (!found) {
        errors.push(`[PLB] VOCE MANCANTE: profession_level_bonuses.json non ha entry per profession="${profId}" skill="${plbSkillId}" (CSV TB-6 vale ${csvVal})`);
      }
    }
  });
});

// ── Report ────────────────────────────────────────────────────────────────────

console.log('\n=== VERIFICA ALLINEAMENTO CSV ↔ JSON ===\n');

if (warnings.length) {
  console.log(`⚠️  AVVISI (${warnings.length}):`);
  warnings.forEach(w => console.log('  ' + w));
  console.log();
}

if (errors.length === 0) {
  console.log('✅ Nessun disallineamento trovato.');
} else {
  console.log(`❌ DISALLINEAMENTI TROVATI (${errors.length}):`);
  errors.forEach(e => console.log('  ' + e));
}

console.log('\nDone.\n');
