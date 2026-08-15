import primarySkillsList from '../data/Tabella-abilita_primarie.json';
import secondarySkillsList from '../data/Tabella-abilita_secondarie.json';
import { STAT_KEYS, getCaseInsensitive } from './skillLookup';
import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getSpecificTb6Ranks,
  getProfessionRanksForLevel,
  calculateCargoPenalty
} from './skillCalculators';

/**
 * Funzioni di calcolo specifiche del personaggio (stat finali, HP, bonus abilità).
 */

export const getFinalStats = (stats, race, bgModifiers = {}) => {
  return STAT_KEYS.reduce((acc, k) => {
    const raw = parseInt(stats[k] || 0);
    const bgMod = bgModifiers.statsBonus?.[k] || 0;
    const statScore = raw + bgMod;
    const bonusNaturale = getBonus(statScore);
    const raceMod = race ? parseBonusValue(race[`mod_${k.toLowerCase()}`] !== undefined ? race[`mod_${k.toLowerCase()}`] : (race[`bonus a ${k}`] || 0)) : 0;
    const bonusTot = bonusNaturale + raceMod;
    acc[k] = { raw, bgMod, statScore, bonusNaturale, raceMod, bonusTot, bonus: bonusTot };
    return acc;
  }, {});
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

  const name = 'Resistenza fisica';
  const base = getCaseInsensitive(char.skills, name) || {};
  const adRanks = base.adolescenceRanks || 0;
  const profRanks = base.professionRanks || 0;
  const tgp4RanksL1 = getCaseInsensitive(char.level1Tgp4, name) || 0;
  const tgp4RanksLater = levelDevelopments.reduce((sum, d) => sum + (getCaseInsensitive(d.tgp4Distribution, name) || 0), 0);
  const bgExtra = getCaseInsensitive(bgModifiers.skillBgRanks, name) || 0;

  const totalRanksRf = adRanks + profRanks + tgp4RanksL1 + tgp4RanksLater + bgExtra;

  const hpD10Modifier = bgModifiers.hpD10Modifier || 0;
  const specialRfBonus = getCaseInsensitive(bgModifiers.primarySkillsSpecialBonus, name) || 0;
  const specialHpBonus = (totalRanksRf * hpD10Modifier) + specialRfBonus;

  return totalHpRolls + coBonus + 5 + specialHpBonus;
};

