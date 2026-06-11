import { useState, useEffect, useMemo } from 'react';
import AnagraficaReadOnlyBox from '../shared/AnagraficaReadOnlyBox';
import { Plus, Minus, Trash2, Check, AlertCircle, ArrowRight, Sparkles, Languages, ArrowLeft } from 'lucide-react';
import EquipmentStep from './EquipmentStep';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import { getAvailableSpellLists } from '../../../utils/magicHelpers';

// Nuove tabelle relazionali normalizzate
import languagesData from '../../../data/languages.json';

import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getSpecificTb6Ranks,
  getFinalStats,
  fmt,
  getTgp4PoolSize,
  getProfessionRanksForLevel,
  getHpDiceForIncrement,
  getCharacterHpTot
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

const getTgp4Cost = (ranks) => {
  if (ranks === 0) return 0;
  if (ranks === 1) return 1;
  if (ranks === 2) return 3; // 1 per il primo, 2 per il secondo
  return 3 + (ranks - 2);
};

const getTgp4CostForMM = (ranks) => ranks; // Movimento e manovra costa 1 a 1

export default function LearningStep({ characterData, setCharacterData }) {
  const race = characterData.race;
  const profession = characterData.profession;
  const baseSkills = characterData.adolescenceSkills || {};
  const level1Tb6 = characterData.level1Tb6 || {};
  const level1Tgp4 = characterData.level1Tgp4 || {};
  const levelDevelopments = characterData.levelDevelopments || [];

  // Calcoliamo il livello corrente complessivo del personaggio
  const currentCharacterLevel = 1 + levelDevelopments.length;

  const getMagicRealmSummaryStep9 = () => {
    const spellListAllocations = characterData.spellListAllocations || {};
    const bgSpellLists = characterData.background?.compiledModifiers?.bgSpellLists || [];
    const allLists = [...new Set([...Object.keys(spellListAllocations), ...bgSpellLists])];
    
    if (allLists.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {allLists.map((name, i) => (
            <div key={i}>Lista incantesimi {name} appresa.</div>
          ))}
        </div>
      );
    }
    
    const inheritedChance = levelDevelopments.length > 0
      ? levelDevelopments[levelDevelopments.length - 1].spellListChanceAccumulated
      : (characterData.spellListChanceAccumulated || 0);
      
    return <div>Nessuna lista incantesimi appresa - Credito ereditato: {inheritedChance}%</div>;
  };

  // Stato per la gestione del livello attualmente in sviluppo (se presente)
  const [activeLevel, setActiveLevel] = useState(null);

  // Stato per visualizzare l'editor dell'equipaggiamento all'interno dello sviluppo livelli
  const [showEquipmentEditor, setShowEquipmentEditor] = useState(false);

  useEffect(() => {
    let err = null;
    if (activeLevel !== null) {
      err = `Completa o annulla lo sviluppo del livello ${activeLevel.level} in corso prima di proseguire.`;
    }

    if (characterData.stepErrors?.learning !== err) {
      setCharacterData(prev => ({
        ...prev,
        stepErrors: {
          ...(prev.stepErrors || {}),
          learning: err
        }
      }));
    }
  }, [activeLevel, characterData.stepErrors, setCharacterData]);

  // Inizializza l'interfaccia o aggiorna in base allo stato globale
  const handleStartNewLevel = () => {
    const nextLevelNum = currentCharacterLevel + 1;

    // Determina la probabilità incantesimi ereditata
    let inheritedChance = characterData.spellListChanceAccumulated || 0;
    if (levelDevelopments.length > 0) {
      inheritedChance = levelDevelopments[levelDevelopments.length - 1].spellListChanceAccumulated;
    }

    setDepositSource('');
    setDepositPoints(1);
    setWithdrawDest('');
    setWithdrawPoints(1);

    setActiveLevel({
      level: nextLevelNum,
      tgp4Distribution: { 'Liste incantesimi': 0 },
      tgp4Transfers: [],
      spellListChanceAccumulated: inheritedChance,
      spellListAllocations: {},
      hpRoll: null,
      hpRollConfirmed: false,
      languages: {}, // lingua -> gradi acquistati
      selectedNewList: ''
    });
  };

  const handleCancelActiveLevel = () => {
    if (confirm(`Annullare lo sviluppo del livello ${activeLevel.level}? Tutti i progressi non salvati andranno persi.`)) {
      setActiveLevel(null);
      setDepositSource('');
      setDepositPoints(1);
      setWithdrawDest('');
      setWithdrawPoints(1);
    }
  };

  const handleRemoveLastLevel = () => {
    if (levelDevelopments.length === 0) return;
    const last = levelDevelopments[levelDevelopments.length - 1];
    if (confirm(`Rimuovere completamente il Livello ${last.level}? Questa azione è irreversibile.`)) {
      // Dobbiamo rimuovere l'ultimo livello e ripristinare le statistiche
      const updatedDevelopments = levelDevelopments.slice(0, -1);
      
      // Calcola le nuove liste incantesimi
      const updatedAllocations = { ...characterData.spellListAllocations };
      // Rimuovi quelle associate a questo livello
      Object.keys(updatedAllocations).forEach(k => {
        if (updatedAllocations[k] === `Livello ${last.level}`) {
          delete updatedAllocations[k];
        }
      });

      // Calcola la probabilità di incantesimo ripristinata
      let prevChance = characterData.spellListChanceAccumulated || 0;
      if (updatedDevelopments.length > 0) {
        prevChance = updatedDevelopments[updatedDevelopments.length - 1].spellListChanceAccumulated;
      } else {
        // Ritorna al livello 1
        prevChance = characterData.spellListChanceAccumulated; 
      }

      // Ripristina le lingue spesa
      const updatedLanguages = { ...characterData.background?.languages };
      if (last.languages) {
        Object.keys(last.languages).forEach(lang => {
          if (updatedLanguages[lang]) {
            updatedLanguages[lang].added = Math.max(0, (updatedLanguages[lang].added || 0) - (last.languages[lang] || 0));
          }
        });
      }

      // Ricalcola le abilità globali
      const newSkills = recalculateSkills(updatedDevelopments, updatedLanguages);

      setCharacterData(prev => ({
        ...prev,
        levelDevelopments: updatedDevelopments,
        spellListAllocations: updatedAllocations,
        skills: newSkills,
        background: {
          ...(prev.background || {}),
          languages: updatedLanguages
        }
      }));
    }
  };

  // Helper per ricalcolare le abilità consolidando tutto
  const recalculateSkills = (developments, currentLangsState) => {
    const newSkills = {};
    const finalLevel = 1 + developments.length;
    const bgModifiers = characterData.background?.compiledModifiers || { statsBonus: {}, skillBgRanks: {}, secondarySkills: {}, gold: 0 };

    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';

      // 1. Adolescenza
      const adRanks = isCogliereAlleSpalle ? 0 : (baseSkills[name]?.adolescenceRanks || 0);

      // 2. Base Professione (moltiplicata per il livello finale)
      const baseProfRanks = isCogliereAlleSpalle ? 0 : (getSpecificTb6Ranks(name, profession) + (level1Tb6[name] || 0));
      const professionRanks = isCogliereAlleSpalle ? 0 : getProfessionRanksForLevel(baseProfRanks, finalLevel);

      // 3. Sviluppo TGP_4 Livello 1
      const tgp4RanksL1 = level1Tgp4[name] || 0;

      // 4. Sviluppo TGP_4 Livelli Successivi
      let tgp4RanksLater = 0;
      developments.forEach(d => {
        tgp4RanksLater += d.tgp4Distribution?.[name] || 0;
      });

      // 5. Background extra ranks
      const bgExtra = isCogliereAlleSpalle ? 0 : (bgModifiers.skillBgRanks?.[name] || 0);

      const totalRanks = adRanks + professionRanks + tgp4RanksL1 + tgp4RanksLater + bgExtra;

      newSkills[name] = {
        category: sk.categoria,
        type: sk.tipo,
        valoreIniziale: sk['valore iniziale'],
        adolescenceRanks: adRanks,
        professionRanks: professionRanks,
        tgp4Ranks: tgp4RanksL1 + tgp4RanksLater,
        bgExtra: bgExtra,
        totalRanks: totalRanks,
        specialBonus: characterData.skills?.[name]?.specialBonus || 0,
        itemBonus: characterData.skills?.[name]?.itemBonus || 0,
        learnedRanks: characterData.skills?.[name]?.learnedRanks || 0,
      };
    });

    // Mantieni le altre abilità secondarie
    Object.keys(baseSkills).forEach(name => {
      if (baseSkills[name].category === 'Altre Abilità') {
        newSkills[name] = baseSkills[name];
      }
    });

    return newSkills;
  };

  // Calcolo dinamico dello stato dei pool per il livello attivo
  const activePoolsState = useMemo(() => {
    if (!activeLevel || !profession) return {};

    const state = {};

    // 1. Inizializza pool base
    TGP4_POOLS.forEach(p => {
      let base = getTgp4PoolSize(p.catName, p.skillName, profession.professione);
      
      // Se è 'Liste incantesimi', somma i punti conservati dai livelli precedenti!
      if (p.key === 'Liste incantesimi') {
        if (activeLevel.level === 2) {
          base += characterData.spellListPointsCarriedOver || 0;
        } else {
          const prevLevelDev = levelDevelopments[activeLevel.level - 3];
          if (prevLevelDev && prevLevelDev.spellListPointsCarriedOver) {
            base += prevLevelDev.spellListPointsCarriedOver;
          }
        }
      }

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
    activeLevel.tgp4Transfers.forEach(t => {
      if (t.type === 'deposit') {
        if (state[t.source]) state[t.source].transferredOut += t.points;
      } else if (t.type === 'withdrawal') {
        if (state[t.dest]) state[t.dest].received += t.pointsReceived;
      }
    });

    // 3. Calcola spesa per abilità primarie
    primarySkillsList.forEach(s => {
      const ranks = activeLevel.tgp4Distribution[s.nome] || 0;
      if (ranks === 0) return;

      const normName = s.nome.toLowerCase().trim();
      if (normName === 'resistenza fisica') {
        state['Resistenza fisica'].spentOnSkills += getTgp4Cost(ranks);
      } else if (normName === 'percezione') {
        state['Percezione'].spentOnSkills += ranks; // 1:1
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

    // Punti spesi per le liste incantesimi
    const listPS = activeLevel.tgp4Distribution['Liste incantesimi'] || 0;
    state['Liste incantesimi'].spentOnSkills += listPS;

    // Punti spesi per le lingue
    const langPS = Object.values(activeLevel.languages).reduce((sum, g) => sum + g, 0);
    state['Lingue'].spentOnSkills += langPS;

    // 4. Calcola pool adjusted e rimanenti
    TGP4_POOLS.forEach(p => {
      const s = state[p.key];
      s.adjustedPool = s.base + s.received - s.transferredOut;
      s.remaining = s.adjustedPool - s.spentOnSkills;
    });

    return state;
  }, [activeLevel, profession, levelDevelopments, characterData.spellListPointsCarriedOver]);

  // Calcolo gradi totali per l'interfaccia dell'activeLevel
  const activeLevelSkillRanks = useMemo(() => {
    if (!activeLevel) return {};
    const ranks = {};

    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';

      // Gradi pre-esistenti prima di questo livello
      const adRanks = isCogliereAlleSpalle ? 0 : (baseSkills[name]?.adolescenceRanks || 0);
      const baseProfRanks = isCogliereAlleSpalle ? 0 : (getSpecificTb6Ranks(name, profession) + (level1Tb6[name] || 0));
      const prevProfRanks = isCogliereAlleSpalle ? 0 : getProfessionRanksForLevel(baseProfRanks, activeLevel.level - 1);
      const prevTgp4Ranks = (level1Tgp4[name] || 0) + levelDevelopments.reduce((sum, d) => sum + (d.tgp4Distribution?.[name] || 0), 0);

      const beforeRanks = adRanks + prevProfRanks + prevTgp4Ranks;

      // Incrementi automatici di questo livello
      const currentProfRanks = isCogliereAlleSpalle ? 0 : getProfessionRanksForLevel(baseProfRanks, activeLevel.level);
      const profIncrement = currentProfRanks - prevProfRanks;

      // Spesi in questo livello
      const currentTgp4 = activeLevel.tgp4Distribution[name] || 0;

      ranks[name] = {
        beforeRanks,
        profIncrement,
        currentTgp4,
        total: beforeRanks + profIncrement + currentTgp4
      };
    });

    return ranks;
  }, [activeLevel, baseSkills, profession, level1Tb6, level1Tgp4, levelDevelopments]);

  // Controlli per aggiungere e rimuovere gradi a livello attivo
  const handleAddTgp4 = (skillName, category) => {
    if (!activeLevel) return;
    const normCat = category?.toLowerCase()?.trim();
    const isMM = normCat === 'di manovra e movimento' || category === 'Abilità di Movimento e Manovra';
    const isNoLimit = isMM || skillName.toLowerCase().trim() === 'percezione';
    const currentRanks = activeLevel.tgp4Distribution[skillName] || 0;

    // Massimo 2 gradi per livello, tranne Movimento e Percezione
    if (!isNoLimit && currentRanks >= 2) return;

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
    const pool = activePoolsState[poolKey];
    if (!pool) return;

    const costOfNextRank = isNoLimit ? 1 : (currentRanks === 0 ? 1 : 2);

    if (pool.remaining >= costOfNextRank) {
      const isRF = skillName.toLowerCase().trim() === 'resistenza fisica';
      setActiveLevel(prev => ({
        ...prev,
        tgp4Distribution: {
          ...prev.tgp4Distribution,
          [skillName]: currentRanks + 1
        },
        ...(isRF ? { hpRoll: null, hpRollConfirmed: false } : {})
      }));
    }
  };

  const handleSubTgp4 = (skillName) => {
    if (!activeLevel) return;
    const current = activeLevel.tgp4Distribution[skillName] || 0;
    if (current > 0) {
      // Se riduciamo i gradi di Resistenza Fisica a 0, dobbiamo resettare anche il roll HP
      const isRF = skillName.toLowerCase().trim() === 'resistenza fisica';
      setActiveLevel(prev => ({
        ...prev,
        tgp4Distribution: {
          ...prev.tgp4Distribution,
          [skillName]: current - 1
        },
        ...(isRF ? { hpRoll: null, hpRollConfirmed: false } : {})
      }));
    }
  };

  // Liste Incantesimi
  const listPS = activeLevel?.tgp4Distribution['Liste incantesimi'] || 0;
  const listPool = activePoolsState['Liste incantesimi']?.adjustedPool || 0;

  const baseAccumulated = useMemo(() => {
    if (!activeLevel) return 0;
    if (activeLevel.level === 2) {
      return characterData.spellListChanceAccumulated || 0;
    }
    const prevLevelDev = levelDevelopments[activeLevel.level - 3];
    return prevLevelDev ? (prevLevelDev.spellListChanceAccumulated || 0) : 0;
  }, [activeLevel, characterData.spellListChanceAccumulated, levelDevelopments]);

  const totalSpellChance = baseAccumulated + (listPool * 20);

  const selectedRealm = characterData.magicRealm || 'Essenza';
  const knownLists = useMemo(() => {
    const list = Object.keys(characterData.spellListAllocations || {});
    
    // Aggiungi le liste apprese dal background
    const bgSpellLists = characterData.background?.compiledModifiers?.bgSpellLists || [];
    bgSpellLists.forEach(k => {
      if (!list.includes(k)) list.push(k);
    });

    // Aggiungi anche quelle eventualmente imparate nei livelli precedenti dello sviluppo attivo
    if (activeLevel) {
      Object.keys(activeLevel.spellListAllocations).forEach(k => {
        if (!list.includes(k)) list.push(k);
      });
    }
    return list;
  }, [characterData.spellListAllocations, characterData.background, activeLevel]);

  const availableLists = useMemo(() => {
    if (!profession) return [];
    const raw = getAvailableSpellLists(profession.professione, selectedRealm);
    return raw.filter(l => !knownLists.includes(l.nome_lista));
  }, [profession, selectedRealm, knownLists]);

  const handleAcquireSpellList = () => {
    if (!activeLevel || !activeLevel.selectedNewList) return;

    setActiveLevel(prev => ({
      ...prev,
      spellListAllocations: {
        ...prev.spellListAllocations,
        [prev.selectedNewList]: `Livello ${prev.level}`
      },
      selectedNewList: ''
    }));
  };

  const handleCancelSpellListAcquisition = () => {
    setActiveLevel(prev => ({
      ...prev,
      spellListAllocations: {},
      selectedNewList: ''
    }));
  };

  const hasAcquiredInActiveLevel = activeLevel ? Object.keys(activeLevel.spellListAllocations).length > 0 : false;
  const acquiredListNameInActiveLevel = hasAcquiredInActiveLevel ? Object.keys(activeLevel.spellListAllocations)[0] : '';

  // Sync spell list points and accumulated probability for active level
  useEffect(() => {
    if (!activeLevel) return;

    const calculatedTotalChance = baseAccumulated + (listPool * 20);
    const hasAcquired = Object.keys(activeLevel.spellListAllocations || {}).length > 0;

    let targetSpent = 0;
    let targetChance = baseAccumulated;

    if (hasAcquired) {
      targetSpent = listPool;
      targetChance = calculatedTotalChance - 100;
    } else {
      if (calculatedTotalChance < 100) {
        targetSpent = listPool;
        targetChance = calculatedTotalChance;
      } else {
        targetSpent = 0;
        targetChance = baseAccumulated;
      }
    }

    let needsUpdate = false;
    const nextTgp4 = { ...activeLevel.tgp4Distribution };
    if (nextTgp4['Liste incantesimi'] !== targetSpent) {
      nextTgp4['Liste incantesimi'] = targetSpent;
      needsUpdate = true;
    }

    if (activeLevel.spellListChanceAccumulated !== targetChance || needsUpdate) {
      setActiveLevel(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tgp4Distribution: nextTgp4,
          spellListChanceAccumulated: targetChance
        };
      });
    }
  }, [
    activeLevel ? Object.keys(activeLevel.spellListAllocations || {}).join(',') : null,
    activeLevel ? activeLevel.level : null,
    listPool,
    baseAccumulated
  ]);

  // Tiro Punti Ferita
  const rfRanksInActiveLevel = activeLevel?.tgp4Distribution['Resistenza fisica'] || 0;
  const rfTotalRanksInActiveLevel = activeLevelSkillRanks['Resistenza fisica']?.total || 0;
  
  const handleRollHp = () => {
    if (!activeLevel) return;
    const numD10 = rfRanksInActiveLevel;
    let sum = 0;
    for (let i = 0; i < numD10; i++) {
      sum += Math.floor(Math.random() * 10) + 1;
    }
    setActiveLevel(prev => ({ ...prev, hpRoll: sum, hpRollConfirmed: false }));
  };

  // Gestione Lingue
  const allLanguages = useMemo(() => [...new Set(languagesData.map(l => l.name_it))].sort(), []);
  const activeLevelLangPS = activePoolsState['Lingue']?.spentOnSkills || 0;
  const activeLevelLangPool = activePoolsState['Lingue']?.adjustedPool || 0;

  // Gradi correnti delle lingue prima di questo livello
  const currentLanguagesState = useMemo(() => {
    const langs = {};
    const baseLangs = characterData.background?.languages || {};
    
    // Inizializza con i valori base del background
    Object.keys(baseLangs).forEach(l => {
      langs[l] = (baseLangs[l].base || 0) + (baseLangs[l].added || 0);
    });

    // Somma eventuali gradi aggiunti nei livelli precedenti
    levelDevelopments.forEach(d => {
      if (d.languages) {
        Object.keys(d.languages).forEach(l => {
          langs[l] = (langs[l] || 0) + (d.languages[l] || 0);
        });
      }
    });

    return langs;
  }, [characterData.background, levelDevelopments]);

  const handleAddLanguageRank = (lang) => {
    if (!activeLevel) return;
    const currentRanks = (currentLanguagesState[lang] || 0) + (activeLevel.languages[lang] || 0);
    if (currentRanks >= 5) return; // Grado massimo 5

    const pool = activePoolsState['Lingue'];
    if (pool && pool.remaining >= 1) {
      setActiveLevel(prev => ({
        ...prev,
        languages: {
          ...prev.languages,
          [lang]: (prev.languages[lang] || 0) + 1
        }
      }));
    }
  };

  const handleSubLanguageRank = (lang) => {
    if (!activeLevel) return;
    const current = activeLevel.languages[lang] || 0;
    if (current > 0) {
      setActiveLevel(prev => ({
        ...prev,
        languages: {
          ...prev.languages,
          [lang]: current - 1
        }
      }));
    }
  };

  // Trasferimento Punti - 2-fase pool model
  const [depositSource, setDepositSource] = useState('');
  const [depositPoints, setDepositPoints] = useState(1);
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawPoints, setWithdrawPoints] = useState(1);

  // Pool Intermedio
  const poolBalance = useMemo(() => {
    if (!activeLevel) return 0;
    return activeLevel.tgp4Transfers.reduce((sum, t) => {
      if (t.type === 'deposit') return sum + t.points;
      if (t.type === 'withdrawal') return sum - t.cost;
      return sum;
    }, 0);
  }, [activeLevel]);

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
    const sourcePool = activePoolsState[depositSource];
    if (!sourcePool || sourcePool.remaining < depositPoints) {
      alert(`Non hai abbastanza punti disponibili nel pool "${depositSource}" (disponibili: ${sourcePool?.remaining || 0}).`);
      return;
    }
    if (!window.confirm(`Confermi di spostare ${depositPoints} PS da "${depositSource}" nel Pool Intermedio?`)) return;
    setActiveLevel(prev => ({ ...prev, tgp4Transfers: [...prev.tgp4Transfers, {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      type: 'deposit',
      source: depositSource,
      points: depositPoints
    }]}));
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
    setActiveLevel(prev => ({ ...prev, tgp4Transfers: [...prev.tgp4Transfers, {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      type: 'withdrawal',
      dest: withdrawDest,
      pointsReceived: withdrawPoints,
      cost,
      rate
    }]}));
    setWithdrawPoints(1);
    setWithdrawDest('');
  };

  const handleDeleteEntry = (id) => {
    const entry = activeLevel.tgp4Transfers.find(t => t.id === id);
    if (!entry) return;
    if (entry.type === 'deposit') {
      const remainingPool = poolBalance - entry.points;
      if (remainingPool < 0) {
        alert('Impossibile rimuovere questo deposito: i punti sono già stati distribuiti dal Pool. Resetta i prelievi prima.');
        return;
      }
    } else if (entry.type === 'withdrawal') {
      const destPool = activePoolsState[entry.dest];
      if (destPool && destPool.remaining < entry.pointsReceived) {
        alert(`Impossibile rimuovere: hai già speso i ${entry.pointsReceived} PS ricevuti nel pool "${entry.dest}". Riduci i gradi spesi prima.`);
        return;
      }
    }
    setActiveLevel(prev => ({ ...prev, tgp4Transfers: prev.tgp4Transfers.filter(t => t.id !== id) }));
  };

  const handleResetTransfers = () => {
    if (!window.confirm('Sei sicuro di voler annullare TUTTI i trasferimenti? I PS verranno restituiti alle categorie originali.')) return;
    setActiveLevel(prev => ({ ...prev, tgp4Transfers: [] }));
    setDepositSource('');
    setDepositPoints(1);
    setWithdrawDest('');
    setWithdrawPoints(1);
  };


  // Conferma finale del livello attivo
  const handleSaveActiveLevel = () => {
    if (!activeLevel) return;

    // 1. Controlla pool negativi
    const negativePools = Object.values(activePoolsState).filter(p => p.remaining < 0);
    if (negativePools.length > 0) {
      alert(`Impossibile completare lo sviluppo: hai speso più punti di quelli disponibili in alcuni pool.`);
      return;
    }

    // 2. Controlla se ci sono pool con punti non spesi (bloccante)
    const unspentPools = Object.values(activePoolsState).filter(p => p.remaining > 0);

    if (unspentPools.length > 0) {
      const poolNames = unspentPools.map(p => p.label).join(', ');
      alert(`Impossibile completare lo sviluppo: devi spendere o trasferire tutti i punti nei seguenti pool: ${poolNames}.`);
      return;
    }

    // 2b. Controlla Pool Intermedio non svuotato
    if (poolBalance > 0) {
      alert(`Impossibile completare lo sviluppo: hai ${poolBalance} PS nel Pool Intermedio non ancora distribuiti. Distribuiscili alle categorie oppure resetta i trasferimenti.`);
      return;
    }

    // 3. Controlla tiro HP se ha aumentato Resistenza Fisica
    if (rfRanksInActiveLevel > 0) {
      if (activeLevel.hpRoll === null || activeLevel.hpRoll <= 0) {
        alert(`Devi effettuare o inserire il tiro per i Punti Ferita prima di completare il livello.`);
        return;
      }
      if (!activeLevel.hpRollConfirmed) {
        alert(`Devi confermare il risultato del tiro dei Punti Ferita prima di poter completare lo sviluppo del livello.`);
        return;
      }
    }

    // 4. Se ha ottenuto l'apprendimento liste ma non ha scelto la lista
    const shouldSelectSpellList = totalSpellChance >= 100 && !hasAcquiredInActiveLevel;
    if (shouldSelectSpellList) {
      alert(`Hai ottenuto con successo l'apprendimento di una lista incantesimi! Selezionala ed acquisiscila prima di salvare il livello.`);
      return;
    }

    // Consolidamento nello stato globale
    const updatedDevelopments = [...levelDevelopments, {
      level: activeLevel.level,
      tgp4Distribution: activeLevel.tgp4Distribution,
      tgp4Transfers: activeLevel.tgp4Transfers,
      spellListChanceAccumulated: activeLevel.spellListChanceAccumulated,
      spellListAllocations: activeLevel.spellListAllocations,
      hpRoll: activeLevel.hpRoll || 0,
      hpRollConfirmed: activeLevel.hpRollConfirmed || false,
      languages: activeLevel.languages
    }];

    // Aggiorna le lingue globali nel background
    const updatedLanguages = { ...characterData.background?.languages };
    Object.keys(activeLevel.languages).forEach(lang => {
      if (!updatedLanguages[lang]) {
        updatedLanguages[lang] = { base: 0, added: 0 };
      }
      updatedLanguages[lang].added = (updatedLanguages[lang].added || 0) + (activeLevel.languages[lang] || 0);
    });

    // Aggiorna le liste incantesimi globali
    const updatedSpellListAllocations = {
      ...characterData.spellListAllocations,
      ...activeLevel.spellListAllocations
    };

    // Ricalcola le abilità globali
    const newSkills = recalculateSkills(updatedDevelopments, updatedLanguages);

    setCharacterData(prev => ({
      ...prev,
      levelDevelopments: updatedDevelopments,
      spellListAllocations: updatedSpellListAllocations,
      skills: newSkills,
      background: {
        ...(prev.background || {}),
        languages: updatedLanguages
      }
    }));

    // Resetta lo stato attivo
    setActiveLevel(null);
    setTransferSource('');
    setTransferDest('');
    setTransferPoints(1);
  };

  if (showEquipmentEditor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button 
            type="button" 
            className="btn btn-outline hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 text-xs rounded-lg border border-gray-300 flex items-center gap-1.5" 
            onClick={() => setShowEquipmentEditor(false)}
          >
            <ArrowLeft className="w-4 h-4" />
            Torna allo Sviluppo Livelli
          </button>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gestione Equipaggiamento del Personaggio</span>
        </div>
        <EquipmentStep characterData={characterData} setCharacterData={setCharacterData} />
      </div>
    );
  }

  const categories = [...new Set(primarySkillsList.map(s => s.categoria))];

  return (
    <div className="space-y-6">
      <AnagraficaReadOnlyBox characterData={characterData} />

      {/* ── HEADER BANNER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-race-border)', borderRadius: '0.6rem', background: 'var(--theme-race-bg)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-race-text)' }}>Popolo</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-race-text)', marginTop: '0.2rem' }}>{race?.nome || race?.popolo}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-race-text)', opacity: 0.85, marginTop: '0.15rem' }}>{race?.categoria || race?.['note (umani/non umani)']}</div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-profession-border)', borderRadius: '0.6rem', background: 'var(--theme-profession-bg)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-profession-text)' }}>Professione</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-profession-text)', marginTop: '0.2rem' }}>{profession?.professione}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-profession-text)', opacity: 0.85, marginTop: '0.15rem' }}>
            {profession && `Primaria: ${profession.primaria} | Secondaria: ${profession.secondaria}`}
          </div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-spell-lists-border)', borderRadius: '0.6rem', background: 'var(--theme-spell-lists-bg)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-spell-lists-text)' }}>Reame Magico</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-spell-lists-text)', marginTop: '0.2rem' }}>{characterData.magicRealm || 'Nessuno'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-spell-lists-text)', opacity: 0.85, marginTop: '0.15rem', fontWeight: 500 }}>
            {getMagicRealmSummaryStep9()}
          </div>
        </div>
      </div>

      {/* Dashboard dei Livelli */}
      {!activeLevel && (
        <div className="card p-6 border border-indigo-100 bg-white rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-indigo-600 w-5 h-5" />
                Sviluppo Livelli Superiore al 1°
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Avanza di livello ricorsivamente distribuendo i Punti Sviluppo (PS). Livello attuale: <strong className="text-indigo-600 font-bold">Livello {currentCharacterLevel}</strong>
              </p>
            </div>
            <button
              onClick={handleStartNewLevel}
              className="btn btn-primary flex items-center gap-1.5 shadow-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-sm rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Sviluppa Livello {currentCharacterLevel + 1}
            </button>
          </div>

          {/* Lista dei livelli sviluppati */}
          {levelDevelopments.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Cronologia Sviluppo</h4>
              <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
                {levelDevelopments.map((dev, idx) => {
                  const isLast = idx === levelDevelopments.length - 1;
                  const acquiredLists = Object.keys(dev.spellListAllocations || {});
                  const languagesBought = Object.keys(dev.languages || {}).map(lang => `${lang} (+${dev.languages[lang]})`).join(', ');

                  return (
                    <div key={dev.level} className="flex justify-between items-center p-4 bg-gray-50/50 hover:bg-gray-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-indigo-900">Livello {dev.level}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold">HP guadagnati: +{dev.hpRoll}</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {acquiredLists.length > 0 && (
                            <p>🔮 <strong>Lista incantesimo appresa:</strong> {acquiredLists.join(', ')}</p>
                          )}
                          {languagesBought.length > 0 && (
                            <p>🗣️ <strong>Lingue apprese:</strong> {languagesBought}</p>
                          )}
                          <p>🎯 <strong>Credito incantesimi finale:</strong> {dev.spellListChanceAccumulated}%</p>
                        </div>
                      </div>
                      {isLast && (
                        <button
                          type="button"
                          onClick={handleRemoveLastLevel}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                          title="Rimuovi questo livello e ripristina lo stato precedente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-indigo-200 rounded-lg text-center text-gray-400 italic text-sm">
              Nessun livello superiore al 1° sviluppato. Il personaggio è attualmente a livello 1.
            </div>
          )}

          {/* Sezione Equipaggiamento di Livello */}
          <div className="mt-6 p-4 border border-amber-200 bg-amber-50/20 rounded-lg flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-amber-950">Equipaggiamento & Spese del Personaggio</h4>
              <p className="text-xs text-amber-800 mt-1">
                Verifica, modifica ed acquista nuovi oggetti per il personaggio prima di avanzare di livello o completare la scheda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEquipmentEditor(true)}
              className="btn btn-outline border-amber-300 text-amber-900 hover:bg-amber-100/50 font-bold px-4 py-2 text-sm rounded-lg"
            >
              Verifica / Modifica Equipaggiamento
            </button>
          </div>
        </div>
      )}

      {/* Interfaccia di Sviluppo del Livello Attivo */}
      {activeLevel && (
        <div className="space-y-6">
          <div className="card p-6 border-2 border-indigo-300 bg-indigo-50/10 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-indigo-100">
              <div>
                <h3 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="text-indigo-600 w-5 h-5" />
                  Sviluppo Livello {activeLevel.level} in Corso
                </h3>
                <p className="text-xs text-indigo-900 mt-1">
                  Distribuisci i Punti Sviluppo (PS) per il livello {activeLevel.level}. Conferma il livello per salvare definitivamente.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelActiveLevel}
                  className="btn btn-outline hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 text-xs rounded-lg border border-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveActiveLevel}
                  className="btn btn-primary bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Conferma e Salva Livello {activeLevel.level}
                </button>
              </div>
            </div>

            {/* Widget rapidi: HP, Spell Lists, Lingue */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Box HP */}
              <div className="p-4 border rounded flex flex-col justify-between" style={{ borderColor: 'var(--theme-primary-skills-border)', backgroundColor: 'var(--theme-primary-skills-bg)' }}>
                {(() => {
                  const currentHp = getCharacterHpTot(characterData);
                  const hpD10Modifier = characterData.background?.compiledModifiers?.hpD10Modifier || 0;
                  const activeLevelHpRoll = activeLevel?.hpRoll || 0;
                  const newHp = currentHp + activeLevelHpRoll + (rfRanksInActiveLevel * hpD10Modifier);
                  return (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary-skills-text)' }}>Punti Ferita (HP)</span>
                        {rfRanksInActiveLevel > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--theme-primary-skills-text)', color: '#fff' }}>
                            Gradi RF a liv. {activeLevel.level}: +{rfRanksInActiveLevel}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs space-y-1 mb-2 font-medium" style={{ color: 'var(--theme-primary-skills-text)' }}>
                        <p><strong>PF Attuali:</strong> {currentHp}</p>
                        <p><strong>Nuovi PF Totali:</strong> <strong className="text-sm font-black">{newHp}</strong></p>
                      </div>

                      {rfRanksInActiveLevel > 0 ? (
                        <div className="space-y-3 mt-2 border-t pt-2" style={{ borderTopColor: 'rgba(30, 58, 138, 0.1)' }}>
                          <p className="text-xs font-medium" style={{ color: 'var(--theme-primary-skills-text)' }}>
                            Hai assegnato gradi in Resistenza Fisica! Devi lanciare <strong>{rfRanksInActiveLevel}d10</strong> per gli HP incrementali.
                          </p>
                          {hpD10Modifier > 0 && (
                            <p className="text-[11px] italic" style={{ color: 'var(--theme-primary-skills-text)', opacity: 0.85 }}>
                              (Include bonus +{rfRanksInActiveLevel * hpD10Modifier} da Resistente al dolore)
                            </p>
                          )}
                          <div className="flex flex-col gap-2 mt-2">
                            {!activeLevel.hpRollConfirmed ? (
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={handleRollHp}
                                  className="text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition hover:opacity-90"
                                  style={{ backgroundColor: 'var(--theme-primary-skills-text)', borderColor: 'var(--theme-primary-skills-text)', cursor: 'pointer' }}
                                >
                                  Tira {rfRanksInActiveLevel}d10
                                </button>
                                <div className="flex items-center gap-1">
                                  <label className="text-xs font-bold" style={{ color: 'var(--theme-primary-skills-text)' }}>Tiro:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={rfRanksInActiveLevel * 10}
                                    value={activeLevel.hpRoll === null ? '' : activeLevel.hpRoll}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? null : parseInt(e.target.value);
                                      setActiveLevel(prev => ({ ...prev, hpRoll: val, hpRollConfirmed: false }));
                                    }}
                                    className="w-16 rounded text-sm p-1 bg-white text-center font-bold"
                                    style={{ border: '1px solid var(--theme-primary-skills-border)' }}
                                  />
                                </div>
                                {activeLevel.hpRoll !== null && activeLevel.hpRoll > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveLevel(prev => ({ ...prev, hpRollConfirmed: true }))}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition active:scale-95"
                                    style={{ border: 'none', cursor: 'pointer' }}
                                  >
                                    Conferma
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full bg-green-50 border border-green-200 rounded p-2 text-green-800">
                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                  ✓ Tiro confermato: +{activeLevel.hpRoll}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveLevel(prev => ({ ...prev, hpRollConfirmed: false }))}
                                  className="text-[10px] text-green-700 hover:text-green-950 underline font-bold"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                  Modifica
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs italic mt-2 border-t pt-2 font-medium" style={{ color: 'var(--theme-primary-skills-text)', opacity: 0.85, borderTopColor: 'rgba(30, 58, 138, 0.1)' }}>
                          Nessun grado in Resistenza Fisica assegnato in questo livello. Nessun tiro HP richiesto.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Box Spell Lists */}
              <div className="p-4 border rounded" style={{ borderColor: 'var(--theme-spell-lists-border)', backgroundColor: 'var(--theme-spell-lists-bg)' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-spell-lists-text)' }}>Liste Incantesimi</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-spell-lists-text)', color: '#fff' }}>
                    {hasAcquiredInActiveLevel ? `PS spesi: ${listPS} / ${listPool}` : `Pool: ${listPool} PS`}
                  </span>
                </div>

                {knownLists.length > 0 && (
                  <div className="mb-2 text-[11px] p-2 rounded bg-white/50 border" style={{ borderColor: 'var(--theme-spell-lists-border)' }}>
                    <div className="font-semibold mb-1" style={{ color: 'var(--theme-spell-lists-text)' }}>Liste già apprese:</div>
                    <div className="flex flex-wrap gap-1">
                      {knownLists.map(l => (
                        <span key={l} className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--theme-spell-lists-bg)', color: 'var(--theme-spell-lists-text)' }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs space-y-1 mt-1 font-medium" style={{ color: 'var(--theme-spell-lists-text)' }}>
                  {!hasAcquiredInActiveLevel ? (
                    <>
                      <p><strong>Credito ereditato:</strong> {baseAccumulated}%</p>
                      <p><strong>Punti pool Liste ({listPool} PS):</strong> +{listPool * 20}%</p>
                      <p className="text-sm font-bold mt-2" style={{ color: 'var(--theme-spell-lists-text)' }}>Probabilità Totale: {totalSpellChance}%</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Lista incantesimo appresa!</strong> Costo: {listPS} PS</p>
                      <p><strong>Credito rimanente per livello successivo:</strong> {activeLevel.spellListChanceAccumulated}%</p>
                    </>
                  )}
                </div>

                {hasAcquiredInActiveLevel ? (
                  <div className="text-xs p-2 rounded font-medium border mt-2 flex justify-between items-center bg-white" style={{ color: 'var(--theme-spell-lists-text)', borderColor: 'var(--theme-spell-lists-border)' }}>
                    <span>Hai imparato con successo: <strong>{acquiredListNameInActiveLevel}</strong></span>
                    <button
                      type="button"
                      onClick={handleCancelSpellListAcquisition}
                      className="text-[11px] underline font-bold hover:text-red-700 transition"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--theme-spell-lists-text)' }}
                    >
                      Rimuovi
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {totalSpellChance >= 100 ? (
                      <div className="space-y-2">
                        <div className="text-[10px] p-1.5 rounded border" style={{ backgroundColor: 'var(--theme-spell-lists-bg)', borderColor: 'var(--theme-spell-lists-border)', color: 'var(--theme-spell-lists-text)' }}>
                          Probabilità totale ≥ 100%! Puoi scegliere e apprendere una nuova lista incantesimi.
                        </div>
                        <div className="flex gap-2">
                          <select
                            className="flex-1 rounded text-xs p-1 bg-white"
                            style={{ borderColor: 'var(--theme-spell-lists-border)', border: '1px solid var(--theme-spell-lists-border)' }}
                            value={activeLevel.selectedNewList}
                            onChange={(e) => setActiveLevel(prev => ({ ...prev, selectedNewList: e.target.value }))}
                          >
                            <option value="">-- Seleziona Lista --</option>
                            {availableLists.map(l => (
                              <option key={l.nome_lista} value={l.nome_lista}>{l.nome_lista} ({l.tipo_lista})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="text-white px-2.5 py-1 rounded text-xs font-bold disabled:opacity-50"
                            style={{ backgroundColor: 'var(--theme-spell-lists-text)', border: 'none', cursor: 'pointer' }}
                            disabled={!activeLevel.selectedNewList}
                            onClick={handleAcquireSpellList}
                          >
                            Conferma
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] p-2 rounded border border-indigo-200 bg-indigo-50/50" style={{ color: 'var(--theme-spell-lists-text)' }}>
                        La probabilità totale ({totalSpellChance}%) è inferiore al 100%. In questo livello non è possibile apprendere una nuova lista.
                        I punti del pool Liste Incantesimi ({listPool} PS) sono stati convertiti automaticamente in credito (+{listPool * 20}%).
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Box Box Lingue */}
              <div className="p-4 border rounded flex flex-col justify-between" style={{ borderColor: 'var(--theme-languages-border)', backgroundColor: 'var(--theme-languages-bg)' }}>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-languages-text)' }}>Lingue</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-languages-text)', color: '#fff' }}>PS: {activeLevelLangPS} / {activeLevelLangPool}</span>
                  </div>
                  <div className="text-xs space-y-2 mt-2" style={{ color: 'var(--theme-languages-text)' }}>
                    <p className="text-[11px] leading-snug">
                      Spendi i punti del pool Lingue (costo 1 PS per grado) per incrementare la conoscenza delle lingue (max grado 5).
                    </p>
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                      {allLanguages.map(lang => {
                        const currentVal = currentLanguagesState[lang] || 0;
                        const addedInLevel = activeLevel.languages[lang] || 0;
                        const totalLangVal = currentVal + addedInLevel;
                        if (currentVal === 0 && addedInLevel === 0) return null;

                        return (
                          <div key={lang} className="flex justify-between items-center bg-white p-1 rounded border" style={{ borderColor: 'var(--theme-languages-border)' }}>
                            <span className="font-medium text-[11px] truncate max-w-[100px]" style={{ color: 'var(--theme-languages-text)' }} title={lang}>{lang}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSubLanguageRank(lang)}
                                disabled={addedInLevel === 0}
                                className="w-4.5 h-4.5 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-[10px] font-bold"
                              >-</button>
                              <span className="font-bold text-[11px] w-3 text-center" style={{ color: 'var(--theme-languages-text)' }}>{totalLangVal}</span>
                              <button
                                type="button"
                                onClick={() => handleAddLanguageRank(lang)}
                                disabled={totalLangVal >= 5 || (activePoolsState['Lingue']?.remaining || 0) < 1}
                                className="w-4.5 h-4.5 flex items-center justify-center rounded bg-teal-100 hover:bg-teal-200 text-[10px] font-bold disabled:opacity-30"
                              >+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Aggiungi nuova lingua */}
                    <div className="flex gap-1 mt-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddLanguageRank(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full text-[10px] p-1 rounded border border-teal-200 bg-white"
                      >
                        <option value="">+ Apprendi Nuova Lingua --</option>
                        {allLanguages.filter(l => (currentLanguagesState[l] || 0) === 0 && !(activeLevel.languages[l])).map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pannello Trasferimento Punti - 2 Fasi */}
            <div className="card rounded-lg p-4 mb-6 shadow-sm" style={{ border: '1px solid var(--theme-primary-skills-border)', backgroundColor: 'var(--theme-primary-skills-bg)' }}>
              <h4 className="font-bold mb-2 text-sm flex items-center gap-1.5" style={{ color: 'var(--theme-primary-skills-text)' }}>
                <span>🔄</span> Trasferimento Punti Sviluppo (PS)
              </h4>
              <p className="text-[11px] mb-3" style={{ color: 'var(--theme-primary-skills-text)', opacity: 0.9 }}>
                Trasferimento in <strong>2 fasi</strong>: preleva PS nel Pool Intermedio, poi distribuisci dal Pool (2:1 base&gt;0 · 4:1 base=0 · 1:1 Percezione).
              </p>

              {/* FASE 1 */}
              <div className="bg-white rounded-lg border p-3 mb-2" style={{ borderColor: 'var(--theme-primary-skills-border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-primary-skills-text)' }}>
                  📥 Fase 1 — Preleva nel Pool Intermedio (1:1)
                </div>
                <div className="grid md:grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--theme-primary-skills-text)' }}>Categoria Sorgente</label>
                    <select value={depositSource} onChange={(e) => setDepositSource(e.target.value)}
                      className="w-full rounded border-purple-200 text-xs p-1.5 bg-white">
                      <option value="">-- Seleziona --</option>
                      {TGP4_POOLS.map(p => {
                        const pool = activePoolsState[p.key];
                        if (!pool || pool.remaining <= 0) return null;
                        return <option key={p.key} value={p.key}>{p.label} ({pool.remaining} PS)</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--theme-primary-skills-text)' }}>PS da spostare</label>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setDepositPoints(prev => Math.max(1, prev - 1))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-xs font-bold">-</button>
                      <span className="w-8 text-center font-bold text-xs">{depositPoints}</span>
                      <button type="button" onClick={() => setDepositPoints(prev => prev + 1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-xs font-bold">+</button>
                    </div>
                  </div>
                  <button type="button" onClick={handleAddDeposit} disabled={!depositSource}
                    className="w-full text-white font-bold py-1.5 px-3 rounded text-xs transition shadow-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
                    Conferma Prelievo →
                  </button>
                </div>
              </div>

              {/* Pool Balance */}
              <div className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 mb-2 font-bold text-xs ${
                poolBalance > 0 ? 'bg-amber-100 border border-amber-300 text-amber-900' : 'bg-gray-100 border border-gray-200 text-gray-500'
              }`}>
                <span>🪙</span>
                <span>Pool Intermedio: <strong>{poolBalance} PS</strong> disponibili</span>
                {poolBalance > 0 && <span className="font-normal">(distribuisci in Fase 2)</span>}
              </div>

              {/* FASE 2 */}
              {poolBalance > 0 && (
                <div className="bg-white rounded-lg border p-3 mb-2" style={{ borderColor: '#c4b5fd' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#7c3aed' }}>
                    📤 Fase 2 — Distribuisci dal Pool alla Destinazione
                  </div>
                  <div className="grid md:grid-cols-3 gap-2 items-end">
                    <div>
                      <label className="block text-[10px] font-bold mb-1" style={{ color: '#7c3aed' }}>Categoria Destinazione</label>
                      <select value={withdrawDest} onChange={(e) => setWithdrawDest(e.target.value)}
                        className="w-full rounded text-xs p-1.5 bg-white" style={{ border: '1px solid #c4b5fd' }}>
                        <option value="">-- Seleziona --</option>
                        {TGP4_POOLS.map(p => (
                          <option key={p.key} value={p.key}>{p.label} (base: {activePoolsState[p.key]?.base || 0})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1" style={{ color: '#7c3aed' }}>PS da ricevere</label>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setWithdrawPoints(prev => Math.max(1, prev - 1))}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-xs font-bold">-</button>
                        <span className="w-8 text-center font-bold text-xs">{withdrawPoints}</span>
                        <button type="button" onClick={() => setWithdrawPoints(prev => prev + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-xs font-bold">+</button>
                      </div>
                      {withdrawDest && (() => {
                        const { rate, cost } = getTransferRate(withdrawDest, withdrawPoints);
                        const ok = poolBalance >= cost;
                        return (
                          <div className={`text-[10px] mt-1 font-medium ${ok ? 'text-purple-800' : 'text-red-700'}`}>
                            Tariffa {rate} → costo <strong>{cost} PS</strong> {!ok && '⚠️ ins.'}
                          </div>
                        );
                      })()}
                    </div>
                    <button type="button" onClick={handleAddWithdrawal} disabled={!withdrawDest}
                      className="w-full text-white font-bold py-1.5 px-3 rounded text-xs transition shadow-sm"
                      style={{ backgroundColor: '#7c3aed' }}>
                      Conferma Distribuzione →
                    </button>
                  </div>
                </div>
              )}

              {/* Reset */}
              {activeLevel.tgp4Transfers.length > 0 && (
                <div className="flex justify-end mb-2">
                  <button type="button" onClick={handleResetTransfers}
                    className="text-[10px] text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 px-2.5 py-1 rounded font-bold transition">
                    🔁 Reset Trasferimenti
                  </button>
                </div>
              )}

              {/* Tabella Operazioni */}
              {activeLevel.tgp4Transfers.length > 0 && (
                <div className="bg-white rounded border border-purple-100 overflow-hidden mt-2">
                  <div className="px-3 py-1.5 bg-purple-50 border-b border-purple-100">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-900">Operazioni Attive</span>
                  </div>
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-purple-50/50 text-purple-900 font-bold">
                      <tr>
                        <th className="px-3 py-1.5">Tipo</th>
                        <th className="px-3 py-1.5">Da / A</th>
                        <th className="px-3 py-1.5 text-center">PS</th>
                        <th className="px-3 py-1.5 text-center">Tar.</th>
                        <th className="px-3 py-1.5 text-center">Az.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {activeLevel.tgp4Transfers.map(t => (
                        <tr key={t.id}>
                          <td className="px-3 py-1.5">
                            {t.type === 'deposit'
                              ? <span className="px-1 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold">📥 Prel.</span>
                              : <span className="px-1 py-0.5 bg-violet-100 text-violet-800 rounded text-[9px] font-bold">📤 Dist.</span>
                            }
                          </td>
                          <td className="px-3 py-1.5 font-medium text-gray-800 text-[10px]">
                            {t.type === 'deposit' ? <><em>{t.source}</em>→Pool</> : <>Pool→<em>{t.dest}</em></>}
                          </td>
                          <td className="px-3 py-1.5 text-center font-bold text-[10px]">
                            {t.type === 'deposit'
                              ? <span className="text-indigo-700">-{t.points}</span>
                              : <><span className="text-green-700">+{t.pointsReceived}</span><span className="text-red-600"> (-{t.cost})</span></>
                            }
                          </td>
                          <td className="px-3 py-1.5 text-center text-[10px] text-gray-600 font-bold">
                            {t.type === 'deposit' ? '1:1' : t.rate}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button type="button" onClick={() => handleDeleteEntry(t.id)}
                              className="text-red-600 hover:text-red-950 font-bold hover:underline text-[10px]">
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tabella Abilità Primarie */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Assegnazione Gradi Abilità</h4>
              {categories.map(cat => {
                const catSkills = primarySkillsList.filter(s => s.categoria === cat);
                if (catSkills.length === 0) return null;

                // Trova i pool relativi alla categoria
                const poolsInCat = [];
                const normCat = cat.toLowerCase().trim();
                if (normCat === 'di manovra e movimento') {
                  poolsInCat.push(activePoolsState['Manovre in Movimento']);
                } else if (normCat === 'con le armi') {
                  poolsInCat.push(activePoolsState['Abilità armi']);
                } else if (normCat === 'generali') {
                  poolsInCat.push(activePoolsState['Abilità generiche']);
                } else if (normCat === 'sotterfugio') {
                  poolsInCat.push(activePoolsState['Abilità sotterfugio']);
                } else if (normCat === 'magiche') {
                  poolsInCat.push(activePoolsState['Abilità magiche']);
                } else if (normCat === 'bonus e abilità varie') {
                  poolsInCat.push(activePoolsState['Resistenza fisica']);
                  poolsInCat.push(activePoolsState['Percezione']);
                }

                return (
                  <div key={cat} className="card rounded-lg overflow-hidden bg-white shadow-sm" style={{ border: '1px solid var(--theme-primary-skills-border)' }}>
                    <div className="px-4 py-2 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--theme-primary-skills-bg)', borderBottomColor: 'var(--theme-primary-skills-border)' }}>
                      <span className="text-xs font-bold uppercase" style={{ color: 'var(--theme-primary-skills-text)' }}>{cat}</span>
                      <div className="flex gap-2">
                        {poolsInCat.map(p => {
                          if (!p) return null;
                          const hasPool = p.base > 0 || p.received > 0;
                          if (!hasPool) return null;
                          const isFull = p.remaining <= 0;
                          return (
                            <span key={p.key} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFull ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                              PS {p.label}: {p.spentOnSkills} / {p.adjustedPool} ({p.remaining} rimanenti)
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-1.5">Abilità</th>
                            <th className="px-2 py-1.5 text-center">Gradi precedenti</th>
                            <th className="px-2 py-1.5 text-center bg-blue-50/30 text-blue-800">Incremento Prof.</th>
                            <th className="px-2 py-1.5 text-center bg-purple-50/30 text-purple-900 font-bold">Acquisto PS (TGP_4)</th>
                            <th className="px-2 py-1.5 text-center font-bold">Gradi Finali</th>
                            <th className="px-2 py-1.5 text-center">Bonus Gradi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catSkills.map(sk => {
                            const name = sk.nome;
                            const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';
                            const state = activeLevelSkillRanks[name] || { beforeRanks: 0, profIncrement: 0, currentTgp4: 0, total: 0 };
                            
                            // Gestione limiti e costi
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

                            const pool = poolKey ? activePoolsState[poolKey] : null;
                            const isMM = poolKey === 'Manovre in Movimento';
                            const isNoLimit = isMM || normName === 'percezione';
                            const nextRankCost = isNoLimit ? 1 : (state.currentTgp4 === 0 ? 1 : 2);
                            const canAdd = pool && (isNoLimit || state.currentTgp4 < 2) && (pool.remaining >= nextRankCost);

                            const bonusGradi = getRanksBonus(name, state.total);

                            return (
                              <tr key={name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                <td className="px-4 py-2 font-medium text-gray-800">{name}</td>
                                <td className="px-2 py-2 text-center text-gray-500">{state.beforeRanks}</td>
                                <td className="px-2 py-2 text-center bg-blue-50/30 text-blue-700 font-semibold">
                                  {state.profIncrement > 0 ? `+${state.profIncrement}` : '0'}
                                </td>
                                <td className="px-2 py-2 text-center bg-purple-50/30">
                                  {pool ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSubTgp4(name)}
                                        disabled={state.currentTgp4 === 0}
                                        className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 disabled:opacity-30 hover:bg-purple-300 font-bold"
                                      >-</button>
                                      <span className="font-bold w-4 text-center text-purple-700">{state.currentTgp4}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddTgp4(name, sk.categoria)}
                                        disabled={!canAdd}
                                        className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 disabled:opacity-30 hover:bg-purple-300 font-bold"
                                      >+</button>
                                    </div>
                                  ) : '—'}
                                </td>
                                <td className="px-2 py-2 text-center font-bold text-gray-800">{state.total}</td>
                                <td className="px-2 py-2 text-center font-bold text-gray-700">
                                  {typeof bonusGradi === 'number' ? fmt(bonusGradi) : bonusGradi}
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
          </div>
        </div>
      )}
    </div>
  );
}
