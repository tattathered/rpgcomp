import tb1 from '../data/TB-1-caratteristiche_bonus.json';
import penalitaCaricoData from '../data/TB-5-penalita_carico.json';
import primarySkillsList from '../data/Tabella-abilita_primarie.json';
import secondarySkillsList from '../data/Tabella-abilita_secondarie.json';

// Nuove tabelle relazionali normalizzate
import racesData from '../data/TB-3-modifiche_speciali_popolo.json';
import skillsData from '../data/skills.json';
import raceAdSkillsData from '../data/TGP-5-sviluppo_abilita_adolescenza.json';
import professionDevelopmentCosts from '../data/TGP-4-sviluppo_abilita.json';
import professionLevelBonuses from '../data/profession_level_bonuses.json';

export const getRaceId = (name) => {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  const race = racesData.find(r => r.id_popolo === n || r.nome.toLowerCase().trim() === n);
  return race ? race.id_popolo : null;
};

export const getSkillId = (name) => {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  const mapping = {
    'corazza di maglia': 'chain_mail',
    'cotta di maglia': 'chain_mail',
    'corazza di maglie': 'chain_mail',
    'taglio a 1 mano': 'one_handed_edged',
    'armi da taglio a 1 mano': 'one_handed_edged',
    'contundenti a 1 mano': 'one_handed_crushing',
    'armi contundenti a 1 mano': 'one_handed_crushing',
    'a 2 mani': 'two_handed',
    'armi a 2 mani': 'two_handed',
    'da tiro': 'missile',
    'armi da tiro': 'missile',
    'da lancio': 'thrown',
    'armi da lancio': 'thrown',
    'con asta': 'polearm',
    'armi con asta': 'polearm',
    'cogliere alle spalle': 'ambush',
    'colpire alle spalle': 'ambush',
    'muoversi silenziosamente': 'stalking',
    'muov. silenz. / nasc.': 'stalking',
    'nascondersi': 'hiding',
    'scassinare serrature': 'pick_locks',
    'scassinare': 'pick_locks',
    'disattivare trappole': 'disarm_traps',
    'uso oggetti magici': 'use_items',
    'uso di oggetti magici': 'use_items',
    'lettura rune': 'read_runes',
    'incantesimi diretti': 'directed_spells',
    'incantesimi base': 'base_spells',
    'percezione': 'perception',
    'resistenza fisica': 'body_development',
    'nessuna armatura': 'no_armor',
    'cuoio grezzo': 'soft_leather',
    'cuoio rinforzato': 'rigid_leather',
    'corazza di piastre': 'plate_mail'
  };
  const mapped = mapping[n];
  if (mapped) return mapped;
  const skill = skillsData.find(s => s.id === n || s.name_it.toLowerCase().trim() === n || s.name_en.toLowerCase().trim() === n);
  return skill ? skill.id : null;
};

export const getProfessionId = (prof) => {
  if (!prof) return null;
  if (typeof prof === 'object') {
    const id = prof.id || prof.professione;
    if (id) return id.toLowerCase().trim();
  }
  const n = String(prof).toLowerCase().trim();
  const enToIt = {
    'warrior': 'guerriero',
    'scout': 'scout',
    'mage': 'mago',
    'bard': 'bardo',
    'animist': 'animista',
    'ranger': 'ranger'
  };
  return enToIt[n] || n;
};

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
  const profId = getProfessionId(profession);
  if (!profId) return 0;

  // Solo abilità con gradi fissi individuali da TB-6 (NON le categorie pool)
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
  if (record) return record.bonus;

  return 0;
};

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

export const getTgp5AdolescenceRanks = (skillName, popolo) => {
  const raceId = getRaceId(popolo);
  if (!raceId) return 0;

  // Mappa nomi abilità → ID italiani usati in TGP-5 (e non getSkillId che usa ID inglesi)
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

  // Backward compatibility
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

export const getCaseInsensitive = (map, key) => {
  if (!map || !key) return undefined;
  const kLower = key.toLowerCase().trim();
  const foundKey = Object.keys(map).find(k => k.toLowerCase().trim() === kLower);
  return foundKey ? map[foundKey] : undefined;
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

  // Calcola carico e penalità per sottrarla se è abilità MM
  const items = char.equipment || [];
  let caricoKg = 0;
  items.forEach(item => {
    caricoKg += (item.qtyCarico || 0) * (item["peso in kg"] || 0);
  });
  const pesoPG = char.peso || 70;
  const { penalita: penalitaCarico } = calculateCargoPenalty(pesoPG, caricoKg);

  // Cerca tra le abilità primarie
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

  // Cerca tra le abilità secondarie
  // Prima controlla se il personaggio la possiede (con rank da background)
  const secSk = Object.values(bgModifiers.secondarySkills || {}).find(s => s.abilita_secondaria.toLowerCase() === nameNorm);
  if (secSk) {
    const carattSigla = secSk.caratteristica_associata;
    const carattBonus = carattSigla ? (finalStats[carattSigla]?.bonusTot || 0) : 0;
    const ranksBonus = secSk.bgRanks ? getRanksBonus(secSk.abilita_secondaria, secSk.bgRanks) : 0;
    const specialBonus = secSk.specialBonus || 0;
    return ranksBonus + specialBonus + carattBonus;
  }

  // Se non posseduta nel background, controlla se fa parte dell'elenco completo per applicare il default (-25 + bonus caratt)
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

  // 1. Aggiungi abilità da background
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

  // 2. Aggiungi nuove abilità apprese al livello 1
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

  // 3. Aggiungi incrementi e nuove abilità dei livelli successivi
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

export const getTgp4CategoryKeyForSecondary = (categoryName) => {
  const normCat = categoryName?.toLowerCase()?.trim();
  if (normCat === 'di manovra e movimento' || normCat === 'abilità di movimento e manovra') return 'Manovre in Movimento';
  if (normCat === 'con le armi' || normCat === 'abilità con le armi') return 'Abilità armi';
  if (normCat === 'generali' || normCat === 'abilità generali') return 'Abilità generiche';
  if (normCat === 'sotterfugio' || normCat === 'abilità di sotterfugio') return 'Abilità sotterfugio';
  if (normCat === 'magiche' || normCat === 'abilità magiche') return 'Abilità magiche';
  return null;
};



