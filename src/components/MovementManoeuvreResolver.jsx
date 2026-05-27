import React, { useState, useEffect, useMemo } from 'react';
import { Compass, Dices, AlertTriangle, Check, Info, ArrowRight, HelpCircle } from 'lucide-react';
import manovreData from '../data/TM_1-manovre_in_movimento.json';
import primarySkillsList from '../data/Tabella-abilita_primarie.json';
import secondarySkillsList from '../data/Tabella-abilita_secondarie.json';
import { getCharacterSkillBonus, fmt } from '../utils/skillHelpers';

const COMPLEXITY_SCALES = [
  { value: '1. Banale', text: 'Banale', activeClass: 'btn-complexity-banale-active', inactiveClass: 'btn-complexity-banale-inactive' },
  { value: '2. Facile', text: 'Facile', activeClass: 'btn-complexity-facile-active', inactiveClass: 'btn-complexity-facile-inactive' },
  { value: '3. Lieve', text: 'Lieve', activeClass: 'btn-complexity-lieve-active', inactiveClass: 'btn-complexity-lieve-inactive' },
  { value: '4. Media', text: 'Media', activeClass: 'btn-complexity-media-active', inactiveClass: 'btn-complexity-media-inactive' },
  { value: '5. Difficile', text: 'Difficile', activeClass: 'btn-complexity-difficile-active', inactiveClass: 'btn-complexity-difficile-inactive' },
  { value: '6. Molto difficile', text: 'Molto difficile', activeClass: 'btn-complexity-molto-difficile-active', inactiveClass: 'btn-complexity-molto-difficile-inactive' },
  { value: '7. Difficilissima', text: 'Difficilissima', activeClass: 'btn-complexity-difficilissima-active', inactiveClass: 'btn-complexity-difficilissima-inactive' },
  { value: '8. Folle', text: 'Folle', activeClass: 'btn-complexity-folle-active', inactiveClass: 'btn-complexity-folle-inactive' },
  { value: '9. Assurda', text: 'Assurda', activeClass: 'btn-complexity-assurda-active', inactiveClass: 'btn-complexity-assurda-inactive' }
];

