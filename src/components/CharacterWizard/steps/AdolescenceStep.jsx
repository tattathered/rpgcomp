import { useEffect, useState, useMemo } from 'react';
import adolescenceData from '../../../data/TGP_5-sviluppo_abilita_adolescenza-v2.json';
import secondarySkillsList from '../../../data/Tabella-abilita_secondarie.json';
import tgp5Data from '../../../data/TGP_5-sviluppo_abilita_adolescenza-v2.json';
import { getAvailableSpellLists } from '../../../utils/magicHelpers';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getSpecificTb6Ranks,
  getFinalStats,
  fmt
} from '../../../utils/skillHelpers';

const STAT_KEYS = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
const STAT_NAMES = {
  'FR': 'Forza',
  'AG': 'Agilità',
  'CO': 'Costituzione',
  'IN': 'Intelligenza',
  'IT': 'Intuizione',
  'PR': 'Presenza'
};

// profRanks will be handled in the next step

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

export default function AdolescenceStep({ characterData, setCharacterData }) {
  const race = characterData.race;
  const profession = characterData.profession;

  // Automatically determine realm for non-choosing professions
  useEffect(() => {
    if (profession) {
      const name = profession.professione.toLowerCase();
      if (name === 'mago' || name === 'bardo') {
        if (characterData.magicRealm !== 'Essenza') {
          setCharacterData(prev => ({ ...prev, magicRealm: 'Essenza' }));
        }
      } else if (name === 'animista' || name === 'ranger') {
        if (characterData.magicRealm !== 'Flusso') {
          setCharacterData(prev => ({ ...prev, magicRealm: 'Flusso' }));
        }
      }
    }
  }, [profession, characterData.magicRealm, setCharacterData]);

  // Calculate & Save skills combined ranks
  useEffect(() => {
    if (race && race.popolo && profession) {
      const newSkills = {};

      // 1. Process all primary skills from Tabella-abilita_primarie
      primarySkillsList.forEach(skill => {
        // Find adolescence ranks in race development
        const adRecord = adolescenceData.find(item => item.abilità?.toLowerCase() === skill.nome?.toLowerCase());
        const adRanks = adRecord ? (adRecord[race.popolo] || 0) : 0;

        // Store just the adolescence ranks for this step
        const totalRanks = adRanks;

        newSkills[skill.nome] = {
          category: skill.categoria,
          type: skill.tipo,
          valoreIniziale: skill['valore iniziale'],
          adolescenceRanks: adRanks,
          professionRanks: 0,
          totalRanks: totalRanks,
          specialBonus: characterData.skills?.[skill.nome]?.specialBonus || 0,
          itemBonus: characterData.skills?.[skill.nome]?.itemBonus || 0,
          learnedRanks: characterData.skills?.[skill.nome]?.learnedRanks || 0,
        };
      });

      // 2. Process other development variables from TGP_5
      const specialKeys = [
        'Punti Lingue Addizionali',
        'Punti Lingue Addizionali ',
        'Punti Background',
        'Punti Background ',
        'Percentuale di Probabilità di Imparare una Lista di Incantesimi',
        'Percentuale di Probabilità di Imparare una Lista di Incantesimi '
      ];

      specialKeys.forEach(key => {
        const adRecord = adolescenceData.find(item => item.abilità === key);
        if (adRecord && adRecord[race.popolo] !== undefined) {
          const ranks = adRecord[race.popolo];
          newSkills[key.trim()] = {
            category: 'Altre Abilità',
            type: 'Altro',
            adolescenceRanks: ranks,
            professionRanks: 0,
            totalRanks: ranks,
            notes: adRecord.note
          };
        }
      });

      // Avoid loop: check if stringified skills actually changed
      if (JSON.stringify(characterData.skills) !== JSON.stringify(newSkills)) {
        setCharacterData(prev => ({
          ...prev,
          skills: newSkills,
          adolescenceSkills: newSkills // Backwards compatibility
        }));
      }
    }
  }, [race, profession, characterData.skills, setCharacterData]);

  if (!race) {
    return (
      <div className="p-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 bg-gray-50">
        Torna allo Step 1 e seleziona un Popolo prima di procedere.
      </div>
    );
  }

  if (!profession) {
    return (
      <div className="p-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 bg-gray-50">
        Torna allo Step 2 e seleziona una Professione prima di procedere.
      </div>
    );
  }

  const isWarriorOrScout = ['guerriero', 'scout'].includes(profession.professione.toLowerCase());
  const selectedRealm = characterData.magicRealm || '';

  const handleRealmChange = (realm) => {
    setCharacterData(prev => ({ ...prev, magicRealm: realm }));
  };

  const skills = characterData.skills || {};
  const categories = [...new Set(Object.values(skills).map(s => s.category))];

  const finalStats = useMemo(() => {
    return getFinalStats(characterData.stats || {}, race, {});
  }, [characterData.stats, race]);

  const finalSkills = useMemo(() => {
    const result = {};
    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const base = skills[name] || {};
      const adRanks = base.adolescenceRanks || 0;
      const profRanks = getSpecificTb6Ranks(name, profession); // fixed profession ranks
      const tgp4Ranks = 0;
      const bgExtra = 0;
      const totalRanks = adRanks + profRanks;

      // Stat bonus for this skill
      const carattSiglaMatch = (sk['valore iniziale'] || '').match(/([A-Z]{2})$/);
      const carattSigla = carattSiglaMatch ? carattSiglaMatch[1] : '';
      const carattBonus = carattSigla ? finalStats[carattSigla]?.bonusTot || 0 : 0;

      const bonusGradi = getRanksBonus(name, totalRanks);
      const ingombroBonus = getIngombroBonus(name);

      let totalBonus;
      if (typeof bonusGradi === 'number') {
        totalBonus = bonusGradi + carattBonus + (ingombroBonus ?? 0);
      } else {
        totalBonus = bonusGradi; // e.g. "3d10"
      }

      result[name] = {
        category: sk.categoria,
        adRanks,
        profRanks,
        tgp4Ranks,
        bgExtra,
        totalRanks,
        carattSigla,
        carattBonus,
        bonusGradi,
        ingombroBonus,
        totalBonus,
        valoreIniziale: sk['valore iniziale'],
      };
    });
    return result;
  }, [skills, finalStats, profession]);
  
  // Spell Lists logic
  const knownLists = Object.keys(characterData.spellListAllocations || {});
  const rawAvailableLists = getAvailableSpellLists(profession.professione, selectedRealm);
  const availableLists = rawAvailableLists.filter(l => !knownLists.includes(l.nome_lista));
  
  // Trova la probabilità base in TGP_5
  const baseChanceRow = tgp5Data.find(d => d['abilità'] === '% Probabilità di Imparare una Lista di Incantesimi');
  const baseChance = baseChanceRow ? (baseChanceRow[race.popolo] || 0) : 0;
  
  const currentAccumulated = characterData.spellListChanceAccumulated !== undefined 
    ? characterData.spellListChanceAccumulated 
    : baseChance;

  const [rollResult, setRollResult] = useState(null);
  const [selectedList, setSelectedList] = useState('');

  const handleRoll = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    setRollResult(roll);
    if (roll <= currentAccumulated) {
      // Success, chance is consumed. It will be 0 after they pick a list, 
      // but for now we wait for them to pick the list.
    } else {
      // Failure, chance is retained.
      setCharacterData(prev => ({
        ...prev,
        spellListChanceAccumulated: currentAccumulated
      }));
    }
  };

  const handleAcquireList = () => {
    if (!selectedList) return;
    setCharacterData(prev => ({
      ...prev,
      spellListChanceAccumulated: 0,
      spellListAllocations: {
        ...(prev.spellListAllocations || {}),
        [selectedList]: 'Adolescenza' // Mark as acquired
      }
    }));
    setRollResult(null); // Reset UI
  };

  // Check if they already acquired one in adolescence
  const acquiredListEntry = Object.entries(characterData.spellListAllocations || {}).find(([name, source]) => source === 'Adolescenza');
  const hasAcquiredInAdolescence = !!acquiredListEntry;
  const acquiredListName = hasAcquiredInAdolescence ? acquiredListEntry[0] : '';

  // Separate regular skills from special points
  const regularCategories = categories.filter(c => c !== 'Altre Abilità ' && c !== 'Altre Abilità' && c !== 'Altro Sviluppo');
  const otherSkills = Object.entries(skills).filter(([name, data]) => data.category.includes('Altre Abilità'));

  return (
    <div>
      {/* Banner in alto con Professione, Popolo e Reame Magico */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Box Popolo */}
        <div className="p-4 border border-blue-200 rounded bg-blue-50/50 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Popolo Selezionato</span>
            <h3 className="font-bold text-blue-900 m-0" style={{fontSize: '1.2rem', marginTop: '0.25rem'}}>{race.popolo}</h3>
          </div>
          <div className="text-xs text-blue-800 font-medium mt-2">
            {race['note (umani/non umani)']}
          </div>
        </div>

        {/* Box Professione */}
        <div className="p-4 border border-purple-200 rounded bg-purple-50/50 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Professione Selezionata</span>
            <h3 className="font-bold text-purple-900 m-0" style={{fontSize: '1.2rem', marginTop: '0.25rem'}}>{profession.professione}</h3>
          </div>
          <div className="text-xs text-purple-800 font-medium mt-2">
            Primaria: {profession.primaria} | Secondaria: {profession.secondaria}
          </div>
        </div>

        {/* Box Reame Magico */}
        <div className="p-4 border border-teal-200 rounded bg-teal-50/50 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Reame Magico & Regole</span>
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
          <div className="text-xs text-teal-900 font-medium mt-2">
            {profession['liste incantesimi'] && <span>Liste: <strong>{profession['liste incantesimi']}</strong></span>}
            {profession['limite incantesimi'] && <span className="block text-[11px] text-teal-800 italic">{profession['limite incantesimi']}</span>}
          </div>
        </div>
      </div>

      {/* Box Apprendimento Liste Incantesimi Adolescenza */}
      {selectedRealm && (
        <div className="mb-6 p-4 border border-indigo-200 bg-indigo-50/50 rounded flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold uppercase tracking-wider text-indigo-800">Apprendimento Lista Incantesimi (Adolescenza)</span>
            <span className="text-xs font-bold bg-indigo-200 text-indigo-900 px-2 py-1 rounded-full">
              Probabilità Attuale: {currentAccumulated}%
            </span>
          </div>
          
          {hasAcquiredInAdolescence ? (
            <div className="text-sm text-indigo-700 bg-indigo-100 p-3 rounded text-center font-medium border border-indigo-200">
              Hai imparato con successo: <strong>{acquiredListName}</strong>
            </div>
          ) : rollResult && rollResult <= currentAccumulated ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-green-700 bg-green-100 p-2 rounded text-center font-medium border border-green-300">
                Tiro: <strong>{rollResult}</strong> - Successo! Scegli la lista da imparare:
              </div>
              <div className="flex gap-2 mt-1">
                <select 
                  className="flex-1 rounded border-indigo-300 text-sm p-1.5 bg-white"
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                >
                  <option value="">-- Seleziona Lista --</option>
                  {availableLists.map(l => (
                    <option key={l.nome_lista} value={l.nome_lista}>{l.nome_lista} ({l.tipo_lista})</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={handleAcquireList}
                  disabled={!selectedList}
                  className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  Conferma
                </button>
              </div>
            </div>
          ) : rollResult && rollResult > currentAccumulated ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-red-700 bg-red-100 p-2 rounded text-center font-medium border border-red-300">
                Tiro: <strong>{rollResult}</strong> - Fallimento. Hai mantenuto il {currentAccumulated}% per il prossimo livello.
              </div>
              <button onClick={() => setRollResult(null)} className="text-xs text-indigo-600 hover:underline text-center">Nascondi esito</button>
            </div>
          ) : currentAccumulated > 0 ? (
            <div className="flex justify-between items-center bg-white p-3 rounded border border-indigo-100">
              <span className="text-sm text-indigo-900">
                In base al tuo popolo ({race.popolo}), hai un <strong>{baseChance}%</strong> di base.
                Tira 1d100. Se il risultato è ≤ {currentAccumulated}, impari una lista.
              </span>
              <button 
                type="button"
                onClick={handleRoll}
                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-700 transition"
              >
                Tenta (1d100)
              </button>
            </div>
          ) : (
            <div className="text-sm text-indigo-700 bg-indigo-100 p-2 rounded text-center font-medium">
              Non hai probabilità di imparare liste in adolescenza.
            </div>
          )}
        </div>
      )}

      {/* Warning se il Reame Magico non è ancora scelto */}
      {isWarriorOrScout && !selectedRealm && (
        <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded text-amber-900 text-sm font-semibold flex items-center gap-2">
          ⚠️ Scegli un Reame Magico (Essenza o Flusso) in alto a destra per il tuo {profession.professione}!
        </div>
      )}

      {/* Box Caratteristiche */}
      {characterData.stats && Object.keys(characterData.stats).length > 0 && (
        <div className="p-4 border border-green-200 rounded bg-green-50/50 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-green-800">Caratteristiche & Bonus Naturali</span>
          <div className="mt-3 bg-white border border-green-100 rounded overflow-hidden">
            <div className="grid grid-cols-5 gap-4 bg-green-50/80 px-4 py-2 border-b border-green-100 text-xs font-bold text-green-800 uppercase tracking-wider text-left">
              <div>Caratteristica</div>
              <div>Valore</div>
              <div>Bonus naturale</div>
              <div>Bonus popolo</div>
              <div>Bonus totale parziale</div>
            </div>
            {STAT_KEYS.map((key, idx) => {
              const s = finalStats[key];
              if (!s) return null;
              const isLast = idx === STAT_KEYS.length - 1;
              return (
                <div key={key} className={`grid grid-cols-5 gap-4 px-4 py-2 items-center text-sm ${!isLast ? 'border-b border-gray-100' : ''}`}>
                  <div className="text-gray-900 font-medium">
                    {STAT_NAMES[key]} ({key})
                  </div>
                  <div className="text-gray-800 font-bold">
                    {s.raw || '-'}
                  </div>
                  <div className={`font-bold ${s.bonusNaturale > 0 ? 'text-green-700' : s.bonusNaturale < 0 ? 'text-red-700' : 'text-gray-500'}`}>
                    {fmt(s.bonusNaturale)}
                  </div>
                  <div className={`font-bold ${s.raceMod > 0 ? 'text-blue-700' : s.raceMod < 0 ? 'text-red-700' : 'text-gray-500'}`}>
                    {fmt(s.raceMod)}
                  </div>
                  <div className={`font-black ${s.bonusTot > 0 ? 'text-purple-700' : s.bonusTot < 0 ? 'text-red-700' : 'text-gray-800'}`}>
                    {fmt(s.bonusTot)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mb-6 text-muted">
        In base alla cultura del tuo Popolo (<strong>{race.popolo}</strong>) hai ottenuto i seguenti Gradi di sviluppo delle abilità in fase adolescenziale.
      </p>

      {/* Griglia delle abilità */}
      <h3 className="text-xl font-bold mb-4 text-gray-800">Sviluppo Adolescenza</h3>
      <div className="flex flex-col gap-6 mb-8">
        {regularCategories.map(cat => {
          const catSkills = primarySkillsList.filter(s => s.categoria === cat);
          if (catSkills.length === 0) return null;

          return (
            <div key={cat} className="card">
              <div className="card-header bg-gray-50 border-b border-gray-200" style={{padding: '0.75rem 1rem'}}>
                <h4 className="font-semibold text-gray-700 m-0 text-sm uppercase tracking-wider">{cat}</h4>
              </div>
              <div className="card-body overflow-x-auto" style={{padding: '0'}}>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2">Abilità</th>
                      <th className="px-2 py-2 text-center">G. adolescenza</th>
                      <th className="px-2 py-2 text-center">G. bonus prof.</th>
                      <th className="px-2 py-2 text-center">G. svil. prof.</th>
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
                      const s = finalSkills[name];
                      if (!s) return null;

                      const max = getMaxRanks(name);
                      const hasIngombro = s.ingombroBonus !== null;
                      const totalBonusStr = typeof s.totalBonus === 'number' ? fmt(s.totalBonus) : s.totalBonus;

                      return (
                        <tr key={name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">
                            {name} {max !== null ? <span className="text-[10px] text-gray-400">({max} max)</span> : ''}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-700 font-semibold">{s.adRanks}</td>
                          <td className="px-2 py-2 text-center text-blue-700 font-semibold">{s.profRanks > 0 ? `+${s.profRanks}` : '0'}</td>
                          <td className="px-2 py-2 text-center text-gray-400">—</td>
                          <td className="px-2 py-2 text-center text-gray-400">—</td>
                          <td className="px-2 py-2 text-center font-bold text-gray-800">{s.totalRanks}</td>
                          <td className="px-2 py-2 text-center font-bold text-gray-700">
                            {typeof s.bonusGradi === 'number' ? fmt(s.bonusGradi) : s.bonusGradi}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600">
                            {s.carattSigla ? `${s.carattSigla} ${fmt(s.carattBonus)}` : '—'}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600">
                            {hasIngombro ? fmt(s.ingombroBonus) : '—'}
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

      {otherSkills.length > 0 && (
        <div className="card border-orange-200 mb-6">
          <div className="card-header bg-orange-50 border-b border-orange-200" style={{padding: '1rem'}}>
            <h4 className="font-semibold text-orange-900 m-0">Punti Speciali & Altre Abilità</h4>
          </div>
          <div className="card-body">
            <div className="grid-2">
              {otherSkills.map(([name, data]) => (
                <div key={name} className="flex items-start gap-4 p-4 border border-orange-100 rounded bg-white">
                  <div className="flex-1">
                    <h5 className="font-bold text-orange-800 m-0 mb-1">{name}</h5>
                    {data.notes && <p className="text-xs text-muted m-0">{data.notes}</p>}
                  </div>
                  <div className="text-xl font-black text-orange-600 bg-orange-100 px-3 py-2 rounded">
                    {data.totalRanks}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-50 text-orange-800 text-sm rounded border border-orange-200">
              <strong>Nota:</strong> I "Punti Lingue Addizionali" e i "Punti Background" non sono abilità dirette, ma un pool di punti che potrai spendere negli step successivi.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

