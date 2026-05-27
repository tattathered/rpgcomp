import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Dices, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import fumbleTables12 from '../data/Tabella-Colpi_Maldestri-TTM-1-TTM-2.json';
import fumbleTables34 from '../data/Tabella-Colpi_Maldestri-TTM-3-TTM-4.json';

const fumbleTables = [...fumbleTables12, ...fumbleTables34];

const fmt = (n) => (typeof n === 'number' ? (n >= 0 ? `+${n}` : `${n}`) : n);

const FUMBLE_COMPLEXITY_SCALES = [
  { value: 'Banale', text: 'Banale', activeClass: 'btn-complexity-banale-active', inactiveClass: 'btn-complexity-banale-inactive' },
  { value: 'Facile', text: 'Facile', activeClass: 'btn-complexity-facile-active', inactiveClass: 'btn-complexity-facile-inactive' },
  { value: 'Normale', text: 'Normale', activeClass: 'btn-complexity-lieve-active', inactiveClass: 'btn-complexity-lieve-inactive' },
  { value: 'Media', text: 'Media', activeClass: 'btn-complexity-media-active', inactiveClass: 'btn-complexity-media-inactive' },
  { value: 'Difficile', text: 'Difficile', activeClass: 'btn-complexity-difficile-active', inactiveClass: 'btn-complexity-difficile-inactive' },
  { value: 'Molto difficile', text: 'Molto difficile', activeClass: 'btn-complexity-molto-difficile-active', inactiveClass: 'btn-complexity-molto-difficile-inactive' },
  { value: 'Difficilissima', text: 'Difficilissima', activeClass: 'btn-complexity-difficilissima-active', inactiveClass: 'btn-complexity-difficilissima-inactive' },
  { value: 'Folle', text: 'Folle', activeClass: 'btn-complexity-folle-active', inactiveClass: 'btn-complexity-folle-inactive' },
  { value: 'Assurda', text: 'Assurda', activeClass: 'btn-complexity-assurda-active', inactiveClass: 'btn-complexity-assurda-inactive' }
];

