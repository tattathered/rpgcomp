import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import AnagraficaReadOnlyBox from '../shared/AnagraficaReadOnlyBox';
import { getAvailableSpellLists } from '../../../utils/magicHelpers';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import secondarySkillsList from '../../../data/Tabella-abilita_secondarie.json';
import gradiLingue from '../../../data/TGP_1-gradi_conoscenze_lingue.json';
import catalogData from '../../../data/TS_4-equipaggiamento.json';

// Nuove tabelle relazionali normalizzate
import languagesData from '../../../data/languages.json';
import raceLanguagesData from '../../../data/race_languages.json';
import racesData from '../../../data/races.json';

import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getSpecificTb6Ranks,
  getFinalStats,
  fmt,
  getTgp5AdolescenceRanks,
  getTb6PoolSize,
  getRaceId,
  getSkillId
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

const getWeaponsForSkill = (skillName, catalog) => {
  const normalizedSkill = skillName.toLowerCase().trim();
  const weapons = catalog.filter(item => item.categoria === 'armi');
  
  const matched = weapons.filter(item => {
    const nome = (item.nome || '').toLowerCase();
    const note = (item.note || '').toLowerCase();
    
    if (normalizedSkill === 'con asta') {
      return note.includes('con asta') || nome.includes('lancia') || nome.includes('giavellotto');
    }
    
    if (normalizedSkill === 'a 2 mani') {
      const isConAsta = note.includes('con asta') || nome.includes('lancia') || nome.includes('giavellotto');
      if (isConAsta) return false;
      return note.includes('2 mani') || note.includes('due mani') || nome.includes('a 2 mani') || nome.includes('a due mani');
    }
    
    if (normalizedSkill === 'da tiro') {
      return note.includes('da tiro') || note.includes('tiro') || nome.includes('arco') || nome.includes('balestra') || nome.includes('fionda');
    }
    
    if (normalizedSkill === 'da lancio') {
      const isConAsta = note.includes('con asta') || nome.includes('lancia') || nome.includes('giavellotto');
      if (isConAsta) return false;
      return note.includes('lancio') || note.includes('da lancio') || nome.includes('bolas');
    }
    
    if (normalizedSkill === 'taglio a 1 mano') {
      if (note.includes('2 mani') || note.includes('due mani') || nome.includes('a 2 mani') || nome.includes('a due mani')) return false;
      return note.includes('da taglio') || nome.includes('spada') || nome.includes('pugnale') || nome.includes('accetta') || nome.includes('scimitarra') || nome.includes('frusta');
    }
    
    if (normalizedSkill === 'contundenti a 1 mano') {
      if (note.includes('2 mani') || note.includes('due mani') || nome.includes('a 2 mani') || nome.includes('a due mani')) return false;
      return note.includes('contundente') || nome.includes('randello') || nome.includes('mazzafrusto') || nome.includes('rete') || nome.includes('martello');
    }
    
    return false;
  });
  
  const names = matched.map(item => item.nome);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
};

function Tooltip({ content }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  const tooltipContent = (
    <div
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        backgroundColor: '#1e293b', // slate-800
        color: '#f8fafc', // slate-50
        padding: '0.6rem 0.8rem',
        borderRadius: '0.375rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
        fontSize: '0.75rem',
        pointerEvents: 'none',
        maxWidth: '280px',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        lineHeight: '1.4',
        border: '1px solid #334155',
        fontWeight: 'normal',
        textAlign: 'left'
      }}
    >
      <div style={{ fontWeight: '700', marginBottom: '0.35rem', borderBottom: '1px solid #475569', paddingBottom: '0.2rem', color: '#38bdf8' }}>
        Armi incluse:
      </div>
      {content}
      <div
        style={{
          position: 'absolute',
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '8px',
          height: '8px',
          backgroundColor: '#1e293b',
          borderRight: '1px solid #334155',
          borderBottom: '1px solid #334155'
        }}
      />
    </div>
  );

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '0.35rem', verticalAlign: 'middle' }}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold flex items-center justify-center text-[10px] transition-colors focus:outline-none"
        style={{ cursor: 'help', border: 'none', padding: 0 }}
      >
        ?
      </button>
      {visible && createPortal(tooltipContent, document.body)}
    </span>
  );
}

