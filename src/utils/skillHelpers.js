/**
 * skillHelpers.js — Re-export di tutti i moduli skill per backward compatibility.
 *
 * I nuovi import dovrebbero puntare direttamente a:
 *   - ./skillLookup    (ID mapping, case-insensitive, formattazione)
 *   - ./skillCalculators (bonus, pool, ranks, HP, penalità)
 *   - ./skillCharacter   (calcoli specifici del personaggio)
 */

export {
  getRaceId,
  getSkillId,
  getProfessionId,
  STAT_KEYS,
  STAT_NAMES,
  getCaseInsensitive,
  fmt
} from './skillLookup';

export {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getSpecificTb6Ranks,
  getTgp5AdolescenceRanks,
  getTb6CategoryKey,
  getTb6PoolSize,
  getTgp4CategoryKey,
  getTgp4PoolSize,
  getProfessionRanksForLevel,
  getHpDiceForIncrement,
  getMagicPointsPerLevel,
  calculateCargoPenalty,
  getTgp4CategoryKeyForSecondary
} from './skillCalculators';

export {
  getFinalStats,
  getCharacterHpTot,
  getCharacterSkillBonus,
  getConsolidatedSecondarySkills
} from './skillCharacter';
