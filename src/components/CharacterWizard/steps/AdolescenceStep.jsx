import { useEffect } from 'react';
import adolescenceData from '../../../data/TGP_5-sviluppo_abilita_adolescenza-v2.json';
import tb1 from '../../../data/TB_1-caratteristiche_bonus.json';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';

const STAT_KEYS = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
const STAT_NAMES = {
  'FR': 'Forza',
  'AG': 'Agilità',
  'CO': 'Costituzione',
  'IN': 'Intelligenza',
  'IT': 'Intuizione',
  'PR': 'Presenza'
};

const parseBonusValue = (val) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace('+', '').trim();
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 0 : parsed;
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

export default function AdolescenceStep({ characterData, setCharacterData }) {
  const race = characterData.race;
  const profession = characterData.profession;

  const getBonus = (val) => {
    if (!val) return 0;
    const record = tb1.find(b => b.punteggio === parseInt(val));
    return record ? record.bonus : 0;
  };

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
              const val = characterData.stats[key];
              const natBonus = val ? getBonus(val) : 0;
              const raceBonusStr = race ? race[`bonus a ${key}`] : 0;
              const raceBonus = parseBonusValue(raceBonusStr);
              const totalBonus = natBonus + raceBonus;
              const isLast = idx === STAT_KEYS.length - 1;
              return (
                <div key={key} className={`grid grid-cols-5 gap-4 px-4 py-2 items-center text-sm ${!isLast ? 'border-b border-gray-100' : ''}`}>
                  <div className="text-gray-900 font-medium">
                    {STAT_NAMES[key]} ({key})
                  </div>
                  <div className="text-gray-800 font-bold">
                    {val || '-'}
                  </div>
                  <div className={`font-bold ${natBonus > 0 ? 'text-green-700' : natBonus < 0 ? 'text-red-700' : 'text-gray-500'}`}>
                    {natBonus > 0 ? `+${natBonus}` : natBonus}
                  </div>
                  <div className={`font-bold ${raceBonus > 0 ? 'text-blue-700' : raceBonus < 0 ? 'text-red-700' : 'text-gray-500'}`}>
                    {raceBonus > 0 ? `+${raceBonus}` : raceBonus}
                  </div>
                  <div className={`font-black ${totalBonus > 0 ? 'text-purple-700' : totalBonus < 0 ? 'text-red-700' : 'text-gray-800'}`}>
                    {totalBonus > 0 ? `+${totalBonus}` : totalBonus}
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
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
        {regularCategories.map(cat => {
          const catSkills = Object.entries(skills).filter(([_, data]) => data.category === cat);
          if (catSkills.length === 0) return null;

          return (
            <div key={cat} className="card h-full">
              <div className="card-header bg-gray-50 border-b border-gray-200" style={{padding: '0.75rem 1rem'}}>
                <h4 className="font-semibold text-gray-700 m-0 text-sm uppercase tracking-wider">{cat}</h4>
              </div>
              <div className="card-body" style={{padding: '0'}}>
                <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-50/50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">Abilità</div>
                  <div className="text-center">Gradi Adol.</div>
                </div>
                <div className="m-0 p-0 text-sm">
                  {catSkills.map(([name, data], idx) => {
                    const max = getMaxRanks(name);
                    return (
                      <div key={name} className={`grid grid-cols-4 gap-2 items-center px-4 py-2 ${idx < catSkills.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="col-span-3 font-medium text-gray-900">
                          {name}
                        </div>
                        <div className="text-center font-bold text-primary-color">
                          {data.adolescenceRanks} {max !== null ? <span className="text-xs font-normal text-gray-500">({max} max)</span> : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

