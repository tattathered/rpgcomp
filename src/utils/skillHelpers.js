import tb1 from '../data/TB_1-caratteristiche_bonus.json';
import penalitaCaricoData from '../data/TB_5-penalita_carico.json';

export const STAT_KEYS = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
export const STAT_NAMES = { FR: 'Forza', AG: 'Agilità', CO: 'Costituzione', IN: 'Intelligenza', IT: 'Intuizione', PR: 'Presenza' };

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
  return null; // not applicable
};

export const getSpecificTb6Ranks = (skillName, profession) => {
  if (!profession) return 0;
  const nameL = skillName.toLowerCase();
  const validKeys = [
    'resistenza fisica', 'percezione', 'lettura rune', 
    'uso oggetti magici', 'incantesimi diretti', 'incantesimi base'
  ];
  if (validKeys.includes(nameL)) {
    return parseBonusValue(profession[nameL]);
  }
  return 0;
};

export const getFinalStats = (stats, race, bgModifiers = {}) => {
  return STAT_KEYS.reduce((acc, k) => {
    const raw = parseInt(stats[k] || 0);
    const bgMod = bgModifiers.statsBonus?.[k] || 0;
    const statScore = raw + bgMod;
    const bonusNaturale = getBonus(statScore);
    const raceMod = race ? parseBonusValue(race[`bonus a ${k}`] || 0) : 0;
    const bonusTot = bonusNaturale + raceMod;
    acc[k] = { raw, bgMod, statScore, bonusNaturale, raceMod, bonusTot, bonus: bonusTot };
    return acc;
  }, {});
};

export const getTgp5AdolescenceRanks = (skillName, popolo, adolescenceData) => {
  if (!popolo || !adolescenceData) return 0;
  const norm = skillName.toLowerCase().trim();
  if (norm === 'cogliere alle spalle') return 0;
  const mapping = {
    'corazza di maglia': 'cotta di maglia',
    'taglio a 1 mano': 'armi da taglio a 1 mano',
    'contundenti a 1 mano': 'armi contundenti a 1 mano',
    'a 2 mani': 'armi a 2 mani',
    'da tiro': 'armi da tiro',
    'da lancio': 'armi da lancio',
    'con asta': 'armi con asta',
    'cogliere alle spalle': 'colpire alle spalle',
    'muoversi silenziosamente': 'muov. silenz. / nasc.',
    'nascondersi': 'muov. silenz. / nasc.',
    'scassinare serrature': 'scassinare',
    'uso oggetti magici': 'uso di oggetti magici',
  };
  const targetTgp5Name = mapping[norm] || norm;
  const match = adolescenceData.find(item => item.abilità?.toLowerCase().trim() === targetTgp5Name);
  return match ? parseBonusValue(match[popolo] || 0) : 0;
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
  const key = getTb6CategoryKey(categoryName);
  if (!key) return 0;
  return parseBonusValue(profession[key] || 0);
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

export const getTgp4PoolSize = (categoryName, skillName, professionName, tgp4Data) => {
  if (!professionName || !tgp4Data) return 0;
  const key = getTgp4CategoryKey(categoryName, skillName);
  if (!key) return 0;
  const record = tgp4Data.find(d => d.categoria?.toLowerCase().trim() === key.toLowerCase().trim());
  return record ? parseBonusValue(record[professionName.toLowerCase()] || 0) : 0;
};

export const fmt = (n) => (typeof n === 'number' ? (n >= 0 ? `+${n}` : `${n}`) : n);

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

export const getCharacterHpTot = (char) => {
  if (!char) return 0;
  const race = char.race;
  const stats = char.stats || {};
  const levelDevelopments = char.levelDevelopments || [];
  
  const bgData = char.background || { languages: {}, options: [] };
  const bgModifiers = bgData.compiledModifiers || { statsBonus: {}, skillBgRanks: {}, secondarySkills: {}, gold: 0 };
  
  const finalStats = getFinalStats(stats, race, bgModifiers);
  const coBonus = finalStats['CO']?.bonusTot || 0;
  
  const level1HpRoll = char.level1HpRoll || 0;
  const totalHpRolls = level1HpRoll + levelDevelopments.reduce((sum, d) => sum + (d.hpRoll || 0), 0);
  
  const rfRanksL1 = char.skills?.['resistenza fisica']?.adolescenceRanks || 0;
  const totalRanksRf = rfRanksL1 + levelDevelopments.reduce((sum, d) => sum + (d.tgp4Distribution?.['resistenza fisica'] || 0), 0);
  const hpD10Modifier = bgModifiers.hpD10Modifier || 0;
  const specialRfBonus = bgModifiers.primarySkillsSpecialBonus?.['resistenza fisica'] || 0;
  const specialHpBonus = (totalRanksRf * hpD10Modifier) + specialRfBonus;
  
  return totalHpRolls + coBonus + 5 + specialHpBonus;
};


