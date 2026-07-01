import React, { useState, useEffect, useMemo } from 'react';
import { Compass, Dices, Info, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import manovreData from '../data/TM-2-manovre_statiche.json';
import primarySkillsList from '../data/Tabella-abilita_primarie.json';
import secondarySkillsList from '../data/Tabella-abilita_secondarie.json';
import { getCharacterSkillBonus, fmt } from '../utils/skillHelpers';

const COMPLEXITY_SCALES = [
  { value: '1. Banale', text: 'Banale', activeClass: 'btn-complexity-banale-active', inactiveClass: 'btn-complexity-banale-inactive', modifier: 30 },
  { value: '2. Facile', text: 'Facile', activeClass: 'btn-complexity-facile-active', inactiveClass: 'btn-complexity-facile-inactive', modifier: 20 },
  { value: '3. Lieve', text: 'Lieve (Normale)', activeClass: 'btn-complexity-lieve-active', inactiveClass: 'btn-complexity-lieve-inactive', modifier: 10 },
  { value: '4. Media', text: 'Media', activeClass: 'btn-complexity-media-active', inactiveClass: 'btn-complexity-media-inactive', modifier: 0 },
  { value: '5. Difficile', text: 'Difficile', activeClass: 'btn-complexity-difficile-active', inactiveClass: 'btn-complexity-difficile-inactive', modifier: -10 },
  { value: '6. Molto difficile', text: 'Molto difficile', activeClass: 'btn-complexity-molto-difficile-active', inactiveClass: 'btn-complexity-molto-difficile-inactive', modifier: -20 },
  { value: '7. Difficilissima', text: 'Difficilissima', activeClass: 'btn-complexity-difficilissima-active', inactiveClass: 'btn-complexity-difficilissima-inactive', modifier: -30 },
  { value: '8. Folle', text: 'Folle', activeClass: 'btn-complexity-folle-active', inactiveClass: 'btn-complexity-folle-inactive', modifier: -50 },
  { value: '9. Assurda', text: 'Assurda', activeClass: 'btn-complexity-assurda-active', inactiveClass: 'btn-complexity-assurda-inactive', modifier: -70 }
];

const TIPOLOGIE_LIST = [
  { id: 1, label: 'Generale', columnName: "GENERALE\r\n(si applica a tutte le manovre statiche non comprese nelle altre colonne)" },
  { id: 2, label: 'Influenza ed interazione', columnName: "INFLUENZA E INTERAZIONE" },
  { id: 3, label: 'Disattivare trappole e scassinare', columnName: "DISATTIVARE TRAPPOLE E SCASSINARE SERRATURE" },
  { id: 4, label: 'Lettura rune ed uso oggetti', columnName: "LETTURA RUNE ED USO DI OGGETTI MAGICI" },
  { id: 5, label: 'Percezione e seguire tracce', columnName: "PERCEZIONE E SEGUIRE TRACCE" }
];

const SKILL_TIPOLOGIA_MAP = {
  // Primarie
  'Nascondersi': 1,
  'Leadership e influenza': 2,
  'Scassinare serrature': 3,
  'Disattivare trappole': 3,
  'Lettura rune': 4,
  'Uso oggetti magici': 4,
  'Percezione': 5,
  'Seguire tracce': 5,
  // Secondarie
  'Astronomia': 1,
  'Conciare': 1,
  'Costruire frecce': 1,
  'Costruzione trappole': 1,
  'Cucinare': 1,
  'Destrezza': 1,
  'Forgiare': 1,
  'Intagliare': 1,
  'Meditazione': 1,
  'Musica': 1,
  'Navigare': 1,
  'Pastorizia': 1,
  'Prevedere il tempo': 1,
  'Procurarsi cibo': 1,
  'Segnalazione': 1,
  'Travestimento': 1,
  'Uso funi': 1,
  'Giocare d\'azzardo': 2,
  'Oratoria': 2
};

const SKILL_CHAR_MAP = {
  'Arrampicarsi': 'AG',
  'Cavalcare': 'IT',
  'Nuotare': 'AG',
  'Seguire tracce': 'IN',
  'Cogliere alle spalle': 'PR',
  'Muoversi silenziosamente': 'PR',
  'Nascondersi': 'PR',
  'Scassinare serrature': 'IN',
  'Disattivare trappole': 'IT',
  'Lettura rune': 'IN',
  'Uso oggetti magici': 'IT',
  'Incantesimi diretti': 'AG',
  'Percezione': 'IT',
  'Resistenza fisica (PF)': 'CO'
};

const getSkillCharacteristic = (skName) => {
  const name = String(skName || '').trim();
  return SKILL_CHAR_MAP[name] || 'IN'; // default per secondarie
};

export default function StaticManoeuvreResolver({ savedCharacters, campaignNpcs = [] }) {
  const [characterId, setCharacterId] = useState('custom');
  const [customCharacterName, setCustomCharacterName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillBonusesOverride, setSkillBonusesOverride] = useState({});
  
  // Tipologia attiva
  const [activeTipologia, setActiveTipologia] = useState(1);
  const [manoeuvreComplexity, setManoeuvreComplexity] = useState('4. Media');

  // Modificatori Tipologia 2 (Influenza)
  const [isLoyalListener, setIsLoyalListener] = useState(false);
  const [isServantListener, setIsServantListener] = useState(false);

  // Modificatori Tipologia 4 (Lettura Rune / Oggetti)
  const [spellLevel, setSpellLevel] = useState(0);
  const [differentRealm, setDifferentRealm] = useState(false);
  const [knowledgeSpell, setKnowledgeSpell] = useState('knows'); // ignore, knows, capable

  // Modificatori Tipologia 5 (Percezione)
  const [specificClue, setSpecificClue] = useState(false);

  // Modificatore speciale GM
  const [customGmModifier, setCustomGmModifier] = useState(0);

  // Tiro
  const [diceRollResult, setDiceRollResult] = useState(50);
  const [diceRollSequence, setDiceRollSequence] = useState([50]);
  const [manualRollInput, setManualRollInput] = useState('50');

  // Filtro ricerca testuale per le abilità
  const [skillSearch, setSkillSearch] = useState('');

  // 1. Filtra solo abilità Primarie MS
  const primaryMSSkills = useMemo(() => {
    return primarySkillsList.filter(sk => sk.tipo_abilita_primaria === 'Manovre Statiche (MS)');
  }, []);

  // 2. Filtra solo abilità Secondarie MS
  const secondaryMSSkills = useMemo(() => {
    return secondarySkillsList.filter(sk => sk.tipo_abilita_secondaria === 'Manovre Statiche (MS)');
  }, []);

  // Filtra abilità in base al termine di ricerca E alla tipologia attiva
  const filteredPrimaryMSSkills = useMemo(() => {
    let list = primaryMSSkills.filter(sk => {
      const tipId = SKILL_TIPOLOGIA_MAP[sk.nome_abilita_primaria] || 1;
      return tipId === activeTipologia;
    });
    if (skillSearch) {
      list = list.filter(sk => sk.nome_abilita_primaria.toLowerCase().includes(skillSearch.toLowerCase()));
    }
    return list;
  }, [primaryMSSkills, activeTipologia, skillSearch]);

  const filteredSecondaryMSSkills = useMemo(() => {
    let list = secondaryMSSkills.filter(sk => {
      const tipId = SKILL_TIPOLOGIA_MAP[sk.nome_abilita_secondaria] || 1;
      return tipId === activeTipologia;
    });
    if (skillSearch) {
      list = list.filter(sk => sk.nome_abilita_secondaria.toLowerCase().includes(skillSearch.toLowerCase()));
    }
    return list;
  }, [secondaryMSSkills, activeTipologia, skillSearch]);

  // Raggruppa le abilità per categoria
  const groupedPrimary = useMemo(() => {
    const groups = {};
    filteredPrimaryMSSkills.forEach(sk => {
      const cat = sk.categoria_abilita_primaria || 'Altro';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sk);
    });
    return groups;
  }, [filteredPrimaryMSSkills]);

  const groupedSecondary = useMemo(() => {
    const groups = {};
    filteredSecondaryMSSkills.forEach(sk => {
      const cat = sk.categoria_abilita_secondaria || 'Altro';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sk);
    });
    return groups;
  }, [filteredSecondaryMSSkills]);

  // Recupera il personaggio attivo (PG o PNG)
  const activeChar = useMemo(() => {
    if (characterId === 'custom') return null;
    return savedCharacters.find(c => c.id === characterId) || null;
  }, [characterId, savedCharacters]);

  const activeNpc = useMemo(() => {
    if (characterId === 'custom') return null;
    return (campaignNpcs || []).find(n => n.id === characterId) || null;
  }, [characterId, campaignNpcs]);

  // Helper per recuperare il bonus abilità del PG o PNG attivo
  const getSelectedActorSkillBonus = (actorChar, actorNpc, skName, isSecondary = false) => {
    if (actorChar) {
      let bonus = getCharacterSkillBonus(actorChar, skName);
      // Controllo elmo in metallo (-5 Percezione)
      const lowerSk = skName.toLowerCase();
      const isPerceptionSkill = lowerSk.includes('percezione') || lowerSk.includes('tracce') || lowerSk.includes('osservare');
      if (isPerceptionSkill) {
        const equipped = actorChar.equipment || [];
        const hasMetalElmo = equipped.some(x => 
          (x.qtyEquip || 0) > 0 && 
          x.nome.toLowerCase().includes('elmo') && 
          x.nome.toLowerCase().includes('metallo')
        );
        if (hasMetalElmo) {
          bonus -= 5;
        }
      }
      return bonus;
    }
    if (actorNpc) {
      if (actorNpc.skills && actorNpc.skills[skName] !== undefined) {
        return actorNpc.skills[skName];
      }
      const charKey = getSkillCharacteristic(skName);
      const statBonus = actorNpc.stats ? (actorNpc.stats[charKey] || 0) : 0;
      return isSecondary ? (-25 + statBonus) : statBonus;
    }
    return isSecondary ? -25 : 0;
  };

  // Sincronizza ed inizializza i bonus delle abilità quando cambia il personaggio
  useEffect(() => {
    const initialOverrides = {};
    primaryMSSkills.forEach(sk => {
      const bonus = getSelectedActorSkillBonus(activeChar, activeNpc, sk.nome_abilita_primaria, false);
      initialOverrides[sk.nome_abilita_primaria] = bonus;
    });
    secondaryMSSkills.forEach(sk => {
      const bonus = getSelectedActorSkillBonus(activeChar, activeNpc, sk.nome_abilita_secondaria, true);
      initialOverrides[sk.nome_abilita_secondaria] = bonus;
    });
    setSkillBonusesOverride(initialOverrides);
    // Azzera la selezione abilità
    setSelectedSkills([]);
  }, [activeChar, activeNpc, primaryMSSkills, secondaryMSSkills]);

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

  // Calcolo Modificatori della Tipologia attiva
  const tipologiaModifiers = useMemo(() => {
    let mod = 0;
    if (activeTipologia === 1 || activeTipologia === 2 || activeTipologia === 3) {
      const comp = COMPLEXITY_SCALES.find(c => c.value === manoeuvreComplexity);
      mod += comp ? comp.modifier : 0;
      
      // Aggiunge D per la tipologia 2
      if (activeTipologia === 2) {
        if (isLoyalListener) mod += 50;
        if (isServantListener) mod += 20;
      }
    } else if (activeTipologia === 4) {
      // Modificatori B
      mod -= parseInt(spellLevel || 0);
      if (differentRealm) mod -= 30;
      if (knowledgeSpell === 'ignore') mod -= 10;
      else if (knowledgeSpell === 'knows') mod += 20;
      else if (knowledgeSpell === 'capable') mod += 30;
    } else if (activeTipologia === 5) {
      // Modificatori C
      if (specificClue) mod += 20;
    }
    return mod;
  }, [activeTipologia, manoeuvreComplexity, isLoyalListener, isServantListener, spellLevel, differentRealm, knowledgeSpell, specificClue]);

  const gmMod = parseInt(customGmModifier) || 0;
  const totalModifiers = tipologiaModifiers + gmMod;

  // Calcolo Risultato Finale
  const finalResult = diceRollResult + totalAppliedSkillBonus + totalModifiers;
  const clampedResult = Math.max(-26, Math.min(176, finalResult));

  // Nome colonna nel database per la Tipologia attiva
  const activeColumnName = useMemo(() => {
    const item = TIPOLOGIE_LIST.find(t => t.id === activeTipologia);
    return item ? item.columnName : '';
  }, [activeTipologia]);

  // Risoluzione su tabella TM-2 (salta la riga "note")
  const outcomeRow = useMemo(() => {
    return manovreData.find(row => row["Tiro aperto"] === clampedResult && typeof row["Tiro aperto"] === 'number') || null;
  }, [clampedResult]);

  const outcomeValue = useMemo(() => {
    if (!outcomeRow || !activeColumnName) return null;
    return outcomeRow[activeColumnName];
  }, [outcomeRow, activeColumnName]);

  const handleToggleSkill = (skillName) => {
    setSelectedSkills(prev => {
      const isSel = prev.includes(skillName);
      let next;
      if (isSel) {
        next = prev.filter(name => name !== skillName);
      } else {
        next = [...prev, skillName];
        if (SKILL_TIPOLOGIA_MAP[skillName]) {
          setActiveTipologia(SKILL_TIPOLOGIA_MAP[skillName]);
        }
      }
      return next;
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

  const handleStaticPrev = () => {
    const sortedRows = [...manovreData]
      .filter(row => typeof row["Tiro aperto"] === 'number')
      .sort((a, b) => a["Tiro aperto"] - b["Tiro aperto"]);
    
    if (!activeColumnName) return;
    const currentDesc = outcomeValue;
    
    const prevEntry = [...sortedRows]
      .reverse()
      .find(r => r["Tiro aperto"] < clampedResult && (!currentDesc || r[activeColumnName] !== currentDesc));
    
    if (prevEntry) {
      setDiceRollResult(prevEntry["Tiro aperto"]);
      setManualRollInput(String(prevEntry["Tiro aperto"]));
      setDiceRollSequence([prevEntry["Tiro aperto"]]);
    }
  };

  const handleStaticNext = () => {
    const sortedRows = [...manovreData]
      .filter(row => typeof row["Tiro aperto"] === 'number')
      .sort((a, b) => a["Tiro aperto"] - b["Tiro aperto"]);
    
    if (!activeColumnName) return;
    const currentDesc = outcomeValue;
    
    const nextEntry = sortedRows
      .find(r => r["Tiro aperto"] > clampedResult && (!currentDesc || r[activeColumnName] !== currentDesc));
    
    if (nextEntry) {
      setDiceRollResult(nextEntry["Tiro aperto"]);
      setManualRollInput(String(nextEntry["Tiro aperto"]));
      setDiceRollSequence([nextEntry["Tiro aperto"]]);
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
              <h3 className="font-bold text-sm text-blue-950 uppercase tracking-wider">Risoluzione Manovre statiche</h3>
              <p className="text-xs text-blue-800/60 font-medium">Seleziona il personaggio, la tipologia di azione e le abilità associate.</p>
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
                  onChange={e => setCharacterId(e.target.value)}
                >
                  <option value="custom">-- Personaggio Personalizzato --</option>
                  <optgroup label="Personaggi Giocanti (PG)">
                    {savedCharacters.map(char => (
                      <option key={char.id} value={char.id}>
                        {char.name} (Liv. {1 + (char.levelDevelopments || []).length} - {char.race?.nome || char.race?.popolo} {char.profession?.professione})
                      </option>
                    ))}
                  </optgroup>
                  {campaignNpcs.length > 0 && (
                    <optgroup label="Personaggi Non Giocanti (PNG)">
                      {campaignNpcs.map(npc => (
                        <option key={npc.id} value={npc.id}>
                          {npc.name} (Liv. {npc.livello} - {npc.professione})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {characterId === 'custom' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome PG/PNG Custom:</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800 font-medium"
                    placeholder="Es. Guardiano delle Rune"
                    value={customCharacterName}
                    onChange={e => setCustomCharacterName(e.target.value)}
                  />
                </div>
              ) : activeChar ? (
                <div className="bg-blue-50/30 p-2.5 border border-blue-100 rounded flex flex-col justify-center">
                  <span className="text-[10px] text-blue-850 font-bold uppercase tracking-wider block">PG Roster Attivo</span>
                  <span className="text-sm font-black text-blue-950">{activeChar.name}</span>
                  {activeChar.equipment && activeChar.equipment.some(x => (x.qtyEquip || 0) > 0 && x.nome.toLowerCase().includes('elmo') && x.nome.toLowerCase().includes('metallo')) && (
                    <span className="text-[10px] text-red-600 font-bold mt-1">
                      ⚠️ Elmo di metallo attivo: -5 Percezione applicato ad abilità sensoriali.
                    </span>
                  )}
                </div>
              ) : (
                <div className="bg-purple-50/30 p-2.5 border border-purple-100 rounded flex flex-col justify-center">
                  <span className="text-[10px] text-purple-850 font-bold uppercase tracking-wider block">PNG Campagna</span>
                  <span className="text-sm font-black text-purple-950">{activeNpc?.name}</span>
                </div>
              )}
            </div>

            {/* 2. Selezione Tipologia Manovra Statica (Scelta GM / Automatica) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                seleziona la tipologia di azione statica:
              </label>
              <div className="flex flex-row gap-4 w-full overflow-x-auto pb-1.5 scrollbar-thin">
                {TIPOLOGIE_LIST.map(tip => (
                  <button
                    key={tip.id}
                    type="button"
                    onClick={() => {
                      setActiveTipologia(tip.id);
                      setSelectedSkills([]); // reset to avoid cross-tipologia selections
                    }}
                    className={`fumble-btn flex-1 min-w-[155px] ${
                      activeTipologia === tip.id
                        ? 'fumble-btn-selected-blue'
                        : 'fumble-btn-deselected'
                    }`}
                  >
                    {tip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Complessità / Modificatori specifici (Dinamico in base alla Tipologia) */}
            <div className="border-t border-gray-200/60 pt-4">
              
              {/* Scale A: Complessità Manovra per Tipologie 1, 2 e 3 */}
              {(activeTipologia === 1 || activeTipologia === 2 || activeTipologia === 3) && (
                <div className="space-y-3 mb-4">
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
                          <span className="text-[8.5px] opacity-85 font-extrabold mt-0.5">{scale.modifier >= 0 ? `+${scale.modifier}` : scale.modifier}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modificatori Specifici per tipologia */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-3">Modificatori Specifici della Tipologia</span>

                {/* Modificatori Tipologia 2: Influenza */}
                {activeTipologia === 2 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        onClick={() => setIsLoyalListener(!isLoyalListener)}
                        className={`border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition select-none ${
                          isLoyalListener 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold shadow-xs' 
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <span className="text-xs">Chi ascolta è leale e devoto</span>
                        <span className={`text-xs font-bold ${isLoyalListener ? 'text-emerald-700' : 'text-gray-400'}`}>+50</span>
                      </div>

                      <div
                        onClick={() => setIsServantListener(!isServantListener)}
                        className={`border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition select-none ${
                          isServantListener 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold shadow-xs' 
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <span className="text-xs">Chi ascolta è al servizio del PG</span>
                        <span className={`text-xs font-bold ${isServantListener ? 'text-emerald-700' : 'text-gray-400'}`}>+20</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded p-2.5 italic leading-relaxed">
                      <strong>NOTA:</strong> La difficoltà e le altre modifiche dipendono dall'atteggiamento di coloro che ascoltano, nei confronti del personaggio, e da ciò che egli vuole ottenere da loro.
                    </p>
                  </div>
                )}

                {/* Modificatori Tipologia 4: Lettura Rune / Oggetti Magici */}
                {activeTipologia === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Spell Level */}
                      <div className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-gray-700 block mb-1">Livello dell'Incantesimo (Penalità):</span>
                        <input
                          type="number"
                          className="w-full text-center text-xs font-bold bg-gray-50 border rounded p-1.5 text-gray-800"
                          placeholder="Livello (es. 1, 5, etc.)"
                          value={spellLevel === 0 ? '' : spellLevel}
                          onChange={e => setSpellLevel(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                        {spellLevel > 0 && (
                          <span className="text-[9px] text-red-600 font-semibold text-center mt-1">Applica malus di -{spellLevel}</span>
                        )}
                      </div>

                      {/* Diferent Realm */}
                      <div
                        onClick={() => setDifferentRealm(!differentRealm)}
                        className={`border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition select-none bg-white ${
                          differentRealm 
                            ? 'bg-red-50 border-red-200 text-red-900 font-semibold shadow-xs' 
                            : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs">Regno Incantesimo</span>
                          <span className="text-[9px] opacity-75 font-medium">diverso da quello del PG</span>
                        </div>
                        <span className={`text-xs font-bold ${differentRealm ? 'text-red-700' : 'text-gray-400'}}`}>-30</span>
                      </div>

                      {/* Knowledge */}
                      <div className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-gray-700 block mb-1">Stato Conoscenza Incantesimo:</span>
                        <select
                          className="w-full p-1 border rounded text-xs bg-white text-gray-800 font-semibold"
                          value={knowledgeSpell}
                          onChange={e => setKnowledgeSpell(e.target.value)}
                        >
                          <option value="ignore">Ignora quale sia l'incantesimo (-10)</option>
                          <option value="knows">Sa quale sia l'incantesimo (+20)</option>
                          <option value="capable">Capace di pronunciarlo (+30)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modificatori Tipologia 5: Percezione e Tracce */}
                {activeTipologia === 5 && (
                  <div className="space-y-3">
                    <div
                      onClick={() => setSpecificClue(!specificClue)}
                      className={`border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition select-none bg-white ${
                        specificClue 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold shadow-xs' 
                          : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs">Ricerca Indizio Specifico</span>
                        <span className="text-[9px] opacity-75 font-medium">Il tempo impiegato round condiziona il grado</span>
                      </div>
                      <span className={`text-xs font-bold ${specificClue ? 'text-emerald-700' : 'text-gray-400'}`}>+20</span>
                    </div>

                    <div className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded p-2.5 space-y-1.5 leading-relaxed">
                      <p><strong>NOTA 1:</strong> Le informazioni disponibili con un Tiro Percezione sono limitate alla zona che esaminate oltre che dalle vostre risorse (di solito i vostri sensi).</p>
                      <p><strong>NOTA 2:</strong> Per seguire le tracce effettuare un Tiro Percezione ogni 30 round.</p>
                    </div>
                  </div>
                )}

                {/* Tipologie 1 e 3: Nessun modificatore addizionale */}
                {(activeTipologia === 1 || activeTipologia === 3) && (
                  <p className="text-[11px] text-gray-400 italic">Nessun modificatore extra specifico. Si applica la complessità base ed il bonus abilità.</p>
                )}

              </div>
            </div>

            {/* 4. Selezione Abilità (2 COLONNE PER CATEGORIA) */}
            <div className="border-t border-gray-200/60 pt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <label className="block text-xs font-bold text-gray-700">
                  Abilità applicate alla manovra statica (seleziona una o più):
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
                
                {/* Colonna Sinistra: Abilità Primarie MS */}
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-inner max-h-[360px] overflow-y-auto">
                  <h4 className="font-bold text-xs text-orange-950 uppercase tracking-wider mb-2 pb-1.5 border-b border-orange-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Abilità Primarie (MS)
                  </h4>
                  {Object.keys(groupedPrimary).length === 0 ? (
                    <p className="text-xs italic text-gray-400 p-4 text-center">Nessuna abilità primaria MS trovata.</p>
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

                {/* Colonna Destra: Abilità Secondarie MS */}
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-inner max-h-[360px] overflow-y-auto">
                  <h4 className="font-bold text-xs text-yellow-950 uppercase tracking-wider mb-2 pb-1.5 border-b border-yellow-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Abilità Secondarie (MS)
                  </h4>
                  {Object.keys(groupedSecondary).length === 0 ? (
                    <p className="text-xs italic text-gray-400 p-4 text-center">Nessuna abilità secondaria MS trovata.</p>
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
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Abilità MS Applicate ({selectedSkills.length})</span>
                  {selectedSkills.length === 0 ? (
                    <span className="text-xs italic text-gray-400">Nessuna abilità selezionata (Bonus +0)</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedSkills.map(skName => (
                        <span key={skName} className="text-[10px] bg-blue-50/50 text-blue-800 border border-blue-100 rounded px-2 py-0.5 font-bold shadow-xs">
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
              <h3 className="font-bold text-sm text-gray-950 uppercase tracking-wider">Tiro di Dado</h3>
              <p className="text-xs text-gray-500 font-medium">Esegui il lancio di dado d100 o immetti il valore manualmente.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* GM Modificatore Speciale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-2.5 flex items-center justify-between bg-gray-50/30">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700">Modificatore Master Speciale:</span>
                  <span className="text-[9.5px] text-gray-400">Bonus/malus arbitrario per questa specifica prova</span>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    className="w-full text-center text-xs font-bold bg-white border rounded p-1 text-gray-800"
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
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tabella Risoluzione TM-2</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900/50 text-blue-300 font-bold border border-blue-800/40">
              Colonna: {TIPOLOGIE_LIST.find(t => t.id === activeTipologia)?.label}
            </span>
          </div>

          <div className="space-y-4">
            {/* Visualizzazione Formula Matematica */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Dettagli Formula MS</span>
              <div className="grid grid-cols-2 gap-y-2 text-xs font-medium border-b border-gray-800 pb-3">
                <span className="text-gray-400">Tiro Aperto:</span>
                <span className="text-right text-white font-bold">{diceRollResult}</span>

                <span className="text-gray-400">Bonus Abilità MS:</span>
                <span className="text-right text-blue-400 font-bold">+{totalAppliedSkillBonus}</span>

                {totalModifiers !== 0 && (
                  <>
                    <span className="text-gray-400">Modificatori Applicati:</span>
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
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center shadow-inner">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
                <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block">Esito Verificato su Tabella TM-2</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={handleStaticPrev}
                    title="Esito precedente"
                    className="p-1 bg-gray-700 hover:bg-gray-650 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 border border-gray-600"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Prec.</span>
                  </button>
                  <button
                    onClick={handleStaticNext}
                    title="Esito successivo"
                    className="p-1 bg-gray-700 hover:bg-gray-650 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 border border-gray-600"
                  >
                    <span>Succ.</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {outcomeValue === null ? (
                <div className="py-6 text-gray-500 italic text-sm">Nessun dato trovato per tiro {clampedResult}</div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="w-16 h-16 rounded-full bg-blue-950 border border-blue-500 flex flex-col items-center justify-center text-blue-400 font-black text-base mx-auto shadow-lg shadow-blue-900/25">
                    <span>{clampedResult}</span>
                    <span className="text-[8px] font-semibold text-blue-300/80 -mt-0.5">TIRO</span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-blue-400 text-sm uppercase tracking-wider">Risoluzione Manovra</h4>
                    <p className="text-xs text-gray-250 mt-2 text-left leading-relaxed font-medium bg-gray-900/60 p-3 border border-gray-800 rounded-lg whitespace-pre-line">
                      {outcomeValue}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Note sulle Regole del Tiro Aperto */}
            <div className="p-3.5 bg-gray-800/30 border border-gray-800 rounded-xl text-[10px] text-gray-400 space-y-2 leading-relaxed shadow-sm">
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
