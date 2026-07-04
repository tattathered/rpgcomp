import attackTables from '../data/Tabelle-Attacco-TA-1_TA-2_TA-3_TA-4.json';
import ta5ZanneArtigli from '../data/TA-5-zanne_e_artigli.json';
import ta6ImmobilizzSbilanc from '../data/TA-6-immobilizzazione_sbilanciamento.json';
import animalAttackStats from '../data/TSC-2-statistiche_degli_animali.json';
import { resolveSpellAttack } from '../utils/spellHelpers';

/**
 * Helper functions per il CombatCalculator.
 */

export const WEAPON_SKILL_TO_TABLE = {
  'taglio a 1 mano': 'TA-1',
  'contundenti a 1 mano': 'TA-2',
  'a 2 mani': 'TA-3',
  'da tiro': 'TA-4',
  'con asta': 'TA-3',
  'da lancio': 'TA-1',
  'dardo': 'TA-7',
  'sfera': 'TA-8',
  'zanne_e_artigli': 'TA-5',
  'immobilizzazione_sbilanciamento': 'TA-6'
};

export const TABLE_NAMES = {
  'TA-1': 'Armi da Taglio a una Mano (TA-1)',
  'TA-2': 'Armi Contundenti a una Mano (TA-2)',
  'TA-3': 'Armi a Due Mani (TA-3)',
  'TA-4': 'Armi da Tiro (TA-4)',
  'TA-5': 'Zanne e Artigli (TA-5)',
  'TA-6': 'Immobilizzazione e Sbilanciamento (TA-6)',
  'TA-7': 'Incantesimi Dardo (TA-7)',
  'TA-8': 'Incantesimi Sfera (TA-8)'
};

export const ARMOR_COLUMNS = {
  'nessuna': 'nessuna_armatura',
  'cuoio_grezzo': 'cuoio_grezzo',
  'cuoio_rinforzato': 'cuoio_rinforzato',
  'maglia': 'corazza_di_maglie',
  'piastre': 'corazza_di_piastre'
};

export const ARMOR_DISPLAY = {
  'nessuna': 'Nessuna Armatura',
  'cuoio_grezzo': 'Cuoio Grezzo',
  'cuoio_rinforzato': 'Cuoio Rinforzato',
  'maglia': 'Corazza di Maglia',
  'piastre': 'Corazza di Piastre'
};

export const CRITICAL_MODIFIERS = {
  'A': -20,
  'B': -10,
  'C': 0,
  'D': 10,
  'E': 20,
  'T': -50
};

export const getSkillForWeapon = (item) => {
  const nome = (item.nome || '').toLowerCase();
  const note = (item.note || item.note_base || '').toLowerCase();

  if (nome.includes('dardo') || note.includes('dardo')) return 'dardo';
  if (nome.includes('sfera') || note.includes('sfera')) return 'sfera';
  if (note.includes('con asta') || nome.includes('lancia') || nome.includes('giavellotto')) return 'con asta';
  if (note.includes('2 mani') || note.includes('due mani') || nome.includes('a 2 mani') || nome.includes('a due mani')) return 'a 2 mani';
  if (note.includes('da tiro') || note.includes('tiro') || nome.includes('arco') || nome.includes('balestra') || nome.includes('fionda')) return 'da tiro';
  if (note.includes('lancio') || note.includes('da lancio') || nome.includes('bolas')) return 'da lancio';
  if (note.includes('contundente') || nome.includes('randello') || nome.includes('mazzafrusto') || nome.includes('rete') || nome.includes('martello')) return 'contundenti a 1 mano';
  return 'taglio a 1 mano';
};

export const getFumbleModifierForWeapon = (category, name) => {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (cat === 'da tiro' || cat === 'da lancio') {
    if (n.includes('balestra')) return 20;
    if (n.includes('arco lungo')) return 10;
    if (n.includes('arco composto')) return 0;
    if (n.includes('arco corto')) return -10;
    if (n.includes('fionda')) return -20;
    return 0;
  }
  if (cat === 'taglio a 1 mano') return -10;
  if (cat === 'contundenti a 1 mano') return -20;
  if (cat === 'con asta') return 10;
  if (cat === 'a 2 mani') return 0;
  return 0;
};

