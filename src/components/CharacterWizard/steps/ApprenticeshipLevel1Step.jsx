import { useState, useEffect } from 'react';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import tb1 from '../../../data/TB_1-caratteristiche_bonus.json';
import tgp4Data from '../../../data/TGP_4-sviluppo_abilità_professioni.json';
import { getAvailableSpellLists } from '../../../utils/magicHelpers';

const parseBonusValue = (val) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace('+', '').trim();
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Map primary skills categories to TB_6 keys
const CAT_TO_TB6 = {
  'Abilità con le Armi': 'abilità armi',
  'Abilità Generali': 'abilità generiche',
  'Abilità di Sotterfugio': 'abilità sotterfugio',
  'Abilità Magiche': 'abilità magiche',
};

// Map primary skills categories to TGP_4 keys
const CAT_TO_TGP4 = {
  'Abilità di Movimento e Manovra': 'Manovre in Movimento',
  'Abilità con le Armi': 'Abilità armi',
  'Abilità Generali': 'Abilità generiche',
  'Abilità di Sotterfugio': 'Abilità sotterfugio',
  'Abilità Magiche': 'Abilità magiche',
};

const getTgp4Pool = (category, professionName) => {
  const tgp4Cat = CAT_TO_TGP4[category];
  if (!tgp4Cat) {
    if (category === 'Resistenza Fisica') {
      const record = tgp4Data.find(d => d.categoria === 'Resistenza fisica');
      return record ? record[professionName.toLowerCase()] || 0 : 0;
    }
    return 0;
  }
  const record = tgp4Data.find(d => d.categoria === tgp4Cat);
  return record ? record[professionName.toLowerCase()] || 0 : 0;
};

const getTb6Pool = (category, profession) => {
  const key = CAT_TO_TB6[category];
  if (!key) return 0;
  return parseBonusValue(profession[key]);
};

