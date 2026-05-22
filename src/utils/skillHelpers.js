import tb1 from '../data/TB_1-caratteristiche_bonus.json';

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
    if (ranks <= 10) return ranks;
    if (ranks <= 20) return 10 + Math.floor((ranks - 10) * 0.5);
    return 15 + Math.floor((ranks - 20) * 0.5);
  }
  if (name === 'resistenza fisica') {
    if (ranks === 0) return 0;
    if (ranks <= 10) return `${ranks}d10`;
    return `10d10+${ranks - 10}d4`;
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

export const fmt = (n) => (typeof n === 'number' ? (n >= 0 ? `+${n}` : `${n}`) : n);