export default function FumbleResolver({
  initialTableCode = 'TTM-1',
  initialDiceRoll = 50,
  initialModifierCustom = 0,
  initialManoeuvreDifficulty = 'Normale',
  initialSpellClass = 'P',
  weaponCategory = '',
  weaponName = '',
  showTitle = true
}) {
  const [fumbleTableCode, setFumbleTableCode] = useState(initialTableCode);
  const [fumbleDiceRoll, setFumbleDiceRoll] = useState(initialDiceRoll);
  const [fumbleManualRoll, setFumbleManualRoll] = useState(String(initialDiceRoll));
  const [fumbleSpellClass, setFumbleSpellClass] = useState(initialSpellClass);
  const [fumbleManoeuvreDifficulty, setFumbleManoeuvreDifficulty] = useState(initialManoeuvreDifficulty);
  const [fumbleModifierCustom, setFumbleModifierCustom] = useState(initialModifierCustom);
  const [fumbleResultOverride, setFumbleResultOverride] = useState(null);

  // Per TTM-1 / TTM-2 stand-alone, consentiamo di selezionare il tipo di arma
  const [selectedMischiaCategory, setSelectedMischiaCategory] = useState('taglio a 1 mano');
  const [selectedTiroWeapon, setSelectedTiroWeapon] = useState('arco composto');

  // Sincronizza lo stato se le props cambiano (es. quando l'utente clicca il link "Risolvi Fumble su TTM-4")
  useEffect(() => {
    setFumbleTableCode(initialTableCode);
    setFumbleManoeuvreDifficulty(initialManoeuvreDifficulty);
    setFumbleSpellClass(initialSpellClass);
    setFumbleModifierCustom(initialModifierCustom);
    setFumbleDiceRoll(initialDiceRoll);
    setFumbleManualRoll(String(initialDiceRoll));
    setFumbleResultOverride(null);
  }, [initialTableCode, initialManoeuvreDifficulty, initialSpellClass, initialModifierCustom, initialDiceRoll]);

  // Se ci vengono fornite categorie esterne (es. dal CombatCalculator), sincronizzale
  useEffect(() => {
    if (weaponCategory) {
      if (initialTableCode === 'TTM-1') {
        setSelectedMischiaCategory(weaponCategory);
      } else if (initialTableCode === 'TTM-2') {
        setSelectedTiroWeapon(weaponName || 'arco composto');
      }
    }
  }, [weaponCategory, weaponName, initialTableCode]);

  // Calcolo modificatore arma
  const weaponFumbleModifier = useMemo(() => {
    if (fumbleTableCode === 'TTM-1') {
      const cat = selectedMischiaCategory;
      if (cat === 'taglio a 1 mano') return -10;
      if (cat === 'contundenti a 1 mano') return -20;
      if (cat === 'con asta') return 10;
      if (cat === 'a 2 mani') return 0;
      return 0;
    }
    if (fumbleTableCode === 'TTM-2') {
      const n = selectedTiroWeapon.toLowerCase();
      if (n.includes('balestra')) return 20;
      if (n.includes('arco lungo')) return 10;
      if (n.includes('arco composto')) return 0;
      if (n.includes('arco corto')) return -10;
      if (n.includes('fionda')) return -20;
      return 0;
    }
    return 0;
  }, [fumbleTableCode, selectedMischiaCategory, selectedTiroWeapon]);

  // Modificatore per tabella
  const fumbleCategoryModifier = useMemo(() => {
    if (fumbleTableCode === 'TTM-3') {
      if (fumbleSpellClass === 'I') return -20;
      if (fumbleSpellClass === 'U') return -10;
      if (fumbleSpellClass === 'P') return 0;
      if (fumbleSpellClass === 'F') return 10;
      if (fumbleSpellClass === 'E') return 20;
      return 0;
    }
    if (fumbleTableCode === 'TTM-4') {
      if (fumbleManoeuvreDifficulty === 'Banale') return -50;
      if (fumbleManoeuvreDifficulty === 'Facile') return -35;
      if (fumbleManoeuvreDifficulty === 'Normale') return -20;
      if (fumbleManoeuvreDifficulty === 'Media') return -10;
      if (fumbleManoeuvreDifficulty === 'Difficile') return 0;
      if (fumbleManoeuvreDifficulty === 'Molto difficile') return 5;
      if (fumbleManoeuvreDifficulty === 'Difficilissima') return 10;
      if (fumbleManoeuvreDifficulty === 'Puramente folle' || fumbleManoeuvreDifficulty === 'Folle') return 15;
      if (fumbleManoeuvreDifficulty === 'Assurda') return 20;
      return 0;
    }
    return weaponFumbleModifier;
  }, [fumbleTableCode, fumbleSpellClass, fumbleManoeuvreDifficulty, weaponFumbleModifier]);

  const computedFumbleResult = useMemo(() => {
    const res = fumbleDiceRoll + fumbleCategoryModifier + fumbleModifierCustom;
    return Math.max(1, Math.min(120, res));
  }, [fumbleDiceRoll, fumbleCategoryModifier, fumbleModifierCustom]);

  const fumbleFinalResult = fumbleResultOverride !== null ? fumbleResultOverride : computedFumbleResult;

  const fumbleOutcome = useMemo(() => {
    return fumbleTables.find(
      r => r.Tabella === fumbleTableCode && r["Risultato del tiro"] === fumbleFinalResult
    ) || null;
  }, [fumbleTableCode, fumbleFinalResult]);

  const handleRollFumbleDice = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    setFumbleDiceRoll(roll);
    setFumbleManualRoll(String(roll));
    setFumbleResultOverride(null);
  };

  const handleFumbleManualRollChange = (val) => {
    setFumbleManualRoll(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      setFumbleDiceRoll(parsed);
      setFumbleResultOverride(null);
    }
  };

  const handleFumbleModifierCustomChange = (val) => {
    setFumbleModifierCustom(val);
    setFumbleResultOverride(null);
  };

  const handleFumblePrev = () => {
    const activeTableEntries = fumbleTables.filter(r => r.Tabella === fumbleTableCode);
    const sortedEntries = [...activeTableEntries].sort((a, b) => a["Risultato del tiro"] - b["Risultato del tiro"]);
    const currentDesc = fumbleOutcome?.descrizione;
    const prevEntry = [...sortedEntries]
      .reverse()
      .find(r => r["Risultato del tiro"] < fumbleFinalResult && (!currentDesc || r.descrizione !== currentDesc));
    if (prevEntry) {
      setFumbleResultOverride(prevEntry["Risultato del tiro"]);
    } else {
      setFumbleResultOverride(1);
    }
  };

  const handleFumbleNext = () => {
    const activeTableEntries = fumbleTables.filter(r => r.Tabella === fumbleTableCode);
    const sortedEntries = [...activeTableEntries].sort((a, b) => a["Risultato del tiro"] - b["Risultato del tiro"]);
    const currentDesc = fumbleOutcome?.descrizione;
    const nextEntry = sortedEntries
      .find(r => r["Risultato del tiro"] > fumbleFinalResult && (!currentDesc || r.descrizione !== currentDesc));
    if (nextEntry) {
      setFumbleResultOverride(nextEntry["Risultato del tiro"]);
    } else {
      setFumbleResultOverride(120);
    }
  };

  return (
    <div className="card p-5 border border-red-200 rounded-xl bg-red-50/10 shadow-sm animate-fadeIn">
      {showTitle && (
        <div className="flex items-center gap-2 pb-3 border-b border-red-100 mb-5">
          <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-red-950 uppercase tracking-wider">Risoluzione Colpi Maldestri</h3>
            <p className="text-xs text-red-800/60 font-medium">Gestisci e risolvi le conseguenze dei fallimenti critici nel gioco.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Controlli di Input */}
        <div className="space-y-5 p-5 bg-white border border-red-100 rounded-lg">
          {/* Selezione Tabella */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
              seleziona la tabella colpi maldestri:
            </label>
            <div className="grid grid-cols-4 gap-6">
              <button
                type="button"
                onClick={() => {
                  setFumbleTableCode('TTM-1');
                  setFumbleResultOverride(null);
                }}
                className={`fumble-btn ${
                  fumbleTableCode === 'TTM-1' ? 'fumble-btn-selected-blue' : 'fumble-btn-deselected'
                }`}
              >
                Colpi maldestri armi da mischia
              </button>

              <button
                type="button"
                onClick={() => {
                  setFumbleTableCode('TTM-2');
                  setFumbleResultOverride(null);
                }}
                className={`fumble-btn ${
                  fumbleTableCode === 'TTM-2' ? 'fumble-btn-selected-amber' : 'fumble-btn-deselected'
                }`}
              >
                Colpi maldestri armi da tiro o da lancio
              </button>

              <button
                type="button"
                onClick={() => {
                  setFumbleTableCode('TTM-3');
                  setFumbleResultOverride(null);
                }}
                className={`fumble-btn ${
                  fumbleTableCode === 'TTM-3' ? 'fumble-btn-selected-purple' : 'fumble-btn-deselected'
                }`}
              >
                Fallimento incantesismi
              </button>

              <button
                type="button"
                onClick={() => {
                  setFumbleTableCode('TTM-4');
                  setFumbleResultOverride(null);
                }}
                className={`fumble-btn ${
                  fumbleTableCode === 'TTM-4' ? 'fumble-btn-selected-emerald' : 'fumble-btn-deselected'
                }`}
              >
                Fallimento manovre di movimento
              </button>
            </div>
          </div>

          {/* Sezione Dinamica sotto la tabella */}
          <div className="border-t border-gray-100 pt-4">
            {fumbleTableCode === 'TTM-1' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  seleziona la categoria arma:
                </label>
                <div className="grid grid-cols-4 gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMischiaCategory('taglio a 1 mano');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedMischiaCategory === 'taglio a 1 mano' ? 'fumble-btn-selected-indigo' : 'fumble-btn-deselected'
                    }`}
                  >
                    Armi da taglio a 1 mano (-10)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMischiaCategory('contundenti a 1 mano');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedMischiaCategory === 'contundenti a 1 mano' ? 'fumble-btn-selected-rose' : 'fumble-btn-deselected'
                    }`}
                  >
                    Armi contundenti a 1 mano (-20)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMischiaCategory('a 2 mani');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedMischiaCategory === 'a 2 mani' ? 'fumble-btn-selected-orange' : 'fumble-btn-deselected'
                    }`}
                  >
                    Armi a 2 mani (+0)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMischiaCategory('con asta');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedMischiaCategory === 'con asta' ? 'fumble-btn-selected-teal' : 'fumble-btn-deselected'
                    }`}
                  >
                    Armi con asta (+10)
                  </button>
                </div>
              </div>
            )}

            {fumbleTableCode === 'TTM-2' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  seleziona la categoria arma da tiro:
                </label>
                <div className="grid grid-cols-5 gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTiroWeapon('balestra');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedTiroWeapon === 'balestra' ? 'fumble-btn-selected-rose' : 'fumble-btn-deselected'
                    }`}
                  >
                    Balestra (+20)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTiroWeapon('arco lungo');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedTiroWeapon === 'arco lungo' ? 'fumble-btn-selected-amber' : 'fumble-btn-deselected'
                    }`}
                  >
                    Arco Lungo (+10)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTiroWeapon('arco composto');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedTiroWeapon === 'arco composto' ? 'fumble-btn-selected-indigo' : 'fumble-btn-deselected'
                    }`}
                  >
                    Arco Composto (0)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTiroWeapon('arco corto');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedTiroWeapon === 'arco corto' ? 'fumble-btn-selected-teal' : 'fumble-btn-deselected'
                    }`}
                  >
                    Arco Corto (-10)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTiroWeapon('fionda');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      selectedTiroWeapon === 'fionda' ? 'fumble-btn-selected-emerald' : 'fumble-btn-deselected'
                    }`}
                  >
                    Fionda (-20)
                  </button>
                </div>
              </div>
            )}

            {fumbleTableCode === 'TTM-3' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  seleziona la classe Incantesimo:
                </label>
                <div className="grid grid-cols-5 gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setFumbleSpellClass('I');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      fumbleSpellClass === 'I' ? 'fumble-btn-selected-emerald' : 'fumble-btn-deselected'
                    }`}
                  >
                    Classe I (-20)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFumbleSpellClass('U');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      fumbleSpellClass === 'U' ? 'fumble-btn-selected-teal' : 'fumble-btn-deselected'
                    }`}
                  >
                    Classe U (-10)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFumbleSpellClass('P');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      fumbleSpellClass === 'P' ? 'fumble-btn-selected-blue' : 'fumble-btn-deselected'
                    }`}
                  >
                    Classe P (+0)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFumbleSpellClass('F');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      fumbleSpellClass === 'F' ? 'fumble-btn-selected-amber' : 'fumble-btn-deselected'
                    }`}
                  >
                    Classe F (+10)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFumbleSpellClass('E');
                      setFumbleResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      fumbleSpellClass === 'E' ? 'fumble-btn-selected-rose' : 'fumble-btn-deselected'
                    }`}
                  >
                    Classe E (+20)
                  </button>
                </div>
              </div>
            )}

            {fumbleTableCode === 'TTM-4' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  seleziona la complessità della manovra di movimento:
                </label>
                <div className="flex flex-row gap-2 w-full overflow-x-auto pb-1 scrollbar-thin">
                  {FUMBLE_COMPLEXITY_SCALES.map(scale => {
                    const isActive = fumbleManoeuvreDifficulty === scale.value;
                    return (
                      <button
                        key={scale.value}
                        type="button"
                        onClick={() => {
                          setFumbleManoeuvreDifficulty(scale.value);
                          setFumbleResultOverride(null);
                        }}
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
            )}
          </div>
        </div>

        {/* Riga Lancio Dado & Modificatore GM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-150 rounded-lg">
          {/* Tiro Dado */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tiro Dado (1d100):</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRollFumbleDice}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Dices className="w-4 h-4" />
                Tira Dado
              </button>
              <input
                type="number"
                min="1"
                max="100"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={fumbleManualRoll}
                onChange={e => handleFumbleManualRollChange(e.target.value)}
              />
            </div>
          </div>

          {/* Modificatore GM */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Modificatore Speciale GM:</label>
            <input
              type="number"
              placeholder="Nessun modificatore extra (0)"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center font-bold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={fumbleModifierCustom === 0 ? '' : fumbleModifierCustom}
              onChange={e => handleFumbleModifierCustomChange(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Risultato Calcolato e Navigazione Esiti */}
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Formula Risultato Fumble</span>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
              Tiro ({fumbleDiceRoll}) + Mod. Categoria ({fumbleCategoryModifier >= 0 ? `+${fumbleCategoryModifier}` : fumbleCategoryModifier}) + Mod. GM ({fumbleModifierCustom >= 0 ? `+${fumbleModifierCustom}` : fumbleModifierCustom})
            </p>
            <strong className="text-lg font-black text-red-950 block mt-1">
              Risultato Finale: {fumbleFinalResult} / 120
            </strong>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFumblePrev}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded text-xs font-bold flex items-center gap-1 transition shadow-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Esito Prec.
            </button>
            <button
              onClick={handleFumbleNext}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded text-xs font-bold flex items-center gap-1 transition shadow-xs"
            >
              Esito Succ.
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Descrizione Esito */}
        <div className="p-5 bg-white border border-red-100 rounded-lg shadow-xs">
          <div className="border-b border-red-50 pb-2 mb-3 flex justify-between items-center">
            <span className="text-xs font-bold text-red-750 uppercase tracking-wider">Effetto del Colpo Maldestro</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800">
              Risultato: {fumbleFinalResult}
            </span>
          </div>
          
          {fumbleOutcome ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                {fumbleOutcome.descrizione}
              </p>
              {fumbleOutcome.note && (
                <div className="p-3 bg-gray-50 rounded border border-gray-150 text-[11px] text-gray-500 whitespace-pre-line leading-relaxed">
                  <span className="font-bold text-[10px] uppercase text-gray-400 block mb-1">Note Tabella:</span>
                  {fumbleOutcome.note}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs italic text-gray-400">Nessun esito trovato per il risultato {fumbleFinalResult} in {fumbleTableCode}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
