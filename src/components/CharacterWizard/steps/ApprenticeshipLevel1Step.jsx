import { useState, useEffect, useMemo } from 'react';
import AnagraficaReadOnlyBox from '../shared/AnagraficaReadOnlyBox';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import tgp4Data from '../../../data/TGP_4-sviluppo_abilità_professioni.json';
import { getAvailableSpellLists } from '../../../utils/magicHelpers';
import lingueTerraDiMezzo from '../../../data/TS_1-lingue_della_terra_di_mezzo-v2.json';
import gradiLingue from '../../../data/TGP_1-gradi_conoscenze_lingue.json';
import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getSpecificTb6Ranks,
  getFinalStats,
  fmt,
  getTgp4PoolSize,
  getTb6PoolSize
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
      lingueTerraDiMezzo.forEach(l => {
        if (l.popolo === race.popolo) {
          baseLangs[l.lingua] = { base: l.livello, addedAdolescenza: 0, addedLivello1: 0, added: 0 };
        }
      });
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
  
  const [selectedNewList, setSelectedNewList] = useState('');
  
  // Point Transfer States
  const [transferSource, setTransferSource] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [transferPoints, setTransferPoints] = useState(1);

  // Compute pools state (base, received, transferredOut, spentOnSkills, remaining)
  const poolsState = useMemo(() => {
    if (!profession) return {};

    const state = {};

    // 1. Calculate base pool sizes
    TGP4_POOLS.forEach(p => {
      const base = getTgp4PoolSize(p.catName, p.skillName, profession.professione, tgp4Data);
      state[p.key] = {
        key: p.key,
        label: p.label,
        base,
        received: 0,
        transferredOut: 0,
        spentOnSkills: 0
      };
    });

    // 2. Add transferred points
    tgp4Transfers.forEach(t => {
      if (state[t.source] && state[t.dest]) {
        state[t.source].transferredOut += t.cost;
        state[t.dest].received += t.points;
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
        state['Percezione'].spentOnSkills += ranks; // 1:1 cost
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

    // 4. Calculate adjusted pool and remaining points
    TGP4_POOLS.forEach(p => {
      const s = state[p.key];
      s.adjustedPool = s.base + s.received - s.transferredOut;
      s.remaining = s.adjustedPool - s.spentOnSkills;
    });

    return state;
  }, [tgp4Distribution, tgp4Transfers, profession, characterData.background?.languages]);

  const allLanguages = useMemo(() => [...new Set(lingueTerraDiMezzo.map(l => l.lingua))].sort(), []);
  const languages = characterData.background?.languages || {};
  const languagePointsLeft = poolsState['Lingue']?.remaining || 0;

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
          JSON.stringify(prev.skills) === JSON.stringify(newSkills)) {
        return prev;
      }
      return {
        ...prev,
        level1Tb6: tb6Distribution,
        level1Tgp4: nextLevel1Tgp4,
        tgp4Transfers: tgp4Transfers,
        skills: newSkills
      };
    });
  }, [tb6Distribution, tgp4Distribution, tgp4Transfers, setCharacterData, baseSkills, profession, characterData.skills]);

  const isWarriorOrScout = profession ? ['guerriero', 'scout'].includes(profession?.professione?.toLowerCase()) : false;

  const selectedRealm = characterData.magicRealm || '';
  const knownLists = Object.keys(characterData.spellListAllocations || {});
  const rawAvailableLists = profession ? getAvailableSpellLists(profession.professione, selectedRealm) : [];
  const availableLists = rawAvailableLists.filter(l => !knownLists.includes(l.nome_lista));

  const handleRealmChange = (realm) => {
    setCharacterData(prev => ({ ...prev, magicRealm: realm }));
  };

  const categories = [...new Set(primarySkillsList.map(s => s.categoria))];

  const handleAddTgp4 = (skillName, category) => {
    const normCat = category?.toLowerCase()?.trim();
    const isMM = normCat === 'di manovra e movimento' || category === 'Abilità di Movimento e Manovra';
    const isNoLimit = isMM || skillName.toLowerCase().trim() === 'percezione';
    const currentRanks = tgp4Distribution[skillName] || 0;
    
    // Check max ranks per level
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

  // Spell Lists local variables
  const listPool = useMemo(() => {
    if (!profession) return 0;
    const base = getTgp4PoolSize('liste incantesimi', null, profession.professione, tgp4Data);
    let received = 0;
    let transferredOut = 0;
    tgp4Transfers.forEach(t => {
      if (t.source === 'Liste incantesimi') transferredOut += t.cost;
      if (t.dest === 'Liste incantesimi') received += t.points;
    });
    return base + received - transferredOut;
  }, [profession, tgp4Transfers]);

  const listPS = tgp4Distribution['Liste incantesimi'] || 0;
  const baseAccumulated = characterData.spellListChanceAccumulated || 0;
  const totalChance = baseAccumulated + (listPool * 20);

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

    if (hasAcquiredInApprenticeship) {
      targetSpent = listPool;
      targetChance = totalChance - 100;
    } else {
      if (totalChance < 100) {
        targetSpent = listPool;
        targetChance = totalChance;
      } else {
        targetSpent = 0;
        targetChance = baseAccumulated;
      }
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
  }, [hasAcquiredInApprenticeship, listPool, totalChance, baseAccumulated, tgp4Distribution, characterData.spellListChanceAccumulated, setCharacterData]);

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

    // 3. Controlla se ha ottenuto l'apprendimento lista incantesimi ma non l'ha ancora scelta
    if (!err && selectedRealm && totalChance >= 100 && !hasAcquiredInApprenticeship) {
      err = 'Hai ottenuto con successo l\'apprendimento di una lista incantesimi! Selezionala ed acquisiscila.';
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
  }, [poolsState, selectedRealm, totalChance, hasAcquiredInApprenticeship, characterData.stepErrors, setCharacterData]);

  // Point Transfer Helper
  const getTransferRateAndCost = (sourceKey, destKey, pointsToReceive) => {
    if (!sourceKey || !destKey) return { rate: '—', cost: 0 };
    
    if (destKey === 'Percezione') {
      return { rate: '1:1', cost: pointsToReceive };
    }
    
    const destPool = TGP4_POOLS.find(p => p.key === destKey);
    const destBase = destPool && profession ? getTgp4PoolSize(destPool.catName, destPool.skillName, profession.professione, tgp4Data) : 0;
    
    if (destBase > 0) {
      return { rate: '2:1', cost: pointsToReceive * 2 };
    } else {
      return { rate: '4:1', cost: pointsToReceive * 4 };
    }
  };

  const handleAddTransfer = () => {
    if (!transferSource || !transferDest || transferSource === transferDest) return;
    if (transferPoints <= 0) return;

    const { cost, rate } = getTransferRateAndCost(transferSource, transferDest, transferPoints);
    const sourcePool = poolsState[transferSource];

    if (!sourcePool || sourcePool.remaining < cost) {
      alert(`Non hai abbastanza punti disponibili nel pool "${transferSource}" (necessari: ${cost}, disponibili: ${sourcePool.remaining}).`);
      return;
    }

    const newTransfer = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      source: transferSource,
      dest: transferDest,
      points: transferPoints,
      cost,
      rate
    };

    setTgp4Transfers(prev => [...prev, newTransfer]);
    
    setTransferSource('');
    setTransferDest('');
    setTransferPoints(1);
  };

  const handleDeleteTransfer = (id) => {
    const transfer = tgp4Transfers.find(t => t.id === id);
    if (!transfer) return;

    const destPool = poolsState[transfer.dest];
    if (destPool && destPool.remaining < transfer.points) {
      alert(`Impossibile eliminare questo trasferimento: hai già speso i punti ricevuti nel pool "${transfer.dest}". Riduci i gradi spesi in quel pool prima di annullare il trasferimento.`);
      return;
    }

    setTgp4Transfers(prev => prev.filter(t => t.id !== id));
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
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-race-text)', marginTop: '0.2rem' }}>{race.popolo}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-race-text)', opacity: 0.85, marginTop: '0.15rem' }}>{race['note (umani/non umani)']}</div>
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
            {adolescenceListEntry && (
              <p className="mb-2 text-indigo-700"><strong>Già appresa (Adolescenza):</strong> {adolescenceListEntry[0]}</p>
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
              ) : (
                <div className="text-xs bg-indigo-100 text-indigo-800 p-2 rounded border border-indigo-200">
                  La probabilità totale ({totalChance}%) è inferiore al 100%. In questo livello non è possibile apprendere una nuova lista.
                  I punti del pool Liste Incantesimi ({listPool} PS) sono stati convertiti automaticamente in credito (+{listPool * 20}%).
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pannello Trasferimento Punti */}
      <div className="card rounded-lg p-5 mb-8 shadow-sm" style={{ border: '1px solid var(--theme-primary-skills-border)', backgroundColor: 'var(--theme-primary-skills-bg)' }}>
        <h4 className="font-bold mb-3 text-base flex items-center gap-2" style={{ color: 'var(--theme-primary-skills-text)' }}>
          <span>🔄</span> Trasferimento Punti Sviluppo (PS)
        </h4>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--theme-primary-skills-text)', opacity: 0.9 }}>
          Puoi trasferire Punti Sviluppo (PS) tra le diverse categorie. Regole di conversione:<br/>
          • Verso <strong>Percezione</strong>: tariffa <strong>1:1</strong>.<br/>
          • Verso categorie con <strong>base iniziale &gt; 0</strong>: tariffa <strong>2:1</strong> (es. 2 PS per riceverne 1).<br/>
          • Verso categorie con <strong>base iniziale = 0</strong> (es. Magiche o Liste Incantesimi per Guerriero): tariffa <strong>4:1</strong> (es. 4 PS per riceverne 1).
        </p>

        <div className="grid md:grid-cols-4 gap-4 items-end bg-white p-4 border rounded-lg mb-4" style={{ borderColor: 'var(--theme-primary-skills-border)' }}>
          <div>
            <label className="block text-xs font-bold text-purple-900 mb-1.5">Preleva da (Sorgente)</label>
            <select
              value={transferSource}
              onChange={(e) => {
                setTransferSource(e.target.value);
                setTransferDest('');
              }}
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
            <label className="block text-xs font-bold text-purple-900 mb-1.5">Trasferisci a (Destinazione)</label>
            <select
              value={transferDest}
              onChange={(e) => setTransferDest(e.target.value)}
              disabled={!transferSource}
              className="w-full rounded border-purple-200 text-sm p-2 bg-white disabled:opacity-50"
            >
              <option value="">-- Seleziona --</option>
              {TGP4_POOLS.map(p => {
                if (p.key === transferSource) return null;
                return (
                  <option key={p.key} value={p.key}>
                    {p.label} (Base: {poolsState[p.key]?.base || 0})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-900 mb-1.5">Punti da ricevere</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTransferPoints(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-sm font-bold"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-sm">{transferPoints}</span>
              <button
                type="button"
                onClick={() => setTransferPoints(prev => prev + 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-sm font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleAddTransfer}
              disabled={!transferSource || !transferDest}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold py-2 px-4 rounded text-sm transition shadow-sm"
            >
              Effettua Trasferimento
            </button>
          </div>
        </div>

        {/* Esito teorico del trasferimento selezionato */}
        {transferSource && transferDest && (() => {
          const { rate, cost } = getTransferRateAndCost(transferSource, transferDest, transferPoints);
          const sourcePool = poolsState[transferSource];
          const hasEnough = sourcePool && sourcePool.remaining >= cost;
          return (
            <div className={`text-xs p-2.5 rounded border mb-4 font-medium flex justify-between items-center ${
              hasEnough ? 'bg-purple-50 text-purple-900 border-purple-200' : 'bg-red-50 text-red-900 border-red-200'
            }`}>
              <span>
                Tariffa: <strong>{rate}</strong> | Costo: <strong>{cost} PS</strong> da <em>{transferSource}</em> per aggiungere <strong>{transferPoints} PS</strong> a <em>{transferDest}</em>.
              </span>
              {!hasEnough && <span className="font-bold text-red-700">⚠️ Punti insufficienti in sorgente!</span>}
            </div>
          );
        })()}

        {/* Tabella Trasferimenti Attivi */}
        {tgp4Transfers.length > 0 ? (
          <div className="bg-white rounded-lg border border-purple-100 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50 text-purple-900 uppercase font-bold text-[10px] tracking-wider border-b border-purple-100">
                <tr>
                  <th className="px-4 py-2">Sorgente</th>
                  <th className="px-4 py-2">Destinazione</th>
                  <th className="px-4 py-2 text-center">Tariffa</th>
                  <th className="px-4 py-2 text-center">Punti Ricevuti</th>
                  <th className="px-4 py-2 text-center">Costo Detratto</th>
                  <th className="px-4 py-2 text-center">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {tgp4Transfers.map(t => (
                  <tr key={t.id} className="hover:bg-purple-50/30">
                    <td className="px-4 py-2 font-medium text-gray-800">{t.source}</td>
                    <td className="px-4 py-2 font-medium text-purple-900">{t.dest}</td>
                    <td className="px-4 py-2 text-center font-bold text-gray-600">{t.rate}</td>
                    <td className="px-4 py-2 text-center font-bold text-green-700">+{t.points} PS</td>
                    <td className="px-4 py-2 text-center font-bold text-red-600">-{t.cost} PS</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteTransfer(t.id)}
                        className="text-red-600 hover:text-red-900 hover:underline font-bold"
                      >
                        Elimina
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
      <div className="card mb-8" style={{borderColor:'var(--theme-languages-border)'}}>
        <div className="card-header border-b" style={{background:'var(--theme-languages-bg)',borderBottomColor:'var(--theme-languages-border)',padding:'0.75rem 1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h4 className="font-semibold m-0 text-sm uppercase tracking-wider" style={{color:'var(--theme-languages-text)'}}>🌐 Lingue Conosciute (Sviluppo Livello 1)</h4>
          <div style={{display:'flex',gap:'1rem'}}>
            <span style={{fontSize:'0.8rem',background:'#fff',border:'1px solid var(--theme-languages-border)',padding:'0.25rem 0.75rem',borderRadius:'0.5rem',color:'var(--theme-languages-text)',fontWeight:'bold'}}>
              Punti totali: <strong>{poolsState['Lingue']?.adjustedPool || 0}</strong>
            </span>
            <span style={{
              fontSize:'0.8rem',
              backgroundColor: languagePointsLeft > 0 ? '#fee2e2' : '#dcfce7',
              color: languagePointsLeft > 0 ? '#991b1b' : '#166534',
              paddingLeft: '5px',
              paddingRight: '5px',
              paddingTop: '0.25rem',
              paddingBottom: '0.25rem',
              borderRadius:'0.5rem',
              fontWeight:'bold'
            }}>
              Rimasti: <strong>{languagePointsLeft}</strong>
            </span>
          </div>
        </div>
        <div className="card-body" style={{padding:'1rem'}}>
          <p className="text-xs text-muted mb-4">Spendi i Punti Sviluppo del pool Lingue per migliorare le lingue conosciute o apprenderne di nuove (max Grado 5).</p>
          <div className="flex flex-col gap-2">
            {Object.entries(languages).sort((a,b)=>a[0].localeCompare(b[0])).map(([lang, data]) => {
              const total = (data.base || 0) + (data.added || 0);
              const gradeInfo = gradiLingue.find(g => g.grado === total);
              return (
                <div key={lang} className="flex items-center justify-between p-2.5 border rounded-lg bg-white" style={{borderColor:'var(--theme-languages-border)'}}>
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
                    <button type="button" onClick={() => addLangPoint(lang)} disabled={languagePointsLeft<=0||total>=5} className="w-7 h-7 border rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-sm font-bold">+</button>
                    <button type="button" onClick={() => removeLangPoint(lang)} disabled={!data.addedLivello1||data.addedLivello1<=0} className="w-7 h-7 border rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-sm font-bold">−</button>
                  </div>
                </div>
              );
            })}
          </div>

          {languagePointsLeft > 0 && (
            <div className="mt-4 pt-4 border-t flex gap-2 items-center" style={{borderTopColor:'var(--theme-languages-border)'}}>
              <select defaultValue="" id="lang-add-select-level1" className="flex-1 rounded border-gray-300 text-xs p-2 bg-white">
                <option value="" disabled>-- Nuova lingua da apprendere --</option>
                {allLanguages.filter(l => !languages[l] || ((languages[l].base || 0) + (languages[l].added || 0)) < 5).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="bg-blue-600 text-white font-bold py-1.5 px-3 rounded text-xs hover:bg-blue-700 transition" 
                onClick={() => { const s = document.getElementById('lang-add-select-level1'); if(s.value){ addNewLang(s.value); s.value=''; } }}
              >
                + Apprendi
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mb-6 text-muted">
        I gradi della tua professione (<strong>TB_6</strong>) sono mostrati per consultazione. Spendi i tuoi Punti Sviluppo (<strong>TGP_4</strong>) per il Livello 1.<br/>
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
              <div className="border-b flex justify-between items-center" style={{padding: '0.75rem 1rem', backgroundColor: 'var(--theme-primary-skills-bg)', borderBottomColor: 'var(--theme-primary-skills-border)'}}>
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
              
              <div className="card-body overflow-x-auto" style={{padding: '0'}}>
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
                      const isNoLimit = isMM || normName === 'percezione';

                      const nextRankCost = isNoLimit ? 1 : (tgp4Ranks === 0 ? 1 : 2);
                      const canAddTgp4 = pool && (isNoLimit || tgp4Ranks < 2) && (pool.remaining >= nextRankCost);

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
    </div>
  );
}