const getSpecificTb6Ranks = (skillName, profession) => {
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

const getRanksBonus = (skillName, ranks) => {
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

export default function ApprenticeshipLevel1Step({ characterData, setCharacterData }) {
  const race = characterData.race;
  const profession = characterData.profession;
  const baseSkills = characterData.adolescenceSkills || {};

  const [tb6Distribution, setTb6Distribution] = useState(characterData.level1Tb6 || {});
  const [tgp4Distribution, setTgp4Distribution] = useState(characterData.level1Tgp4 || {});
  const [selectedNewList, setSelectedNewList] = useState('');

  // Save distribution and combined skills to characterData when it changes
  useEffect(() => {
    if (!profession) return;

    const newSkills = {};
    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const adRanks = baseSkills[name]?.adolescenceRanks || 0;
      const profFixedRanks = getSpecificTb6Ranks(name, profession);
      const tb6Ranks = tb6Distribution[name] || 0;
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

    setCharacterData(prev => {
      if (JSON.stringify(prev.level1Tb6) === JSON.stringify(tb6Distribution) &&
          JSON.stringify(prev.level1Tgp4) === JSON.stringify(tgp4Distribution) &&
          JSON.stringify(prev.skills) === JSON.stringify(newSkills)) {
        return prev;
      }
      return {
        ...prev,
        level1Tb6: tb6Distribution,
        level1Tgp4: {
          ...tgp4Distribution,
          'Liste incantesimi': tgp4Distribution['Liste incantesimi'] || 0
        },
        skills: newSkills
      };
    });
  }, [tb6Distribution, tgp4Distribution, setCharacterData, baseSkills, profession, characterData.skills]);

  if (!race || !profession) {
    return (
      <div className="p-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 bg-gray-50">
        Completa gli step precedenti prima di procedere.
      </div>
    );
  }

  const isWarriorOrScout = ['guerriero', 'scout'].includes(profession?.professione?.toLowerCase());

  const selectedRealm = characterData.magicRealm || '';
  const knownLists = Object.keys(characterData.spellListAllocations || {});
  const rawAvailableLists = getAvailableSpellLists(profession.professione, selectedRealm);
  const availableLists = rawAvailableLists.filter(l => !knownLists.includes(l.nome_lista));

  const handleRealmChange = (realm) => {
    setCharacterData(prev => ({ ...prev, magicRealm: realm }));
  };

  const categories = [...new Set(primarySkillsList.map(s => s.categoria))];

  // Helper to calculate cost of TGP_4 ranks
  const getTgp4Cost = (ranks) => {
    if (ranks === 0) return 0;
    if (ranks === 1) return 1;
    if (ranks === 2) return 3; // 1 for first + 2 for second
    return 3 + (ranks - 2); // Fallback, though max is usually 2
  };

  const getTgp4CostForMM = (ranks) => ranks; // Movimento e Manovra cost is 1:1

  const handleAddTb6 = (skillName, category) => {
    const currentPool = getTb6Pool(category, profession);
    const categorySkills = primarySkillsList.filter(s => s.categoria === category);
    const spentInCat = categorySkills.reduce((sum, s) => sum + (tb6Distribution[s.nome] || 0), 0);
    
    if (spentInCat < currentPool) {
      setTb6Distribution(prev => ({
        ...prev,
        [skillName]: (prev[skillName] || 0) + 1
      }));
    }
  };

  const handleSubTb6 = (skillName) => {
    if (tb6Distribution[skillName] > 0) {
      setTb6Distribution(prev => ({
        ...prev,
        [skillName]: prev[skillName] - 1
      }));
    }
  };

  const handleAddTgp4 = (skillName, category) => {
    const isMM = category === 'Abilità di Movimento e Manovra';
    const currentRanks = tgp4Distribution[skillName] || 0;
    
    // Check max ranks per level
    if (!isMM && currentRanks >= 2) return;

    // Check pool availability
    const pool = getTgp4Pool(category === 'Abilità Varie' && skillName === 'Resistenza Fisica' ? 'Resistenza Fisica' : category, profession.professione);
    
    const categorySkills = primarySkillsList.filter(s => {
      if (category === 'Abilità Varie') return s.nome === 'Resistenza Fisica';
      return s.categoria === category;
    });

    const spentInCat = categorySkills.reduce((sum, s) => {
      const ranks = tgp4Distribution[s.nome] || 0;
      return sum + (isMM ? getTgp4CostForMM(ranks) : getTgp4Cost(ranks));
    }, 0);

    const costOfNextRank = isMM ? 1 : (currentRanks === 0 ? 1 : 2);
    
    if (spentInCat + costOfNextRank <= pool) {
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

  const listPS = tgp4Distribution['Liste incantesimi'] || 0;
  const listPool = getTgp4Pool('Liste incantesimi', profession.professione);
  const baseAccumulated = characterData.spellListChanceAccumulated || 0;
  const totalChance = baseAccumulated + (listPS * 20);

  const handleAddListPS = () => {
    if (listPS < listPool) {
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
              <button type="button" onClick={handleSubListPS} className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200">-</button>
              <span className="font-bold w-4 text-center">{listPS}</span>
              <button type="button" onClick={handleAddListPS} disabled={listPS >= listPool} className="px-2 py-0.5 bg-indigo-100 border border-indigo-300 rounded text-indigo-800 hover:bg-indigo-200 disabled:opacity-50">+</button>
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

      <p className="mb-6 text-muted">
        Distribuisci i gradi della tua professione (<strong>TB_6</strong>) e spendi i tuoi Punti Sviluppo (<strong>TGP_4</strong>) per il Livello 1.
        Ricorda che in TGP_4 il 1° grado costa 1 PS, il 2° grado costa altri 2 PS (totale 3). Max 2 gradi per livello (eccetto Manovre in Movimento).
      </p>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {categories.map(cat => {
          const catSkills = primarySkillsList.filter(s => s.categoria === cat);
          if (catSkills.length === 0) return null;

          const tb6Pool = getTb6Pool(cat, profession);
          const tgp4Pool = cat === 'Abilità Varie' ? 0 : getTgp4Pool(cat, profession.professione);
          const tgp4PoolResistenza = cat === 'Abilità Varie' ? getTgp4Pool('Resistenza Fisica', profession.professione) : 0;
          
          const isMM = cat === 'Abilità di Movimento e Manovra';

          const spentTb6 = catSkills.reduce((sum, s) => sum + (tb6Distribution[s.nome] || 0), 0);
          
          const spentTgp4 = catSkills.reduce((sum, s) => {
            if (cat === 'Abilità Varie' && s.nome !== 'Resistenza Fisica') return sum;
            const ranks = tgp4Distribution[s.nome] || 0;
            return sum + (isMM ? getTgp4CostForMM(ranks) : getTgp4Cost(ranks));
          }, 0);

          const isTb6Full = spentTb6 >= tb6Pool;
          const isTgp4Full = cat === 'Abilità Varie' ? (spentTgp4 >= tgp4PoolResistenza) : (spentTgp4 >= tgp4Pool);
          
          // Only show category if it has skills that we actually display (skip empty ones if any)
          return (
            <div key={cat} className="card">
              <div className="card-header bg-gray-50 border-b border-gray-200 flex justify-between items-center" style={{padding: '0.75rem 1rem'}}>
                <h4 className="font-semibold text-gray-700 m-0 text-sm uppercase tracking-wider">{cat}</h4>
                <div className="flex gap-4 text-xs">
                  {tb6Pool > 0 && (
                    <span className={`px-2 py-1 rounded font-bold ${isTb6Full ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      TB_6: {spentTb6} / {tb6Pool} Gradi
                    </span>
                  )}
                  {tgp4Pool > 0 && (
                    <span className={`px-2 py-1 rounded font-bold ${isTgp4Full ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                      TGP_4: {spentTgp4} / {tgp4Pool} PS
                    </span>
                  )}
                  {tgp4PoolResistenza > 0 && (
                    <span className={`px-2 py-1 rounded font-bold ${isTgp4Full ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                      TGP_4 (Res. Fisica): {spentTgp4} / {tgp4PoolResistenza} PS
                    </span>
                  )}
                </div>
              </div>
              
              <div className="card-body overflow-x-auto" style={{padding: '0'}}>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2">Abilità</th>
                      <th className="px-2 py-2 text-center" title="Gradi Adolescenza (Fissi)">Adol.</th>
                      <th className="px-2 py-2 text-center bg-blue-50/30" title="Gradi Fissi da Professione (TB_6)">Prof. fissa</th>
                      <th className="px-2 py-2 text-center bg-blue-50/50" title="Distribuzione Pool Professione (TB_6)">Distr. TB_6</th>
                      <th className="px-2 py-2 text-center bg-purple-50/50" title="Sviluppo Apprendistato Livello 1 (TGP_4)">Lvl 1 (TGP_4)</th>
                      <th className="px-2 py-2 text-center font-bold">Tot Gradi</th>
                      <th className="px-2 py-2 text-center">Bonus Gradi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catSkills.map((sk) => {
                      const name = sk.nome;
                      const adRanks = baseSkills[name]?.adolescenceRanks || 0;
                      const profFixedRanks = getSpecificTb6Ranks(name, profession);
                      
                      const tb6Ranks = tb6Distribution[name] || 0;
                      const tgp4Ranks = tgp4Distribution[name] || 0;
                      
                      const totalRanks = adRanks + profFixedRanks + tb6Ranks + tgp4Ranks;
                      const bonus = getRanksBonus(name, totalRanks);

                      const max = getMaxRanks(name);

                      // For TGP_4, determine cost of next rank
                      const nextRankCost = isMM ? 1 : (tgp4Ranks === 0 ? 1 : 2);
                      const currentPool = cat === 'Abilità Varie' ? (name === 'Resistenza Fisica' ? tgp4PoolResistenza : 0) : tgp4Pool;
                      
                      const canAddTgp4 = (isMM || tgp4Ranks < 2) && (spentTgp4 + nextRankCost <= currentPool);
                      const canAddTb6 = spentTb6 < tb6Pool;

                      // Display logic
                      const hasTb6Pool = tb6Pool > 0;
                      const hasTgp4Pool = currentPool > 0;

                      return (
                        <tr key={name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{name}</td>
                          <td className="px-2 py-2 text-center text-gray-500">{adRanks}</td>
                          <td className="px-2 py-2 text-center text-blue-700 font-semibold bg-blue-50/30">
                            {profFixedRanks > 0 ? `+${profFixedRanks}` : '-'}
                          </td>
                          <td className="px-2 py-2 text-center bg-blue-50/50">
                            {hasTb6Pool ? (
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleSubTb6(name)}
                                  disabled={tb6Ranks === 0}
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-200 text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-300"
                                >-</button>
                                <span className="font-bold w-4">{tb6Ranks}</span>
                                <button 
                                  onClick={() => handleAddTb6(name, cat)}
                                  disabled={!canAddTb6}
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-200 text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-300"
                                >+</button>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-2 py-2 text-center bg-purple-50/50">
                            {hasTgp4Pool ? (
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleSubTgp4(name)}
                                  disabled={tgp4Ranks === 0}
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-300"
                                >-</button>
                                <span className="font-bold w-4">{tgp4Ranks}</span>
                                <button 
                                  onClick={() => handleAddTgp4(name, cat)}
                                  disabled={!canAddTgp4}
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-300"
                                >+</button>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-gray-800">
                            {totalRanks} {max !== null ? <span className="text-[10px] font-normal text-gray-500">({max} max)</span> : ''}
                          </td>
                          <td className="px-2 py-2 text-center font-black text-primary-color">
                            {bonus > 0 && typeof bonus === 'number' ? `+${bonus}` : bonus}
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
