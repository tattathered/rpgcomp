import ta7 from '../data/TA-7-incantesimi-dardo.json';
import ta8 from '../data/TA-8-incantesimi_sfera.json';
import ta9 from '../data/TA-9-incantesimi_base.json';

// Helper per formattare i modificatori con il segno (+ o -)
export const fmt = (n) => (typeof n === 'number' ? (n >= 0 ? `+${n}` : `${n}`) : n);

// Parser per determinare se un tiro ricade in un range (es: "01-05" o "120")
export const isInRange = (roll, rangeStr) => {
  const cleanStr = String(rangeStr).trim();
  
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    const min = parseInt(parts[0].replace(/[^\d]/g, ''), 10);
    const max = parseInt(parts[1].replace(/[^\d]/g, ''), 10);
    return roll >= min && roll <= max;
  }
  
  const val = parseInt(cleanStr.replace(/[^\d]/g, ''), 10);
  if (!isNaN(val)) {
    return roll === val;
  }
  return false;
};

// Mappatura delle categorie di armatura per incantesimi d'attacco (TA-7 e TA-8)
export const ATTACK_ARMOR_MAP = {
  'nessuna': 'Nessuna Armatura',
  'cuoio_grezzo': 'Cuoio Grezzo',
  'cuoio_rinforzato': 'Cuoio Rinforzato',
  'maglia': 'Corazza di Maglie',
  'piastre': 'Corazza di Piastre'
};

// Mappatura delle categorie di armatura per incantesimi base (TA-9)
export const BASE_ARMOR_MAP = {
  'nessuna': 'Generale',
  'cuoio_grezzo': 'Armatura di cuoio',
  'cuoio_rinforzato': 'Armatura di cuoio',
  'maglia': 'Armatura di metallo',
  'piastre': 'Armatura di metallo'
};

// Mappatura dei regni magici per incantesimi base (TA-9)
export const REALM_MAP = {
  'essenza': 'Essenza',
  'flusso': 'Flusso',
  'mentalismo': 'Mentalismo'
};

/**
 * Risolve un attacco d'incantesimo (Dardo o Sfera)
 * @param {number} finalResult - Il tiro d100 modificato
 * @param {string} tableCode - 'TA-7' o 'TA-8'
 * @param {string} armorCategory - 'nessuna', 'cuoio_grezzo', ecc.
 * @returns {object|null} - L'esito estratto (PF e severità critico) o null
 */
export const resolveSpellAttack = (finalResult, tableCode, armorCategory) => {
  const tableData = tableCode === 'TA-7' ? ta7 : ta8;
  const colKey = ATTACK_ARMOR_MAP[armorCategory] || 'Nessuna Armatura';
  
  // Clamp finalResult to [1, maxTableValue]
  const maxVal = tableCode === 'TA-7' ? 150 : 100;
  const clampedResult = Math.max(1, Math.min(maxVal, finalResult));
  
  // Trova la riga corrispondente
  const record = tableData.find(r => {
    // Gestione differenze chiave del tiro nel CSV/JSON
    const resKey = String(r['Risultato del Tiro'] || r['risultato'] || '');
    return isInRange(clampedResult, resKey);
  });
  
  if (record) {
    const rawVal = String(record[colKey] || '').trim();
    return {
      range: String(record['Risultato del Tiro'] || ''),
      valore: rawVal
    };
  }
  return null;
};

/**
 * Risolve un incantesimo base (TA-9)
 * @param {number} finalResult - Il tiro d100 modificato
 * @param {string} realm - 'essenza', 'flusso', 'mentalismo'
 * @param {string} armorCategory - 'nessuna', 'cuoio_grezzo', ecc.
 * @returns {object|null} - L'esito estratto (modificatore TR o fallimento "F") o null
 */
export const resolveBaseSpell = (finalResult, realm, armorCategory) => {
  const colRealm = REALM_MAP[realm] || 'Essenza';
  const colArmor = BASE_ARMOR_MAP[armorCategory] || 'Generale';
  const colKey = `${colRealm} ${colArmor}`; // es. "Essenza Armatura di cuoio"
  
  // Clamp finalResult to [1, 100]
  const clampedResult = Math.max(1, Math.min(100, finalResult));
  
  // Trova la riga corrispondente
  const record = ta9.find(r => {
    const resKey = String(r['Risultato dei Dadi'] || r['risultato'] || '');
    return isInRange(clampedResult, resKey);
  });
  
  if (record) {
    const rawVal = String(record[colKey] || '').trim();
    return {
      range: String(record['Risultato dei Dadi'] || ''),
      valore: rawVal
    };
  }
  return null;
};
