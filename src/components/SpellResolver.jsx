import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Dices, ChevronLeft, ChevronRight, AlertTriangle, AlertOctagon } from 'lucide-react';
import { fmt, resolveSpellAttack, resolveBaseSpell, isInRange } from '../utils/spellHelpers';
import CriticalResolver from './CriticalResolver';
import FumbleResolver from './FumbleResolver';
import ta7 from '../data/TA-7-incantesimi-dardo.json';
import ta8 from '../data/TA-8-incantesimi_sfera.json';
import ta9 from '../data/TA-9-incantesimi_base.json';

const PREPARATION_OPTIONS = [
  { rounds: 0, modifier: -30, text: '0 Round (Istantaneo)' },
  { rounds: 1, modifier: -15, text: '1 Round' },
  { rounds: 2, modifier: 0, text: '2 Round (Standard)' },
  { rounds: 3, modifier: 10, text: '3 Round' },
  { rounds: 4, modifier: 20, text: '4 Round (Massimo)' }
];

const DARDO_ELEMENTS = [
  { id: 'calore', name: 'Fuoco (Calore)', tableCode: 'TC-6' },
  { id: 'freddo', name: 'Ghiaccio (Freddo)', tableCode: 'TC-7' },
  { id: 'elettricita', name: 'Fulmine (Elettricità)', tableCode: 'TC-8' },
  { id: 'impatto', name: 'Energia / Acqua (Impatto)', tableCode: 'TC-1' }
];

const ELEMENT_LABELS = {
  calore: 'Fuoco',
  freddo: 'Ghiaccio',
  elettricita: 'Fulmine',
  impatto: 'Impatto'
};

const SFIDE_Distanza_Sfera = [
  { label: '0m - 3m (+35)', modifier: 35 },
  { label: '3m - 16m (+0)', modifier: 0 },
  { label: '16m - 33m (-25)', modifier: -25 },
  { label: '33m - 66m (-40)', modifier: -40 },
  { label: '66m - 100m (-55)', modifier: -55 },
  { label: 'oltre 100m (-75)', modifier: -75 }
];

const SFIDE_Distanza_Base = [
  { label: 'A contatto (+30)', modifier: 30 },
  { label: '0m - 3m (+10)', modifier: 10 },
  { label: '3m - 16m (+0)', modifier: 0 },
  { label: '16m - 33m (-10)', modifier: -10 },
  { label: '33m - 100m (-20)', modifier: -20 },
  { label: 'oltre 100m (-30)', modifier: -30 }
];

const ARMOR_OPTIONS = [
  { id: 'nessuna', name: 'Nessuna Armatura (PA 1-4)' },
  { id: 'cuoio_grezzo', name: 'Cuoio Grezzo (PA 5-8)' },
  { id: 'cuoio_rinforzato', name: 'Cuoio Rinforzato (PA 9-12)' },
  { id: 'maglia', name: 'Cotta di Maglia (PA 13-16)' },
  { id: 'piastre', name: 'Corazza di Piastre (PA 17-20)' }
];

