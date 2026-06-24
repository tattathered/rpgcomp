import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertOctagon, Dices, ChevronLeft, ChevronRight } from 'lucide-react';

import tc1 from '../data/TC-1-colpi_critici_impatto.json';
import tc2 from '../data/TC-2-colpi_critici_taglio.json';
import tc3 from '../data/TC-3-colpi_critici_punta.json';
import tc4 from '../data/TC-4-colpi_critici_perdita_equilibrio.json';
import tc5 from '../data/TC-5-colpi_critici_da_presa.json';
import tc6 from '../data/TC-6-colpi_critici_calore.json';
import tc7 from '../data/TC-7-colpi_critici_freddo.json';
import tc8 from '../data/TC-8-colpi_critici_elettricita.json';
import tc9 from '../data/TC-9-colpi_critici_impatto_magico.json';
import tcModifiers from '../data/TC-modifiche_al_tiro.json';

const tcTables = {
  'TC-1': tc1,
  'TC-2': tc2,
  'TC-3': tc3,
  'TC-4': tc4,
  'TC-5': tc5,
  'TC-6': tc6,
  'TC-7': tc7,
  'TC-8': tc8,
  'TC-9': tc9
};

const TABLE_NAMES = {
  'TC-1': 'TC-1 Impatto',
  'TC-2': 'TC-2 Taglio',
  'TC-3': 'TC-3 Punta',
  'TC-4': 'TC-4 Perdita Equilibrio',
  'TC-5': 'TC-5 Da Presa',
  'TC-6': 'TC-6 Calore',
  'TC-7': 'TC-7 Freddo',
  'TC-8': 'TC-8 Elettricità',
  'TC-9': 'TC-9 Impatto Magico'
};

const SEVERITIES = ['T', 'A', 'B', 'C', 'D', 'E'];

const fmt = (n) => (typeof n === 'number' ? (n >= 0 ? `+${n}` : `${n}`) : n);

// Parser helper for ranges
const isInRange = (roll, rangeStr) => {
  const cleanStr = String(rangeStr).trim();
  
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    return roll >= min && roll <= max;
  }
  
  const val = parseInt(cleanStr, 10);
  if (!isNaN(val)) {
    return roll === val;
  }
  return false;
};

