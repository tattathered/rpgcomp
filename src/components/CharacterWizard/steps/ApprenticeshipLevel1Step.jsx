import { useState, useEffect, useMemo, useRef } from 'react';
import AnagraficaReadOnlyBox from '../shared/AnagraficaReadOnlyBox';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import { getAvailableSpellLists } from '../../../utils/magicHelpers';
import gradiLingue from '../../../data/TGP-1-gradi_conoscenze_lingue.json';
import secondarySkillsList from '../../../data/Tabella-abilita_secondarie.json';

// Nuove tabelle relazionali normalizzate
import languagesData from '../../../data/languages.json';
import raceLanguagesData from '../../../data/race_languages.json';
import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getSpecificTb6Ranks,
  getFinalStats,
  fmt,
  getTgp4PoolSize,
  getTb6PoolSize,
  getRaceId,
  getConsolidatedSecondarySkills,
  getTgp4CategoryKeyForSecondary
} from '../../../utils/skillHelpers';

const TGP4_POOLS = [
  { key: 'Manovre in Movimento', label: 'Manovre in Movimento', isCategory: true, catName: 'di manovra e movimento' },
  { key: 'Abilità armi', label: 'Abilità armi', isCategory: true, catName: 'con le armi' },
  { key: 'Abilità generiche', label: 'Abilità generiche', isCategory: true, catName: 'generali' },
  { key: 'Abilità sotterfugio', label: 'Abilità sotterfugio', isCategory: true, catName: 'sotterfugio' },
  { key: 'Abilità magiche', label: 'Abilità magiche', isCategory: true, catName: 'magiche' },
  { key: 'Resistenza fisica', label: 'Resistenza fisica', isCategory: false, skillName: 'resistenza fisica', catName: 'bonus e abilità varie' },
  { key: 'Percezione', label: 'Percezione', isCategory: false, skillName: 'percezione', catName: 'bonus e abilità varie' },
  { key: 'Liste incantesimi', label: 'Liste incantesimi', isCategory: true, catName: 'liste incantesimi' },
  { key: 'Lingue', label: 'Lingue', isCategory: true, catName: 'lingue' }
];

const getMaxRanks = (skillName) => {
  const limits = {
    'nessuna armatura': 2,
    'cuoio grezzo': 3,
    'cuoio rinforzato': 5,
    'corazza di maglia': 7,
    'corazza di piastre': 9
  };
  return limits[skillName.toLowerCase()] || null;
};

// Helper to calculate cost of TGP_4 ranks
const getTgp4Cost = (ranks) => {
  if (ranks === 0) return 0;
  if (ranks === 1) return 1;
  if (ranks === 2) return 3; // 1 for first + 2 for second
  return 3 + (ranks - 2); // Fallback
};

const getTgp4CostForMM = (ranks) => ranks; // Movimento e Manovra cost is 1:1