export default function AdolescenceStep({ characterData, setCharacterData, equipmentCatalog }) {
  const race = characterData.race;
  const profession = characterData.profession;
  const catalog = equipmentCatalog || catalogData;

  // Init languages from race
  useEffect(() => {
    if (race && (!characterData.background?.languages)) {
      const baseLangs = {};
      const raceId = race.id || getRaceId(race.popolo);
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

  const allLanguages = useMemo(() => [...new Set(languagesData.map(l => l.name_it))].sort(), []);
  const languages = characterData.background?.languages || {};
  const languagePointsTotal = characterData.skills?.['Punti Lingue Addizionali']?.totalRanks || 0;
  const languagePointsSpent = Object.values(languages).reduce((sum, l) => sum + (l.addedAdolescenza || 0), 0);
  const languagePointsLeft = languagePointsTotal - languagePointsSpent;

  const addLangPoint = (lang) => {
    if (languagePointsLeft <= 0) return;
    const cur = languages[lang] || { base: 0, addedAdolescenza: 0, addedLivello1: 0, added: 0 };
    const total = (cur.base || 0) + (cur.addedAdolescenza || 0) + (cur.addedLivello1 || 0);
    if (total >= 5) return;
    
    const nextLangs = {
      ...languages,
      [lang]: {
        ...cur,
        addedAdolescenza: (cur.addedAdolescenza || 0) + 1,
        added: (cur.addedAdolescenza || 0) + 1 + (cur.addedLivello1 || 0)
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
    if (!cur || cur.addedAdolescenza <= 0) return;
    
    const nextLangs = { ...languages };
    const newAddedAdolescenza = cur.addedAdolescenza - 1;
    const newAdded = newAddedAdolescenza + (cur.addedLivello1 || 0);
    
    if (cur.base === 0 && newAddedAdolescenza === 0 && !cur.addedLivello1 && !cur.fromBg) {
      delete nextLangs[lang];
    } else {
      nextLangs[lang] = {
        ...cur,
        addedAdolescenza: newAddedAdolescenza,
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
        addedAdolescenza: (cur.addedAdolescenza || 0) + 1,
        added: (cur.addedAdolescenza || 0) + 1 + (cur.addedLivello1 || 0)
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
        const isCogliere = skill.nome.toLowerCase() === 'cogliere alle spalle';
        // Find adolescence ranks in race development
        const adRanks = isCogliere ? 0 : getTgp5AdolescenceRanks(skill.nome, race.popolo);
        
        // Find profession ranks (distributed + fixed)
        const distributedProf = isCogliere ? 0 : (characterData.level1Tb6?.[skill.nome] || 0);
        const fixedProf = isCogliere ? 0 : getSpecificTb6Ranks(skill.nome, profession);
        const profRanks = distributedProf + fixedProf;

        const totalRanks = adRanks + profRanks;

        newSkills[skill.nome] = {
          category: skill.categoria,
          type: skill.tipo,
          valoreIniziale: skill['valore iniziale'],
          adolescenceRanks: adRanks,
          professionRanks: profRanks,
          totalRanks: totalRanks,
          specialBonus: characterData.skills?.[skill.nome]?.specialBonus || 0,
          itemBonus: characterData.skills?.[skill.nome]?.itemBonus || 0,
          learnedRanks: characterData.skills?.[skill.nome]?.learnedRanks || 0,
        };
      });

      // 2. Process other development variables from racesData properties
      const raceId = race.id || getRaceId(race.popolo);
      const fullRace = racesData.find(r => r.id === raceId) || race;
      
      const extraLangs = fullRace.extra_language_points !== undefined ? fullRace.extra_language_points : (race.extra_language_points || 0);
      newSkills['Punti Lingue Addizionali'] = {
        category: 'Altre Abilità',
        type: 'Altro',
        adolescenceRanks: extraLangs,
        professionRanks: 0,
        totalRanks: extraLangs,
        notes: 'Punti spendibili in lingue addizionali.'
      };

      const bgPoints = fullRace.background_points !== undefined ? fullRace.background_points : (race.background_points || 0);
      newSkills['Punti Background'] = {
        category: 'Altre Abilità',
        type: 'Altro',
        adolescenceRanks: bgPoints,
        professionRanks: 0,
        totalRanks: bgPoints,
        notes: 'Opzioni di background disponibili alla creazione.'
      };

      const learnChance = fullRace.spell_list_learn_chance !== undefined ? fullRace.spell_list_learn_chance : (race.spell_list_learn_chance || 0);
      newSkills['Percentuale di Probabilità di Imparare una Lista di Incantesimi'] = {
        category: 'Altre Abilità',
        type: 'Altro',
        adolescenceRanks: learnChance,
        professionRanks: 0,
        totalRanks: learnChance,
        notes: 'Probabilità base per l\'apprendimento delle liste di incantesimi.'
      };

      // Avoid loop: check if stringified skills actually changed
      if (JSON.stringify(characterData.skills) !== JSON.stringify(newSkills)) {
        setCharacterData(prev => ({
          ...prev,
          skills: newSkills,
          adolescenceSkills: newSkills // Backwards compatibility
        }));
      }
    }
  }, [race, profession, characterData.skills, characterData.level1Tb6, setCharacterData]);

  const isWarriorOrScout = profession ? ['guerriero', 'scout'].includes(profession.professione.toLowerCase()) : false;
  const selectedRealm = characterData.magicRealm || '';

  const handleRealmChange = (realm) => {
    setCharacterData(prev => ({ ...prev, magicRealm: realm }));
  };

  const skills = characterData.skills || {};
  const categories = [...new Set(Object.values(skills).map(s => s.category))];

  const finalStats = useMemo(() => {
    return getFinalStats(characterData.stats || {}, race, {});
  }, [characterData.stats, race]);

  const tb6Distribution = characterData.level1Tb6 || {};

  const spentTb6ByCat = useMemo(() => {
    const counts = {};
    primarySkillsList.forEach(sk => {
      const cat = sk.categoria;
      const spent = tb6Distribution[sk.nome] || 0;
      counts[cat] = (counts[cat] || 0) + spent;
    });
    return counts;
  }, [tb6Distribution]);

  const handleIncreaseTb6 = (skillName, cat) => {
    const poolSize = getTb6PoolSize(cat, profession);
    const spent = spentTb6ByCat[cat] || 0;
    if (spent < poolSize) {
      setCharacterData(prev => {
        const dist = { ...(prev.level1Tb6 || {}) };
        dist[skillName] = (dist[skillName] || 0) + 1;
        return {
          ...prev,
          level1Tb6: dist
        };
      });
    }
  };

  const handleDecreaseTb6 = (skillName, cat) => {
    const current = tb6Distribution[skillName] || 0;
    if (current > 0) {
      setCharacterData(prev => {
        const dist = { ...(prev.level1Tb6 || {}) };
        if (dist[skillName] <= 1) {
          delete dist[skillName];
        } else {
          dist[skillName] -= 1;
        }
        return {
          ...prev,
          level1Tb6: dist
        };
      });
    }
  };

  const finalSkills = useMemo(() => {
    const bgModifiers = characterData.background?.compiledModifiers || {};
    const primarySkillsSpecialBonus = bgModifiers.primarySkillsSpecialBonus || {};

    const result = {};
    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';
      const adRanks = isCogliereAlleSpalle ? 0 : getTgp5AdolescenceRanks(name, race?.popolo);
      const profFixed = isCogliereAlleSpalle ? 0 : getSpecificTb6Ranks(name, profession);
      const profDist = isCogliereAlleSpalle ? 0 : (tb6Distribution[name] || 0);
      const profRanks = profFixed + profDist;
      const tgp4Ranks = 0;
      const bgExtra = 0;
      const totalRanks = adRanks + profRanks;

      // Stat bonus for this skill
      const carattSiglaMatch = (sk['valore iniziale'] || '').match(/([A-Z]{2})$/);
      const carattSigla = carattSiglaMatch ? carattSiglaMatch[1] : '';
      const carattBonus = isCogliereAlleSpalle ? 0 : (carattSigla ? finalStats[carattSigla]?.bonusTot || 0 : 0);

      const bonusGradi = getRanksBonus(name, totalRanks);
      const ingombroBonus = getIngombroBonus(name);
      const specialBonus = primarySkillsSpecialBonus[name] || 0;

      let totalBonus;
      if (typeof bonusGradi === 'number') {
        totalBonus = bonusGradi + carattBonus + specialBonus + (ingombroBonus ?? 0);
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
        specialBonus,
        totalBonus,
        valoreIniziale: sk['valore iniziale'],
      };
    });
    return result;
  }, [race?.popolo, tb6Distribution, finalStats, profession, characterData]);
  
  // Spell Lists logic
  const knownLists = Object.keys(characterData.spellListAllocations || {});
  const rawAvailableLists = profession ? getAvailableSpellLists(profession.professione, selectedRealm) : [];
  const availableLists = rawAvailableLists.filter(l => !knownLists.includes(l.nome_lista));
  
  // Trova la probabilità base in racesData
  const raceId = race ? (race.id || getRaceId(race.popolo)) : null;
  const fullRace = racesData.find(r => r.id === raceId) || race;
  const baseChance = fullRace ? (fullRace.spell_list_learn_chance || 0) : 0;
  
  const currentAccumulated = characterData.spellListChanceAccumulated !== undefined 
    ? characterData.spellListChanceAccumulated 
    : baseChance;
  
  const rollResult = characterData.adolescenceSpellListRoll !== undefined ? characterData.adolescenceSpellListRoll : null;
  const [selectedList, setSelectedList] = useState('');

  useEffect(() => {
    if (characterData.spellListChanceAccumulated === undefined && baseChance !== undefined) {
      setCharacterData(prev => ({
        ...prev,
        spellListChanceAccumulated: baseChance
      }));
    }
  }, [baseChance, characterData.spellListChanceAccumulated, setCharacterData]);

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

  const handleRoll = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    setCharacterData(prev => {
      const nextChance = roll <= currentAccumulated ? prev.spellListChanceAccumulated : currentAccumulated;
      return {
        ...prev,
        spellListChanceAccumulated: nextChance !== undefined ? nextChance : baseChance,
        adolescenceSpellListRoll: roll
      };
    });
  };

  const handleAcquireList = () => {
    if (!selectedList) return;
    setCharacterData(prev => ({
      ...prev,
      spellListChanceAccumulated: 0,
      spellListAllocations: {
        ...(prev.spellListAllocations || {}),
        [selectedList]: 'Adolescenza'
      }
    }));
  };

  const handleRemoveSpellList = () => {
    setCharacterData(prev => {
      const nextAlloc = { ...prev.spellListAllocations };
      delete nextAlloc[acquiredListName];
      return {
        ...prev,
        spellListChanceAccumulated: baseChance,
        adolescenceSpellListRoll: null,
        spellListAllocations: nextAlloc
      };
    });
    setSelectedList('');
  };

  // Check if they already acquired one in adolescence
  const acquiredListEntry = Object.entries(characterData.spellListAllocations || {}).find(([name, source]) => source === 'Adolescenza');
  const hasAcquiredInAdolescence = !!acquiredListEntry;
  const acquiredListName = hasAcquiredInAdolescence ? acquiredListEntry[0] : '';

  useEffect(() => {
    let err = null;

    // 1. Magic realm
    if (isWarriorOrScout && !selectedRealm) {
      err = 'Seleziona un Reame Magico (Essenza o Flusso) in alto a destra.';
    }

    // 2. TB_6 points
    if (!err) {
      const categoriesList = ['di manovra e movimento', 'con le armi', 'generali', 'sotterfugio', 'magiche'];
      const unspentTb6 = [];
      categoriesList.forEach(cat => {
        const poolSize = getTb6PoolSize(cat, profession);
        const spent = spentTb6ByCat[cat] || 0;
        if (spent < poolSize) {
          unspentTb6.push(`${cat} (${spent}/${poolSize})`);
        }
      });
      if (unspentTb6.length > 0) {
        err = `Devi spendere tutti i Punti Bonus Professione (TB_6). Categorie incomplete: ${unspentTb6.join(', ')}.`;
      }
    }

    // 3. Languages
    if (!err) {
      if (languagePointsLeft > 0) {
        err = `Devi spendere tutti i Punti Lingue Addizionali (rimangono: ${languagePointsLeft}).`;
      }
    }

    // 4. Spell list roll / selection
    if (!err && selectedRealm) {
      if (currentAccumulated > 0 && !hasAcquiredInAdolescence && rollResult === null) {
        err = 'Devi effettuare il tentativo (tiro 1d100) per l\'apprendimento della lista incantesimi.';
      } else if (rollResult && rollResult <= currentAccumulated && !hasAcquiredInAdolescence) {
        err = 'Hai ottenuto con successo l\'apprendimento di una lista incantesimi! Selezionala ed acquisiscila.';
      }
    }

    if (characterData.stepErrors?.adolescence !== err) {
      setCharacterData(prev => ({
        ...prev,
        stepErrors: {
          ...(prev.stepErrors || {}),
          adolescence: err
        }
      }));
    }
  }, [
    isWarriorOrScout, selectedRealm, spentTb6ByCat, profession,
    languagePointsLeft, currentAccumulated, hasAcquiredInAdolescence, rollResult,
    characterData.stepErrors, setCharacterData
  ]);

  // Separate regular skills from special points
  const regularCategories = categories.filter(c => c !== 'Altre Abilità ' && c !== 'Altre Abilità' && c !== 'Altro Sviluppo');
  const otherSkills = Object.entries(skills).filter(([name, data]) => data.category.includes('Altre Abilità'));

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
          {isWarriorOrScout ? (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleRealmChange('Essenza')}
                className={`flex-1 py-1 px-2 rounded font-bold text-xs border transition ${
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
                className={`flex-1 py-1 px-2 rounded font-bold text-xs border transition ${
                  selectedRealm === 'Flusso'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-100/50'
                }`}
              >
                Flusso
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-spell-lists-text)', marginTop: '0.2rem' }}>
              {selectedRealm || 'Nessuno'}
            </div>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-spell-lists-text)', opacity: 0.85, marginTop: '0.15rem' }}>
            {profession['liste incantesimi'] && <span>Liste: <strong>{profession['liste incantesimi']}</strong></span>}
            {profession['limite incantesimi'] && <span className="block text-[10px] italic opacity-85 mt-0.5">{profession['limite incantesimi']}</span>}
          </div>
        </div>
      </div>

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
            <div className="flex flex-col gap-2">
              <div className="text-sm text-indigo-700 bg-indigo-100 p-3 rounded text-center font-medium border border-indigo-200 flex justify-between items-center">
                <span>Hai imparato con successo: <strong>{acquiredListName}</strong></span>
                <button
                  type="button"
                  onClick={handleRemoveSpellList}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-bold transition shadow-sm"
                >
                  Rimuovi
                </button>
              </div>
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
              <div className="text-sm text-red-700 bg-red-100 p-2 rounded text-center font-medium border border-red-300 flex justify-between items-center">
                <span>Tiro: <strong>{rollResult}</strong> - Fallimento. Hai mantenuto il {currentAccumulated}% per il prossimo livello.</span>
                <button
                  type="button"
                  onClick={() => setCharacterData(prev => ({ ...prev, adolescenceSpellListRoll: null }))}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-bold transition shadow-sm"
                >
                  Annulla tiro
                </button>
              </div>
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



      {/* ── LINGUE ── */}
      <div className="card mb-6" style={{borderColor:'var(--theme-languages-border)'}}>
        <div className="card-header border-b" style={{background:'var(--theme-languages-bg)',borderBottomColor:'var(--theme-languages-border)',padding:'0.75rem 1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h4 className="font-semibold m-0 text-sm uppercase tracking-wider" style={{color:'var(--theme-languages-text)'}}>🌐 Lingue Conosciute (Adolescenza)</h4>
          <div style={{display:'flex',gap:'1rem'}}>
            <span style={{fontSize:'0.8rem',background:'#fff',border:'1px solid var(--theme-languages-border)',padding:'0.25rem 0.75rem',borderRadius:'0.5rem',color:'var(--theme-languages-text)',fontWeight:'bold'}}>
              Punti totali: <strong>{languagePointsTotal}</strong>
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
          <p className="text-xs text-muted mb-4">Usa i Punti Lingue Addizionali per migliorare le lingue conosciute o apprenderne di nuove (max Grado 5).</p>
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
                    <button type="button" onClick={() => removeLangPoint(lang)} disabled={!data.addedAdolescenza||data.addedAdolescenza<=0} className="w-7 h-7 border rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-sm font-bold">−</button>
                  </div>
                </div>
              );
            })}
          </div>

          {languagePointsLeft > 0 && (
            <div className="mt-4 pt-4 border-t flex gap-2 items-center" style={{borderTopColor:'var(--theme-languages-border)'}}>
              <select defaultValue="" id="lang-add-select-adolescence" className="flex-1 rounded border-gray-300 text-xs p-2 bg-white">
                <option value="" disabled>-- Nuova lingua da apprendere --</option>
                {allLanguages.filter(l => !languages[l] || ((languages[l].base || 0) + (languages[l].added || 0)) < 5).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="bg-blue-600 text-white font-bold py-1.5 px-3 rounded text-xs hover:bg-blue-700 transition" 
                onClick={() => { const s = document.getElementById('lang-add-select-adolescence'); if(s.value){ addNewLang(s.value); s.value=''; } }}
              >
                + Apprendi
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mb-6 text-muted">
        In base alla cultura del tuo Popolo (<strong>{race.popolo}</strong>) hai ottenuto i seguenti Gradi di sviluppo delle abilità in fase adolescenziale.
      </p>

      {/* Griglia delle abilità */}
      <h3 className="text-xl font-bold mb-4 text-gray-800">Sviluppo Adolescenza</h3>
      <div className="flex flex-col gap-6 mb-8">
        {regularCategories.map(cat => {
          const catSkills = primarySkillsList.filter(s => s.categoria === cat);
          if (catSkills.length === 0) return null;

          const tb6PoolSize = getTb6PoolSize(cat, profession);
          const spentTb6InCat = spentTb6ByCat[cat] || 0;
          const availableTb6Pool = tb6PoolSize - spentTb6InCat;

          return (
            <div key={cat} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', background: '#fff' }}>
              <div style={{ padding: '0.5rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {cat}
                </div>
                {tb6PoolSize > 0 && (() => {
                  const isFull = spentTb6InCat === tb6PoolSize;
                  return (
                    <span
                      className="text-xs font-bold rounded"
                      style={{
                        backgroundColor: isFull ? '#dcfce7' : '#fee2e2',
                        color: isFull ? '#166534' : '#991b1b',
                        paddingLeft: '5px',
                        paddingRight: '5px',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem'
                      }}
                    >
                      Punti Bonus Professione (TB_6): {spentTb6InCat} / {tb6PoolSize} spesi
                    </span>
                  );
                })()}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <tr>
                      <th style={{ padding: '0.45rem 1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Abilità</th>
                      <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>G. adolescenza</th>
                      <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>G. bonus prof.</th>
                      <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>G. svil. prof.</th>
                      <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#7e22ce', fontWeight: 700 }}>G. background</th>
                      <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#1e3a8a', fontWeight: 700 }}>G. TOTALE</th>
                      <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontWeight: 600 }}>Bonus sviluppo</th>
                      <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>Bonus caratt.</th>
                      <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>Speciale</th>
                      <th style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#1e3a8a', fontWeight: 900 }}>Bonus TOTALE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catSkills.map((sk) => {
                      const name = sk.nome;
                      const s = finalSkills[name];
                      if (!s) return null;

                      const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';
                      const max = getMaxRanks(name);
                      const hasIngombro = s.ingombroBonus !== null;
                      const specialBonus = s.specialBonus || 0;
                      const hasSpecialBonus = specialBonus !== 0;
                      const displaySpecial = (hasIngombro || hasSpecialBonus) ? (specialBonus + (s.ingombroBonus ?? 0)) : null;

                      let totalBonusStr = typeof s.totalBonus === 'number' ? fmt(s.totalBonus) : s.totalBonus;
                      if (name.toLowerCase().trim() === 'resistenza fisica') {
                        const coBonus = s.carattBonus || 0;
                        const otherBonus = coBonus + 5 + specialBonus;
                        totalBonusStr = `${s.bonusGradi} e ${fmt(otherBonus)}`;
                      }

                      const isFixedSkill = [
                        'resistenza fisica', 'percezione', 'incantesimi base'
                      ].includes(name.toLowerCase().trim());

                      return (
                        <tr key={name} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.45rem 1rem', fontWeight: 500, color: '#1f2937' }}>
                            <span style={{ verticalAlign: 'middle' }}>{name}</span>
                            {max !== null ? <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '0.25rem', verticalAlign: 'middle' }}>({max} max)</span> : ''}
                            {cat === 'con le armi' && (() => {
                              const weaponsList = getWeaponsForSkill(name, catalog);
                              if (weaponsList.length === 0) return null;
                              return (
                                <Tooltip
                                  content={
                                    <ul style={{ margin: 0, paddingLeft: '1rem', listStyleType: 'disc' }}>
                                      {weaponsList.map(w => (
                                        <li key={w} style={{ marginBottom: '0.15rem' }}>{w}</li>
                                      ))}
                                    </ul>
                                  }
                                />
                              );
                            })()}
                          </td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#9ca3af' }}>{s.adRanks}</td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>
                            {isCogliereAlleSpalle ? (
                              '0'
                            ) : isFixedSkill ? (
                              s.profRanks > 0 ? `+${s.profRanks}` : '0'
                            ) : tb6PoolSize > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseTb6(name, cat)}
                                  disabled={!tb6Distribution[name]}
                                  className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full text-xs font-bold transition disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-blue-900">
                                  {tb6Distribution[name] || 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleIncreaseTb6(name, cat)}
                                  disabled={availableTb6Pool <= 0}
                                  className="w-5 h-5 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-xs font-bold transition disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#9ca3af' }}>—</td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#9ca3af' }}>—</td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 900, color: '#1e3a8a' }}>{s.totalRanks}</td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontWeight: 600 }}>
                            {typeof s.bonusGradi === 'number' ? fmt(s.bonusGradi) : s.bonusGradi}
                          </td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontSize: '0.75rem' }}>
                            {s.carattSigla ? `${s.carattSigla} ${fmt(s.carattBonus)}` : '—'}
                          </td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280' }}>
                            {displaySpecial !== null ? fmt(displaySpecial) : '—'}
                          </td>
                          <td style={{ padding: '0.45rem 1rem', textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#1e3a8a' }}>
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



      {otherSkills.filter(([name]) => name.trim() !== 'Punti Lingue Addizionali').length > 0 && (
        <div className="card mb-6" style={{ borderColor: 'var(--theme-primary-skills-border)' }}>
          <div className="card-header border-b" style={{padding: '1rem', backgroundColor: 'var(--theme-primary-skills-bg)', borderBottomColor: 'var(--theme-primary-skills-border)'}}>
            <h4 className="font-semibold m-0" style={{ color: 'var(--theme-primary-skills-text)' }}>Punti Speciali & Altre Abilità</h4>
          </div>
          <div className="card-body">
            <div className="grid-2">
              {otherSkills
                .filter(([name]) => name.trim() !== 'Punti Lingue Addizionali')
                .map(([name, data]) => {
                  const isBgPoints = name.trim() === 'Punti Background';
                  return (
                    <div key={name} className="flex items-start gap-4 p-4 border rounded bg-white" style={{ borderColor: 'var(--theme-primary-skills-border)' }}>
                      <div className="flex-1">
                        <h5 className="font-bold m-0 mb-1" style={{ color: 'var(--theme-primary-skills-text)' }}>{name}</h5>
                        {isBgPoints ? (
                          <p className="text-xs text-muted m-0">I Punti Background non sono abilità dirette, ma un pool di punti che potrai spendere nella fase successiva per caratterizzare e bilanciare il personaggio.</p>
                        ) : (
                          data.notes && <p className="text-xs text-muted m-0">{data.notes}</p>
                        )}
                      </div>
                      <div className="text-xl font-black px-3 py-2 rounded" style={{ backgroundColor: 'var(--theme-primary-skills-bg)', color: 'var(--theme-primary-skills-text)' }}>
                        {data.totalRanks}
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