export default function CriticalResolver({
  initialTableCode = 'TC-2',
  initialSeverity = 'C',
  initialDiceRoll = 50,
  initialModifierCustom = 0,
  showTitle = true
}) {
  const [tableCode, setTableCode] = useState(initialTableCode);
  const [severity, setSeverity] = useState(initialSeverity);
  const [diceRoll, setDiceRoll] = useState(initialDiceRoll);
  const [manualRoll, setManualRoll] = useState(String(initialDiceRoll));
  const [modifierCustom, setModifierCustom] = useState(initialModifierCustom);
  const [resultOverride, setResultOverride] = useState(null);

  // Per prevenire reset spuri di resultOverride a causa di ri-renderizzazioni del padre con le stesse props
  const prevProps = useRef({
    tableCode: initialTableCode,
    severity: initialSeverity,
    diceRoll: initialDiceRoll,
    modifierCustom: initialModifierCustom
  });

  // Sync if props change
  useEffect(() => {
    const hasChanged =
      prevProps.current.tableCode !== initialTableCode ||
      prevProps.current.severity !== initialSeverity ||
      prevProps.current.diceRoll !== initialDiceRoll ||
      prevProps.current.modifierCustom !== initialModifierCustom;

    if (hasChanged) {
      setTableCode(initialTableCode);
      setSeverity(initialSeverity);
      setDiceRoll(initialDiceRoll);
      setManualRoll(String(initialDiceRoll));
      setModifierCustom(initialModifierCustom);
      setResultOverride(null);
      
      prevProps.current = {
        tableCode: initialTableCode,
        severity: initialSeverity,
        diceRoll: initialDiceRoll,
        modifierCustom: initialModifierCustom
      };
    }
  }, [initialTableCode, initialSeverity, initialDiceRoll, initialModifierCustom]);

  // Modificatore basato sulla severità (TC-modifiche_al_tiro)
  const severityModifier = useMemo(() => {
    // Cerca la riga corrispondente alla severità in tcModifiers
    const modRow = tcModifiers.find(r => (r['tipo critico'] || '').trim().toUpperCase() === severity.toUpperCase());
    if (modRow) {
      // Trova la colonna corretta basata sul tableCode
      // I file CSV e JSON hanno come intestazioni di colonna i nomi file esatti (es. 'TC-1-colpi_critici_impatto')
      const colName = Object.keys(modRow).find(key => key.startsWith(tableCode));
      if (colName && modRow[colName] !== undefined) {
        const val = parseInt(modRow[colName], 10);
        return isNaN(val) ? 0 : val;
      }
    }
    // Fallback standard se il file di modifiche non mappa
    const standardMods = { T: -50, A: -20, B: -10, C: 0, D: 10, E: 20 };
    return standardMods[severity] !== undefined ? standardMods[severity] : 0;
  }, [tableCode, severity]);

  const computedResult = useMemo(() => {
    const res = diceRoll + severityModifier + modifierCustom;
    return Math.max(1, Math.min(120, res));
  }, [diceRoll, severityModifier, modifierCustom]);

  const finalResult = resultOverride !== null ? resultOverride : computedResult;

  // Outcome lookup logic
  const outcome = useMemo(() => {
    const tableData = tcTables[tableCode] || [];
    // Trova la riga in cui il risultato rientra nel range
    const record = tableData.find(r => {
      const resKey = String(r['Risultato'] || r['risultato'] || '');
      return isInRange(finalResult, resKey);
    });
    
    if (record) {
      // Estrai la descrizione. La chiave può essere il nome della tabella o "descrizione"
      const descKey = Object.keys(record).find(k => k !== 'Risultato' && k !== 'risultato');
      return {
        range: String(record['Risultato'] || record['risultato'] || ''),
        descrizione: record[descKey] || ''
      };
    }
    return null;
  }, [tableCode, finalResult]);

  const handleRollDice = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    setDiceRoll(roll);
    setManualRoll(String(roll));
    setResultOverride(null);
  };

  const handleManualRollChange = (val) => {
    setManualRoll(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      setDiceRoll(parsed);
      setResultOverride(null);
    }
  };

  const handleModifierCustomChange = (val) => {
    const parsed = parseInt(val);
    setModifierCustom(isNaN(parsed) ? 0 : parsed);
    setResultOverride(null);
  };

  const handlePrev = () => {
    const tableData = tcTables[tableCode] || [];
    // Filtra ed ordina i record in ordine di range iniziale
    const sortedRecords = [...tableData]
      .map(r => {
        const key = String(r['Risultato'] || r['risultato'] || '');
        let min = 0;
        if (key.includes('-')) {
          min = parseInt(key.split('-')[0], 10);
        } else {
          min = parseInt(key, 10);
        }
        return { r, min };
      })
      .filter(item => !isNaN(item.min))
      .sort((a, b) => a.min - b.min);

    let currentIndex = sortedRecords.findIndex(item => {
      const k = String(item.r['Risultato'] || item.r['risultato'] || '');
      return isInRange(finalResult, k);
    });

    if (currentIndex === -1) {
      const firstMin = sortedRecords[0]?.min ?? 1;
      if (finalResult < firstMin) {
        // Siamo già sotto il primo range, imposta il minimo del primo
        setResultOverride(firstMin);
        return;
      } else {
        // Siamo sopra l'ultimo range. Il precedente dell'oltre-limite è l'ultimo record!
        currentIndex = sortedRecords.length;
      }
    }

    if (currentIndex > 0) {
      const prevRecord = sortedRecords[currentIndex - 1].r;
      const key = String(prevRecord['Risultato'] || prevRecord['risultato'] || '');
      if (key.includes('-')) {
        const parts = key.split('-');
        setResultOverride(parseInt(parts[0], 10));
      } else {
        setResultOverride(parseInt(key, 10));
      }
    }
  };

  const handleNext = () => {
    const tableData = tcTables[tableCode] || [];
    const sortedRecords = [...tableData]
      .map(r => {
        const key = String(r['Risultato'] || r['risultato'] || '');
        let min = 0;
        if (key.includes('-')) {
          min = parseInt(key.split('-')[0], 10);
        } else {
          min = parseInt(key, 10);
        }
        return { r, min };
      })
      .filter(item => !isNaN(item.min))
      .sort((a, b) => a.min - b.min);

    let currentIndex = sortedRecords.findIndex(item => {
      const k = String(item.r['Risultato'] || item.r['risultato'] || '');
      return isInRange(finalResult, k);
    });

    if (currentIndex === -1) {
      const firstMin = sortedRecords[0]?.min ?? 1;
      if (finalResult < firstMin) {
        // Siamo sotto il primo range. Il successivo è il primo record!
        currentIndex = -1; // -1 + 1 = 0
      } else {
        // Siamo già sopra l'ultimo range, mantieni l'ultimo valore dell'ultimo record
        const lastRecord = sortedRecords[sortedRecords.length - 1].r;
        const key = String(lastRecord['Risultato'] || lastRecord['risultato'] || '');
        if (key.includes('-')) {
          setResultOverride(parseInt(key.split('-')[1], 10));
        } else {
          setResultOverride(parseInt(key, 10));
        }
        return;
      }
    }

    if (currentIndex < sortedRecords.length - 1) {
      const nextRecord = sortedRecords[currentIndex + 1].r;
      const key = String(nextRecord['Risultato'] || nextRecord['risultato'] || '');
      if (key.includes('-')) {
        const parts = key.split('-');
        setResultOverride(parseInt(parts[0], 10));
      } else {
        setResultOverride(parseInt(key, 10));
      }
    }
  };


  return (
    <div className="card p-5 border border-amber-200 rounded-xl bg-amber-50/10 shadow-sm animate-fadeIn">
      {showTitle && (
        <div className="flex items-center gap-2 pb-3 border-b border-amber-100 mb-5">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-amber-950 uppercase tracking-wider">Risoluzione Colpi Critici</h3>
            <p className="text-xs text-amber-800/60 font-medium">Gestisci e risolvi la gravità e gli effetti dei colpi critici inflitti.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Controlli di Input */}
        <div className="space-y-5 p-5 bg-white border border-amber-100 rounded-lg">
          {/* Selezione Tabella */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wider">
              Seleziona la tabella critici:
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 pb-1">
              {Object.keys(TABLE_NAMES).map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setTableCode(code);
                    setResultOverride(null);
                  }}
                  className={`fumble-btn ${
                    tableCode === code ? 'fumble-btn-selected-amber' : 'fumble-btn-deselected'
                  }`}
                >
                  {TABLE_NAMES[code]}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wider">
              Seleziona la gravità del critico:
            </label>
            <div className="flex flex-row gap-2 w-full overflow-x-auto pb-1 scrollbar-thin">
              {SEVERITIES.map(sev => {
                const isActive = severity === sev;
                const standardMods = { T: -50, A: -20, B: -10, C: 0, D: 10, E: 20 };
                // Calcola modificatore per visualizzazione rapida nel pulsante
                const modRow = tcModifiers.find(r => (r['tipo critico'] || '').trim().toUpperCase() === sev.toUpperCase());
                let modVal = standardMods[sev];
                if (modRow) {
                  const colName = Object.keys(modRow).find(key => key.startsWith(tableCode));
                  if (colName && modRow[colName] !== undefined) {
                    const parsed = parseInt(modRow[colName], 10);
                    if (!isNaN(parsed)) modVal = parsed;
                  }
                }
                
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => {
                      setSeverity(sev);
                      setResultOverride(null);
                    }}
                    className={`fumble-btn ${
                      isActive 
                        ? 'fumble-btn-selected-amber' 
                        : 'fumble-btn-deselected'
                    } flex-1 min-w-[60px]`}
                  >
                    <span className="uppercase font-black text-sm">{sev}</span>
                    <span className="text-[10px] opacity-75 font-semibold mt-0.5">{fmt(modVal)}</span>
                  </button>
                );
              })}
            </div>
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
                className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                value={manualRoll}
                onChange={e => handleManualRollChange(e.target.value)}
              />
            </div>
          </div>

          {/* Modificatore GM */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Modificatore Speciale GM:</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={modifierCustom || ''}
              placeholder="+0"
              onChange={e => handleModifierCustomChange(e.target.value)}
            />
          </div>
        </div>

        {/* Risultato Calcolato e Navigazione Esiti */}
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Formula Risultato Critico</span>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
              Tiro ({diceRoll}) + Mod. Severità ({severityModifier >= 0 ? `+${severityModifier}` : severityModifier}) + Mod. GM ({modifierCustom >= 0 ? `+${modifierCustom}` : modifierCustom})
            </p>
            <strong className="text-lg font-black text-amber-950 block mt-1">
              Risultato Finale: {finalResult} / 120
            </strong>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded text-xs font-bold flex items-center gap-1 transition shadow-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Esito Prec.
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded text-xs font-bold flex items-center gap-1 transition shadow-xs"
            >
              Esito Succ.
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Descrizione Esito */}
        <div className="p-5 bg-white border border-amber-100 rounded-lg shadow-xs">
          <div className="border-b border-amber-50 pb-2 mb-3 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-750 uppercase tracking-wider">Effetto del Colpo Critico</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Risultato: {finalResult}
              </span>
              {resultOverride !== null && (
                <button
                  type="button"
                  onClick={() => setResultOverride(null)}
                  className="text-[10px] text-amber-750 underline hover:text-amber-600 font-semibold"
                >
                  Ripristina Tiro
                </button>
              )}
            </div>
          </div>
          
          {outcome ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                {outcome.descrizione}
              </p>
              {outcome.note && (
                <div className="p-3 bg-gray-50 rounded border border-gray-150 text-[11px] text-gray-500 whitespace-pre-line leading-relaxed">
                  <span className="font-bold text-[10px] uppercase text-gray-400 block mb-1">Note Tabella:</span>
                  {outcome.note}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs italic text-gray-400">Nessun esito trovato per il risultato {finalResult} in {tableCode}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
