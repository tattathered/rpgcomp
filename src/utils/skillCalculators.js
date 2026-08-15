import tb1 from '../data/TB-1-caratteristiche_bonus.json';
import penalitaCaricoData from '../data/TB-5-penalita_carico.json';
import raceAdSkillsData from '../data/TGP-5-sviluppo_abilita_adolescenza.json';
import professionDevelopmentCosts from '../data/TGP-4-sviluppo_abilita.json';
import professionLevelBonuses from '../data/profession_level_bonuses.json';
import { getRaceId, getProfessionId } from './skillLookup';

/**
 * Calcolatori di bonus, pool, gradi, HP, penalità.
 */

export const getBonus = (val) => {
  if (!val) return 0;
  const record = tb1.find(b => b.punteggio === parseInt(val));
  return record ? record.bonus : 0;
};

export const parseBonusValue = (val) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace('+', '').trim();
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const getRanksBonus = (skillName, ranks) => {
  const name = skillName.toLowerCase();
  if (name === 'cogliere alle spalle') {
    if (ranks === 0) return 0;
    if (ranks <= 10) return ranks * 5;
    if (ranks <= 20) return 50 + (ranks - 10) * 2;
    return 70 + (ranks - 20) * 1;
  }
  if (name === 'resistenza fisica') {
    if (ranks === 0) return 0;
    return `${ranks}d10`;
  }
  if (ranks === 0) return -25;
  if (ranks <= 10) return ranks * 5;
  if (ranks <= 20) return 50 + (ranks - 10) * 2;
  return 70 + (ranks - 20) * 1;
};

export const getIngombroBonus = (skillName) => {
  const name = skillName.toLowerCase();
  if (name === 'nessuna armatura') return 0;
  if (name === 'cuoio grezzo') return -15;
  if (name === 'cuoio rinforzato') return -30;
  if (name === 'corazza di maglia' || name === 'corazza di maglie') return -45;
  if (name === 'corazza di piastre') return -60;
  if (name === 'resistenza fisica') return 5;
  return null;
};

export const getSpecificTb6Ranks = (skillName, profession) => {
  if (!profession) return 0;
  const profId = getProfessionId(profession);
  if (!profId) return 0;

  const itSkillIdMap = {
    'resistenza fisica': 'resistenza_fisica',
    'percezione': 'percezione',
    'lettura rune': 'lettura_runes',
    'uso oggetti magici': 'uso_oggetti_magici',
    'incantesimi diretti': 'incantesimi_diretti',
    'incantesimi base': 'incantesimi_base',
  };
  const skillId = itSkillIdMap[skillName.toLowerCase().trim()];
  if (!skillId) return 0;

  const record = professionLevelBonuses.find(lb => lb.profession_id === profId && lb.skill_id === skillId);
  return record ? record.bonus : 0;
};

export const getTgp5AdolescenceRanks = (skillName, popolo) => {
  const raceId = getRaceId(popolo);
  if (!raceId) return 0;

  const itSkillMap = {
    'resistenza fisica': 'sviluppo_fisico',
    'corazza di maglia': 'armatura_maglia',
    'cotta di maglia': 'armatura_maglia',
    'taglio a 1 mano': 'taglio_una_mano',
    'armi da taglio a 1 mano': 'taglio_una_mano',
    'contundenti a 1 mano': 'contundenti_una_mano',
    'armi contundenti a 1 mano': 'contundenti_una_mano',
    'a 2 mani': 'armi_a_due_mani',
    'armi a 2 mani': 'armi_a_due_mani',
    'da tiro': 'armi_da_tiro',
    'armi da tiro': 'armi_da_tiro',
    'da lancio': 'armi_da_lancio',
    'armi da lancio': 'armi_da_lancio',
    'con asta': 'armi_con_asta',
    'armi con asta': 'armi_con_asta',
    'cogliere alle spalle': 'imboscata',
    'colpire alle spalle': 'imboscata',
    'nascondersi': 'nascondersi',
    'scassinare serrature': 'scassinare',
    'scassinare': 'scassinare',
    'disattivare trappole': 'disarmare_trappole',
    'uso oggetti magici': 'usare_oggetti',
    'uso di oggetti magici': 'usare_oggetti',
    'lettura rune': 'leggere_runes',
    'percezione': 'percezione',
    'nessuna armatura': 'nessuna_armatura',
    'cuoio grezzo': 'cuoio_grezzo',
    'cuoio rinforzato': 'cuoio_rinforzato',
    'nuotare': 'nuotare',
    'arrampicarsi': 'arrampicarsi',
    'cavalcare': 'cavalcare',
    'aggirare': 'aggirare',
  };

  const skillId = itSkillMap[skillName.toLowerCase().trim()];
  if (!skillId) return 0;

  const match = raceAdSkillsData.find(item => item.id_popolo === raceId && item.id_abilita === skillId);
  return match ? match.gradi : 0;
};

