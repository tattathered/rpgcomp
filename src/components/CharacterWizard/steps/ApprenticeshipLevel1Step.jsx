import { useState, useEffect } from 'react';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import tb1 from '../../../data/TB_1-caratteristiche_bonus.json';
import tgp4Data from '../../../data/TGP_4-sviluppo_abilità_professioni.json';

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
      // Check if actually changed to avoid loop
      if (JSON.stringify(prev.level1Tb6) === JSON.stringify(tb6Distribution) &&
          JSON.stringify(prev.level1Tgp4) === JSON.stringify(tgp4Distribution) &&
          JSON.stringify(prev.skills) === JSON.stringify(newSkills)) {
        return prev;
      }
      return {
        ...prev,
        level1Tb6: tb6Distribution,
        level1Tgp4: tgp4Distribution,
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

  const isWarriorOrScout = ['guerriero', 'scout'].includes(profession.professione.toLowerCase());
  const selectedRealm = characterData.magicRealm || '';

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
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">Liste Incantesimi</span>
          <p className="text-xs mt-2 text-indigo-900">
            Hai a disposizione <strong>{getTgp4Pool('Liste incantesimi', profession.professione)}</strong> Punti Sviluppo per le liste. 
            (Selezione liste in sviluppo).
          </p>
          <select className="mt-2 block w-full rounded border-gray-300 text-sm p-2 bg-white" disabled>
            <option>-- Seleziona Lista (Disponibile prossimamente) --</option>
          </select>
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