export const getCharacterSkillBonus = (char, skillName) => {
  if (!char || !skillName) return 0;
  const nameNorm = skillName.toLowerCase().trim();

  const finalLevel = 1 + (char.levelDevelopments || []).length;
  const race = char.race;
  const profession = char.profession;
  const stats = char.stats || {};
  const levelDevelopments = char.levelDevelopments || [];
  const bgData = char.background || { languages: {}, options: [] };
  const bgModifiers = bgData.compiledModifiers || { statsBonus: {}, skillBgRanks: {}, secondarySkills: {}, gold: 0 };
  const finalStats = getFinalStats(stats, race, bgModifiers);

  const items = char.equipment || [];
  let caricoKg = 0;
  items.forEach(item => {
    caricoKg += (item.qtyCarico || 0) * (item["peso in kg"] || 0);
  });
  const pesoPG = char.peso || 70;
  const { penalita: penalitaCarico } = calculateCargoPenalty(pesoPG, caricoKg);

  const sk = primarySkillsList.find(s => s.nome.toLowerCase() === nameNorm);
  if (sk) {
    const isCogliereAlleSpalle = nameNorm === 'cogliere alle spalle';
    const adRanks = isCogliereAlleSpalle ? 0 : (getCaseInsensitive(char.adolescenceSkills, sk.nome)?.adolescenceRanks || 0);
    const l1Tb6Ranks = getCaseInsensitive(char.level1Tb6, sk.nome) || 0;
    const baseProfRanks = isCogliereAlleSpalle ? 0 : (getSpecificTb6Ranks(sk.nome, profession) + l1Tb6Ranks);
    const professionRanks = isCogliereAlleSpalle ? 0 : getProfessionRanksForLevel(baseProfRanks, finalLevel);
    const tgp4RanksL1 = getCaseInsensitive(char.level1Tgp4, sk.nome) || 0;
    const tgp4RanksLater = levelDevelopments.reduce((sum, d) => sum + (getCaseInsensitive(d.tgp4Distribution, sk.nome) || 0), 0);
    const tgp4Ranks = tgp4RanksL1 + tgp4RanksLater;
    const bgExtra = isCogliereAlleSpalle ? 0 : (getCaseInsensitive(bgModifiers.skillBgRanks, sk.nome) || 0);
    const totalRanks = adRanks + professionRanks + tgp4Ranks + bgExtra;

    const carattSiglaMatch = (sk['valore iniziale'] || '').match(/([A-Z]{2})$/);
    const carattSigla = carattSiglaMatch ? carattSiglaMatch[1] : '';
    const carattBonus = isCogliereAlleSpalle ? 0 : (carattSigla ? finalStats[carattSigla]?.bonusTot || 0 : 0);

    const bonusGradi = getRanksBonus(sk.nome, totalRanks);
    const ingombroBonus = getIngombroBonus(sk.nome);
    const specialBonus = getCaseInsensitive(bgModifiers.primarySkillsSpecialBonus, sk.nome) || 0;

    let totalBonus;
    if (typeof bonusGradi === 'number') {
      totalBonus = bonusGradi + carattBonus + specialBonus + (ingombroBonus ?? 0);
      if (sk.tipo === 'Manovre in Movimento (MM)' || (sk.categoria && sk.categoria.toLowerCase() === 'di manovra e movimento')) {
        totalBonus -= penalitaCarico;
      }
    } else {
      totalBonus = 0;
    }
    return totalBonus;
  }

  const secSk = Object.values(bgModifiers.secondarySkills || {}).find(s => s.abilita_secondaria.toLowerCase() === nameNorm);
  if (secSk) {
    const carattSigla = secSk.caratteristica_associata;
    const carattBonus = carattSigla ? (finalStats[carattSigla]?.bonusTot || 0) : 0;
    const ranksBonus = secSk.bgRanks ? getRanksBonus(secSk.abilita_secondaria, secSk.bgRanks) : 0;
    const specialBonus = secSk.specialBonus || 0;
    return ranksBonus + specialBonus + carattBonus;
  }

  const secSkDef = secondarySkillsList.find(s => s.abilita_secondaria.toLowerCase() === nameNorm);
  if (secSkDef) {
    const carattSigla = secSkDef.caratteristica_associata;
    const carattBonus = carattSigla ? (finalStats[carattSigla]?.bonusTot || 0) : 0;
    return -25 + carattBonus;
  }

  return 0;
};

export const getConsolidatedSecondarySkills = (characterData) => {
  if (!characterData) return [];
  const bgSkills = characterData.background?.compiledModifiers?.secondarySkills || {};
  const newSec = characterData.newSecondarySkills || [];
  const level1Ranks = characterData.level1SecondarySkillsTgp4 || {};
  const levelDevelopments = characterData.levelDevelopments || [];

  const consolidated = {};

  Object.keys(bgSkills).forEach(name => {
    const sk = bgSkills[name];
    consolidated[name] = {
      nome: name,
      categoria: sk.categoria,
      caratteristica: sk.caratteristica_associata || sk.caratteristica,
      bgRanks: sk.bgRanks || 0,
      specialBonus: sk.specialBonus || 0,
      level1Ranks: level1Ranks[name] || 0,
      levelUpRanks: 0,
    };
  });

  newSec.forEach(name => {
    if (!consolidated[name]) {
      const sk = secondarySkillsList.find(s => s.abilita_secondaria === name);
      consolidated[name] = {
        nome: name,
        categoria: sk?.categoria || '',
        caratteristica: sk?.caratteristica_associata || '',
        bgRanks: 0,
        specialBonus: 0,
        level1Ranks: level1Ranks[name] || 0,
        levelUpRanks: 0,
      };
    }
  });

  levelDevelopments.forEach(d => {
    const levelNewSec = d.newSecondarySkills || [];
    const levelRanks = d.secondarySkillsTgp4 || {};

    levelNewSec.forEach(name => {
      if (!consolidated[name]) {
        const sk = secondarySkillsList.find(s => s.abilita_secondaria === name);
        consolidated[name] = {
          nome: name,
          categoria: sk?.categoria || '',
          caratteristica: sk?.caratteristica_associata || '',
          bgRanks: 0,
          specialBonus: 0,
          level1Ranks: 0,
          levelUpRanks: 0,
        };
      }
    });

    Object.keys(levelRanks).forEach(name => {
      if (consolidated[name]) {
        consolidated[name].levelUpRanks += levelRanks[name];
      }
    });
  });

  return Object.values(consolidated);
};