export const getTb6CategoryKey = (categoryName) => {
  const norm = categoryName.toLowerCase().trim();
  if (norm === 'con le armi' || norm === 'abilità con le armi') return 'abilità armi';
  if (norm === 'generali' || norm === 'abilità generali') return 'abilità generiche';
  if (norm === 'sotterfugio' || norm === 'abilità di sotterfugio') return 'abilità sotterfugio';
  if (norm === 'magiche' || norm === 'abilità magiche') return 'abilità magiche';
  return null;
};

export const getTb6PoolSize = (categoryName, profession) => {
  if (!profession) return 0;
  const profId = getProfessionId(profession);
  if (!profId) return 0;

  const normCat = categoryName.toLowerCase().trim();
  const mapping = {
    'di manovra e movimento': 'abilita_armi',
    'abilità di movimento e manovra': 'abilita_armi',
    'con le armi': 'abilita_armi',
    'abilità con le armi': 'abilita_armi',
    'generali': 'abilita_generiche',
    'abilità generali': 'abilita_generiche',
    'sotterfugio': 'abilita_sotterfugio',
    'abilità di sotterfugio': 'abilita_sotterfugio',
    'magiche': 'abilita_magiche',
    'abilità magiche': 'abilita_magiche'
  };
  const targetId = mapping[normCat] || normCat;

  const record = professionLevelBonuses.find(lb => lb.profession_id === profId && lb.skill_id === targetId);
  if (record) return record.bonus;

  if (typeof profession === 'object') {
    const key = getTb6CategoryKey(categoryName);
    if (key && profession[key] !== undefined) {
      return parseBonusValue(profession[key] || 0);
    }
  }
  return 0;
};

export const getTgp4CategoryKey = (categoryName, skillName) => {
  const normCat = categoryName?.toLowerCase().trim();
  const normSkill = skillName?.toLowerCase().trim();

  if (normSkill === 'resistenza fisica') return 'Resistenza fisica';
  if (normSkill === 'percezione') return 'Percezione';
  if (normSkill === 'incantesimi base') return 'Abilità magiche';
  if (normCat === 'liste incantesimi' || normSkill === 'liste incantesimi') return 'Liste incantesimi';
  if (normCat === 'lingue' || normSkill === 'lingue') return 'Lingue';

  if (normCat === 'di manovra e movimento' || normCat === 'abilità di movimento e manovra') return 'Manovre in Movimento';
  if (normCat === 'con le armi' || normCat === 'abilità con le armi') return 'Abilità armi';
  if (normCat === 'generali' || normCat === 'abilità generali') return 'Abilità generiche';
  if (normCat === 'sotterfugio' || normCat === 'abilità di sotterfugio') return 'Abilità sotterfugio';
  if (normCat === 'magiche' || normCat === 'abilità magiche') return 'Abilità magiche';
  return null;
};

