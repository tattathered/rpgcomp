import React, { useState, useEffect, useMemo } from 'react';
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

  // Sync if props change
  useEffect(() => {
    setTableCode(initialTableCode);
    setSeverity(initialSeverity);
    setDiceRoll(initialDiceRoll);
    setManualRoll(String(initialDiceRoll));
    setModifierCustom(initialModifierCustom);
    setResultOverride(null);
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
      const resKey = r['Risultato'] || r['risultato'] || '';
      return isInRange(finalResult, resKey);
    });
    
    if (record) {
      // Estrai la descrizione. La chiave può essere il nome della tabella o "descrizione"
      const descKey = Object.keys(record).find(k => k !== 'Risultato' && k !== 'risultato');
      return {
        range: record['Risultato'] || record['risultato'],
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
    const currentDesc = outcome?.descrizione;
    // Filtra ed ordina i record in ordine di range iniziale
    const sortedRecords = [...tableData]
      .map(r => {
        const key = r['Risultato'] || r['risultato'] || '';
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

    const currentIndex = sortedRecords.findIndex(item => {
      const k = item.r['Risultato'] || item.r['risultato'];
      return isInRange(finalResult, k);
    });

    if (currentIndex > 0) {
      const prevRecord = sortedRecords[currentIndex - 1].r;
      const key = prevRecord['Risultato'] || prevRecord['risultato'];
      // Imposta il valore mediano o minimo del range precedente
      if (key.includes('-')) {
        const parts = key.split('-');
        setResultOverride(parseInt(parts[0], 10));
      } else {
        setResultOverride(parseInt(key, 10));
      }
    } else {
      setResultOverride(1);
    }
  };

  const handleNext = () => {
    const tableData = tcTables[tableCode] || [];
    const sortedRecords = [...tableData]
      .map(r => {
        const key = r['Risultato'] || r['risultato'] || '';
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

    const currentIndex = sortedRecords.findIndex(item => {
      const k = item.r['Risultato'] || item.r['risultato'];
      return isInRange(finalResult, k);
    });

    if (currentIndex >= 0 && currentIndex < sortedRecords.length - 1) {
      const nextRecord = sortedRecords[currentIndex + 1].r;
      const key = nextRecord['Risultato'] || nextRecord['risultato'];
      if (key.includes('-')) {
        const parts = key.split('-');
        setResultOverride(parseInt(parts[0], 10));
      } else {
        setResultOverride(parseInt(key, 10));
      }
    } else {
      setResultOverride(120);
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
                    className={`py-2 px-0.5 text-xs font-bold rounded border transition text-center flex flex-col justify-center items-center h-12 leading-tight flex-1 min-w-[60px] ${
                      isActive 
                        ? 'bg-amber-600 border-amber-600 text-white shadow-sm' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
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

        {/* Tabella di calcolo */}
        <div className="text-center py-2.5 px-4 bg-amber-50 border border-amber-100 rounded-lg flex flex-wrap justify-center items-center gap-2 text-xs md:text-sm font-bold text-amber-950 shadow-inner">
          <span className="opacity-75">Calcolo:</span>
          <span className="px-2 py-0.5 bg-white border border-amber-200 rounded text-amber-800">Dado: {diceRoll}</span>
          <span>+</span>
          <span className="px-2 py-0.5 bg-white border border-amber-200 rounded text-amber-800">Mod. Severità ({severity}): {fmt(severityModifier)}</span>
          <span>+</span>
          <span className="px-2 py-0.5 bg-white border border-amber-200 rounded text-amber-800">Mod. GM: {fmt(modifierCustom)}</span>
          <span>=</span>
          <span className="px-2.5 py-0.5 bg-amber-600 border border-amber-700 text-white rounded shadow-sm text-sm font-black">Risultato: {computedResult}</span>
        </div>

        {/* Esito Box */}
        <div className="p-5 bg-gradient-to-br from-amber-900 to-amber-950 text-amber-50 rounded-xl border border-amber-950 shadow-md relative overflow-hidden">
          {/* Sfondo Decorativo */}
          <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none translate-x-1/4 translate-y-1/4 scale-150">
            <AlertOctagon className="w-64 h-64 text-amber-100" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-amber-800/40">
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase">Esito del Colpo Critico</span>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60 font-semibold">Range Tabella:</span>
                <span className="px-2 py-0.5 bg-amber-800/60 rounded text-xs font-black tracking-wide border border-amber-700/50">
                  {outcome ? outcome.range : finalResult}
                </span>
                {resultOverride !== null && (
                  <button
                    type="button"
                    onClick={() => setResultOverride(null)}
                    className="text-[10px] text-amber-300 underline hover:text-amber-200 font-semibold"
                  >
                    Ripristina Tiro
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-[80px] flex items-center justify-center py-2">
              <p className="text-sm md:text-base font-bold text-center leading-relaxed text-amber-100">
                {outcome ? outcome.descrizione : 'Tiro fuori range o nessun colpo critico corrispondente trovato.'}
              </p>
            </div>

            {/* Pulsanti navigazione esiti */}
            <div className="flex justify-between items-center pt-3 border-t border-amber-800/40">
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 bg-amber-800/40 hover:bg-amber-800/70 border border-amber-700/50 rounded-lg text-xs font-bold text-amber-200 hover:text-white transition flex items-center gap-1 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                Precedente
              </button>
              <div className="text-[11px] font-black text-amber-400 uppercase tracking-widest bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900">
                Risultato Attivo: {finalResult}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 bg-amber-800/40 hover:bg-amber-800/70 border border-amber-700/50 rounded-lg text-xs font-bold text-amber-200 hover:text-white transition flex items-center gap-1 active:scale-95"
              >
                Successivo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
