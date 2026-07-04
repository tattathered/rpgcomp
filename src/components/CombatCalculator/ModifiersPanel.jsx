import { Target } from 'lucide-react';

export default function ModifiersPanel({
  flankAttack, setFlankAttack,
  backAttack, setBackAttack,
  surprisedDefender, setSurprisedDefender,
  stunnedDefender, setStunnedDefender,
  movementMetres, setMovementMetres,
  drawOrSwapWeapon, setDrawOrSwapWeapon,
  isRangedOrThrown,
  isAttackerGravelyInjured,
  gmBonus, setGmBonus,
  computedModifiers
}) {
  return (
    <div className="card p-5 border border-gray-200 rounded-xl bg-white shadow-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 mb-4">
        <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
          <Target className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Modificatori Situazionali (Attacco)</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Attacco sul Fianco */}
        <label className={`flex items-center gap-2 p-2.5 border rounded-lg text-xs cursor-pointer transition ${isRangedOrThrown ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-150' : (flankAttack ? 'bg-sky-100 border-sky-300 font-semibold text-sky-950' : 'bg-sky-50/60 border-sky-150 text-sky-900 hover:bg-sky-100/50')}`}>
          <input
            type="checkbox"
            checked={flankAttack}
            disabled={isRangedOrThrown}
            onChange={e => setFlankAttack(e.target.checked)}
            className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
          />
          <div>
            <span className="block font-bold">Attacco sul Fianco (+15 BO)</span>
            <span className="text-[9px] text-sky-750">Non per armi da tiro/lancio</span>
          </div>
        </label>

        {/* Attacco da Dietro */}
        <label className={`flex items-center gap-2 p-2.5 border rounded-lg text-xs cursor-pointer transition ${isRangedOrThrown ? 'opacity-40 cursor-not-allowed bg-gray-50' : (backAttack ? 'bg-purple-100 border-purple-300 font-semibold text-purple-950' : 'bg-purple-50/60 border-purple-150 text-purple-900 hover:bg-purple-100/50')}`}>
          <input
            type="checkbox"
            checked={backAttack}
            disabled={isRangedOrThrown}
            onChange={e => setBackAttack(e.target.checked)}
            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
          />
          <div>
            <span className="block font-bold">Attacco da Dietro (+20 BO)</span>
            <span className="text-[9px] text-purple-750">Oltre a bonus fianco (+35 tot)</span>
          </div>
        </label>

        {/* Difensore Sorpreso */}
        <label className={`flex items-center gap-2 p-2.5 border rounded-lg text-xs cursor-pointer transition ${isRangedOrThrown ? 'opacity-40 cursor-not-allowed bg-gray-50' : (surprisedDefender ? 'bg-amber-100 border-amber-300 font-semibold text-amber-950' : 'bg-amber-50/60 border-amber-150 text-amber-900 hover:bg-amber-100/50')}`}>
          <input
            type="checkbox"
            checked={surprisedDefender}
            disabled={isRangedOrThrown}
            onChange={e => setSurprisedDefender(e.target.checked)}
            className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
          />
          <div>
            <span className="block font-bold">Difensore Sorpreso (+20 BO)</span>
            <span className="text-[9px] text-amber-750">Non per armi da tiro/lancio</span>
          </div>
        </label>

        {/* Difensore Stordito o a terra */}
        <label className={`flex items-center gap-2 p-2.5 border rounded-lg text-xs cursor-pointer transition ${isRangedOrThrown ? 'opacity-40 cursor-not-allowed bg-gray-50' : (stunnedDefender ? 'bg-pink-100 border-pink-300 font-semibold text-pink-950' : 'bg-pink-50/60 border-pink-150 text-pink-900 hover:bg-pink-100/50')}`}>
          <input
            type="checkbox"
            checked={stunnedDefender}
            disabled={isRangedOrThrown}
            onChange={e => setStunnedDefender(e.target.checked)}
            className="rounded border-pink-300 text-pink-600 focus:ring-pink-500"
          />
          <div>
            <span className="block font-bold">Stordito o a terra (+20 BO)</span>
            <span className="text-[9px] text-pink-750">Non per armi da tiro/lancio</span>
          </div>
        </label>

        {/* Distanza di Movimento */}
        <div className="p-2.5 border border-emerald-200 rounded-lg bg-emerald-50/50 text-emerald-950 text-xs flex flex-col justify-between">
          <label className="block font-bold text-emerald-900 mb-1">Movimento Round (metri):</label>
          <div className="flex items-center gap-2 justify-between">
            <input
              type="number"
              min="0"
              step="3"
              className="w-16 p-1 border border-emerald-300 rounded text-center font-bold bg-white text-emerald-900 focus:ring-emerald-500 focus:border-emerald-500"
              value={movementMetres}
              onChange={e => setMovementMetres(Math.max(0, parseInt(e.target.value) || 0))}
            />
            <span className="text-[10px] text-red-600 font-bold">
              -{movementMetres >= 3 ? Math.floor(movementMetres / 3) * 10 : 0} BO
            </span>
          </div>
        </div>

        {/* Cambio Arma */}
        <label className={`flex items-center gap-2 p-2.5 border rounded-lg text-xs cursor-pointer transition ${drawOrSwapWeapon ? 'bg-indigo-100 border-indigo-300 font-semibold text-indigo-950' : 'bg-indigo-50/60 border-indigo-150 text-indigo-900 hover:bg-indigo-100/50'}`}>
          <input
            type="checkbox"
            checked={drawOrSwapWeapon}
            onChange={e => setDrawOrSwapWeapon(e.target.checked)}
            className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <span className="block font-bold">Cambio Arma/Scudo (-30 BO)</span>
            <span className="text-[9px] text-indigo-755">Eseguito nel round</span>
          </div>
        </label>

        {/* Attaccante Ferito */}
        <div className={`p-2.5 border rounded-lg text-xs transition flex justify-between items-center ${isAttackerGravelyInjured ? 'bg-red-100 border-red-300 text-red-950 font-semibold' : 'bg-red-50/40 border-red-150 text-red-900'}`}>
          <div>
            <span className="block font-bold">Gravemente Ferito (-20 BO)</span>
            <span className="text-[9px] text-red-750">HP subiti {'>'} 50% HP Totali</span>
          </div>
          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full ${isAttackerGravelyInjured ? 'bg-red-200 text-red-800' : 'bg-red-100 text-red-650'}`}>
            {isAttackerGravelyInjured ? 'SÌ' : 'NO'}
          </span>
        </div>

        {/* Modificatore GM Custom */}
        <div className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-950 flex flex-col justify-between">
          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">GM Custom Modifier:</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-full p-1 border border-slate-350 rounded font-bold text-xs bg-white text-center text-slate-900 focus:ring-slate-500 focus:border-slate-500"
              placeholder="Es: -10"
              value={gmBonus}
              onChange={e => setGmBonus(parseInt(e.target.value) || 0)}
            />
            <span className="text-xs text-slate-500 font-medium">BO</span>
          </div>
        </div>
      </div>

      {/* Banner Riepilogo Modificatori */}
      <div className="mt-4 p-3 bg-indigo-950/5 border border-indigo-200 rounded-lg flex justify-between items-center">
        <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Somma Modificatori Attivi:</span>
        <strong className="text-base text-indigo-900 font-black">{computedModifiers >= 0 ? `+${computedModifiers}` : computedModifiers} BO</strong>
      </div>
    </div>
  );
}