export default function MovementManoeuvreResolver({ savedCharacters, onRedirectToFumble }) {
  const [characterId, setCharacterId] = useState('custom');
  const [customCharacterName, setCustomCharacterName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillBonusesOverride, setSkillBonusesOverride] = useState({});
  const [manoeuvreComplexity, setManoeuvreComplexity] = useState('4. Media');

  // Modificatori
  const [isStunned, setIsStunned] = useState(false);
  const [isProne, setIsProne] = useState(false);
  const [isLimbDisabled, setIsLimbDisabled] = useState(false);
  const [customGmModifier, setCustomGmModifier] = useState(0);

  // Tiro
  const [diceRollResult, setDiceRollResult] = useState(50);
  const [diceRollSequence, setDiceRollSequence] = useState([50]);
  const [manualRollInput, setManualRollInput] = useState('50');

  // Filtro ricerca testuale per le abilità
  const [skillSearch, setSkillSearch] = useState('');

  // 1. Filtra solo abilità Primarie MM
  const primaryMMSkills = useMemo(() => {
    return primarySkillsList.filter(sk => sk.tipo_abilita_primaria === 'Manovre in Movimento (MM)');
  }, []);

  // 2. Filtra solo abilità Secondarie MM
  const secondaryMMSkills = useMemo(() => {
    return secondarySkillsList.filter(sk => sk.tipo_abilita_secondaria === 'Manovre in Movimento (MM)');
  }, []);

  // Filtra abilità in base al termine di ricerca
  const filteredPrimaryMMSkills = useMemo(() => {
    if (!skillSearch) return primaryMMSkills;
    return primaryMMSkills.filter(sk => sk.nome_abilita_primaria.toLowerCase().includes(skillSearch.toLowerCase()));
  }, [primaryMMSkills, skillSearch]);

  const filteredSecondaryMMSkills = useMemo(() => {
    if (!skillSearch) return secondaryMMSkills;
    return secondaryMMSkills.filter(sk => sk.nome_abilita_secondaria.toLowerCase().includes(skillSearch.toLowerCase()));
  }, [secondaryMMSkills, skillSearch]);

  // Raggruppa le abilità per categoria
  const groupedPrimary = useMemo(() => {
    const groups = {};
    filteredPrimaryMMSkills.forEach(sk => {
      const cat = sk.categoria_abilita_primaria || 'Altro';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sk);
    });
    return groups;
  }, [filteredPrimaryMMSkills]);

  const groupedSecondary = useMemo(() => {
    const groups = {};
    filteredSecondaryMMSkills.forEach(sk => {
      const cat = sk.categoria_abilita_secondaria || 'Altro';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sk);
    });
    return groups;
  }, [filteredSecondaryMMSkills]);

  // Recupera il personaggio attivo
  const activeChar = useMemo(() => {
    if (characterId === 'custom') return null;
    return savedCharacters.find(c => c.id === characterId) || null;
  }, [characterId, savedCharacters]);

  // Sincronizza ed inizializza i bonus delle abilità quando cambia il personaggio
  useEffect(() => {
    const initialOverrides = {};
    primaryMMSkills.forEach(sk => {
      const bonus = activeChar ? getCharacterSkillBonus(activeChar, sk.nome_abilita_primaria) : 0;
      initialOverrides[sk.nome_abilita_primaria] = bonus;
    });
    secondaryMMSkills.forEach(sk => {
      // Le abilità secondarie non addestrate hanno per default -25
      const bonus = activeChar ? getCharacterSkillBonus(activeChar, sk.nome_abilita_secondaria) : -25;
      initialOverrides[sk.nome_abilita_secondaria] = bonus;
    });
    setSkillBonusesOverride(initialOverrides);
    // Azzera la selezione abilità
    setSelectedSkills([]);
  }, [activeChar, primaryMMSkills, secondaryMMSkills]);

  // Gestione modifica input di bonus abilità singola da parte del GM
  const handleUpdateSkillBonus = (skillName, value) => {
    setSkillBonusesOverride(prev => ({
      ...prev,
      [skillName]: value
    }));
  };

  // Calcolo del bonus totale delle sole abilità selezionate
  const totalAppliedSkillBonus = useMemo(() => {
    return selectedSkills.reduce((sum, skName) => {
      return sum + (skillBonusesOverride[skName] ?? 0);
    }, 0);
  }, [selectedSkills, skillBonusesOverride]);

  // Meccanismo del Tiro Aperto
  const handleRollOpenDice = () => {
    const rolls = [];
    let roll = Math.floor(Math.random() * 100) + 1;
    rolls.push(roll);
    let total = roll;

    if (roll > 95) {
      while (true) {
        let nextRoll = Math.floor(Math.random() * 100) + 1;
        rolls.push(nextRoll);
        total += nextRoll;
        if (nextRoll < 95) break;
      }
    } else if (roll < 6) {
      while (true) {
        let nextRoll = Math.floor(Math.random() * 100) + 1;
        rolls.push(-nextRoll);
        total -= nextRoll;
        if (nextRoll < 95) break;
      }
    }

    setDiceRollSequence(rolls);
    setDiceRollResult(total);
    setManualRollInput(String(total));
  };

  const handleManualRollChange = (val) => {
    setManualRollInput(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      setDiceRollResult(parsed);
      setDiceRollSequence([parsed]);
    }
  };

  // Modificatori situazionali
  const stunnedMod = isStunned ? -50 : 0;
  const proneMod = isProne ? -70 : 0;
  const limbMod = isLimbDisabled ? -30 : 0;
  const gmMod = parseInt(customGmModifier) || 0;
  const totalModifiers = stunnedMod + proneMod + limbMod + gmMod;

  // Calcolo Risultato Finale
  const finalResult = diceRollResult + totalAppliedSkillBonus + totalModifiers;
  const clampedResult = Math.max(-151, Math.min(276, finalResult));

  // Risoluzione su tabella
  const outcomeRow = useMemo(() => {
    return manovreData.find(row => row["Tiro Aperto"] === clampedResult) || null;
  }, [clampedResult]);

  const outcomeValue = useMemo(() => {
    if (!outcomeRow) return null;
    return outcomeRow[manoeuvreComplexity];
  }, [outcomeRow, manoeuvreComplexity]);

  // Redirect a Fumble TTM-4
  const handleTriggerFumble = () => {
    if (onRedirectToFumble) {
      let ttm4Difficulty = 'Normale';
      if (manoeuvreComplexity.includes('Banale')) ttm4Difficulty = 'Banale';
      else if (manoeuvreComplexity.includes('Facile')) ttm4Difficulty = 'Facile';
      else if (manoeuvreComplexity.includes('Lieve')) ttm4Difficulty = 'Normale';
      else if (manoeuvreComplexity.includes('Media')) ttm4Difficulty = 'Media';
      else if (manoeuvreComplexity.includes('Difficile')) ttm4Difficulty = 'Difficile';
      else if (manoeuvreComplexity.includes('Molto difficile')) ttm4Difficulty = 'Molto difficile';
      else if (manoeuvreComplexity.includes('Difficilissima')) ttm4Difficulty = 'Difficilissima';
      else if (manoeuvreComplexity.includes('Folle')) ttm4Difficulty = 'Puramente folle';
      else if (manoeuvreComplexity.includes('Assurda')) ttm4Difficulty = 'Assurda';

      onRedirectToFumble({
        tableCode: 'TTM-4',
        difficulty: ttm4Difficulty,
        characterName: activeChar ? activeChar.name : (customCharacterName || 'PG Custom')
      });
    }
  };

  const handleToggleSkill = (skillName) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillName)) {
        return prev.filter(name => name !== skillName);
      } else {
        return [...prev, skillName];
      }
    });
  };

  const getSkillRowClass = (skillName, isSelected) => {
    const val = skillBonusesOverride[skillName] ?? 0;
    if (val > 0) {
      return isSelected ? 'skill-row-positive-active' : 'skill-row-positive-inactive';
    } else if (val < 0) {
      return isSelected ? 'skill-row-negative-active' : 'skill-row-negative-inactive';
    } else {
      return isSelected ? 'skill-row-neutral-active' : 'skill-row-neutral-inactive';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
      {/* SEZIONE INPUT - SINISTRA */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Pannello Configurazione Manovra */}
        <div className="card p-5 border border-blue-200 rounded-xl bg-blue-50/5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-blue-100 mb-4">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-blue-950 uppercase tracking-wider">Risoluzione Manovre di movimento</h3>
              <p className="text-xs text-blue-800/60 font-medium">Imposta il personaggio, la difficoltà ed infine seleziona le abilità.</p>
            </div>
          </div>

          <div className="space-y-5">
            
            {/* 1. Selezione Personaggio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Seleziona Personaggio:</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white font-medium text-gray-800"
                  value={characterId}
                  onChange={e => {
                    setCharacterId(e.target.value);
                  }}
                >
                  <option value="custom">-- Personaggio Personalizzato / PNG --</option>
                  {savedCharacters.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name} (Liv. {1 + (char.levelDevelopments || []).length} - {char.race?.popolo} {char.profession?.professione})
                    </option>
                  ))}
                </select>
              </div>

              {characterId === 'custom' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome PG/PNG Custom:</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800 font-medium"
                    placeholder="Es. Guardiano del Roster"
                    value={customCharacterName}
                    onChange={e => setCustomCharacterName(e.target.value)}
                  />
                </div>
              ) : (
                <div className="bg-blue-50/30 p-2.5 border border-blue-100 rounded flex flex-col justify-center">
                  <span className="text-[10px] text-blue-850 font-bold uppercase tracking-wider block">PG Roster Attivo</span>
                  <span className="text-sm font-black text-blue-950">{activeChar?.name}</span>
                </div>
              )}
            </div>

            {/* 2. Complessità Manovra (SPOSTATO IN ALTO) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Complessità Manovra (Scelta GM):</label>
              <div className="flex flex-row gap-2 w-full overflow-x-auto pb-1 scrollbar-thin">
                {COMPLEXITY_SCALES.map(scale => {
                  const isActive = manoeuvreComplexity === scale.value;
                  return (
                    <button
                      key={scale.value}
                      type="button"
                      onClick={() => setManoeuvreComplexity(scale.value)}
                      className={`py-2 px-0.5 text-[10px] md:text-xs font-bold rounded border transition text-center flex flex-col justify-center items-center h-12 leading-tight flex-1 min-w-[70px] md:min-w-0 ${
                        isActive ? scale.activeClass : scale.inactiveClass
                      }`}
                    >
                      <span className="uppercase font-black text-[9px] md:text-[10px] tracking-wide">{scale.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Selezione Abilità (2 COLONNE PER CATEGORIA) */}
            <div className="border-t border-gray-200/60 pt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <label className="block text-xs font-bold text-gray-700">
                  Abilità applicate alla manovra (seleziona una o più):
                </label>
                <input
                  type="text"
                  placeholder="Filtra abilità..."
                  className="p-1.5 border border-gray-300 rounded text-xs text-gray-800 w-full md:w-48 bg-white"
                  value={skillSearch}
                  onChange={e => setSkillSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Colonna Sinistra: Abilità Primarie MM */}
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-inner max-h-[360px] overflow-y-auto">
                  <h4 className="font-bold text-xs text-orange-950 uppercase tracking-wider mb-2 pb-1.5 border-b border-orange-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Abilità Primarie (MM)
                  </h4>
                  {Object.keys(groupedPrimary).length === 0 ? (
                    <p className="text-xs italic text-gray-400 p-4 text-center">Nessuna abilità primaria trovata.</p>
                  ) : (
                    Object.keys(groupedPrimary).map(catName => (
                      <div key={catName} className="mb-4">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{catName}</span>
                        <div className="space-y-1">
                          {groupedPrimary[catName].map(sk => {
                            const isSelected = selectedSkills.includes(sk.nome_abilita_primaria);
                            const val = skillBonusesOverride[sk.nome_abilita_primaria] ?? 0;
                            return (
                              <div
                                key={sk.nome_abilita_primaria}
                                className={`flex items-center justify-between gap-2 p-2 rounded border transition ${getSkillRowClass(sk.nome_abilita_primaria, isSelected)}`}
                              >
                                <div className="flex items-start gap-2 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSkill(sk.nome_abilita_primaria)}
                                    className="mt-1 shrink-0 accent-orange-655"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-gray-800 flex items-center flex-wrap gap-1.5">
                                      <span>{sk.nome_abilita_primaria}</span>
                                      <span className="text-[8px] font-black px-1 py-0.2 rounded bg-gray-150 text-gray-600">
                                        {sk.caratteristica_abilita_primaria}
                                      </span>
                                    </div>
                                    <p className="text-gray-400 leading-tight mt-0.5 line-clamp-2" style={{ fontSize: '11px' }} title={sk.abilita_primaria_descrizione}>
                                      {sk.abilita_primaria_descrizione}
                                    </p>
                                  </div>
                                </div>
                                <div className="w-12 shrink-0">
                                  <input
                                    type="number"
                                    className={`w-full p-1 border rounded text-center text-xs font-bold ${
                                      isSelected ? 'border-gray-400 text-gray-900 bg-white' : 'border-gray-200 text-gray-550 bg-white/70'
                                    }`}
                                    value={val}
                                    onChange={e => handleUpdateSkillBonus(sk.nome_abilita_primaria, parseInt(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Colonna Destra: Abilità Secondarie MM */}
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-inner max-h-[360px] overflow-y-auto">
                  <h4 className="font-bold text-xs text-yellow-950 uppercase tracking-wider mb-2 pb-1.5 border-b border-yellow-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Abilità Secondarie (MM)
                  </h4>
                  {Object.keys(groupedSecondary).length === 0 ? (
                    <p className="text-xs italic text-gray-400 p-4 text-center">Nessuna abilità secondaria trovata.</p>
                  ) : (
                    Object.keys(groupedSecondary).map(catName => (
                      <div key={catName} className="mb-4">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{catName}</span>
                        <div className="space-y-1">
                          {groupedSecondary[catName].map(sk => {
                            const isSelected = selectedSkills.includes(sk.nome_abilita_secondaria);
                            const val = skillBonusesOverride[sk.nome_abilita_secondaria] ?? 0;
                            return (
                              <div
                                key={sk.nome_abilita_secondaria}
                                className={`flex items-center justify-between gap-2 p-2 rounded border transition ${getSkillRowClass(sk.nome_abilita_secondaria, isSelected)}`}
                              >
                                <div className="flex items-start gap-2 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSkill(sk.nome_abilita_secondaria)}
                                    className="mt-1 shrink-0 accent-yellow-600"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-gray-800 flex items-center flex-wrap gap-1.5">
                                      <span>{sk.nome_abilita_secondaria}</span>
                                      <span className="text-[8px] font-black px-1 py-0.2 rounded bg-gray-150 text-gray-600">
                                        {sk.caratteristica_abilita_secondaria}
                                      </span>
                                    </div>
                                    <p className="text-gray-400 leading-tight mt-0.5 line-clamp-2" style={{ fontSize: '11px' }} title={sk.abilita_secondaria_descrizione}>
                                      {sk.abilita_secondaria_descrizione}
                                    </p>
                                  </div>
                                </div>
                                <div className="w-12 shrink-0">
                                  <input
                                    type="number"
                                    className={`w-full p-1 border rounded text-center text-xs font-bold ${
                                      isSelected ? 'border-gray-400 text-gray-900 bg-white' : 'border-gray-200 text-gray-550 bg-white/70'
                                    }`}
                                    value={val}
                                    onChange={e => handleUpdateSkillBonus(sk.nome_abilita_secondaria, parseInt(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* Box Riepilogo Selezioni ed Calcolo Totale */}
              <div className="mt-4 p-3 bg-blue-50/20 border border-blue-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="text-left w-full md:w-auto">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Abilità MM Applicate ({selectedSkills.length})</span>
                  {selectedSkills.length === 0 ? (
                    <span className="text-xs italic text-gray-400">Nessuna abilità selezionata (Bonus +0)</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedSkills.map(skName => (
                        <span key={skName} className="text-[10px] bg-blue-55 text-blue-800 border border-blue-100 rounded px-2 py-0.5 font-bold shadow-xs">
                          {skName} ({fmt(skillBonusesOverride[skName] ?? 0)})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-full md:w-auto bg-blue-600 text-white rounded-lg px-4 py-2 text-center shadow-sm">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider block opacity-75">Bonus Somma:</span>
                  <span className="text-base font-black">{fmt(totalAppliedSkillBonus)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Pannello Modificatori & Tiro */}
        <div className="card p-5 border border-gray-200 rounded-xl bg-white shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
            <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-950 uppercase tracking-wider">Modificatori e Lancio</h3>
              <p className="text-xs text-gray-500 font-medium">Applica penalità situazionali ed esegui il tiro di dado.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Sezione Modificatori Situazionali */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Modificatori Situazionali Regolamentari:</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Stordito */}
                <div
                  onClick={() => setIsStunned(!isStunned)}
                  className={`border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition select-none ${
                    isStunned 
                      ? 'bg-red-50 border-red-200 text-red-900 font-semibold shadow-xs' 
                      : 'bg-gray-50/50 hover:bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-xs">Stordito</span>
                  <span className={`text-xs font-bold ${isStunned ? 'text-red-700' : 'text-gray-400'}`}>-50</span>
                </div>

                {/* A terra */}
                <div
                  onClick={() => setIsProne(!isProne)}
                  className={`border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition select-none ${
                    isProne 
                      ? 'bg-red-50 border-red-200 text-red-900 font-semibold shadow-xs' 
                      : 'bg-gray-50/50 hover:bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-xs">A terra</span>
                  <span className={`text-xs font-bold ${isProne ? 'text-red-700' : 'text-gray-400'}`}>-70</span>
                </div>

                {/* Arto fuori uso */}
                <div
                  onClick={() => setIsLimbDisabled(!isLimbDisabled)}
                  className={`border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition select-none ${
                    isLimbDisabled 
                      ? 'bg-red-50 border-red-200 text-red-900 font-semibold shadow-xs' 
                      : 'bg-gray-50/50 hover:bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-xs">Arto fuori uso</span>
                  <span className={`text-xs font-bold ${isLimbDisabled ? 'text-red-700' : 'text-gray-400'}`}>-30</span>
                </div>

                {/* GM Modificatore Speciale */}
                <div className="border border-gray-200 rounded-lg p-1.5 flex flex-col justify-between bg-gray-50/30">
                  <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wider block text-center">Mod. GM Speciale</span>
                  <input
                    type="number"
                    className="w-full text-center text-xs font-bold bg-white border rounded p-1 text-gray-800 mt-0.5"
                    placeholder="Es. +15 o -10"
                    value={customGmModifier === 0 ? '' : customGmModifier}
                    onChange={e => setCustomGmModifier(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Sezione Lancio Dado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiro Dado Aperto (1D100):</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleRollOpenDice}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Dices className="w-4 h-4" />
                    Genera Tiro Aperto
                  </button>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded text-sm font-bold text-center bg-gray-50/50 text-gray-800"
                    placeholder="Tiro"
                    value={manualRollInput}
                    onChange={e => handleManualRollChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 border border-gray-150 rounded-lg flex flex-col justify-center">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Tracciato Lanci Dadi (Tiro Aperto)</span>
                {diceRollSequence.length <= 1 ? (
                  <span className="text-xs font-bold text-gray-700 mt-0.5">Tiro Standard: {diceRollResult}</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {diceRollSequence.map((roll, idx) => (
                      <span key={idx} className="text-xs font-black text-gray-800">
                        {idx > 0 && (roll >= 0 ? ' + ' : ' - ')}
                        <span className={Math.abs(roll) > 95 ? 'text-green-600' : Math.abs(roll) < 6 ? 'text-red-600' : ''}>
                          {Math.abs(roll)}
                        </span>
                      </span>
                    ))}
                    <span className="text-xs font-black text-blue-700 ml-1.5">
                      = {diceRollResult}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RISOLUZIONE E RISULTATO - DESTRA */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Pannello Riepilogo Calcolo */}
        <div className="card p-5 border border-gray-250 rounded-xl bg-gray-900 text-gray-100 shadow-md">
          <div className="border-b border-gray-800 pb-3 mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tabella Risoluzione</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900/50 text-blue-300 font-bold border border-blue-800/40">
              {manoeuvreComplexity}
            </span>
          </div>

          <div className="space-y-4">
            {/* Visualizzazione Formula Matematica */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Dettagli Formula</span>
              <div className="grid grid-cols-2 gap-y-2 text-xs font-medium border-b border-gray-800 pb-3">
                <span className="text-gray-400">Tiro Aperto:</span>
                <span className="text-right text-white font-bold">{diceRollResult}</span>

                <span className="text-gray-400">Bonus Abilità MM:</span>
                <span className="text-right text-blue-400 font-bold">+{totalAppliedSkillBonus}</span>

                {totalModifiers !== 0 && (
                  <>
                    <span className="text-gray-400">Modificatori Situazionali:</span>
                    <span className={`text-right font-bold ${totalModifiers >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalModifiers >= 0 ? `+${totalModifiers}` : totalModifiers}
                    </span>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-300 font-bold uppercase">Risultato Finale Calcolato:</span>
                <strong className="text-2xl font-black text-white tracking-tight">
                  {finalResult}
                </strong>
              </div>
              {finalResult !== clampedResult && (
                <div className="text-[10px] text-yellow-500 italic text-right">
                  (Ricalcolato a {clampedResult} per limite tabella)
                </div>
              )}
            </div>

            {/* Esito Risoluzione */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-center shadow-inner">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Esito Verificato su Tabella TM-1</span>
              
              {outcomeValue === null ? (
                <div className="py-6 text-gray-500 italic text-sm">Nessun dato trovato per tiro {clampedResult}</div>
              ) : outcomeValue === 'F' ? (
                <div className="space-y-4 py-2 animate-bounce">
                  <div className="w-16 h-16 rounded-full bg-red-950 border border-red-500 flex items-center justify-center text-red-500 font-black text-2xl mx-auto shadow-lg shadow-red-900/20">
                    F
                  </div>
                  <div>
                    <h4 className="font-extrabold text-red-400 text-lg uppercase tracking-wider">Fallimento Grave!</h4>
                    <p className="text-xs text-gray-300 mt-1 max-w-xs mx-auto leading-relaxed">
                      La manovra è fallita in modo disastroso. È necessario lanciare sulla tabella dei Colpi Maldestri delle Manovre in Movimento.
                    </p>
                  </div>

                  <button
                    onClick={handleTriggerFumble}
                    className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-650 text-white font-extrabold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-red-950/50 uppercase tracking-wider border border-red-600"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Risolvi Colpo Maldestro su TTM-4
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="w-20 h-20 rounded-full bg-blue-950 border border-blue-500 flex flex-col items-center justify-center text-blue-400 font-black text-2xl mx-auto shadow-lg shadow-blue-900/25">
                    <span>{outcomeValue}</span>
                    <span className="text-[10px] font-semibold text-blue-300/80 -mt-1">%</span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-blue-400 text-base uppercase tracking-wider">Manovra Riuscita</h4>
                    <p className="text-xs text-gray-300 mt-1 max-w-xs mx-auto font-medium">
                      La manovra è stata completata con un punteggio di successo pari a {outcomeValue}.
                    </p>
                  </div>

                  {/* Descrizione dei 3 significati dell'esito numerico */}
                  <div className="text-left space-y-3 bg-gray-900/60 p-4 border border-gray-800 rounded-lg text-[11px] text-gray-400 leading-relaxed shadow-inner">
                    <div className="flex gap-2">
                      <div className="p-1 rounded-full bg-blue-950/80 text-blue-400 border border-blue-900/40 shrink-0 h-5 w-5 flex items-center justify-center font-bold">1</div>
                      <p>
                        <strong className="text-gray-200">Percentuale di Riuscita:</strong> la manovra è riuscita al <strong className="text-blue-400 font-bold">{outcomeValue}%</strong>. 
                        {parseInt(outcomeValue) > 100 && (
                          <span className="text-green-400 block mt-0.5">
                            Completata! Hai il {parseInt(outcomeValue) - 100}% di attività residua utilizzabile in questo round.
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <div className="p-1 rounded-full bg-blue-950/80 text-blue-400 border border-blue-900/40 shrink-0 h-5 w-5 flex items-center justify-center font-bold">2</div>
                      <p>
                        <strong className="text-gray-200">Successo Completo:</strong> indica una probabilità del <strong className="text-blue-400 font-bold">{outcomeValue}%</strong> di successo completo del compito specifico.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <div className="p-1 rounded-full bg-blue-950/80 text-blue-400 border border-blue-900/40 shrink-0 h-5 w-5 flex items-center justify-center font-bold">3</div>
                      <p>
                        <strong className="text-gray-200">Riduzione Attività Round Successivo:</strong> penalità pari a <strong className="text-red-400 font-bold">-{Math.max(0, 100 - parseInt(outcomeValue))}</strong> all'attività del prossimo round (100 - {outcomeValue}).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Note sulle Regole del Tiro Aperto */}
            <div className="p-4 bg-gray-800/30 border border-gray-800 rounded-xl text-[10px] text-gray-400 space-y-2 leading-relaxed shadow-sm">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold uppercase tracking-wider mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>Regole del Tiro Aperto:</span>
              </div>
              <p>• <strong>Superiore a 95:</strong> se ottieni da 96 a 100, tiri ancora 1D100 e lo sommi. Continui a tirare e sommare finché ottieni un valore inferiore a 95.</p>
              <p>• <strong>Inferiore a 06:</strong> se ottieni da 01 a 05, tiri ancora 1D100 e lo sottrai. Se il tiro successivo è 95 o più, continui a sottrarre, altrimenti ti fermi.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
