import { AlertTriangle, RotateCcw } from 'lucide-react';
import { TABLE_NAMES } from '../../utils/combatHelpers';
import { fmt } from '../../utils/skillHelpers';

export default function CombatOutcomePanel({
  combatOutcome,
  defenderId,
  defenderInfo,
  defenderHpSubiti, setDefenderHpSubiti,
  onUpdateHpSubiti,
  onUpdateActorHp,
  setCritTableCode,
  setCritSeverity,
  setCritDiceRoll,
  handleReset
}) {
  if (!combatOutcome) return null;

  return (
    <div className={`card p-6 border-2 rounded-xl shadow-lg transition-all animate-fadeIn ${
      combatOutcome.type === 'fumble' 
        ? 'bg-red-50 border-red-500 text-red-950' 
        : combatOutcome.type === 'miss'
        ? 'bg-slate-50 border-slate-350 text-slate-900'
        : 'bg-emerald-50 border-emerald-500 text-emerald-950'
    }`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200/50 pb-4 mb-4">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Risoluzione dell'Attacco</span>
          <h4 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2 mt-0.5">
            {combatOutcome.type === 'fumble' && <AlertTriangle className="text-red-650 w-7 h-7" />}
            {combatOutcome.message}
          </h4>
        </div>
        
        <div className="flex gap-4 text-xs font-bold">
          <div className="bg-white/70 px-3 py-1 rounded border">
            Tabella: {combatOutcome.tableCode}
          </div>
          <div className="bg-white/70 px-3 py-1 rounded border">
            Tiro Dado: {combatOutcome.roll}
          </div>
          <div className="bg-white/70 px-3 py-1 rounded border">
            Risultato Finale: {combatOutcome.finalResult}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium leading-relaxed">{combatOutcome.details}</p>
        
        {combatOutcome.type === 'hit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Box HP Danni */}
            <div className="p-4 bg-white/70 border border-emerald-200 rounded-lg shadow-sm flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-black shadow shrink-0">
                  {combatOutcome.damage}
                </div>
                <div>
                  <strong className="block text-sm text-gray-900 font-bold">Punti Ferita Subiti</strong>
                  <span className="text-[11px] text-gray-500 block leading-tight">Riduci i PF del difensore di questo valore.</span>
                </div>
              </div>
              
              {defenderId !== 'custom' && defenderInfo && (
                <button
                  onClick={() => {
                    const currentHp = defenderInfo.hpTot - defenderHpSubiti;
                    const newHp = Math.max(0, currentHp - combatOutcome.damage);
                    const newHpSubiti = defenderInfo.hpTot - newHp;
                    
                    if (defenderInfo.type === 'pc') {
                      if (onUpdateHpSubiti) {
                        onUpdateHpSubiti(defenderInfo.id, newHpSubiti);
                      }
                    } else {
                      if (onUpdateActorHp) {
                        onUpdateActorHp(defenderInfo.type, defenderInfo.id, newHp);
                      }
                    }
                    
                    setDefenderHpSubiti(newHpSubiti);
                    alert(`Applicati ${combatOutcome.damage} PF di danno a ${defenderInfo.name}. HP rimanenti: ${newHp}/${defenderInfo.hpTot}.`);
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 bg-emerald-655 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition active:scale-95 text-center whitespace-nowrap"
                  style={{ backgroundColor: 'var(--success-color, #10b981)', border: 'none', cursor: 'pointer' }}
                >
                  Applica Danni a {defenderInfo.name}
                </button>
              )}
            </div>

            {/* Box Dettagli Critico */}
            {combatOutcome.criticalType && (
              <div className="p-4 bg-white/70 border border-emerald-250 rounded-lg shadow-sm flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4 md:col-span-2 lg:col-span-1 animate-fadeIn">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-xl font-black shadow uppercase shrink-0">
                      {combatOutcome.criticalType}
                    </div>
                    <div>
                      <strong className="block text-sm text-gray-900 font-bold">
                        Colpo Critico Primario (Severità {combatOutcome.criticalType})
                      </strong>
                      <span className="text-xs text-amber-800 font-medium block">
                        Modificatore Tiro Critico: {fmt(combatOutcome.criticalModifier)} | Tabella: {TABLE_NAMES[combatOutcome.suggestedTable] || combatOutcome.suggestedTable}
                      </span>
                    </div>
                  </div>

                  {combatOutcome.hasSecondaryCrit && (
                    <div className="pl-16 border-t border-gray-200/50 pt-3 mt-1 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold shadow uppercase shrink-0">
                          {combatOutcome.secondaryCritSeverity}
                        </div>
                        <div>
                          <strong className="block text-xs text-gray-950">
                            Colpo Critico Secondario (Severità {combatOutcome.secondaryCritSeverity})
                          </strong>
                          <span className="text-[11px] text-amber-900 block">
                            Tabella: {TABLE_NAMES[combatOutcome.secondaryCritTable] || combatOutcome.secondaryCritTable}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCritTableCode(combatOutcome.suggestedTable);
                            setCritSeverity(combatOutcome.criticalType);
                            setCritDiceRoll(Math.floor(Math.random() * 100) + 1);
                          }}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-bold transition active:scale-95 cursor-pointer"
                        >
                          Carica Primario
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCritTableCode(combatOutcome.secondaryCritTable);
                            setCritSeverity(combatOutcome.secondaryCritSeverity);
                            setCritDiceRoll(Math.floor(Math.random() * 100) + 1);
                          }}
                          className="px-2.5 py-1 bg-amber-655 hover:bg-amber-700 text-white rounded text-xs font-bold transition active:scale-95 cursor-pointer"
                          style={{ backgroundColor: '#d97706' }}
                        >
                          Carica Secondario
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {combatOutcome.type === 'fumble' && (
          <div className="p-4 bg-white/70 border border-red-200 rounded-lg shadow-sm flex items-center gap-4 mt-4">
            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-xl font-black shadow">
              F
            </div>
            <div>
              <strong className="block text-sm text-red-950">Colpo Maldestro Rilevato!</strong>
              <span className="text-xs text-red-750">L'attaccante rischia di ferirsi o rompere l'arma.</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200/50 flex justify-end gap-3">
        <button
          onClick={handleReset}
          className="btn btn-outline bg-white hover:bg-gray-100/50 text-gray-700 px-4 py-2 text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Campi
        </button>
      </div>
    </div>
  );
}
