import { useState, useEffect, useMemo } from 'react';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import tgp4Data from '../../../data/TGP_4-sviluppo_abilità_professioni.json';
import { getAvailableSpellLists } from '../../../utils/magicHelpers';
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

  const finalStats = useMemo(() => {
    return getFinalStats(characterData.stats || {}, race, {});
  }, [characterData.stats, race]);

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

      if (s.nome === 'resistenza fisica') {
        state['Resistenza fisica'].spentOnSkills += getTgp4Cost(ranks);
      } else if (s.nome === 'percezione') {
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

    // 4. Calculate adjusted pool and remaining points
    TGP4_POOLS.forEach(p => {
      const s = state[p.key];
      s.adjustedPool = s.base + s.received - s.transferredOut;
      s.remaining = s.adjustedPool - s.spentOnSkills;
    });

    return state;
  }, [tgp4Distribution, tgp4Transfers, profession]);

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
  const listPS = tgp4Distribution['Liste incantesimi'] || 0;
  const listPool = poolsState['Liste incantesimi']?.adjustedPool || 0;
  const baseAccumulated = characterData.spellListChanceAccumulated || 0;
  const totalChance = baseAccumulated + (listPS * 20);

  const handleAddListPS = () => {
    const pool = poolsState['Liste incantesimi'];
    if (pool && pool.remaining >= 1) {
      setTgp4Distribution(prev => ({ ...prev, 'Liste incantesimi': (prev['Liste incantesimi'] || 0) + 1 }));
    }
  };

  const handleSubListPS = () => {
    if (listPS > 0) {
      setTgp4Distribution(prev => ({ ...prev, 'Liste incantesimi': prev['Liste incantesimi'] - 1 }));
    }
  };

  const [rollResult, setRollResult] = useState(null);
  
  const handleRoll = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    setRollResult(roll);
  };

  const handleAcquireList = () => {
    if (!selectedNewList) return;
    
    let newAccumulated = totalChance;
    if (totalChance >= 100) {
      newAccumulated = totalChance - 100;
    } else if (rollResult && rollResult <= totalChance) {
      newAccumulated = 0;
    }

    setCharacterData(prev => ({
      ...prev,
      spellListChanceAccumulated: newAccumulated,
      spellListAllocations: {
        ...(prev.spellListAllocations || {}),
        [selectedNewList]: 'Apprendistato Liv. 1'
      }
    }));
    setRollResult(null);
    setSelectedNewList('');
  };

  const acquiredListEntry = Object.entries(characterData.spellListAllocations || {}).find(([name, source]) => source === 'Apprendistato Liv. 1');
  const hasAcquiredInApprenticeship = !!acquiredListEntry;
  const acquiredListName = hasAcquiredInApprenticeship ? acquiredListEntry[0] : '';
  
  const adolescenceListEntry = Object.entries(characterData.spellListAllocations || {}).find(([name, source]) => source === 'Adolescenza');

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
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border border-teal-200 rounded bg-teal-50/50 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Scelte Magiche (Reame)</span>
            {isWarriorOrScout ? (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRealmChange('Essenza')}
                  className={`flex-1 py-1.5 px-3 rounded font-bold text-xs border transition ${
                    selectedRealm === 'Essenza'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-100/50'
                  }`}
                >
                  Essenza
                </button>
                <button
                  type="button"
                  onClick={() => handleRealmChange('Flusso')}
                  className={`flex-1 py-1.5 px-3 rounded font-bold text-xs border transition ${
                    selectedRealm === 'Flusso'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-100/50'
                  }`}
                >
                  Flusso
                </button>
              </div>
            ) : (
              <h3 className="font-bold text-teal-950 m-0" style={{fontSize: '1.2rem', marginTop: '0.25rem'}}>{selectedRealm || 'Nessuno'}</h3>
            )}
          </div>
        </div>

        <div className="p-4 border border-indigo-200 rounded bg-indigo-50/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">Liste Incantesimi</span>
            <span className="text-xs font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">PS: {listPS} / {listPool}</span>
          </div>

          <div className="text-xs text-indigo-900 mb-3 space-y-1">
            {adolescenceListEntry && (
              <p className="mb-2 text-indigo-700"><strong>Già appresa (Adolescenza):</strong> {adolescenceListEntry[0]}</p>
            )}
            <p><strong>Credito precedente:</strong> {baseAccumulated}%</p>
            <div className="flex items-center gap-2">
              <strong>Alloca PS:</strong>
              <button type="button" onClick={handleSubListPS} disabled={listPS === 0} className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 font-bold">-</button>
              <span className="font-bold w-4 text-center">{listPS}</span>
              <button type="button" onClick={handleAddListPS} disabled={listPS >= listPool} className="px-2 py-0.5 bg-indigo-100 border border-indigo-300 rounded text-indigo-800 hover:bg-indigo-200 disabled:opacity-50 font-bold">+</button>
              <span>(+{listPS * 20}%)</span>
            </div>
            <p className="text-sm font-bold text-indigo-700 mt-2">Probabilità Totale: {totalChance}%</p>
          </div>

          {hasAcquiredInApprenticeship ? (
            <div className="text-sm text-indigo-700 bg-indigo-100 p-2 rounded text-center font-medium border border-indigo-200">
              Hai imparato con successo: <strong>{acquiredListName}</strong>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {totalChance >= 100 ? (
                <div className="text-xs bg-green-100 text-green-800 p-2 rounded border border-green-300">
                  Hai 100% o più! Puoi imparare automaticamente una lista (costerà 100%, il resto sarà conservato).
                </div>
              ) : rollResult && rollResult <= totalChance ? (
                <div className="text-xs bg-green-100 text-green-800 p-2 rounded border border-green-300">
                  Tiro: <strong>{rollResult}</strong> - Successo! Scegli la lista (il credito si azzererà).
                </div>
              ) : rollResult && rollResult > totalChance ? (
                <div className="text-xs bg-red-100 text-red-800 p-2 rounded border border-red-300 flex justify-between items-center">
                  <span>Tiro: <strong>{rollResult}</strong> - Fallito. Credito mantenuto.</span>
                  <button onClick={() => setRollResult(null)} className="underline text-red-600 hover:text-red-900">Riprova/Annulla</button>
                </div>
              ) : totalChance > 0 ? (
                <button type="button" onClick={handleRoll} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-indigo-700">
                  Tira 1d100 (≤ {totalChance}%)
                </button>
              ) : (
                 <div className="text-xs text-indigo-500 italic">Alloca PS per avere una probabilità di imparare liste.</div>
              )}

              {(totalChance >= 100 || (rollResult && rollResult <= totalChance)) && (
                <div className="flex gap-2 mt-1">
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
                    className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                    disabled={!selectedNewList}
                    onClick={handleAcquireList}
                  >
                    Acquisisci
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pannello Trasferimento Punti */}
      <div className="card border border-purple-200 bg-purple-50/20 rounded-lg p-5 mb-8 shadow-sm">
        <h4 className="font-bold text-purple-900 mb-3 text-base flex items-center gap-2">
          <span>🔄</span> Trasferimento Punti Sviluppo (PS)
        </h4>
        <p className="text-xs text-purple-800 mb-4 leading-relaxed">
          Puoi trasferire Punti Sviluppo (PS) tra le diverse categorie. Regole di conversione:<br/>
          • Verso <strong>Percezione</strong>: tariffa <strong>1:1</strong>.<br/>
          • Verso categorie con <strong>base iniziale &gt; 0</strong>: tariffa <strong>2:1</strong> (es. 2 PS per riceverne 1).<br/>
          • Verso categorie con <strong>base iniziale = 0</strong> (es. Magiche o Liste Incantesimi per Guerriero): tariffa <strong>4:1</strong> (es. 4 PS per riceverne 1).
        </p>

        <div className="grid md:grid-cols-4 gap-4 items-end bg-white p-4 border border-purple-100 rounded-lg mb-4">
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
            <div key={cat} className="card border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="card-header bg-gray-50 border-b border-gray-200 flex justify-between items-center" style={{padding: '0.75rem 1rem'}}>
                <h4 className="font-semibold text-gray-700 m-0 text-sm uppercase tracking-wider">{cat}</h4>
                <div className="flex flex-wrap gap-3 text-xs">
                  {tb6PoolSize > 0 && (
                    <span className="px-2.5 py-1 rounded font-bold bg-blue-105 text-blue-800">
                      TB_6: {spentTb6} / {tb6PoolSize} Gradi
                    </span>
                  )}
                  {poolsInCat.map(p => {
                    if (!p) return null;
                    const hasPool = p.base > 0 || p.received > 0;
                    if (!hasPool) return null;
                    const isFull = p.remaining <= 0;
                    return (
                      <span key={p.key} className={`px-2.5 py-1 rounded font-bold ${isFull ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
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
                      <th className="px-2 py-2 text-center">Carico</th>
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

                      let totalBonus;
                      if (typeof bonusGradi === 'number') {
                        totalBonus = bonusGradi + carattBonus + (ingombroBonus ?? 0);
                      } else {
                        totalBonus = bonusGradi;
                      }
                      const totalBonusStr = typeof totalBonus === 'number' ? fmt(totalBonus) : totalBonus;

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
                            {hasIngombro ? fmt(ingombroBonus) : '—'}
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
