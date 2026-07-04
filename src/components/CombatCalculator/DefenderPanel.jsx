import { Shield } from 'lucide-react';
import { ARMOR_DISPLAY } from '../../utils/combatHelpers';
import { fmt } from '../../utils/skillHelpers';

export default function DefenderPanel({
  defenderId, setDefenderId,
  customDefenderName, setCustomDefenderName,
  defenderArmor, setDefenderArmor,
  defenderBD, setDefenderBD,
  customDefenderBO, setCustomDefenderBO,
  defenderHpTot, setDefenderHpTot,
  defenderHpSubiti, setDefenderHpSubiti,
  processedRoster,
  campaignNpcs,
  campaignCreatures,
  defenderInfo,
  selectedDefenderWeaponIdx, setSelectedDefenderWeaponIdx,
  useShield, setUseShield,
  backAttack,
  defenderParry, handleDefenderParryChange,
  defenderWeaponBO,
  onUpdateHpSubiti,
  onUpdateActorHp,
  overrideBracciali, setOverrideBracciali,
  overrideSchinieri, setOverrideSchinieri,
  overrideElmo, setOverrideElmo
}) {
  const isPc = defenderInfo?.type === 'pc';
  const hasMetalBracciali = defenderInfo?.hasMetalBracciali || false;
  const hasMetalSchinieri = defenderInfo?.hasMetalSchinieri || false;
  const hasMetalElmo = defenderInfo?.hasMetalElmo || false;
  return (
    <div className="card p-5 border border-red-200 rounded-xl bg-red-50/15 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-red-150 mb-4">
          <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-red-950 uppercase tracking-wider">Difensore</h4>
        </div>

        <div className="space-y-4">
          {/* Selezione Difensore */}
          <div>
            <label className="block text-xs font-bold text-red-900 mb-1">Seleziona Difensore:</label>
            <select
              className="w-full p-2 border border-red-250 rounded text-sm bg-white focus:ring-red-500 focus:border-red-500 font-medium"
              value={defenderId}
              onChange={e => {
                setDefenderId(e.target.value);
                setSelectedDefenderWeaponIdx(0);
              }}
            >
              <option value="custom">- Inserimento Manuale (Custom) -</option>
              
              {processedRoster.length > 0 && (
                <optgroup label="Personaggi Giocanti (PG)">
                  {processedRoster.map(char => (
                    <option key={char.id} value={`pc-${char.id}`}>
                      {char.name} (Armatura: {ARMOR_DISPLAY[char.equippedArmor] || 'Nessuna'})
                    </option>
                  ))}
                </optgroup>
              )}
              
              {campaignNpcs.length > 0 && (
                <optgroup label="Personaggi Non Giocanti (PNG)">
                  {campaignNpcs.map(npc => (
                    <option key={npc.id} value={`npc-${npc.id}`}>
                      {npc.name} (Armatura: {ARMOR_DISPLAY[npc.equippedArmor] || 'Nessuna'})
                    </option>
                  ))}
                </optgroup>
              )}
              
              {campaignCreatures.length > 0 && (
                <optgroup label="Creature / Mostri">
                  {campaignCreatures.map(creature => (
                    <option key={creature.id} value={`creature-${creature.id}`}>
                      {creature.Nome} (Armatura: {creature.tipo_armatura})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {defenderId === 'custom' ? (
            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-red-200 rounded-lg">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-red-900 uppercase">Nome Difensore:</label>
                <input
                  type="text"
                  className="w-full p-1.5 border border-red-250 rounded text-xs mt-0.5 bg-red-50/10 focus:ring-red-500 focus:border-red-500"
                  value={customDefenderName}
                  onChange={e => setCustomDefenderName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-red-900 uppercase">Tipo Armatura:</label>
                <select
                  className="w-full p-1.5 border border-red-250 rounded text-xs mt-0.5 bg-white focus:ring-red-500 focus:border-red-500"
                  value={defenderArmor}
                  onChange={e => setDefenderArmor(e.target.value)}
                >
                  <option value="nessuna">Nessuna Armatura</option>
                  <option value="cuoio_grezzo">Cuoio Grezzo</option>
                  <option value="cuoio_rinforzato">Cuoio Rinforzato</option>
                  <option value="maglia">Cotta di Maglia</option>
                  <option value="piastre">Armatura a Piastre</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-red-900 uppercase">BD Base del Difensore:</label>
                <input
                  type="number"
                  className="w-full p-1.5 border border-red-250 rounded text-xs mt-0.5 text-center font-bold focus:ring-red-500 focus:border-red-500"
                  value={defenderBD}
                  onChange={e => setDefenderBD(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-red-900 uppercase">BO Base (Parata):</label>
                <input
                  type="number"
                  className="w-full p-1.5 border border-red-250 rounded text-xs mt-0.5 text-center font-bold focus:ring-red-500 focus:border-red-500"
                  value={customDefenderBO}
                  onChange={e => setCustomDefenderBO(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-red-900 uppercase">HP Totali PG:</label>
                <input
                  type="number"
                  className="w-full p-1.5 border border-red-250 rounded text-xs mt-0.5 text-center focus:ring-red-500 focus:border-red-500"
                  value={defenderHpTot}
                  onChange={e => setDefenderHpTot(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-red-900 uppercase">HP Subiti (Ferite):</label>
                <input
                  type="number"
                  className="w-full p-1.5 border border-red-250 rounded text-xs mt-0.5 text-center font-semibold text-red-650 focus:ring-red-500 focus:border-red-500"
                  value={defenderHpSubiti}
                  onChange={e => setDefenderHpSubiti(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50/30 border border-red-100 rounded-lg grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-red-900 uppercase">Nome Difensore:</label>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {defenderInfo?.name} <span className="text-[10px] text-gray-500 font-normal uppercase">({defenderInfo?.type === 'pc' ? 'PG' : defenderInfo?.type === 'npc' ? 'PNG' : defenderInfo?.type === 'creature' ? 'Creatura' : defenderInfo?.type})</span>
                </p>
              </div>
              {defenderInfo && defenderInfo.weapons && defenderInfo.weapons.length > 0 ? (
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-red-900 uppercase mb-1">Seleziona Arma per Parare:</label>
                  <select
                    className="w-full p-1.5 border border-red-200 rounded text-xs bg-white font-medium focus:ring-red-500 focus:border-red-500"
                    value={selectedDefenderWeaponIdx}
                    onChange={e => setSelectedDefenderWeaponIdx(parseInt(e.target.value))}
                  >
                    {defenderInfo.weapons.map((w, idx) => (
                      <option key={idx} value={idx}>
                        {w.nome} (BO: {fmt(w.bo)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                defenderInfo?.type !== 'creature' && (
                  <div className="col-span-2">
                    <p className="text-xs italic text-orange-600">Nessuna arma in inventario. Caricata skill predefinita.</p>
                  </div>
                )
              )}
              
              {/* Controllo Scudo */}
              <div className="col-span-2 flex items-center gap-1.5 mt-1 border-t border-red-100 pt-2 pb-1">
                <input
                  type="checkbox"
                  id="useShieldCheckbox"
                  className="rounded border-red-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                  checked={useShield}
                  disabled={backAttack}
                  onChange={e => setUseShield(e.target.checked)}
                />
                <label htmlFor="useShieldCheckbox" className={`text-xs font-bold ${backAttack ? 'text-gray-400 line-through' : 'text-red-950'} select-none`}>
                  Usa Scudo (+25 BD)
                  {backAttack && <span className="text-[10px] text-gray-400 font-normal italic ml-1">(Non applicabile alle spalle)</span>}
                  {defenderInfo?.type === 'pc' && defenderInfo?.hasShield && (
                    <span className="text-[10px] text-emerald-600 font-normal ml-1">(Equipaggiato)</span>
                  )}
                </label>
              </div>

              {/* Override Equipaggiamento Difensivo (solo PG) */}
              {isPc && (
                <div className="col-span-2 border border-red-100 rounded-lg p-3 bg-red-50/20">
                  <span className="block text-[9px] font-bold text-red-800 uppercase mb-2">Override Equipaggiamento Difensivo</span>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={overrideBracciali}
                        onChange={e => setOverrideBracciali(e.target.checked)}
                        className="rounded border-red-300 text-red-600 focus:ring-red-500 w-3 h-3"
                      />
                      Bracciali {hasMetalBracciali ? '(Metallo -5 BO)' : '(Cuoio)'}
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={overrideSchinieri}
                        onChange={e => setOverrideSchinieri(e.target.checked)}
                        className="rounded border-red-300 text-red-600 focus:ring-red-500 w-3 h-3"
                      />
                      Schinieri {hasMetalSchinieri ? '(Metallo -5 MM)' : '(Cuoio)'}
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={overrideElmo}
                        onChange={e => setOverrideElmo(e.target.checked)}
                        className="rounded border-red-300 text-red-600 focus:ring-red-500 w-3 h-3"
                      />
                      Elmo {hasMetalElmo ? '(Metallo -5 Perc.)' : '(Cuoio)'}
                    </label>
                  </div>
                </div>
              )}

              <div>
                <span className="block text-[9px] font-bold text-gray-550 uppercase">Armatura Attiva</span>
                <strong className="text-sm text-gray-900 block font-semibold">{ARMOR_DISPLAY[defenderArmor] || defenderArmor || 'Nessuna'}</strong>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-gray-555 uppercase">BD Consolidato</span>
                <strong className="text-sm text-gray-900 block font-semibold">
                  {fmt(defenderBD + ((useShield && !backAttack) ? 25 : 0))}
                  {(useShield && !backAttack) && <span className="text-[10px] text-emerald-600 font-normal ml-1">(+25 Scudo)</span>}
                </strong>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-gray-555 uppercase">HP Totali</span>
                <strong className="text-sm text-gray-900 block">{defenderHpTot}</strong>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-gray-555 uppercase mb-1">HP Subiti (Ferite)</span>
                <input
                  type="number"
                  min="0"
                  max={defenderHpTot}
                  className="w-16 p-1 border border-red-200 rounded text-xs text-center font-bold text-red-655 bg-white focus:ring-red-500 focus:border-red-500"
                  value={defenderHpSubiti}
                  onChange={e => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setDefenderHpSubiti(val);
                    if (defenderInfo) {
                      if (defenderInfo.type === 'pc') {
                        if (onUpdateHpSubiti) onUpdateHpSubiti(defenderInfo.id, val);
                      } else {
                        const newHp = Math.max(0, defenderInfo.hpTot - val);
                        if (onUpdateActorHp) onUpdateActorHp(defenderInfo.type, defenderInfo.id, newHp);
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Campo di Parata (Dichiarazione di Parata del Difensore) */}
          <div className="p-3 bg-red-500/5 border border-red-100 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-red-900 uppercase">Quota BO spesa per Parare:</label>
              <span className="text-xs font-bold text-red-700">
                -{defenderParry} al tiro ({defenderWeaponBO > 0 ? Math.round((defenderParry / defenderWeaponBO) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={defenderWeaponBO}
                value={defenderParry}
                onChange={e => handleDefenderParryChange(parseInt(e.target.value) || 0)}
                className="w-full accent-red-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max={defenderWeaponBO}
                value={defenderParry}
                onChange={e => handleDefenderParryChange(parseInt(e.target.value) || 0)}
                className="w-12 p-1 border border-red-300 rounded text-center text-xs font-bold text-red-800 bg-white focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <p className="text-[9px] text-red-755 mt-1 italic">
              BO Max per Parare: {defenderWeaponBO}. Sottrae questo valore dal tiro d'attacco finale.
            </p>
          </div>

        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-red-200/50 flex justify-between items-center text-xs">
        <span className="text-gray-555 font-medium">Colonna Armatura:</span>
        <span className="font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded border border-red-200">
          {ARMOR_DISPLAY[defenderArmor] || defenderArmor || 'Nessuna'}
        </span>
      </div>
    </div>
  );
}