export const getTgp4PoolSize = (categoryName, skillName, professionName) => {
  if (!professionName) return 0;
  const profId = getProfessionId(professionName);
  if (!profId) return 0;

  const key = getTgp4CategoryKey(categoryName, skillName);
  if (!key) return 0;

  const normKey = key.toLowerCase().trim();
  if (normKey === 'percezione') return 0;

  const record = professionDevelopmentCosts.find(
    d => d.categoria && d.categoria.toLowerCase().trim() === normKey
  );
  return record ? (record[profId] ?? 0) : 0;
};

export const getProfessionRanksForLevel = (baseProfRanks, level) => {
  if (!baseProfRanks || !level) return 0;
  const base = parseFloat(baseProfRanks);
  if (isNaN(base) || base === 0) return 0;

  const lvl = parseInt(level);
  if (lvl <= 20) {
    return base * lvl;
  } else {
    const first20 = base * 20;
    const remaining = lvl - 20;
    let factor = 0;
    if (base === 3) factor = 1;
    else if (base === 2) factor = 0.5;
    else if (base === 1) factor = 0.25;
    return first20 + factor * remaining;
  }
};

export const getHpDiceForIncrement = (prevRanks, ranksGained) => {
  const g = parseInt(ranksGained || 0);
  return g > 0 ? g : 0;
};

export const getMagicPointsPerLevel = (statScore) => {
  if (!statScore) return 0;
  const score = parseInt(statScore);
  const record = tb1.find(b => b.punteggio === score);
  return record ? (record["punti magia"] || 0) : 0;
};

export const calculateCargoPenalty = (pesoPG, caricoKg) => {
  const caricoArrotondato = Math.floor(caricoKg);
  if (caricoArrotondato < 8) return { penalita: 0, caricoBloccato: false };

  const rows = penalitaCaricoData.filter(row => row['penalità carico'] !== 'peso personaggio (kg)');
  const matchedRow = rows.find(row => {
    const rangeText = row['penalità carico'];
    if (!rangeText) return false;
    const match = rangeText.match(/da\s+(\d+)\s+a\s+(\d+)/i);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      if (min === 176 && pesoPG >= 176) return true;
      return pesoPG >= min && pesoPG <= max;
    }
    return false;
  });

  if (!matchedRow) {
    return { penalita: 0, caricoBloccato: true };
  }

  const columnRanges = [
    { key: 'PESO TRASPORTATO (in kg) oltre l\'armatura ed i vestiti', min: 8, max: 12 },
    { key: '', min: 13, max: 17 },
    { key: '_1', min: 18, max: 22 },
    { key: '_2', min: 23, max: 30 },
    { key: '_3', min: 31, max: 40 },
    { key: '_4', min: 41, max: 50 },
    { key: '_5', min: 51, max: 60 },
    { key: '_6', min: 61, max: 70 },
    { key: '_7', min: 71, max: 80 }
  ];

  const matchedCol = columnRanges.find(col => caricoArrotondato >= col.min && caricoArrotondato <= col.max);
  if (!matchedCol) {
    return { penalita: 0, caricoBloccato: true };
  }

  const val = matchedRow[matchedCol.key];
  if (val === 'NA' || val === undefined || val === '') {
    return { penalita: 0, caricoBloccato: true };
  }

  const cleanVal = String(val).replace(/[^0-9]/g, '');
  if (cleanVal === '') {
    return { penalita: 0, caricoBloccato: true };
  }

  return { penalita: parseInt(cleanVal, 10), caricoBloccato: false };
};

export const getTgp4CategoryKeyForSecondary = (categoryName) => {
  const normCat = categoryName?.toLowerCase()?.trim();
  if (normCat === 'di manovra e movimento' || normCat === 'abilità di movimento e manovra') return 'Manovre in Movimento';
  if (normCat === 'con le armi' || normCat === 'abilità con le armi') return 'Abilità armi';
  if (normCat === 'generali' || normCat === 'abilità generali') return 'Abilità generiche';
  if (normCat === 'sotterfugio' || normCat === 'abilità di sotterfugio') return 'Abilità sotterfugio';
  if (normCat === 'magiche' || normCat === 'abilità magiche') return 'Abilità magiche';
  return null;
};