export default function SpellResolver({ showTitle = true, initialType = 'base' }) {
  const [spellType, setSpellType] = useState(initialType);
  
  useEffect(() => {
    setSpellType(initialType);
  }, [initialType]);

  const [spellBo, setSpellBo] = useState(50);
  const [preparationsRounds, setPreparationsRounds] = useState(2); // standard
  const [spellDiceRoll, setSpellDiceRoll] = useState(50);
  const [spellManualRoll, setSpellManualRoll] = useState('50');
  const [spellModifierCustom, setSpellModifierCustom] = useState(0);
  const [spellResultOverride, setSpellResultOverride] = useState(null);

  // Lanciatore gravemente ferito
  const [isInjured, setIsInjured] = useState(false);

  // Distanze
  const [distanceModSfera, setDistanceModSfera] = useState(0);
  const [distanceModBase, setDistanceModBase] = useState(0);

  // Bersaglio / Difensore
  const [targetArmor, setTargetArmor] = useState('nessuna');
  const [targetAgilityBonus, setTargetAgilityBonus] = useState(0);
  const [targetCoveragePenalty, setTargetCoveragePenalty] = useState(0);
  const [targetShieldActive, setTargetShieldActive] = useState(false); // solo dardi
  const [isTargetAware, setIsTargetAware] = useState(true); // solo sfere
  const [isTargetStatic, setIsTargetStatic] = useState(false); // solo base

  // Elemento magico per dardi/sfere
  const [spellElement, setSpellElement] = useState('calore');

  // Regno magico per incantesimi base
  const [spellRealm, setSpellRealm] = useState('essenza'); // 'essenza', 'flusso', 'mentalismo'

  // Sub-risolutori attivi
  const [activeSubCrit, setActiveSubCrit] = useState(null); // { tableCode, severity, diceRoll }
  const [activeSubFumble, setActiveSubFumble] = useState(null); // { tableCode, diceRoll }

  // Reset override se cambia il tipo di incantesimo
  useEffect(() => {
    setSpellResultOverride(null);
    setActiveSubCrit(null);
    setActiveSubFumble(null);
  }, [spellType]);

  // Calcolo dei modificatori
  const prepModifier = useMemo(() => {
    const option = PREPARATION_OPTIONS.find(o => o.rounds === preparationsRounds);
    return option ? option.modifier : 0;
  }, [preparationsRounds]);

  const distanceModifier = useMemo(() => {
    if (spellType === 'sfera') return distanceModSfera;
    if (spellType === 'base') return distanceModBase;
    return 0;
  }, [spellType, distanceModSfera, distanceModBase]);

  const healthModifier = useMemo(() => {
    return isInjured ? -10 : 0;
  }, [isInjured]);

  const targetDefenseModifier = useMemo(() => {
    let def = 0;
    
    // Agilità
    if (spellType === 'dardo') {
      def += targetAgilityBonus;
    } else if (spellType === 'sfera' && isTargetAware) {
      def += targetAgilityBonus;
    }

    // Scudo (-20 dardo)
    if (spellType === 'dardo' && targetShieldActive) {
      def += 20;
    }

    // Copertura
    def += targetCoveragePenalty;

    // Bersaglio statico (+10 base, riduce la difesa)
    if (spellType === 'base' && isTargetStatic) {
      def -= 10;
    }

    return def;
  }, [spellType, targetAgilityBonus, isTargetAware, targetShieldActive, targetCoveragePenalty, isTargetStatic]);

  const computedSpellResult = useMemo(() => {
    const bo = parseInt(spellBo) || 0;
    const gmMod = parseInt(spellModifierCustom) || 0;
    const res = spellDiceRoll + bo + prepModifier + distanceModifier + healthModifier - targetDefenseModifier + gmMod;
    return Math.max(1, Math.min(150, res));
  }, [spellDiceRoll, spellBo, prepModifier, distanceModifier, healthModifier, targetDefenseModifier, spellModifierCustom]);

  const finalSpellResult = spellResultOverride !== null ? spellResultOverride : computedSpellResult;

  // Risoluzione esito
  const spellOutcome = useMemo(() => {
    if (spellType === 'base') {
      return resolveBaseSpell(finalSpellResult, spellRealm, targetArmor);
    } else {
      const tableCode = spellType === 'dardo' ? 'TA-7' : 'TA-8';
      return resolveSpellAttack(finalSpellResult, tableCode, targetArmor);
    }
  }, [spellType, finalSpellResult, spellRealm, targetArmor]);

  const handleRollDice = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    setSpellDiceRoll(roll);
    setSpellManualRoll(String(roll));
    setSpellResultOverride(null);
    setActiveSubCrit(null);
    setActiveSubFumble(null);
  };

  const handleManualRollChange = (val) => {
    setSpellManualRoll(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      setSpellDiceRoll(parsed);
      setSpellResultOverride(null);
      setActiveSubCrit(null);
      setActiveSubFumble(null);
    }
  };

  const handleModifierCustomChange = (val) => {
    const parsed = parseInt(val);
    setSpellModifierCustom(isNaN(parsed) ? 0 : parsed);
    setSpellResultOverride(null);
    setActiveSubCrit(null);
    setActiveSubFumble(null);
  };

  // Navigazione range
  const sortedRanges = useMemo(() => {
    // Genera range unici ed ordinati a seconda della tabella attiva
    let uniqueTiri = [];
    if (spellType === 'base') {
      // In TA-9 abbiamo "Risultato dei Dadi"
      uniqueTiri = ta9.map(r => String(r['Risultato dei Dadi'] || r['risultato'] || ''));
    } else if (spellType === 'dardo') {
      uniqueTiri = ta7.map(r => String(r['Risultato del Tiro'] || r['risultato'] || ''));
    } else {
      uniqueTiri = ta8.map(r => String(r['Risultato del Tiro'] || r['risultato'] || ''));
    }

    return uniqueTiri
      .map(key => {
        let min = 0;
        let max = 0;
        const clean = key.trim();
        if (clean.includes('-')) {
          const parts = clean.split('-');
          min = parseInt(parts[0], 10);
          max = parseInt(parts[1], 10);
        } else {
          min = parseInt(clean, 10);
          max = min;
        }
        return { key, min, max };
      })
      .filter(item => !isNaN(item.min))
      .sort((a, b) => a.min - b.min);
  }, [spellType]);

  const handlePrevRange = () => {
    let currentIndex = sortedRanges.findIndex(item => isInRange(finalSpellResult, item.key));
    if (currentIndex === -1) {
      const firstMin = sortedRanges[0]?.min ?? 1;
      if (finalSpellResult < firstMin) {
        setSpellResultOverride(firstMin);
        return;
      } else {
        currentIndex = sortedRanges.length;
      }
    }
    if (currentIndex > 0) {
      const prev = sortedRanges[currentIndex - 1];
      setSpellResultOverride(prev.min);
      setActiveSubCrit(null);
      setActiveSubFumble(null);
    }
  };

  const handleNextRange = () => {
    let currentIndex = sortedRanges.findIndex(item => isInRange(finalSpellResult, item.key));
    if (currentIndex === -1) {
      const firstMin = sortedRanges[0]?.min ?? 1;
      if (finalSpellResult < firstMin) {
        currentIndex = -1;
      } else {
        const last = sortedRanges[sortedRanges.length - 1];
        setSpellResultOverride(last.max);
        return;
      }
    }
    if (currentIndex < sortedRanges.length - 1) {
      const next = sortedRanges[currentIndex + 1];
      setSpellResultOverride(next.min);
      setActiveSubCrit(null);
      setActiveSubFumble(null);
    }
  };

  // Parsing dell'esito dardo/sfera (es: "12B" o "F" o "0")
  const parsedOutcome = useMemo(() => {
    if (!spellOutcome || spellType === 'base') return null;
    
    // Fallimento naturale (fumble) solo su tiro <= 2
    if (spellDiceRoll <= 2) {
      return { type: 'fumble', label: 'FALLIMENTO INCANTESIMO' };
    }

    const val = String(spellOutcome.valore).trim();
    if (val === '0' || val === '' || val === 'F') {
      return { type: 'miss', label: 'Incantesimo Mancato' };
    }
    const match = val.match(/^(\d+)([A-E])?$/);
    if (match) {
      return {
        type: 'hit',
        damage: parseInt(match[1], 10),
        critSeverity: match[2] || null,
        label: `Colpito: ${match[1]} PF ${match[2] ? `+ Critico ${match[2]}` : ''}`
      };
    }
    return { type: 'generic', label: val };
  }, [spellOutcome, spellType, spellDiceRoll]);

  // Tabella dei critici associata all'elemento
  const selectedCritTable = useMemo(() => {
    const el = DARDO_ELEMENTS.find(e => e.id === spellElement);
    return el ? el.tableCode : 'TC-2';
  }, [spellElement]);

  const handleOpenCritResolver = () => {
    if (parsedOutcome && parsedOutcome.critSeverity) {
      setActiveSubCrit({
        tableCode: selectedCritTable,
        severity: parsedOutcome.critSeverity,
        diceRoll: Math.floor(Math.random() * 100) + 1
      });
      setActiveSubFumble(null);
    }
  };

  const handleOpenFumbleResolver = () => {
    setActiveSubFumble({
      tableCode: 'TTM-3',
      diceRoll: Math.floor(Math.random() * 100) + 1
    });
    setActiveSubCrit(null);
  };

  const noteTabella = useMemo(() => {
    if (spellType === 'dardo') {
      return `MODIFICHE INERENTI AL BERSAGLIO:\n- Detrarre il bonus di Agilità del bersaglio\n- Copertura: da -10 a -60 (Tiro Manovra e decisione del GM)\n- Scudo: -20 in direzione dell'attacco\n\nMODIFICHE INERENTI ALL'ATTACCANTE:\n+ Sommare il BO "Incantesimo base" dell'attaccante\n- Sottrarre il livello dell'incantesimo (malus al tiro)\n+20 se il bersaglio è nel punto centrale scelto dall'attaccante\n+ Preparazione round: 4 round (+20), 3 round (+10), 2 round (+0), 1 round (-15), 0 round (-30)\n\nNOTA: Un risultato (F) indica che l'incantesimo è fallito e richiede un tiro sulla tabella TTM-3 (Fallimenti degli Incantesimi).`;
    }
    if (spellType === 'sfera') {
      return `MODIFICHE INERENTI AL BERSAGLIO:\n- Detrarre il bonus di Agilità del bersaglio (solo se consapevole)\n- Copertura: da -10 a -80 (Tiro Manovra e decisione del GM)\n\nMODIFICHE DOVUTE ALLA DISTANZA:\n+35 da 0m a 3m\n0 da 3m a 16m\n-25 da 17m a 33m\n-40 da 33m a 66m\n-55 da 66m a 100m\n-75 oltre 100m\n\nPreparazione round: 4 round (+20), 3 round (+10), 2 round (+0), 1 round (-15), 0 round (-30)\n\nNOTA: Un risultato (F) indica che l'incantesimo è fallito e richiede un tiro sulla tabella TTM-3 (Fallimenti degli Incantesimi).`;
    }
    return `MODIFICHE PER L'ATTACCANTE:\n+ Sommare il BO incantesimi base dell'attaccante\n-10 se l'attaccante ha perso più della metà dei suoi PF\n+ Preparazione round: 4 round (+20), 3 round (+10), 2 round (+0), 1 round (-15), 0 round (-30)\n\nMODIFICHE PER IL BERSAGLIO:\n- Sottrarre il bonus di copertura\n+10 se il bersaglio è statico (sorpreso o prono senza riparo)\n\nMODIFICHE PER LA DISTANZA:\n+30 a contatto\n+10 da 0m a 3m\n0 da 3m a 16m\n-10 da 16m a 33m\n-20 da 33m a 100m\n-30 più di 100m\n\nNOTA: Un risultato (F) indica che l'incantesimo è fallito e richiede un tiro sulla tabella TTM-3 (Fallimenti degli Incantesimi). Il numero ottenuto rappresenta il modificatore per il Tiro Resistenza (TR) del bersaglio.`;
  }, [spellType]);

  return (
    <div className="card p-5 border border-indigo-200 rounded-xl bg-indigo-50/10 shadow-sm animate-fadeIn">
      {showTitle && (
        <div className="flex items-center gap-2 pb-3 border-b border-indigo-100 mb-5">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base text-indigo-950 uppercase tracking-wider">Risoluzione Lancio Incantesimi</h3>
            <p className="text-xs text-indigo-800/60 font-medium">Calcola la riuscita e gli effetti degli incantesimi base, dardo e sfera.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Scelta Tipo Incantesimo */}
        {initialType !== 'base' && (
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                spellType === 'dardo'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
              }`}
              onClick={() => setSpellType('dardo')}
            >
              Incantesimi Dardo (TA-7)
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                spellType === 'sfera'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
              }`}
              onClick={() => setSpellType('sfera')}
            >
              Incantesimi Sfera (TA-8)
            </button>
          </div>
        )}

        {/* Input Controls */}
        <div className="space-y-5 p-5 bg-white border border-indigo-100 rounded-lg shadow-xs">
          {/* Lanciatore */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">BO Incantesimi Lanciatore:</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={spellBo}
                onChange={e => setSpellBo(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Round di Preparazione:</label>
              <div className="flex flex-wrap gap-1">
                {PREPARATION_OPTIONS.map(o => (
                  <button
                    key={o.rounds}
                    type="button"
                    onClick={() => setPreparationsRounds(o.rounds)}
                    className={`flex-1 py-1.5 px-1 text-[10px] font-black uppercase rounded border transition-all ${
                      preparationsRounds === o.rounds
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {o.rounds} R ({fmt(o.modifier)})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={isInjured}
                  onChange={e => setIsInjured(e.target.checked)}
                />
                <span>Lanciatore Gravemente Ferito (-10)</span>
              </label>
            </div>
          </div>

          {/* Configurazione regno/tipo se Dardo o Sfera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            {(spellType === 'dardo' || spellType === 'sfera') && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Elemento dell'Incantesimo:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DARDO_ELEMENTS.map(e => {
                    const label = ELEMENT_LABELS[e.id] || e.name;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSpellElement(e.id)}
                        className={`py-1.5 px-2 text-[10px] font-black uppercase rounded border transition-all text-center ${
                          spellElement === e.id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {spellType === 'base' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Ambito / Regno Incantesimo:</label>
                <div className="flex gap-2">
                  {['essenza', 'flusso', 'mentalismo'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSpellRealm(r)}
                      className={`flex-1 py-2 text-xs font-black uppercase rounded border transition-all ${
                        spellRealm === r
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Distanza (Condizionale) */}
            {spellType !== 'dardo' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Distanza dal Bersaglio:</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={spellType === 'sfera' ? distanceModSfera : distanceModBase}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    if (spellType === 'sfera') setDistanceModSfera(val);
                    else setDistanceModBase(val);
                  }}
                >
                  {(spellType === 'sfera' ? SFIDE_Distanza_Sfera : SFIDE_Distanza_Base).map(d => (
                    <option key={d.label} value={d.modifier}>{d.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Difensore / Bersaglio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Armatura del Bersaglio:</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={targetArmor}
                onChange={e => setTargetArmor(e.target.value)}
              >
                {ARMOR_OPTIONS.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Copertura del Bersaglio:</label>
              <input
                type="number"
                min="0"
                max="80"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={targetCoveragePenalty || ''}
                placeholder="Malus copertura (es. -20)"
                onChange={e => setTargetCoveragePenalty(Math.abs(parseInt(e.target.value)) || 0)}
              />
            </div>

            {/* Agilità, Scudo, Staticità (Condizionali) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 pt-2">
              {spellType !== 'base' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Modificatore Agilità Bersaglio:</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={targetAgilityBonus || ''}
                    placeholder="Bonus Agilità da sottrarre"
                    onChange={e => setTargetAgilityBonus(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                {spellType === 'dardo' && (
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={targetShieldActive}
                      onChange={e => setTargetShieldActive(e.target.checked)}
                    />
                    <span>Scudo Attivo contro dardo (-20)</span>
                  </label>
                )}
                {spellType === 'sfera' && (
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={isTargetAware}
                      onChange={e => setIsTargetAware(e.target.checked)}
                    />
                    <span>Bersaglio Consapevole (applica Agilità)</span>
                  </label>
                )}
                {spellType === 'base' && (
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={isTargetStatic}
                      onChange={e => setIsTargetStatic(e.target.checked)}
                    />
                    <span>Bersaglio Statico / Sorpreso (+10 al Tiro)</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lancio Dado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-150 rounded-lg shadow-xs">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tiro Dado (1d100):</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRollDice}
                className="px-4 py-2 btn-tiro-dado-critico text-white font-bold rounded-lg text-xs transition shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Dices className="w-4 h-4" />
                Tira Dado
              </button>
              <input
                type="number"
                min="1"
                max="100"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={spellManualRoll}
                onChange={e => handleManualRollChange(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Modificatore Speciale GM:</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={spellModifierCustom || ''}
              placeholder="+0"
              onChange={e => handleModifierCustomChange(e.target.value)}
            />
          </div>
        </div>

        {/* Blocco 1: Risultato Calcolato & Navigazione Esiti */}
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Formula Risultato Lancio Incantesimo</span>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium leading-relaxed">
              Tiro ({spellDiceRoll}) + BO ({spellBo}) + Mod. Prep ({prepModifier})
              {spellType !== 'dardo' && ` + Mod. Distanza (${distanceModifier})`}
              {isInjured && ` + Mod. Ferito (-10)`}
              {targetDefenseModifier !== 0 && ` - Difese Bersaglio (${targetDefenseModifier})`}
              {spellModifierCustom !== 0 && ` + Mod. GM (${spellModifierCustom >= 0 ? `+${spellModifierCustom}` : spellModifierCustom})`}
            </p>
            <strong className="text-lg font-black text-indigo-950 block mt-1">
              Risultato Finale: {finalSpellResult} / 120
            </strong>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrevRange}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded text-xs font-bold flex items-center gap-1 transition shadow-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Esito Prec.
            </button>
            <button
              type="button"
              onClick={handleNextRange}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded text-xs font-bold flex items-center gap-1 transition shadow-xs"
            >
              Esito Succ.
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Blocco 2: Descrizione Esito */}
        <div className="p-5 bg-white border border-indigo-100 rounded-lg shadow-xs space-y-4">
          <div className="border-b border-indigo-50 pb-2 flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-750 uppercase tracking-wider">Effetto del Lancio</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Risultato: {finalSpellResult}
              </span>
              {spellResultOverride !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setSpellResultOverride(null);
                    setActiveSubCrit(null);
                    setActiveSubFumble(null);
                  }}
                  className="text-[10px] text-indigo-750 underline hover:text-indigo-600 font-semibold"
                >
                  Ripristina Tiro
                </button>
              )}
            </div>
          </div>

          {/* Dardo / Sfera Outcome Rendering */}
          {spellType !== 'base' && parsedOutcome && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-black tracking-wide border shadow-sm ${
                  parsedOutcome.type === 'hit'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : parsedOutcome.type === 'fumble'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  {parsedOutcome.label}
                </span>

                {parsedOutcome.type === 'hit' && parsedOutcome.critSeverity && (
                  <button
                    type="button"
                    onClick={handleOpenCritResolver}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-xs tracking-wider uppercase transition shadow-sm active:scale-95"
                  >
                    Risolvi Critico {parsedOutcome.critSeverity}
                  </button>
                )}

                {parsedOutcome.type === 'fumble' && (
                  <button
                    type="button"
                    onClick={handleOpenFumbleResolver}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-xs tracking-wider uppercase transition shadow-sm active:scale-95"
                  >
                    Risolvi Fallimento Magico
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 font-semibold italic">
                *Nota: I danni ed i colpi critici degli incantesimi dardo/sfera bypassano la normale parata fisica e richiedono la risoluzione dell'elemento corrispondente.
              </p>
            </div>
          )}

          {/* Incantesimo Base (TA-9) Outcome Rendering */}
          {spellType === 'base' && spellOutcome && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-black tracking-wide border shadow-sm ${
                  spellDiceRoll <= 2
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                }`}>
                  {spellDiceRoll <= 2 
                    ? 'FALLIMENTO INCANTESIMO' 
                    : spellOutcome.valore === 'F' 
                    ? 'Incantesimo Mancato' 
                    : `Modificatore TR Difensore: ${spellOutcome.valore}`
                  }
                </span>

                {spellDiceRoll <= 2 && (
                  <button
                    type="button"
                    onClick={handleOpenFumbleResolver}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-xs tracking-wider uppercase transition shadow-sm active:scale-95"
                  >
                    Risolvi Fallimento Magico
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 font-semibold italic">
                {spellDiceRoll <= 2 
                  ? '*Lancio fallito. Il GM effettuerà un tiro sulla tabella TTM-3.'
                  : spellOutcome.valore === 'F'
                  ? '*Lancio fallito (nessun effetto sul bersaglio).'
                  : `*Il difensore deve lanciare un Tiro di Resistenza (TR) su ${fmt(spellRealm)} applicando un modificatore di ${spellOutcome.valore} al proprio tiro.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Sub-risolutori Integrati (Critici / Fallimenti) */}
        {activeSubCrit && (
          <div className="mt-6 border-t-2 border-dashed border-amber-200 pt-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black text-amber-600 tracking-wider uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                Risoluzione Critico Associato
              </span>
              <button
                type="button"
                onClick={() => setActiveSubCrit(null)}
                className="text-xs text-amber-700 hover:underline font-bold"
              >
                Chiudi Critico
              </button>
            </div>
            <CriticalResolver
              initialTableCode={activeSubCrit.tableCode}
              initialSeverity={activeSubCrit.severity}
              initialDiceRoll={activeSubCrit.diceRoll}
              showTitle={false}
            />
          </div>
        )}

        {activeSubFumble && (
          <div className="mt-6 border-t-2 border-dashed border-red-200 pt-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black text-red-600 tracking-wider uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">
                Risoluzione Fallimento Incantesimo (TTM-3)
              </span>
              <button
                type="button"
                onClick={() => setActiveSubFumble(null)}
                className="text-xs text-red-750 hover:underline font-bold"
              >
                Chiudi Fallimento
              </button>
            </div>
            <FumbleResolver
              initialTableCode="TTM-3"
              initialDiceRoll={activeSubFumble.diceRoll}
              showTitle={false}
            />
          </div>
        )}

        {/* Blocco 3: Note Tabella */}
        <div className="p-4 bg-gray-50 border border-gray-150 rounded-lg text-[11px] text-gray-500 whitespace-pre-line leading-relaxed shadow-inner">
          <span className="font-bold text-[10px] uppercase text-gray-400 block mb-1.5">Note Tabella & Regole speciali:</span>
          {noteTabella}
        </div>
      </div>
    </div>
  );
}