export const getCriticalTableForWeapon = (category, name) => {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (cat === 'dardo' || cat === 'sfera') {
    if (n.includes('fuoco') || n.includes('calore')) return 'TC-6';
    if (n.includes('ghiaccio') || n.includes('freddo')) return 'TC-7';
    if (n.includes('fulmine') || n.includes('elettricità') || n.includes('fulm')) return 'TC-8';
    if (n.includes('impatto') || n.includes('energia') || n.includes('acqua')) return 'TC-1';
    return 'TC-6';
  }
  if (cat === 'contundenti a 1 mano') return 'TC-1';
  if (cat === 'da tiro' || cat === 'da lancio') {
    if (n.includes('fionda') || n.includes('sasso') || n.includes('pietra') || n.includes('bolas')) {
      if (n.includes('bolas')) return 'TC-4';
      return 'TC-1';
    }
    return 'TC-3';
  }
  if (cat === 'con asta') {
    if (n.includes('ascia') || n.includes('alabarda')) return 'TC-2';
    return 'TC-3';
  }
  if (cat === 'a 2 mani') {
    if (n.includes('martello') || n.includes('mazza')) return 'TC-1';
    return 'TC-2';
  }
  if (n.includes('stocco') || n.includes('daga') || n.includes('pugnale')) return 'TC-3';
  return 'TC-2';
};

export const getCreatureSizeCap = (sizeStr) => {
  const norm = (sizeStr || '').toLowerCase().trim();
  if (norm.includes('piccolissimo') || norm === 'minuscolo') return 85;
  if (norm.includes('piccolo')) return 105;
  if (norm.includes('medio')) return 120;
  if (norm.includes('grande')) return 135;
  if (norm.includes('enorme')) return 150;
  return 150;
};

export const mapCreatureArmor = (armorStr) => {
  const norm = (armorStr || '').toLowerCase().trim();
  if (norm.includes('piastra') || norm.includes('piastre')) return 'piastre';
  if (norm.includes('maglia') || norm.includes('maglie')) return 'maglia';
  if (norm.includes('rinforzato') || norm.includes('rinforzata')) return 'cuoio_rinforzato';
  if (norm.includes('grezzo') || norm.includes('morbido') || norm.includes('morbida') || norm.includes('cuoio')) return 'cuoio_grezzo';
  return 'nessuna';
};

export const getCreatureAttackDetails = (attackString) => {
  if (!attackString) return null;
  const match = attackString.match(/\(([^)]+)\)/);
  if (!match) return null;
  const abbr = match[1].toLowerCase().trim();
  return animalAttackStats.find(s => {
    const sAbbr = (s["(Abbreviazione)"] || "").replace(/[()]/g, "").toLowerCase().trim();
    return sAbbr === abbr;
  }) || null;
};

export const mapCreatureCritToTable = (critStr) => {
  const norm = (critStr || '').trim().toUpperCase();
  if (norm.startsWith('IM')) return 'TC-1';
  if (norm.startsWith('TA')) return 'TC-2';
  if (norm.startsWith('PU')) return 'TC-3';
  if (norm.startsWith('PE')) return 'TC-4';
  if (norm.startsWith('PR')) return 'TC-5';
  return 'TC-2';
};

export const findRangeRow = (jsonList, rollResult) => {
  return jsonList.find(row => {
    const rawRange = row.risultato_del_tiro;
    if (!rawRange) return false;
    const cleanRange = rawRange.replace(/[a-zA-Z]/g, "").trim();
    const parts = cleanRange.split('-');
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10);
      const max = parseInt(parts[1], 10);
      return rollResult >= min && rollResult <= max;
    }
    const parsedVal = parseInt(cleanRange, 10);
    if (!isNaN(parsedVal)) return rollResult === parsedVal;
    return false;
  });
};

export const resolveTableValue = (tableCode, finalResult, defenderArmor) => {
  const armorColName = ARMOR_COLUMNS[defenderArmor] || 'nessuna_armatura';
  const isSpell = tableCode === 'TA-7' || tableCode === 'TA-8';
  const isCreatureTable = tableCode === 'TA-5' || tableCode === 'TA-6';

  if (isSpell) {
    const outcome = resolveSpellAttack(finalResult, tableCode, defenderArmor);
    return outcome ? String(outcome.valore).trim() : '0';
  }

  if (isCreatureTable) {
    const jsonList = tableCode === 'TA-5' ? ta5ZanneArtigli : ta6ImmobilizzSbilanc;
    const row = findRangeRow(jsonList, finalResult);
    return row ? String(row[armorColName] || '').trim() : null;
  }

  const row = attackTables.find(r => r.tabella === tableCode && r.risultato_del_tiro === finalResult);
  return row ? String(row[armorColName] || '').trim() : null;
};