export default function ApprenticeshipLevel1Step({ characterData, setCharacterData }) {
  const race = characterData.race;
  const profession = characterData.profession;
  const baseSkills = characterData.adolescenceSkills || {};

  // Init languages from race if not present
  useEffect(() => {
    if (race && (!characterData.background?.languages)) {
      const baseLangs = {};
      const raceId = race.id_popolo || getRaceId(race.nome);
      if (raceId) {
        const rlList = raceLanguagesData.filter(rl => rl.race_id === raceId);
        rlList.forEach(rl => {
          const lang = languagesData.find(l => l.id === rl.language_id);
          if (lang) {
            baseLangs[lang.name_it] = { base: rl.level, addedAdolescenza: 0, addedLivello1: 0, added: 0 };
          }
        });
      }
      setCharacterData(prev => ({
        ...prev,
        background: {
          ...(prev.background || {}),
          languages: baseLangs,
          options: prev.background?.options || []
        }
      }));
    }
  }, [race, characterData.background, setCharacterData]);

  const bgModifiers = useMemo(() => {
    return characterData.background?.compiledModifiers || {};
  }, [characterData.background]);

  const finalStats = useMemo(() => {
    return getFinalStats(characterData.stats || {}, race, bgModifiers);
  }, [characterData.stats, race, bgModifiers]);

  const tb6Distribution = characterData.level1Tb6 || {};
  const [tgp4Distribution, setTgp4Distribution] = useState(() => {
    const initial = { ...(characterData.level1Tgp4 || {}) };
    if (initial['Liste incantesimi'] === undefined) {
      initial['Liste incantesimi'] = 0;
    }
    return initial;
  });
  const [tgp4Transfers, setTgp4Transfers] = useState(characterData.tgp4Transfers || []);
  const [tgp4SecondarySkillsDistribution, setTgp4SecondarySkillsDistribution] = useState(() => {
    return characterData.level1SecondarySkillsTgp4 || {};
  });
  const [newSecondarySkills, setNewSecondarySkills] = useState(() => {
    return characterData.newSecondarySkills || [];
  });

  const [selectedNewList, setSelectedNewList] = useState('');
  const [spellAttemptStatus, setSpellAttemptStatus] = useState(() => characterData.level1SpellAttemptStatus || 'none');
  const [spellAttemptRoll, setSpellAttemptRoll] = useState(() => characterData.level1SpellAttemptRoll || null);
  const [manualSpellRoll, setManualSpellRoll] = useState('');
  const prevTotalChanceRef = useRef(null);

  // Spell Lists local variables
  const listPool = useMemo(() => {
    if (!profession) return 0;
    const base = getTgp4PoolSize('liste incantesimi', null, profession.professione);
    let received = 0;
    let transferredOut = 0;
    tgp4Transfers.forEach(t => {
      if (t.type === 'deposit' && t.source === 'Liste incantesimi') transferredOut += t.points;
      if (t.type === 'withdrawal' && t.dest === 'Liste incantesimi') received += t.pointsReceived;
    });
    return base + received - transferredOut;
  }, [profession, tgp4Transfers]);

  const listPS = tgp4Distribution['Liste incantesimi'] || 0;
  const baseAccumulated = characterData.spellListChanceAccumulated || 0;
  const totalChance = baseAccumulated + (listPool * 20);

  // Reset attempt if totalChance changes
  useEffect(() => {
    if (prevTotalChanceRef.current !== null && prevTotalChanceRef.current !== totalChance) {
      setSpellAttemptStatus('none');
      setSpellAttemptRoll(null);
      setManualSpellRoll('');
      // If they had acquired a list, remove it
      const acquiredListEntry = Object.entries(characterData.spellListAllocations || {}).find(([name, source]) => source === 'Apprendistato Liv. 1');
      if (acquiredListEntry) {
        const acquiredListName = acquiredListEntry[0];
        setCharacterData(prev => {
          const nextAlloc = { ...prev.spellListAllocations };
          delete nextAlloc[acquiredListName];
          return {
            ...prev,
            spellListAllocations: nextAlloc
          };
        });
      }
    }
    prevTotalChanceRef.current = totalChance;
  }, [totalChance]);

  // Point Transfer States (2-phase pool model)
  const [depositSource, setDepositSource] = useState('');
  const [depositPoints, setDepositPoints] = useState(1);
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawPoints, setWithdrawPoints] = useState(1);

  // Compute pools state (base, received, transferredOut, spentOnSkills, remaining)
  const poolsState = useMemo(() => {
    if (!profession) return {};

    const state = {};

    // 1. Calculate base pool sizes
    TGP4_POOLS.forEach(p => {
      const base = getTgp4PoolSize(p.catName, p.skillName, profession.professione);
      state[p.key] = {
        key: p.key,
        label: p.label,
        base,
        received: 0,
        transferredOut: 0,
        spentOnSkills: 0
      };
    });

    // 2. Applica trasferimenti (nuovo formato tipizzato)
    tgp4Transfers.forEach(t => {
      if (t.type === 'deposit') {
        if (state[t.source]) state[t.source].transferredOut += t.points;
      } else if (t.type === 'withdrawal') {
        if (state[t.dest]) state[t.dest].received += t.pointsReceived;
      }
    });

    // 3. Calculate spent points on skills
    primarySkillsList.forEach(s => {
      const ranks = tgp4Distribution[s.nome] || 0;
      if (ranks === 0) return;

      const normName = s.nome.toLowerCase().trim();
      if (normName === 'resistenza fisica') {
        state['Resistenza fisica'].spentOnSkills += getTgp4Cost(ranks);
      } else if (normName === 'percezione') {
        state['Percezione'].spentOnSkills += getTgp4Cost(ranks);
      } else {
        const cat = s.categoria?.toLowerCase()?.trim();
        if (cat === 'di manovra e movimento') {
          state['Manovre in Movimento'].spentOnSkills += getTgp4CostForMM(ranks);
        } else if (cat === 'con le armi') {
          state['Abilità armi'].spentOnSkills += getTgp4Cost(ranks);
        } else if (cat === 'generali') {
          state['Abilità generiche'].spentOnSkills += getTgp4Cost(ranks);
        } else if (cat === 'sotterfugio') {
          state['Abilità sotterfugio'].spentOnSkills += getTgp4Cost(ranks);
        } else if (cat === 'magiche') {
          state['Abilità magiche'].spentOnSkills += getTgp4Cost(ranks);
        }
      }
    });

    // Also include 'Liste incantesimi' spent points (direct ranks in tgp4Distribution)
    const listPS = tgp4Distribution['Liste incantesimi'] || 0;
    state['Liste incantesimi'].spentOnSkills += listPS;

    // Add languages spent points
    const langSpent = Object.values(characterData.background?.languages || {}).reduce((sum, l) => sum + (l.addedLivello1 || 0), 0);
    state['Lingue'].spentOnSkills = langSpent;

    // Add secondary skills spent points (1:1 cost)
    Object.keys(tgp4SecondarySkillsDistribution).forEach(name => {
      const ranks = tgp4SecondarySkillsDistribution[name] || 0;
      if (ranks === 0) return;

      const bgSkill = bgModifiers.secondarySkills?.[name];
      let category = bgSkill?.categoria;
      if (!category) {
        const defSkill = secondarySkillsList.find(s => s.abilita_secondaria === name);
        category = defSkill?.categoria;
      }

      if (category) {
        const poolKey = getTgp4CategoryKeyForSecondary(category);
        if (poolKey && state[poolKey]) {
          state[poolKey].spentOnSkills += ranks;
        }
      }
    });

    // 4. Calculate adjusted pool and remaining points
    TGP4_POOLS.forEach(p => {
      const s = state[p.key];
      s.adjustedPool = s.base + s.received - s.transferredOut;
      s.remaining = s.adjustedPool - s.spentOnSkills;
    });

    return state;
  }, [tgp4Distribution, tgp4Transfers, profession, characterData.background?.languages, tgp4SecondarySkillsDistribution, newSecondarySkills, bgModifiers.secondarySkills]);

  const allLanguages = useMemo(() => [...new Set(languagesData.map(l => l.name_it))].sort(), []);
  const languages = characterData.background?.languages || {};
  const languagePointsLeft = poolsState['Lingue']?.remaining || 0;

  // Pool Intermedio: somma depositi meno costi dei prelievi
  const poolBalance = useMemo(() => {
    return tgp4Transfers.reduce((sum, t) => {
      if (t.type === 'deposit') return sum + t.points;
      if (t.type === 'withdrawal') return sum - t.cost;
      return sum;
    }, 0);
  }, [tgp4Transfers]);

  const addLangPoint = (lang) => {
    if (languagePointsLeft <= 0) return;
    const cur = languages[lang] || { base: 0, addedAdolescenza: 0, addedLivello1: 0, added: 0 };
    const total = (cur.base || 0) + (cur.addedAdolescenza || 0) + (cur.addedLivello1 || 0);
    if (total >= 5) return;

    const nextLangs = {
      ...languages,
      [lang]: {
        ...cur,
        addedLivello1: (cur.addedLivello1 || 0) + 1,
        added: (cur.addedAdolescenza || 0) + (cur.addedLivello1 || 0) + 1
      }
    };
    setCharacterData(prev => ({
      ...prev,
      background: {
        ...(prev.background || {}),
        languages: nextLangs
      }
    }));
  };

  const removeLangPoint = (lang) => {
    const cur = languages[lang];
    if (!cur || cur.addedLivello1 <= 0) return;

    const nextLangs = { ...languages };
    const newAddedLivello1 = cur.addedLivello1 - 1;
    const newAdded = (cur.addedAdolescenza || 0) + newAddedLivello1;

    if (cur.base === 0 && (cur.addedAdolescenza || 0) === 0 && newAddedLivello1 === 0 && !cur.fromBg) {
      delete nextLangs[lang];
    } else {
      nextLangs[lang] = {
        ...cur,
        addedLivello1: newAddedLivello1,
        added: newAdded
      };
    }

    setCharacterData(prev => ({
      ...prev,
      background: {
        ...(prev.background || {}),
        languages: nextLangs
      }
    }));
  };

  const addNewLang = (lang) => {
    if (!lang || languagePointsLeft <= 0) return;
    const cur = languages[lang] || { base: 0, addedAdolescenza: 0, addedLivello1: 0, added: 0 };
    const total = (cur.base || 0) + (cur.addedAdolescenza || 0) + (cur.addedLivello1 || 0);
    if (total >= 5) return;

    const nextLangs = {
      ...languages,
      [lang]: {
        ...cur,
        addedLivello1: (cur.addedLivello1 || 0) + 1,
        added: (cur.addedAdolescenza || 0) + (cur.addedLivello1 || 0) + 1
      }
    };
    setCharacterData(prev => ({
      ...prev,
      background: {
        ...(prev.background || {}),
        languages: nextLangs
      }
    }));
  };

  // Save distribution and combined skills to characterData when it changes
  useEffect(() => {
    if (!profession) return;

    const newSkills = {};
    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';
      const adRanks = isCogliereAlleSpalle ? 0 : (baseSkills[name]?.adolescenceRanks || 0);
      const profFixedRanks = isCogliereAlleSpalle ? 0 : getSpecificTb6Ranks(name, profession);
      const tb6Ranks = isCogliereAlleSpalle ? 0 : (tb6Distribution[name] || 0);
      const tgp4Ranks = tgp4Distribution[name] || 0;
      const totalRanks = adRanks + profFixedRanks + tb6Ranks + tgp4Ranks;

      newSkills[name] = {
        category: sk.categoria,
        type: sk.tipo,
        valoreIniziale: sk['valore iniziale'],
        adolescenceRanks: adRanks,
        professionRanks: profFixedRanks + tb6Ranks,
        tgp4Ranks: tgp4Ranks,
        totalRanks: totalRanks,
        specialBonus: characterData.skills?.[name]?.specialBonus || 0,
        itemBonus: characterData.skills?.[name]?.itemBonus || 0,
        learnedRanks: characterData.skills?.[name]?.learnedRanks || 0,
      };
    });

    Object.keys(baseSkills).forEach(name => {
      if (baseSkills[name].category === 'Altre Abilità') {
        newSkills[name] = baseSkills[name];
      }
    });

    const nextLevel1Tgp4 = {
      ...tgp4Distribution,
      'Liste incantesimi': tgp4Distribution['Liste incantesimi'] || 0
    };

    setCharacterData(prev => {
      if (JSON.stringify(prev.level1Tb6) === JSON.stringify(tb6Distribution) &&
        JSON.stringify(prev.level1Tgp4) === JSON.stringify(nextLevel1Tgp4) &&
        JSON.stringify(prev.tgp4Transfers) === JSON.stringify(tgp4Transfers) &&
        JSON.stringify(prev.skills) === JSON.stringify(newSkills) &&
        prev.level1SpellAttemptStatus === spellAttemptStatus &&
        prev.level1SpellAttemptRoll === spellAttemptRoll &&
        JSON.stringify(prev.level1SecondarySkillsTgp4) === JSON.stringify(tgp4SecondarySkillsDistribution) &&
        JSON.stringify(prev.newSecondarySkills) === JSON.stringify(newSecondarySkills)) {
        return prev;
      }
      return {
        ...prev,
        level1Tb6: tb6Distribution,
        level1Tgp4: nextLevel1Tgp4,
        tgp4Transfers: tgp4Transfers,
        skills: newSkills,
        level1SpellAttemptStatus: spellAttemptStatus,
        level1SpellAttemptRoll: spellAttemptRoll,
        level1SecondarySkillsTgp4: tgp4SecondarySkillsDistribution,
        newSecondarySkills: newSecondarySkills
      };
    });
  }, [
    tb6Distribution,
    tgp4Distribution,
    tgp4Transfers,
    setCharacterData,
    baseSkills,
    profession,
    characterData.skills,
    spellAttemptStatus,
    spellAttemptRoll,
    tgp4SecondarySkillsDistribution,
    newSecondarySkills
  ]);

  const handleSpellRoll = (customVal) => {
    let roll;
    if (customVal !== undefined) {
      roll = parseInt(customVal);
      if (isNaN(roll) || roll < 1 || roll > 100) return;
    } else {
      roll = Math.floor(Math.random() * 100) + 1;
    }
    setSpellAttemptRoll(roll);
    if (roll <= totalChance) {
      setSpellAttemptStatus('success');
    } else {
      setSpellAttemptStatus('failed');
    }
  };

  const handleCancelSpellAttempt = () => {
    setSpellAttemptStatus('none');
    setSpellAttemptRoll(null);
    setManualSpellRoll('');
    if (hasAcquiredInApprenticeship) {
      handleRemoveSpellList();
    }
  };

  const handleSelectAccumulate = () => {
    setSpellAttemptStatus('accumulate');
    setSpellAttemptRoll(null);
  };

  const isWarriorOrScout = profession ? ['guerriero', 'scout'].includes(profession?.professione?.toLowerCase()) : false;

  const selectedRealm = characterData.magicRealm || '';
  const knownLists = useMemo(() => {
    const list = new Set();
    Object.keys(characterData.spellListAllocations || {}).forEach(k => {
      if (characterData.spellListAllocations[k] !== 'Apprendistato Liv. 1') {
        list.add(k);
      }
    });
    const bgSpellLists = characterData.background?.compiledModifiers?.bgSpellLists || [];
    bgSpellLists.forEach(k => {
      list.add(k);
    });
    return Array.from(list);
  }, [characterData.spellListAllocations, characterData.background]);

  const knownListsUpper = useMemo(() => {
    return knownLists.map(l => l.toUpperCase().trim());
  }, [knownLists]);

  const rawAvailableLists = useMemo(() => {
    return profession ? getAvailableSpellLists(profession.professione, selectedRealm) : [];
  }, [profession, selectedRealm]);

  const availableLists = useMemo(() => {
    return rawAvailableLists.filter(l => !knownListsUpper.includes(l.nome_lista.toUpperCase().trim()));
  }, [rawAvailableLists, knownListsUpper]);

  const handleRealmChange = (realm) => {
    setCharacterData(prev => ({ ...prev, magicRealm: realm }));
  };

  const categories = [...new Set(primarySkillsList.map(s => s.categoria))];

  const handleAddTgp4 = (skillName, category) => {
    const normCat = category?.toLowerCase()?.trim();
    const isMM = normCat === 'di manovra e movimento' || category === 'Abilità di Movimento e Manovra';
    const isNoLimit = isMM;
    const currentRanks = tgp4Distribution[skillName] || 0;

    // Check max ranks per level
    if (!isNoLimit && currentRanks >= 2) return;

    // Check max total ranks for Movement Maneuvers
    const max = getMaxRanks(skillName);
    if (max !== null) {
      const adRanks = baseSkills[skillName]?.adolescenceRanks || 0;
      const profFixedRanks = getSpecificTb6Ranks(skillName, profession);
      const tb6Ranks = tb6Distribution[skillName] || 0;
      const totalRanks = adRanks + profFixedRanks + tb6Ranks + currentRanks;
      if (totalRanks >= max) {
        alert(`Non è possibile aumentare ${skillName} oltre il limite di ${max} gradi totali.`);
        return;
      }
    }

    let poolKey;
    if (skillName.toLowerCase().trim() === 'resistenza fisica') {
      poolKey = 'Resistenza fisica';
    } else if (skillName.toLowerCase().trim() === 'percezione') {
      poolKey = 'Percezione';
    } else {
      if (normCat === 'di manovra e movimento' || normCat === 'abilità di movimento e manovra') poolKey = 'Manovre in Movimento';
      else if (normCat === 'con le armi' || normCat === 'abilità con le armi') poolKey = 'Abilità armi';
      else if (normCat === 'generali' || normCat === 'abilità generali') poolKey = 'Abilità generiche';
      else if (normCat === 'sotterfugio' || normCat === 'abilità di sotterfugio') poolKey = 'Abilità sotterfugio';
      else if (normCat === 'magiche' || normCat === 'abilità magiche') poolKey = 'Abilità magiche';
    }

    if (!poolKey) return;

    const pool = poolsState[poolKey];
    if (!pool) return;

    const costOfNextRank = isNoLimit ? 1 : (currentRanks === 0 ? 1 : 2);

    if (pool.remaining >= costOfNextRank) {
      setTgp4Distribution(prev => ({
        ...prev,
        [skillName]: currentRanks + 1
      }));
    }
  };

  const handleSubTgp4 = (skillName) => {
    if (tgp4Distribution[skillName] > 0) {
      setTgp4Distribution(prev => ({
        ...prev,
        [skillName]: prev[skillName] - 1
      }));
    }
  };

  const possessedSecondarySkills = useMemo(() => {
    const set = new Set();
    Object.keys(bgModifiers.secondarySkills || {}).forEach(k => set.add(k));
    newSecondarySkills.forEach(k => set.add(k));
    return Array.from(set);
  }, [bgModifiers.secondarySkills, newSecondarySkills]);

  const availableSecondarySkillsForLearn = useMemo(() => {
    return secondarySkillsList
      .filter(s => !possessedSecondarySkills.includes(s.abilita_secondaria))
      .sort((a, b) => a.abilita_secondaria.localeCompare(b.abilita_secondaria));
  }, [possessedSecondarySkills]);

  const handleLearnSecondarySkill = (skillName) => {
    if (!skillName) return;
    if (newSecondarySkills.includes(skillName)) return;
    setNewSecondarySkills(prev => [...prev, skillName]);
  };

  const handleRemoveNewSecondarySkill = (skillName) => {
    if (tgp4SecondarySkillsDistribution[skillName] > 0) {
      alert("Riduci a 0 i gradi spesi prima di rimuovere l'abilità.");
      return;
    }
    setNewSecondarySkills(prev => prev.filter(s => s !== skillName));
    setTgp4SecondarySkillsDistribution(prev => {
      const next = { ...prev };
      delete next[skillName];
      return next;
    });
  };

  const handleAddSecondaryTgp4 = (skillName, category) => {
    const currentRanks = tgp4SecondarySkillsDistribution[skillName] || 0;

    if (currentRanks >= 2) {
      alert("Non puoi sviluppare più di 2 gradi per livello/fase.");
      return;
    }

    const poolKey = getTgp4CategoryKeyForSecondary(category);
    if (!poolKey) return;

    const pool = poolsState[poolKey];
    if (!pool) return;

    const costOfNextRank = 1;

    if (pool.remaining >= costOfNextRank) {
      setTgp4SecondarySkillsDistribution(prev => ({
        ...prev,
        [skillName]: currentRanks + 1
      }));
    } else {
      alert(`Punti insufficienti nel pool "${poolKey}".`);
    }
  };

  const handleSubSecondaryTgp4 = (skillName) => {
    const currentRanks = tgp4SecondarySkillsDistribution[skillName] || 0;
    if (currentRanks > 0) {
      setTgp4SecondarySkillsDistribution(prev => ({
        ...prev,
        [skillName]: currentRanks - 1
      }));
    }
  };



  const acquiredListEntry = Object.entries(characterData.spellListAllocations || {}).find(([name, source]) => source === 'Apprendistato Liv. 1');
  const hasAcquiredInApprenticeship = !!acquiredListEntry;
  const acquiredListName = hasAcquiredInApprenticeship ? acquiredListEntry[0] : '';

  const adolescenceListEntry = Object.entries(characterData.spellListAllocations || {}).find(([name, source]) => source === 'Adolescenza');

  const handleAcquireList = () => {
    if (!selectedNewList) return;

    setCharacterData(prev => ({
      ...prev,
      spellListAllocations: {
        ...(prev.spellListAllocations || {}),
        [selectedNewList]: 'Apprendistato Liv. 1'
      }
    }));
    setSelectedNewList('');
  };

  const handleRemoveSpellList = () => {
    if (!hasAcquiredInApprenticeship) return;
    setCharacterData(prev => {
      const nextAlloc = { ...prev.spellListAllocations };
      delete nextAlloc[acquiredListName];
      return {
        ...prev,
        spellListAllocations: nextAlloc
      };
    });
  };

  // Sync spell list points and accumulated probability
  useEffect(() => {
    let targetSpent = 0;
    let targetChance = baseAccumulated;

    if (totalChance >= 100) {
      if (hasAcquiredInApprenticeship) {
        targetSpent = listPool;
        targetChance = totalChance - 100;
      } else {
        targetSpent = 0;
        targetChance = baseAccumulated;
      }
    } else if (totalChance > 0) {
      if (spellAttemptStatus === 'accumulate') {
        targetSpent = listPool;
        targetChance = totalChance;
      } else if (spellAttemptStatus === 'success') {
        if (hasAcquiredInApprenticeship) {
          targetSpent = listPool;
          targetChance = 0;
        } else {
          targetSpent = 0;
          targetChance = 0;
        }
      } else if (spellAttemptStatus === 'failed') {
        targetSpent = listPool;
        targetChance = totalChance;
      } else {
        // 'none'
        targetSpent = 0;
        targetChance = baseAccumulated;
      }
    } else {
      // totalChance === 0
      targetSpent = 0;
      targetChance = 0;
    }

    if (tgp4Distribution['Liste incantesimi'] !== targetSpent) {
      setTgp4Distribution(prev => ({
        ...prev,
        'Liste incantesimi': targetSpent
      }));
    }

    if (characterData.spellListChanceAccumulated !== targetChance) {
      setCharacterData(prev => ({
        ...prev,
        spellListChanceAccumulated: targetChance
      }));
    }
  }, [
    hasAcquiredInApprenticeship,
    listPool,
    totalChance,
    baseAccumulated,
    spellAttemptStatus,
    setCharacterData
  ]);

  // Validation useEffect for Level 1
  useEffect(() => {
    let err = null;

    // 1. Controlla pool negativi
    const negativePools = Object.values(poolsState).filter(p => p.remaining < 0);
    if (negativePools.length > 0) {
      const names = negativePools.map(p => p.label).join(', ');
      err = `Hai speso troppi punti nei seguenti pool: ${names}.`;
    }

    // 2. Controlla pool con punti residui non spesi
    if (!err) {
      const unspentPools = Object.values(poolsState).filter(p => p.remaining > 0);
      if (unspentPools.length > 0) {
        const names = unspentPools.map(p => p.label).join(', ');
        err = `Devi spendere o trasferire tutti i punti nei seguenti pool: ${names}.`;
      }
    }

    // 2b. Controlla Pool Intermedio non svuotato
    if (!err && poolBalance > 0) {
      err = `Hai ${poolBalance} PS nel Pool Intermedio non ancora distribuiti. Distribuiscili alle categorie oppure resetta i trasferimenti.`;
    }

    // 3. Controlla se ha ottenuto l'apprendimento lista incantesimi ma non l'ha ancora scelta o se deve fare una scelta per probabilità parziale
    if (!err && selectedRealm) {
      if (totalChance >= 100 && !hasAcquiredInApprenticeship) {
        err = 'Hai ottenuto con successo l\'apprendimento di una lista incantesimi! Selezionala ed acquisiscila.';
      } else if (totalChance > 0 && totalChance < 100) {
        if (spellAttemptStatus === 'none') {
          err = 'Devi scegliere se tentare l\'apprendimento della lista o accumulare la probabilità come credito.';
        } else if (spellAttemptStatus === 'success' && !hasAcquiredInApprenticeship) {
          err = 'Hai ottenuto con successo l\'apprendimento di una lista incantesimi! Selezionala ed acquisiscila.';
        }
      }
    }

    if (characterData.stepErrors?.level1 !== err) {
      setCharacterData(prev => ({
        ...prev,
        stepErrors: {
          ...(prev.stepErrors || {}),
          level1: err
        }
      }));
    }
  }, [poolsState, poolBalance, selectedRealm, totalChance, hasAcquiredInApprenticeship, spellAttemptStatus, characterData.stepErrors, setCharacterData]);

  // ── Handlers Trasferimento 2-Fasi ────────────────────────────────────────────

  const getTransferRate = (destKey, pointsToReceive) => {
    if (!destKey) return { rate: '—', cost: 0 };
    if (destKey === 'Percezione') return { rate: '1:1', cost: pointsToReceive };
    const destPool = TGP4_POOLS.find(p => p.key === destKey);
    const destBase = destPool && profession ? getTgp4PoolSize(destPool.catName, destPool.skillName, profession.professione) : 0;
    return destBase > 0
      ? { rate: '2:1', cost: pointsToReceive * 2 }
      : { rate: '4:1', cost: pointsToReceive * 4 };
  };

  const handleAddDeposit = () => {
    if (!depositSource || depositPoints <= 0) return;
    const sourcePool = poolsState[depositSource];
    if (!sourcePool || sourcePool.remaining < depositPoints) {
      alert(`Non hai abbastanza punti disponibili nel pool "${depositSource}" (disponibili: ${sourcePool?.remaining || 0}).`);
      return;
    }
    if (!window.confirm(`Confermi di spostare ${depositPoints} PS da "${depositSource}" nel Pool Intermedio?`)) return;
    setTgp4Transfers(prev => [...prev, {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      type: 'deposit',
      source: depositSource,
      points: depositPoints
    }]);
    setDepositPoints(1);
    setDepositSource('');
  };

  const handleAddWithdrawal = () => {
    if (!withdrawDest || withdrawPoints <= 0) return;
    const { cost, rate } = getTransferRate(withdrawDest, withdrawPoints);
    if (poolBalance < cost) {
      alert(`Non hai abbastanza punti nel Pool Intermedio (necessari: ${cost}, disponibili: ${poolBalance}).`);
      return;
    }
    if (!window.confirm(`Confermi di trasferire ${withdrawPoints} PS verso "${withdrawDest}" con costo ${cost} PS dal Pool Intermedio? (tariffa ${rate})`)) return;
    setTgp4Transfers(prev => [...prev, {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      type: 'withdrawal',
      dest: withdrawDest,
      pointsReceived: withdrawPoints,
      cost,
      rate
    }]);
    setWithdrawPoints(1);
    setWithdrawDest('');
  };

  const handleDeleteEntry = (id) => {
    const entry = tgp4Transfers.find(t => t.id === id);
    if (!entry) return;
    if (entry.type === 'deposit') {
      // Posso eliminare il deposito solo se il pool non ha già speso quei punti in prelievi
      const remainingPool = poolBalance - entry.points; // pool senza questo deposito
      if (remainingPool < 0) {
        alert('Impossibile rimuovere questo deposito: i punti sono già stati distribuiti dal Pool. Resetta i prelievi prima.');
        return;
      }
    } else if (entry.type === 'withdrawal') {
      // Posso eliminare il prelievo solo se i punti ricevuti non sono già stati spesi in abilità
      const destPool = poolsState[entry.dest];
      if (destPool && destPool.remaining < entry.pointsReceived) {
        alert(`Impossibile rimuovere: hai già speso i ${entry.pointsReceived} PS ricevuti nel pool "${entry.dest}". Riduci i gradi spesi prima.`);
        return;
      }
    }
    setTgp4Transfers(prev => prev.filter(t => t.id !== id));
  };

  const handleResetTransfers = () => {
    if (!window.confirm('Sei sicuro di voler annullare TUTTI i trasferimenti? I PS verranno restituiti alle categorie originali. Questa operazione richiede che tu abbia anche rimosso eventuali gradi già acquistati con i PS trasferiti.')) return;
    setTgp4Transfers([]);
    setDepositSource('');
    setDepositPoints(1);
    setWithdrawDest('');
    setWithdrawPoints(1);
  };


  if (!race || !profession) {
    return (
      <div className="p-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 bg-gray-50">
        Completa gli step precedenti prima di procedere.
      </div>
    );
  }

  return (
    <div>
      <AnagraficaReadOnlyBox characterData={characterData} />
      {/* ── HEADER BANNER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-race-border)', borderRadius: '0.6rem', background: 'var(--theme-race-bg)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-race-text)' }}>Popolo</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-race-text)', marginTop: '0.2rem' }}>{race.nome}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-race-text)', opacity: 0.85, marginTop: '0.15rem' }}>{race.categoria}</div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-profession-border)', borderRadius: '0.6rem', background: 'var(--theme-profession-bg)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-profession-text)' }}>Professione</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-profession-text)', marginTop: '0.2rem' }}>{profession.professione}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-profession-text)', opacity: 0.85, marginTop: '0.15rem' }}>
            Primaria: {profession.primaria} | Secondaria: {profession.secondaria}
          </div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-spell-lists-border)', borderRadius: '0.6rem', background: 'var(--theme-spell-lists-bg)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-spell-lists-text)' }}>Reame Magico</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-spell-lists-text)', marginTop: '0.2rem' }}>{selectedRealm || 'Nessuno'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-spell-lists-text)', opacity: 0.85, marginTop: '0.15rem' }}>
            {profession['liste incantesimi'] && <span>Liste: <strong>{profession['liste incantesimi']}</strong></span>}
            {profession['limite incantesimi'] && <span className="block text-[10px] italic opacity-85 mt-0.5">{profession['limite incantesimi']}</span>}
          </div>
        </div>
      </div>

      {/* Box Apprendimento Liste Incantesimi Sviluppo Livello 1 */}
      {selectedRealm && (
        <div className="mb-6 p-4 border border-indigo-200 bg-indigo-50/50 rounded flex flex-col gap-3">
          <div className="flex justify-between items-center font-bold">
            <span className="text-sm uppercase tracking-wider text-indigo-800">Apprendimento Lista Incantesimi (Sviluppo Livello 1)</span>
            <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">
              {hasAcquiredInApprenticeship ? `PS spesi: ${listPS} / ${listPool}` : `Pool: ${listPool} PS`}
            </span>
          </div>

          <div className="text-xs text-indigo-900 mb-1 space-y-1 font-medium">
            {knownLists.length > 0 && (
              <div className="mb-2 text-[11px] p-2 rounded bg-white/50 border border-indigo-200">
                <div className="font-semibold mb-1 text-indigo-800">Liste già apprese:</div>
                <div className="flex flex-wrap gap-1">
                  {knownLists.map(l => (
                    <span key={l} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!hasAcquiredInApprenticeship ? (
              <>
                <p><strong>Credito ereditato:</strong> {baseAccumulated}%</p>
                <p><strong>Punti pool Liste ({listPool} PS):</strong> +{listPool * 20}%</p>
                <p className="text-sm font-bold text-indigo-700 mt-2">Probabilità Totale: {totalChance}%</p>
              </>
            ) : (
              <>
                <p><strong>Lista incantesimo appresa!</strong> Costo: {listPS} PS</p>
                <p><strong>Credito rimanente per livello successivo:</strong> {characterData.spellListChanceAccumulated}%</p>
              </>
            )}
          </div>

          {hasAcquiredInApprenticeship ? (
            <div className="text-sm text-indigo-700 bg-indigo-100 p-2.5 rounded border border-indigo-200 flex justify-between items-center font-medium">
              <span>Hai imparato con successo: <strong>{acquiredListName}</strong></span>
              <button
                type="button"
                onClick={handleRemoveSpellList}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-bold transition shadow-sm"
              >
                Rimuovi
              </button>
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-2">
              {totalChance >= 100 ? (
                <div className="space-y-2">
                  <div className="text-xs bg-green-100 text-green-800 p-2 rounded border border-green-300">
                    Probabilità totale ≥ 100%! Puoi scegliere e apprendere una nuova lista incantesimi.
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded border-indigo-300 text-sm p-1.5 bg-white"
                      value={selectedNewList}
                      onChange={(e) => setSelectedNewList(e.target.value)}
                    >
                      <option value="">-- Seleziona Lista --</option>
                      {availableLists.map(l => (
                        <option key={l.nome_lista} value={l.nome_lista}>{l.nome_lista} ({l.tipo_lista})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                      disabled={!selectedNewList}
                      onClick={handleAcquireList}
                    >
                      Conferma
                    </button>
                  </div>
                </div>
              ) : totalChance > 0 ? (
                <div className="space-y-3">
                  {spellAttemptStatus === 'none' && (
                    <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 space-y-2">
                      <p className="text-xs text-amber-900 font-medium">
                        Hai una Probabilità Totale del <strong>{totalChance}%</strong> di apprendere una lista. Scegli se tentare il tiro o accumulare la probabilità come credito:
                      </p>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={handleSelectAccumulate}
                          className="flex-1 py-1.5 px-3 rounded text-xs font-bold bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50 transition"
                        >
                          Accumula come credito
                        </button>
                        <div className="flex-1 flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => handleSpellRoll()}
                            className="flex-1 py-1.5 px-3 rounded text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                          >
                            Tenta il tiro (1d100)
                          </button>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="Dado"
                              value={manualSpellRoll}
                              onChange={(e) => setManualSpellRoll(e.target.value)}
                              className="w-14 p-1.5 border rounded text-xs text-center bg-white"
                              min="1"
                              max="100"
                            />
                            <button
                              type="button"
                              onClick={() => handleSpellRoll(manualSpellRoll)}
                              disabled={!manualSpellRoll || isNaN(parseInt(manualSpellRoll))}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-2 py-1.5 rounded text-xs disabled:opacity-50"
                            >
                              Vai
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {spellAttemptStatus === 'accumulate' && (
                    <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/30 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-indigo-900 font-medium">
                          Hai scelto di <strong>accumulare la probabilità del {totalChance}%</strong> come credito per il prossimo livello.
                        </p>
                        <p className="text-[10px] text-gray-500">Nessun tiro effettuato.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelSpellAttempt}
                        className="text-xs font-bold text-red-650 hover:text-red-800 border border-red-200 hover:border-red-300 bg-white px-2.5 py-1.5 rounded transition"
                      >
                        Annulla scelta
                      </button>
                    </div>
                  )}

                  {spellAttemptStatus === 'failed' && (
                    <div className="p-3 rounded-lg border border-red-200 bg-red-50/30 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-red-900 font-medium">
                          Tentativo fallito! Hai ottenuto <strong>{spellAttemptRoll}</strong> al dado (necessario ≤ {totalChance}).
                        </p>
                        <p className="text-[10px] text-gray-500">
                          La probabilità del {totalChance}% è stata convertita in credito per il livello successivo.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelSpellAttempt}
                        className="text-xs font-bold text-red-650 hover:text-red-800 border border-red-200 hover:border-red-300 bg-white px-2.5 py-1.5 rounded transition"
                      >
                        Annulla tiro
                      </button>
                    </div>
                  )}

                  {spellAttemptStatus === 'success' && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border border-green-250 bg-green-50/30 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-green-900 font-medium">
                            Tentativo riuscito! Hai ottenuto <strong>{spellAttemptRoll}</strong> al dado (necessario ≤ {totalChance}).
                          </p>
                          <p className="text-[10px] text-gray-500">Seleziona e acquisisci una nuova lista per completare il livello.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelSpellAttempt}
                          className="text-xs font-bold text-red-655 hover:text-red-800 border border-red-200 hover:border-red-300 bg-white px-2.5 py-1.5 rounded transition"
                        >
                          Annulla tiro
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 rounded border-indigo-300 text-sm p-1.5 bg-white"
                          value={selectedNewList}
                          onChange={(e) => setSelectedNewList(e.target.value)}
                        >
                          <option value="">-- Seleziona Lista --</option>
                          {availableLists.map(l => (
                            <option key={l.nome_lista} value={l.nome_lista}>{l.nome_lista} ({l.tipo_lista})</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                          disabled={!selectedNewList}
                          onClick={handleAcquireList}
                        >
                          Conferma
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">
                  Non hai probabilità o punti assegnati a questo pool.
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* Pannello Trasferimento Punti - 2 Fasi */}
      <div className="card rounded-lg p-5 mb-8 shadow-sm" style={{ border: '1px solid var(--theme-primary-skills-border)', backgroundColor: 'var(--theme-primary-skills-bg)' }}>
        <h4 className="font-bold mb-2 text-base flex items-center gap-2" style={{ color: 'var(--theme-primary-skills-text)' }}>
          <span>🔄</span> Trasferimento Punti Sviluppo (PS)
        </h4>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--theme-primary-skills-text)', opacity: 0.9 }}>
          Il trasferimento avviene in <strong>2 fasi</strong>: prima si prelevano PS da una categoria nel <strong>Pool Intermedio</strong>, poi si distribuiscono dal Pool alle categorie di destinazione.<br />
          Regole di conversione (fase 2): Verso <strong>Percezione</strong>: <strong>1:1</strong> · Verso categorie con base &gt; 0: <strong>2:1</strong> · Verso categorie con base = 0: <strong>4:1</strong>
        </p>

        {/* FASE 1: Preleva nel Pool */}
        <div className="bg-white rounded-lg border p-4 mb-3" style={{ borderColor: 'var(--theme-primary-skills-border)' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-primary-skills-text)' }}>
            📥 Fase 1 — Preleva nel Pool Intermedio (1:1)
          </div>
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-purple-900 mb-1">Categoria Sorgente</label>
              <select
                value={depositSource}
                onChange={(e) => setDepositSource(e.target.value)}
                className="w-full rounded border-purple-200 text-sm p-2 bg-white"
              >
                <option value="">-- Seleziona --</option>
                {TGP4_POOLS.map(p => {
                  const pool = poolsState[p.key];
                  if (!pool || pool.remaining <= 0) return null;
                  return (
                    <option key={p.key} value={p.key}>
                      {p.label} ({pool.remaining} PS disp.)
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-900 mb-1">PS da spostare nel Pool</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setDepositPoints(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-sm font-bold">-</button>
                <span className="w-10 text-center font-bold text-sm">{depositPoints}</span>
                <button type="button" onClick={() => setDepositPoints(prev => prev + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-sm font-bold">+</button>
              </div>
            </div>
            <button type="button" onClick={handleAddDeposit} disabled={!depositSource}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-2 px-4 rounded text-sm transition shadow-sm">
              Conferma Prelievo →
            </button>
          </div>
        </div>

        {/* Pool Balance Badge */}
        <div className={`flex items-center justify-center gap-3 rounded-lg py-2.5 px-4 mb-3 font-bold text-sm ${poolBalance > 0 ? 'bg-amber-100 border border-amber-300 text-amber-900' : 'bg-gray-100 border border-gray-200 text-gray-500'
          }`}>
          <span style={{ fontSize: '1.1rem' }}>🪙</span>
          <span>Pool Intermedio: <strong>{poolBalance} PS</strong> disponibili</span>
          {poolBalance > 0 && <span className="text-xs font-normal">(da distribuire in Fase 2)</span>}
        </div>

        {/* FASE 2: Distribuisci dal Pool */}
        {poolBalance > 0 && (
          <div className="bg-white rounded-lg border p-4 mb-3" style={{ borderColor: '#c4b5fd' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#7c3aed' }}>
              📤 Fase 2 — Distribuisci dal Pool alla Destinazione
            </div>
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">Categoria Destinazione</label>
                <select
                  value={withdrawDest}
                  onChange={(e) => setWithdrawDest(e.target.value)}
                  className="w-full rounded text-sm p-2 bg-white"
                  style={{ border: '1px solid #c4b5fd' }}
                >
                  <option value="">-- Seleziona --</option>
                  {TGP4_POOLS.map(p => (
                    <option key={p.key} value={p.key}>
                      {p.label} (base: {poolsState[p.key]?.base || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">PS da ricevere</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setWithdrawPoints(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-sm font-bold">-</button>
                  <span className="w-10 text-center font-bold text-sm">{withdrawPoints}</span>
                  <button type="button" onClick={() => setWithdrawPoints(prev => prev + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-sm font-bold">+</button>
                </div>
                {withdrawDest && (() => {
                  const { rate, cost } = getTransferRate(withdrawDest, withdrawPoints);
                  const ok = poolBalance >= cost;
                  return (
                    <div className={`text-[11px] mt-1 font-medium ${ok ? 'text-purple-800' : 'text-red-700'}`}>
                      Tariffa {rate} → costo <strong>{cost} PS</strong> dal Pool {!ok && '⚠️ insufficienti'}
                    </div>
                  );
                })()}
              </div>
              <button type="button" onClick={handleAddWithdrawal} disabled={!withdrawDest}
                className="w-full text-white font-bold py-2 px-4 rounded text-sm transition shadow-sm"
                style={{ backgroundColor: '#7c3aed' }}>
                Conferma Distribuzione →
              </button>
            </div>
          </div>
        )}

        {/* Reset Button */}
        {tgp4Transfers.length > 0 && (
          <div className="flex justify-end mb-3">
            <button type="button" onClick={handleResetTransfers}
              className="text-xs text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 px-3 py-1.5 rounded font-bold transition">
              🔁 Reset Completo Trasferimenti
            </button>
          </div>
        )}

        {/* Tabella Operazioni Attive */}
        {tgp4Transfers.length > 0 ? (
          <div className="bg-white rounded-lg border border-purple-100 overflow-hidden">
            <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900">Operazioni di Trasferimento Attive</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/50 text-purple-900 uppercase font-bold text-[10px] tracking-wider border-b border-purple-100">
                <tr>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Da / A</th>
                  <th className="px-4 py-2 text-center">PS Spostati</th>
                  <th className="px-4 py-2 text-center">Tariffa</th>
                  <th className="px-4 py-2 text-center">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {tgp4Transfers.map(t => (
                  <tr key={t.id} className="hover:bg-purple-50/30">
                    <td className="px-4 py-2">
                      {t.type === 'deposit'
                        ? <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold">📥 Prelievo</span>
                        : <span className="px-1.5 py-0.5 bg-violet-100 text-violet-800 rounded text-[10px] font-bold">📤 Distribuzione</span>
                      }
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-800">
                      {t.type === 'deposit'
                        ? <><em>{t.source}</em> → Pool</>
                        : <>Pool → <em>{t.dest}</em></>
                      }
                    </td>
                    <td className="px-4 py-2 text-center font-bold">
                      {t.type === 'deposit'
                        ? <span className="text-indigo-700">-{t.points} PS sorgente</span>
                        : <><span className="text-green-700">+{t.pointsReceived} PS</span> <span className="text-red-600 text-[10px]">(-{t.cost} Pool)</span></>
                      }
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-gray-600">
                      {t.type === 'deposit' ? '1:1' : t.rate}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button type="button" onClick={() => handleDeleteEntry(t.id)}
                        className="text-red-600 hover:text-red-900 hover:underline font-bold text-[11px]">
                        Rimuovi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-purple-500 italic text-center py-2">Nessun trasferimento attivo.</div>
        )}
      </div>

      {/* ── LINGUE ── */}
      <div className="card mb-8" style={{ borderColor: 'var(--theme-languages-border)' }}>
        <div className="card-header border-b" style={{ background: 'var(--theme-languages-bg)', borderBottomColor: 'var(--theme-languages-border)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 className="font-semibold m-0 text-sm uppercase tracking-wider" style={{ color: 'var(--theme-languages-text)' }}>🌐 Lingue Conosciute (Sviluppo Livello 1)</h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', background: '#fff', border: '1px solid var(--theme-languages-border)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', color: 'var(--theme-languages-text)', fontWeight: 'bold' }}>
              Punti totali: <strong>{poolsState['Lingue']?.adjustedPool || 0}</strong>
            </span>
            <span style={{
              fontSize: '0.8rem',
              backgroundColor: languagePointsLeft > 0 ? '#fee2e2' : '#dcfce7',
              color: languagePointsLeft > 0 ? '#991b1b' : '#166534',
              paddingLeft: '5px',
              paddingRight: '5px',
              paddingTop: '0.25rem',
              paddingBottom: '0.25rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold'
            }}>
              Rimasti: <strong>{languagePointsLeft}</strong>
            </span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '1rem' }}>
          <p className="text-xs text-muted mb-4">Spendi i Punti Sviluppo del pool Lingue per migliorare le lingue conosciute o apprenderne di nuove (max Grado 5).</p>
          <div className="flex flex-col gap-2">
            {Object.entries(languages).sort((a, b) => a[0].localeCompare(b[0])).map(([lang, data]) => {
              const total = (data.base || 0) + (data.added || 0);
              const gradeInfo = gradiLingue.find(g => g.grado === total);
              return (
                <div key={lang} className="flex items-center justify-between p-2.5 border rounded-lg bg-white" style={{ borderColor: 'var(--theme-languages-border)' }}>
                  <div>
                    <strong className="text-sm text-gray-900">{lang}</strong>
                    {data.base > 0 && <span className="ml-2 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Base ({data.base})</span>}
                    {data.addedAdolescenza > 0 && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">+{data.addedAdolescenza} Adolescenza</span>}
                    {data.addedLivello1 > 0 && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">+{data.addedLivello1} Liv. 1</span>}
                    {data.fromBg && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">BG</span>}
                    <div className="text-[11px] text-gray-500 mt-1">{gradeInfo?.conoscenza || ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-lg min-w-[1.5rem] text-center text-blue-900">{total}</strong>
                    <button type="button" onClick={() => addLangPoint(lang)} disabled={languagePointsLeft <= 0 || total >= 5} className="w-7 h-7 border rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-sm font-bold">+</button>
                    <button type="button" onClick={() => removeLangPoint(lang)} disabled={!data.addedLivello1 || data.addedLivello1 <= 0} className="w-7 h-7 border rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-sm font-bold">−</button>
                  </div>
                </div>
              );
            })}
          </div>

          {languagePointsLeft > 0 && (
            <div className="mt-4 pt-4 border-t flex gap-2 items-center" style={{ borderTopColor: 'var(--theme-languages-border)' }}>
              <select defaultValue="" id="lang-add-select-level1" className="flex-1 rounded border-gray-300 text-xs p-2 bg-white">
                <option value="" disabled>-- Nuova lingua da apprendere --</option>
                {allLanguages.filter(l => !languages[l] || ((languages[l].base || 0) + (languages[l].added || 0)) < 5).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button
                type="button"
                className="bg-blue-600 text-white font-bold py-1.5 px-3 rounded text-xs hover:bg-blue-700 transition"
                onClick={() => { const s = document.getElementById('lang-add-select-level1'); if (s.value) { addNewLang(s.value); s.value = ''; } }}
              >
                + Apprendi
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mb-6 text-muted">
        I gradi della tua professione (<strong>TB_6</strong>) sono mostrati per consultazione. Spendi i tuoi Punti Sviluppo (<strong>TGP_4</strong>) per il Livello 1.<br />
        Ricorda che in TGP_4 il 1° grado costa 1 PS, il 2° grado costa altri 2 PS (totale 3). Max 2 gradi per livello (eccetto Manovre in Movimento).
      </p>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {categories.map(cat => {
          const catSkills = primarySkillsList.filter(s => s.categoria === cat);
          if (catSkills.length === 0) return null;

          // Determine pools for this category
          const poolsInCat = [];
          const normCat = cat.toLowerCase().trim();
          if (normCat === 'di manovra e movimento') {
            poolsInCat.push(poolsState['Manovre in Movimento']);
          } else if (normCat === 'con le armi') {
            poolsInCat.push(poolsState['Abilità armi']);
          } else if (normCat === 'generali') {
            poolsInCat.push(poolsState['Abilità generiche']);
          } else if (normCat === 'sotterfugio') {
            poolsInCat.push(poolsState['Abilità sotterfugio']);
          } else if (normCat === 'magiche') {
            poolsInCat.push(poolsState['Abilità magiche']);
          } else if (normCat === 'bonus e abilità varie') {
            poolsInCat.push(poolsState['Resistenza fisica']);
            poolsInCat.push(poolsState['Percezione']);
          }

          const tb6PoolSize = getTb6PoolSize(cat, profession);
          const spentTb6 = catSkills.reduce((sum, s) => sum + (tb6Distribution[s.nome] || 0), 0);

          return (
            <div key={cat} className="card rounded-lg overflow-hidden shadow-sm" style={{ border: '1px solid var(--theme-primary-skills-border)' }}>
              <div className="border-b flex justify-between items-center" style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--theme-primary-skills-bg)', borderBottomColor: 'var(--theme-primary-skills-border)' }}>
                <h4 className="font-semibold m-0 text-sm uppercase tracking-wider" style={{ color: 'var(--theme-primary-skills-text)' }}>{cat}</h4>
                <div className="flex flex-wrap gap-3 text-xs">
                  {tb6PoolSize > 0 && (() => {
                    const isTb6Full = spentTb6 === tb6PoolSize;
                    return (
                      <span
                        className="rounded font-bold text-xs"
                        style={{
                          backgroundColor: isTb6Full ? '#dcfce7' : '#fee2e2',
                          color: isTb6Full ? '#166534' : '#991b1b',
                          paddingLeft: '5px',
                          paddingRight: '5px',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                        }}
                      >
                        TB_6: {spentTb6} / {tb6PoolSize} Gradi
                      </span>
                    );
                  })()}
                  {poolsInCat.map(p => {
                    if (!p) return null;
                    const hasPool = p.base > 0 || p.received > 0;
                    if (!hasPool) return null;
                    const isFull = p.remaining <= 0;
                    return (
                      <span
                        key={p.key}
                        className="rounded font-bold text-xs"
                        style={{
                          backgroundColor: isFull ? '#dcfce7' : '#fee2e2',
                          color: isFull ? '#166534' : '#991b1b',
                          paddingLeft: '5px',
                          paddingRight: '5px',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                        }}
                      >
                        PS {p.label}: {p.spentOnSkills} / {p.adjustedPool} spesi {p.received > 0 ? `(+${p.received} trasf.)` : ''} {p.transferredOut > 0 ? `(-${p.transferredOut} trasf.)` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="card-body overflow-x-auto" style={{ padding: '0' }}>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2">Abilità</th>
                      <th className="px-2 py-2 text-center">G. adolescenza</th>
                      <th className="px-2 py-2 text-center bg-blue-50/30">G. bonus prof.</th>
                      <th className="px-2 py-2 text-center bg-purple-50/50">G. svil. prof.</th>
                      <th className="px-2 py-2 text-center">G. background</th>
                      <th className="px-2 py-2 text-center font-bold">G. TOTALE</th>
                      <th className="px-2 py-2 text-center">Bonus sviluppo</th>
                      <th className="px-2 py-2 text-center">Bonus caratt.</th>
                      <th className="px-2 py-2 text-center">Speciale</th>
                      <th className="px-2 py-2 text-center font-bold">Bonus TOTALE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catSkills.map((sk) => {
                      const name = sk.nome;
                      const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';

                      const adRanks = isCogliereAlleSpalle ? 0 : (baseSkills[name]?.adolescenceRanks || 0);
                      const profFixedRanks = isCogliereAlleSpalle ? 0 : getSpecificTb6Ranks(name, profession);
                      const tb6Ranks = isCogliereAlleSpalle ? 0 : (tb6Distribution[name] || 0);
                      const profRanks = profFixedRanks + tb6Ranks;

                      const tgp4Ranks = tgp4Distribution[name] || 0;
                      const totalRanks = adRanks + profRanks + tgp4Ranks;
                      const bonusGradi = getRanksBonus(name, totalRanks);

                      const max = getMaxRanks(name);

                      // Find pool state for this specific skill
                      let poolKey;
                      const normName = name.toLowerCase().trim();
                      if (normName === 'resistenza fisica') {
                        poolKey = 'Resistenza fisica';
                      } else if (normName === 'percezione') {
                        poolKey = 'Percezione';
                      } else {
                        const normCat = sk.categoria?.toLowerCase()?.trim();
                        if (normCat === 'di manovra e movimento') poolKey = 'Manovre in Movimento';
                        else if (normCat === 'con le armi') poolKey = 'Abilità armi';
                        else if (normCat === 'generali') poolKey = 'Abilità generiche';
                        else if (normCat === 'sotterfugio') poolKey = 'Abilità sotterfugio';
                        else if (normCat === 'magiche') poolKey = 'Abilità magiche';
                      }

                      const pool = poolKey ? poolsState[poolKey] : null;
                      const hasTgp4Pool = pool !== null;
                      const isMM = poolKey === 'Manovre in Movimento';
                      const isNoLimit = isMM;

                      const nextRankCost = isNoLimit ? 1 : (tgp4Ranks === 0 ? 1 : 2);
                      let meetsLimit = true;
                      if (max !== null) {
                        meetsLimit = totalRanks < max;
                      } else {
                        meetsLimit = tgp4Ranks < 2;
                      }
                      const canAddTgp4 = pool && meetsLimit && (pool.remaining >= nextRankCost);

                      // Stat bonus for this skill
                      const carattSiglaMatch = (sk['valore iniziale'] || '').match(/([A-Z]{2})$/);
                      const carattSigla = carattSiglaMatch ? carattSiglaMatch[1] : '';
                      const carattBonus = isCogliereAlleSpalle ? 0 : (carattSigla ? finalStats[carattSigla]?.bonusTot || 0 : 0);

                      const ingombroBonus = getIngombroBonus(name);
                      const hasIngombro = ingombroBonus !== null;
                      const specialBonus = bgModifiers.primarySkillsSpecialBonus?.[name] || 0;
                      const hasSpecialBonus = specialBonus !== 0;
                      const displaySpecial = (hasIngombro || hasSpecialBonus) ? (specialBonus + (ingombroBonus ?? 0)) : null;

                      let totalBonus;
                      if (typeof bonusGradi === 'number') {
                        totalBonus = bonusGradi + carattBonus + specialBonus + (ingombroBonus ?? 0);
                      } else {
                        totalBonus = bonusGradi;
                      }
                      let totalBonusStr = typeof totalBonus === 'number' ? fmt(totalBonus) : totalBonus;
                      if (normName === 'resistenza fisica') {
                        const coBonus = carattBonus || 0;
                        const otherBonus = coBonus + 5 + specialBonus;
                        totalBonusStr = `${bonusGradi} e ${fmt(otherBonus)}`;
                      }

                      return (
                        <tr key={name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{name}</td>
                          <td className="px-2 py-2 text-center text-gray-500">{adRanks}</td>
                          <td className="px-2 py-2 text-center bg-blue-50/30 text-blue-700 font-semibold">
                            {profRanks > 0 ? `+${profRanks}` : '0'}
                          </td>
                          <td className="px-2 py-2 text-center bg-purple-50/50">
                            {hasTgp4Pool ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSubTgp4(name)}
                                  disabled={tgp4Ranks === 0}
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-300 font-bold"
                                >-</button>
                                <span className="font-bold w-4 text-center text-purple-700">{tgp4Ranks}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddTgp4(name, sk.categoria)}
                                  disabled={!canAddTgp4}
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-300 font-bold"
                                >+</button>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-400">—</td>
                          <td className="px-2 py-2 text-center font-bold text-gray-800">
                            {totalRanks} {max !== null ? <span className="text-[10px] font-normal text-gray-500">({max} max)</span> : ''}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-gray-700">
                            {typeof bonusGradi === 'number' ? fmt(bonusGradi) : bonusGradi}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600">
                            {carattSigla ? `${carattSigla} ${fmt(carattBonus)}` : '—'}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600">
                            {displaySpecial !== null ? fmt(displaySpecial) : '—'}
                          </td>
                          <td className="px-2 py-2 text-center font-black text-primary-color">
                            {totalBonusStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SVILUPPO ABILITA' SECONDARIE ── */}
      <div className="card rounded-lg overflow-hidden shadow-sm mb-8" style={{ border: '1px solid var(--theme-primary-skills-border)' }}>
        <div className="border-b flex justify-between items-center" style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--theme-primary-skills-bg)', borderBottomColor: 'var(--theme-primary-skills-border)' }}>
          <h4 className="font-semibold m-0 text-sm uppercase tracking-wider" style={{ color: 'var(--theme-primary-skills-text)' }}>
            🌟 Sviluppo Abilità Secondarie (Livello 1)
          </h4>
        </div>
        <div className="card-body" style={{ padding: '1rem' }}>
          <p className="text-xs text-muted mb-4">
            Spendi i punti sviluppo delle categorie corrispondenti per migliorare o apprendere abilità secondarie. Il costo è di <strong>1 PS per grado (1:1)</strong>, con un massimo di <strong>2 gradi</strong> per livello/fase.
          </p>

          {possessedSecondarySkills.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap mb-4">
                <thead className="bg-gray-50/50 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2">Abilità (Categoria)</th>
                    <th className="px-2 py-2 text-center">G. background</th>
                    <th className="px-2 py-2 text-center bg-purple-50/50">G. svil. prof (Liv. 1)</th>
                    <th className="px-2 py-2 text-center font-bold">G. TOTALE</th>
                    <th className="px-2 py-2 text-center">Bonus sviluppo</th>
                    <th className="px-2 py-2 text-center">Bonus caratt.</th>
                    <th className="px-2 py-2 text-center">Speciale</th>
                    <th className="px-2 py-2 text-center font-bold">Bonus TOTALE</th>
                    <th className="px-2 py-2 text-center">Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {possessedSecondarySkills.map(name => {
                    const bgSkill = bgModifiers.secondarySkills?.[name];
                    const isNew = newSecondarySkills.includes(name);
                    
                    let category = bgSkill?.categoria;
                    let characteristic = bgSkill?.caratteristica_associata || bgSkill?.caratteristica;
                    let bgRanks = bgSkill?.bgRanks || 0;
                    let specialBonus = bgSkill?.specialBonus || 0;

                    if (!bgSkill) {
                      const defSkill = secondarySkillsList.find(s => s.abilita_secondaria === name);
                      category = defSkill?.categoria || '';
                      characteristic = defSkill?.caratteristica_associata || '';
                      bgRanks = 0;
                      specialBonus = 0;
                    }

                    const tgp4Ranks = tgp4SecondarySkillsDistribution[name] || 0;
                    const totalRanks = bgRanks + tgp4Ranks;
                    const bonusGradi = getRanksBonus(name, totalRanks);
                    const carattBonus = characteristic ? (finalStats[characteristic]?.bonusTot || 0) : 0;
                    const totalBonus = (typeof bonusGradi === 'number' ? bonusGradi : 0) + carattBonus + specialBonus;

                    const poolKey = getTgp4CategoryKeyForSecondary(category);
                    const pool = poolKey ? poolsState[poolKey] : null;
                    const canAdd = pool && tgp4Ranks < 2 && pool.remaining >= 1;

                    return (
                      <tr key={name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <span className="font-medium text-gray-900">{name}</span>
                          <span className="block text-[10px] text-gray-500 font-normal">{category} ({characteristic})</span>
                        </td>
                        <td className="px-2 py-2 text-center text-gray-500">{bgRanks}</td>
                        <td className="px-2 py-2 text-center bg-purple-50/50">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSubSecondaryTgp4(name)}
                              disabled={tgp4Ranks === 0}
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-300 font-bold"
                            >-</button>
                            <span className="font-bold w-4 text-center text-purple-700">{tgp4Ranks}</span>
                            <button
                              type="button"
                              onClick={() => handleAddSecondaryTgp4(name, category)}
                              disabled={!canAdd}
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-300 font-bold"
                            >+</button>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center font-bold text-gray-800">{totalRanks}</td>
                        <td className="px-2 py-2 text-center font-bold text-gray-700">{fmt(bonusGradi)}</td>
                        <td className="px-2 py-2 text-center text-gray-600">
                          {characteristic ? `${characteristic} ${fmt(carattBonus)}` : '—'}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-600">{specialBonus !== 0 ? fmt(specialBonus) : '—'}</td>
                        <td className="px-2 py-2 text-center font-black text-primary-color">{fmt(totalBonus)}</td>
                        <td className="px-2 py-2 text-center">
                          {isNew && (
                            <button
                              type="button"
                              onClick={() => handleRemoveNewSecondarySkill(name)}
                              className="text-xs text-red-650 hover:text-red-800 hover:underline font-bold"
                            >
                              Rimuovi
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic mb-4">Nessuna abilità secondaria posseduta. Seleziona un'abilità dal menu in basso per apprenderla.</div>
          )}

          <div className="flex gap-2 items-center pt-3 border-t border-gray-100">
            <select
              defaultValue=""
              id="secondary-add-select-level1"
              className="flex-1 rounded border-gray-300 text-xs p-2 bg-white"
            >
              <option value="" disabled>-- Seleziona nuova abilità secondaria da apprendere --</option>
              {availableSecondarySkillsForLearn.map(s => (
                <option key={s.abilita_secondaria} value={s.abilita_secondaria}>
                  {s.abilita_secondaria} ({s.categoria} - {s.caratteristica_associata})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="bg-indigo-600 text-white font-bold py-1.5 px-3 rounded text-xs hover:bg-indigo-700 transition"
              onClick={() => {
                const s = document.getElementById('secondary-add-select-level1');
                if (s && s.value) {
                  handleLearnSecondarySkill(s.value);
                  s.value = '';
                }
              }}
            >
              + Apprendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
