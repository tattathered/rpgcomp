import React from "react";
import { Trash2, Heart, Shield, Sword, User } from "lucide-react";

export default function CampaignRosterManager({
  activeNpcs = [],
  activeCreatures = [],
  onDeleteNpc,
  onDeleteCreature,
  onUpdateHp
}) {
  
  // Calcolo badge stato salute
  const getHealthStatus = (current, max) => {
    const pct = current / max;
    if (current <= 0) return { label: "Morto", class: "bg-red-100 text-red-800 border-red-200" };
    if (pct <= 0.25) return { label: "Critico", class: "bg-orange-100 text-orange-800 border-orange-200" };
    if (pct <= 0.5) return { label: "Ferito", class: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    return { label: "Sano", class: "bg-green-100 text-green-800 border-green-200" };
  };

  const handleHpChange = (type, id, currentHp, maxHp, delta) => {
    const newHp = Math.max(0, Math.min(maxHp, currentHp + delta));
    onUpdateHp(type, id, newHp);
  };

  return (
    <div className="space-y-8">
      
      {/* Sezione PNG */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-gray-800 border-b pb-2 flex justify-between items-center">
          <span>PNG della Campagna</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
            {activeNpcs.length} Attori
          </span>
        </h3>

        {activeNpcs.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
            Nessun PNG salvato per questa campagna. Usa il catalogo PNG per crearne uno.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeNpcs.map((npc) => {
              const status = getHealthStatus(npc.hpCorrenti, npc.hpMax);
              return (
                <div
                  key={npc.id}
                  className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between space-y-3 relative hover:shadow-xs transition-shadow"
                >
                  {/* Intestazione */}
                  <div className="flex justify-between items-start">
                    <div className="max-w-[80%]">
                      <h4 className="font-black text-sm text-gray-800 truncate" title={npc.name}>
                        {npc.name}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-semibold capitalize">
                        {npc.professione} • Livello {npc.livello}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteNpc(npc.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                      title="Rimuovi dalla campagna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Statistiche Chiave */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 border border-gray-150 rounded flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">DB / Armor</span>
                        <span className="font-extrabold text-gray-700">
                          +{npc.db} ({npc.equippedArmor.replace("_", " ")})
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-2 border border-gray-150 rounded flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Cultura</span>
                        <span className="font-extrabold text-gray-700 truncate block max-w-[80px]" title={npc.culture}>
                          {npc.culture || "Umana"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Controlli PF e HP */}
                  <div className="border-t border-gray-200/60 pt-3 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-xs font-black text-indigo-950">
                        HP: {npc.hpCorrenti} / {npc.hpMax}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${status.class}`}>
                        {status.label}
                      </span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => handleHpChange("npc", npc.id, npc.hpCorrenti, npc.hpMax, -5)}
                          className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleHpChange("npc", npc.id, npc.hpCorrenti, npc.hpMax, -1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleHpChange("npc", npc.id, npc.hpCorrenti, npc.hpMax, 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleHpChange("npc", npc.id, npc.hpCorrenti, npc.hpMax, 5)}
                          className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sezione Creature */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-gray-800 border-b pb-2 flex justify-between items-center">
          <span>Creature e Mostri della Campagna</span>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
            {activeCreatures.length} Attori
          </span>
        </h3>

        {activeCreatures.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
            Nessuna creatura associata a questa campagna. Usa il bestiario per aggiungerne una.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCreatures.map((creature) => {
              const status = getHealthStatus(creature.hpCorrenti, creature.punti_ferita);
              return (
                <div
                  key={creature.id}
                  className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between space-y-3 relative hover:shadow-xs transition-shadow"
                >
                  {/* Intestazione */}
                  <div className="flex justify-between items-start">
                    <div className="max-w-[80%]">
                      <h4 className="font-black text-sm text-gray-800 truncate" title={creature.Nome}>
                        {creature.Nome}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                        {creature.Categoria} • Lvl {creature.Livello}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteCreature(creature.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                      title="Rimuovi dalla campagna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Statistiche Chiave */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 border border-gray-150 rounded flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">DB / Armor</span>
                        <span className="font-extrabold text-gray-700 truncate block max-w-[80px]" title={creature.tipo_armatura}>
                          +{creature.bonus_difensivo} ({creature.tipo_armatura})
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-2 border border-gray-150 rounded flex items-center gap-1.5">
                      <Sword className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <div>
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Attacchi</span>
                        <span className="font-extrabold text-gray-700 truncate block max-w-[80px]" title={`${creature.Attacco_uno} (+${creature.Attacco_uno_BO})`}>
                          {creature.Attacco_uno ? creature.Attacco_uno.replace(/^\([^)]+\)\s*/, "") : "Nessuno"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Controlli PF e HP */}
                  <div className="border-t border-gray-200/60 pt-3 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-xs font-black text-indigo-950">
                        HP: {creature.hpCorrenti} / {creature.punti_ferita}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${status.class}`}>
                        {status.label}
                      </span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => handleHpChange("creature", creature.id, creature.hpCorrenti, creature.punti_ferita, -5)}
                          className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleHpChange("creature", creature.id, creature.hpCorrenti, creature.punti_ferita, -1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleHpChange("creature", creature.id, creature.hpCorrenti, creature.punti_ferita, 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleHpChange("creature", creature.id, creature.hpCorrenti, creature.punti_ferita, 5)}
                          className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
