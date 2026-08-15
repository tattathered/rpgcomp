import { Swords } from 'lucide-react';
import { TABLE_NAMES, WEAPON_SKILL_TO_TABLE } from '../../utils/combatHelpers';
import { fmt } from '../../utils/skillHelpers';

export default function AttackerPanel({
  attackerId, setAttackerId,
  customAttackerName, setCustomAttackerName,
  attackerBO, setAttackerBO,
  attackerWeaponCat, setAttackerWeaponCat,
  attackerHpTot, setAttackerHpTot,
  attackerHpSubiti, setAttackerHpSubiti,
  processedRoster,
  campaignNpcs,
  campaignCreatures,
  attackerInfo,
  selectedWeaponIdx, setSelectedWeaponIdx,
  attackerBOEffective,
  attackerBoSpesoParata,
  onUpdateHpSubiti,
  onUpdateActorHp
}) {
  return (
    <div className="card p-5 border border-blue-200 rounded-xl bg-blue-50/15 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-blue-150 mb-4">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <Swords className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-blue-950 uppercase tracking-wider">Attaccante</h4>
        </div>

        <div className="space-y-4">
          {/* Selezione Attaccante */}
          <div>
            <label className="block text-xs font-bold text-blue-900 mb-1">Seleziona Attaccante:</label>
            <select
              className="w-full p-2 border border-blue-250 rounded text-sm bg-white focus:ring-blue-500 focus:border-blue-500 font-medium"
              value={attackerId}
              onChange={e => {
                setAttackerId(e.target.value);
                setSelectedWeaponIdx(0);
              }}
            >
              <option value="custom">- Inserimento Manuale (Custom) -</option>
              
              {processedRoster.length > 0 && (
                <optgroup label="Personaggi Giocanti (PG)">
                  {processedRoster.map(char => (
                    <option key={char.id} value={`pc-${char.id}`}>
                      {char.name} (HP: {char.hpTot - (char.hpSubiti || 0)}/{char.hpTot})
                    </option>
                  ))}
                </optgroup>
              )}
              
              {campaignNpcs.length > 0 && (
                <optgroup label="Personaggi Non Giocanti (PNG)">
                  {campaignNpcs.map(npc => (
                    <option key={npc.id} value={`npc-${npc.id}`}>
                      {npc.name} (HP: {npc.hpCorrenti !== undefined ? npc.hpCorrenti : npc.hpMax}/{npc.hpMax})
                    </option>
                  ))}
                </optgroup>
              )}
              
              {campaignCreatures.length > 0 && (
                <optgroup label="Creature / Mostri">
                  {campaignCreatures.map(creature => (
                    <option key={creature.id} value={`creature-${creature.id}`}>
                      {creature.Nome} (HP: {creature.hpCorrenti !== undefined ? creature.hpCorrenti : creature.punti_ferita}/{creature.punti_ferita})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {attackerId === 'custom' ? (
            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-blue-200 rounded-lg">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-blue-900 uppercase">Nome Attaccante:</label>
                <input
                  type="text"
                  className="w-full p-1.5 border border-blue-250 rounded text-xs mt-0.5 bg-blue-50/10 focus:ring-blue-500 focus:border-blue-500"
                  value={customAttackerName}
                  onChange={e => setCustomAttackerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase">Arma & Tabella:</label>
                <select
                  className="w-full p-1.5 border border-blue-250 rounded text-xs mt-0.5 bg-white focus:ring-blue-500 focus:border-blue-500"
                  value={attackerWeaponCat}
                  onChange={e => setAttackerWeaponCat(e.target.value)}
                >
                  <option value="taglio a 1 mano">Taglio ad una mano (TA-1)</option>
                  <option value="contundenti a 1 mano">Contundenti una mano (TA-2)</option>
                  <option value="a 2 mani">A due mani (TA-3)</option>
                  <option value="con asta">Con asta (TA-3)</option>
                  <option value="da tiro">Da tiro (TA-4)</option>
                  <option value="da lancio">Da lancio (Dinamico)</option>
                  <option value="dardo">Dardo Magico (TA-7)</option>
                  <option value="sfera">Sfera Magica (TA-8)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase">BO Base dell'Attacco:</label>
                <input
                  type="number"
                  className="w-full p-1.5 border border-blue-250 rounded text-xs mt-0.5 text-center font-bold focus:ring-blue-500 focus:border-blue-500"
                  value={attackerBO}
                  onChange={e => setAttackerBO(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase">HP Totali PG:</label>
                <input
                  type="number"
                  className="w-full p-1.5 border border-blue-250 rounded text-xs mt-0.5 text-center focus:ring-blue-500 focus:border-blue-500"
                  value={attackerHpTot}
                  onChange={e => setAttackerHpTot(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase">HP Attuali Subiti:</label>
                <input
                  type="number"
                  className="w-full p-1.5 border border-blue-250 rounded text-xs mt-0.5 text-center font-semibold text-red-650 focus:ring-blue-500 focus:border-blue-500"
                  value={attackerHpSubiti}
                  onChange={e => setAttackerHpSubiti(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-lg grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-blue-900 uppercase">Nome Attaccante:</label>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {attackerInfo?.name} <span className="text-[10px] text-gray-500 font-normal uppercase">({attackerInfo?.type === 'pc' ? 'PG' : attackerInfo?.type === 'npc' ? 'PNG' : attackerInfo?.type === 'creature' ? 'Creatura' : attackerInfo?.type})</span>
                </p>
              </div>
              {attackerInfo?.hasMetalBracciali && (
                <div className="col-span-2">
                  <span className="text-[10px] text-red-600 font-bold bg-red-50/50 px-2 py-1 rounded border border-red-200 block">
                    ⚠️ Bracciali di metallo equipaggiati: -5 BO applicato.
                  </span>
                </div>
              )}
              {attackerInfo && attackerInfo.weapons && attackerInfo.weapons.length > 0 ? (
                <div className="col-span-2">
                  {attackerInfo.type === 'creature' && attackerInfo.weapons.length > 1 && (
                    <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 mb-1.5">
                      Attacco {selectedWeaponIdx + 1} di {attackerInfo.weapons.length}
                    </span>
                  )}
                  <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Seleziona Attacco / Arma:</label>
                  <select
                    className="w-full p-1.5 border border-blue-200 rounded text-xs bg-white font-medium focus:ring-blue-500 focus:border-blue-500"
                    value={selectedWeaponIdx}
                    onChange={e => setSelectedWeaponIdx(parseInt(e.target.value))}
                  >
                    {attackerInfo.weapons.map((w, idx) => (
                      <option key={idx} value={idx}>
                        {w.nome} (BO: {fmt(w.bo)}{w.skillName ? ` | ${w.skillName}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="col-span-2">
                  <p className="text-xs italic text-orange-600">Nessun attacco/arma disponibile.</p>
                </div>
              )}
              {attackerInfo?.type === 'npc' && (
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Mappa a Tabella Attacco:</label>
                  <select
                    className="w-full p-1.5 border border-blue-200 rounded text-xs bg-white font-medium focus:ring-blue-500 focus:border-blue-500"
                    value={attackerWeaponCat}
                    onChange={e => setAttackerWeaponCat(e.target.value)}
                  >
                    <option value="taglio a 1 mano">Taglio ad una mano (TA-1)</option>
                    <option value="contundenti a 1 mano">Contundenti una mano (TA-2)</option>
                    <option value="a 2 mani">A due mani (TA-3)</option>
                    <option value="con asta">Con asta (TA-3)</option>
                    <option value="da tiro">Da tiro (TA-4)</option>
                    <option value="da lancio">Da lancio (Dinamico)</option>
                    <option value="dardo">Dardo Magico (TA-7)</option>
                    <option value="sfera">Sfera Magica (TA-8)</option>
                  </select>
                </div>
              )}
              <div>
                <span className="block text-[9px] font-bold text-gray-550 uppercase">BO Disponibile</span>
                <strong className="text-sm text-gray-950 block font-bold">{fmt(attackerBOEffective)}</strong>
                {attackerBoSpesoParata > 0 && (
                  <span className="text-[9px] text-blue-700 block leading-tight">({fmt(attackerBO)} base - {attackerBoSpesoParata} parata)</span>
                )}
              </div>
              <div>
                <span className="block text-[9px] font-bold text-gray-550 uppercase">HP Totali</span>
                <strong className="text-sm text-gray-900 block">{attackerHpTot}</strong>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-gray-555 uppercase mb-1">HP Subiti (Ferite)</span>
                <input
                  type="number"
                  min="0"
                  max={attackerHpTot}
                  className="w-16 p-1 border border-blue-200 rounded text-xs text-center font-bold text-red-655 bg-white focus:ring-blue-500 focus:border-blue-500"
                  value={attackerHpSubiti}
                  onChange={e => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setAttackerHpSubiti(val);
                    if (attackerInfo) {
                      if (attackerInfo.type === 'pc') {
                        if (onUpdateHpSubiti) onUpdateHpSubiti(attackerInfo.id, val);
                      } else {
                        const newHp = Math.max(0, attackerInfo.hpTot - val);
                        if (onUpdateActorHp) onUpdateActorHp(attackerInfo.type, attackerInfo.id, newHp);
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-blue-200/50 flex justify-between items-center text-xs">
        <span className="text-gray-550 font-medium">Tabella Attacco:</span>
        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {TABLE_NAMES[WEAPON_SKILL_TO_TABLE[attackerWeaponCat]] || TABLE_NAMES['TA-1']}
        </span>
      </div>
    </div>
  );
}
