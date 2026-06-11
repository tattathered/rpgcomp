import { useState, useEffect } from 'react';
import profStatsList from '../../../data/Tabella-professioni_caratteristica_fondamentale.json';
import tb1 from '../../../data/TB-1-caratteristiche_bonus.json';
import AnagraficaReadOnlyBox from '../shared/AnagraficaReadOnlyBox';

const STAT_KEYS = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
const STAT_NAMES = {
  'FR': 'Forza',
  'AG': 'Agilità',
  'CO': 'Costituzione',
  'IN': 'Intelligenza',
  'IT': 'Intuizione',
  'PR': 'Prontezza'
};

const checkElfConstraint = (racePopolo, stats) => {
  if (!stats) return { show: false, respected: false };
  const keys = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
  const hasAll = keys.every(k => stats[k] !== undefined && stats[k] !== null);
  if (!hasAll) return { show: false, respected: false };

  const vals = keys.map(k => Number(stats[k]) || 0).sort((a, b) => b - a);
  const prVal = Number(stats.PR) || 0;

  if (racePopolo === 'Elfi Noldor') {
    return { show: true, respected: prVal >= vals[0] };
  }
  if (racePopolo === 'Elfi Sindar') {
    return { show: true, respected: prVal >= vals[1] };
  }
  if (racePopolo === 'Elfi Silvani') {
    return { show: true, respected: prVal >= vals[2] };
  }
  return { show: false, respected: false };
};

export default function StatsStep({ characterData, setCharacterData }) {
  const [method, setMethod] = useState(characterData.statsMethod || 'classic'); // 'classic' | 'points'

  useEffect(() => {
    const keys = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
    const missing = keys.some(k => !characterData.stats?.[k]);
    let err = null;
    if (missing) {
      err = 'Devi assegnare tutte le 6 caratteristiche principali prima di procedere.';
    }

    if (characterData.stepErrors?.stats !== err) {
      setCharacterData(prev => ({
        ...prev,
        stepErrors: {
          ...(prev.stepErrors || {}),
          stats: err
        }
      }));
    }
  }, [characterData.stats, characterData.stepErrors, setCharacterData]);
  const [rolls, setRolls] = useState(characterData.statsRolls || []);
  
  // Per metodo classico: tiene traccia di quale tiro è assegnato a quale caratteristica
  const [assignments, setAssignments] = useState(characterData.statsAssignments || {
    'FR': null, 'AG': null, 'CO': null, 'IN': null, 'IT': null, 'PR': null
  });

  // Per metodo a punti
  const [maxPoints, setMaxPoints] = useState(characterData.statsMaxPoints || 405); // Rende modificabile il pool
  const [pointStats, setPointStats] = useState(characterData.statsPointBuy || {
    'FR': 60, 'AG': 60, 'CO': 60, 'IN': 60, 'IT': 60, 'PR': 60
  });

  // Per metodo manuale
  const [manualStats, setManualStats] = useState(characterData.statsManual || {
    'FR': 50, 'AG': 50, 'CO': 50, 'IN': 50, 'IT': 50, 'PR': 50
  });

  const prof = characterData.profession;
  const statsInfo = prof ? profStatsList.find(p => p.professione.toLowerCase() === prof.professione.toLowerCase()) : null;
  const primaryStat = statsInfo ? statsInfo['caratteristica fondamentale'] : null;
  const secondaryStat = statsInfo ? statsInfo['caratteristica secondaria'] : null;

  const getBonus = (val) => {
    if (!val) return 0;
    const record = tb1.find(b => b.punteggio === val);
    return record ? record.bonus : 0;
  };

  const calculateFinalStat = (statKey, baseValue) => {
    if (!baseValue) return null;
    let finalVal = baseValue;
    if (statKey === primaryStat && finalVal < 90) finalVal = 90;
    if (statKey === secondaryStat && finalVal < 75) finalVal = 75;
    return finalVal;
  };

  const getClassicFinalStats = (currentAssignments, currentRolls) => {
    const finalStats = {};
    for (let key of STAT_KEYS) {
      const rollId = currentAssignments[key];
      if (rollId) {
        const rollObj = currentRolls.find(r => r.id === rollId);
        finalStats[key] = calculateFinalStat(key, rollObj.val);
      } else {
        finalStats[key] = null;
      }
    }
    return finalStats;
  };

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    let targetStats = {};
    if (newMethod === 'points') {
      targetStats = pointStats;
    } else if (newMethod === 'manual') {
      targetStats = manualStats;
    } else {
      targetStats = getClassicFinalStats(assignments, rolls);
    }
    setCharacterData(prev => ({
      ...prev,
      statsMethod: newMethod,
      stats: targetStats
    }));
  };

  const generateRolls = () => {
    const newRolls = [];
    while (newRolls.length < 6) {
      const roll = Math.floor(Math.random() * 100) + 1;
      if (roll >= 20) {
        newRolls.push({ id: Math.random().toString(), val: roll });
      }
    }
    setRolls(newRolls);
    const clearedAssignments = { 'FR': null, 'AG': null, 'CO': null, 'IN': null, 'IT': null, 'PR': null };
    setAssignments(clearedAssignments);
    
    setCharacterData(prev => ({
      ...prev,
      statsMethod: 'classic',
      statsRolls: newRolls,
      statsAssignments: clearedAssignments,
      stats: { 'FR': null, 'AG': null, 'CO': null, 'IN': null, 'IT': null, 'PR': null }
    }));
  };

  const handleAssign = (statKey, rollId) => {
    const newAssignments = { ...assignments };
    for (let key in newAssignments) {
      if (newAssignments[key] === rollId) {
        newAssignments[key] = null;
      }
    }
    newAssignments[statKey] = rollId;
    setAssignments(newAssignments);
    saveStats(newAssignments, rolls);
  };

  const saveStats = (currentAssignments, currentRolls) => {
    const newStats = getClassicFinalStats(currentAssignments, currentRolls);
    setCharacterData(prev => ({
      ...prev,
      statsMethod: 'classic',
      statsAssignments: currentAssignments,
      statsRolls: currentRolls,
      stats: newStats
    }));
  };

  const calculateStatCost = (val) => {
    if (val <= 90) return val;
    return 90 + ((val - 90) * (val - 90));
  };

  const getPointsTotal = () => {
    return STAT_KEYS.reduce((sum, key) => sum + calculateStatCost(pointStats[key]), 0);
  };

  const remainingPoints = maxPoints - getPointsTotal();

  const handlePointChange = (key, delta) => {
    const currentVal = pointStats[key];
    let newVal = currentVal + delta;
    
    if (newVal > 100) return;
    if (newVal < 20) return;

    if (key === primaryStat && newVal < 90) return;
    if (key === secondaryStat && newVal < 75) return;

    if (delta > 0) {
      const costDiff = calculateStatCost(newVal) - calculateStatCost(currentVal);
      if (remainingPoints - costDiff < 0) return;
    }

    const updatedPointStats = { ...pointStats, [key]: newVal };
    setPointStats(updatedPointStats);
    
    setCharacterData(prev => ({
      ...prev,
      statsMethod: 'points',
      statsPointBuy: updatedPointStats,
      stats: updatedPointStats
    }));
  };

  const handleManualChange = (key, val) => {
    let parsedVal = Math.min(100, Math.max(20, parseInt(val) || 20));
    
    if (key === primaryStat && parsedVal < 90) parsedVal = 90;
    if (key === secondaryStat && parsedVal < 75) parsedVal = 75;

    const updated = { ...manualStats, [key]: parsedVal };
    setManualStats(updated);
    setCharacterData(prev => ({
      ...prev,
      statsMethod: 'manual',
      statsManual: updated,
      stats: updated
    }));
  };

  const handleMaxPointsChange = (val) => {
    const parsedVal = Math.max(300, parseInt(val) || 0);
    setMaxPoints(parsedVal);
    setCharacterData(prev => ({
      ...prev,
      statsMaxPoints: parsedVal
    }));
  };

  // Ensure minimums when component mounts or profession changes
  useEffect(() => {
    // pointStats minimums
    const newPointStats = { ...pointStats };
    let pointChanged = false;
    if (primaryStat && newPointStats[primaryStat] < 90) {
      newPointStats[primaryStat] = 90;
      pointChanged = true;
    }
    if (secondaryStat && newPointStats[secondaryStat] < 75) {
      newPointStats[secondaryStat] = 75;
      pointChanged = true;
    }
    if (pointChanged) {
      setPointStats(newPointStats);
    }

    // manualStats minimums
    const newManualStats = { ...manualStats };
    let manualChanged = false;
    if (primaryStat && newManualStats[primaryStat] < 90) {
      newManualStats[primaryStat] = 90;
      manualChanged = true;
    }
    if (secondaryStat && newManualStats[secondaryStat] < 75) {
      newManualStats[secondaryStat] = 75;
      manualChanged = true;
    }
    if (manualChanged) {
      setManualStats(newManualStats);
    }

    // sync characterData.stats if needed
    if (pointChanged || manualChanged) {
      setCharacterData(prev => {
        let finalStats = prev.stats || {};
        if (prev.statsMethod === 'points' && pointChanged) {
          finalStats = newPointStats;
        } else if (prev.statsMethod === 'manual' && manualChanged) {
          finalStats = newManualStats;
        }
        return {
          ...prev,
          statsPointBuy: pointChanged ? newPointStats : prev.statsPointBuy,
          statsManual: manualChanged ? newManualStats : prev.statsManual,
          stats: finalStats
        };
      });
    }
  }, [primaryStat, secondaryStat, method]);

  const poolTotal = rolls.reduce((sum, r) => sum + r.val, 0);

  return (
    <div>
      <AnagraficaReadOnlyBox characterData={characterData} />
      {/* ── POPOLO + REQUISITI AFFIANCATI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {characterData.race ? (
          <div className="p-4 border rounded" style={{ backgroundColor: 'var(--theme-race-bg)', borderColor: 'var(--theme-race-border)', color: 'var(--theme-race-text)' }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-race-text)' }}>Popolo Selezionato</span>
            <h3 className="font-bold m-0" style={{ fontSize: '1.2rem', marginTop: '0.25rem', color: 'var(--theme-race-text)' }}>{characterData.race.nome}</h3>
            {characterData.race.nome === 'Elfi Noldor' && (
              <p className="text-xs font-semibold mt-1 bg-white/20 px-2 py-1 rounded inline-block text-[11px]">
                ⚠️ <strong>Vincolo Prontezza (PR):</strong> Deve essere attribuito il punteggio più alto.
              </p>
            )}
            {characterData.race.nome === 'Elfi Sindar' && (
              <p className="text-xs font-semibold mt-1 bg-white/20 px-2 py-1 rounded inline-block text-[11px]">
                ⚠️ <strong>Vincolo Prontezza (PR):</strong> Deve essere attribuito uno dei due punteggi più alti.
              </p>
            )}
            {characterData.race.nome === 'Elfi Silvani' && (
              <p className="text-xs font-semibold mt-1 bg-white/20 px-2 py-1 rounded inline-block text-[11px]">
                ⚠️ <strong>Vincolo Prontezza (PR):</strong> Deve essere attribuito uno dei tre punteggi più alti.
              </p>
            )}
            <div className="text-sm font-medium mt-2" style={{ color: 'var(--theme-race-text)', opacity: 0.85 }}>
              {characterData.race?.categoria || characterData.race?.['note (umani/non umani)']}
            </div>
          </div>
        ) : (
          <div className="p-4 border rounded" style={{ backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', color: '#6b7280' }}>
            <span className="text-xs font-bold uppercase tracking-wider">Popolo Selezionato</span>
            <div className="mt-2 text-sm">Nessun popolo selezionato</div>
          </div>
        )}

        <div className="p-4 rounded-md border" style={{ backgroundColor: 'var(--theme-profession-bg)', borderColor: 'var(--theme-profession-border)', color: 'var(--theme-profession-text)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--theme-profession-text)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requisiti della Professione: {prof ? prof.professione : 'Nessuna'}</h3>
          <div className="flex flex-col gap-2">
            <span className="px-3 py-1 rounded font-medium text-sm" style={{ backgroundColor: 'rgba(107, 33, 168, 0.1)', color: 'var(--theme-profession-text)' }}>Primaria: {primaryStat || '-'} (Minimo 90)</span>
            <span className="px-3 py-1 rounded font-medium text-sm" style={{ backgroundColor: 'rgba(107, 33, 168, 0.05)', color: 'var(--theme-profession-text)' }}>Secondaria: {secondaryStat || '-'} (Minimo 75)</span>
          </div>
        </div>
      </div>

      {/* ── 3 PULSANTI METODO SU 3 COLONNE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn btn-method-classic${method !== 'classic' ? ' inactive' : ''}`}
          onClick={() => handleMethodChange('classic')}
        >
          Metodo Classico (Tiri D100)
        </button>
        <button
          className={`btn btn-method-points${method !== 'points' ? ' inactive' : ''}`}
          onClick={() => handleMethodChange('points')}
        >
          Metodo a Punti ({maxPoints} PT)
        </button>
        <button
          className={`btn btn-method-manual${method !== 'manual' ? ' inactive' : ''}`}
          onClick={() => handleMethodChange('manual')}
        >
          Inserimento Diretto / Libero
        </button>
      </div>

      {method === 'classic' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{padding: '1rem'}}>
            <div>
              <h3 className="card-title" style={{fontSize: '1rem', margin: 0}}>Assegnazione Tiri</h3>
              {rolls.length > 0 && <p className="text-sm text-muted mt-1">Totale Pool: <strong className="text-primary-color">{poolTotal}</strong></p>}
            </div>
            <button className="btn btn-primary" onClick={generateRolls}>Tira 6D100</button>
          </div>
          <div className="card-body">
            {rolls.length === 0 ? (
              <p className="text-center text-muted">Clicca su "Tira 6D100" per iniziare.</p>
            ) : (
              <div>
                <div className="flex gap-2 mb-6 justify-center">
                  {rolls.map((r, i) => {
                    const isAssigned = Object.values(assignments).includes(r.id);
                    return (
                      <div key={r.id} className={`p-3 rounded border font-bold text-lg ${isAssigned ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-primary-light border-primary text-primary-color'}`}>
                        {r.val}
                      </div>
                    )
                  })}
                </div>

                <div className="grid-2">
                  {STAT_KEYS.map(key => {
                    const assignedRollId = assignments[key];
                    const rollObj = rolls.find(r => r.id === assignedRollId);
                    const finalVal = calculateFinalStat(key, rollObj?.val);
                    const isAdjusted = finalVal !== rollObj?.val;
                    const bonus = finalVal ? getBonus(finalVal) : 0;

                    return (
                      <div key={key} className="flex items-center justify-between p-3 border rounded bg-white">
                        <div className="flex flex-col">
                          <span className="font-semibold">{STAT_NAMES[key]} ({key})</span>
                          {key === primaryStat && <span className="text-xs font-bold text-primary-color">Primaria</span>}
                          {key === secondaryStat && <span className="text-xs font-bold text-gray-500">Secondaria</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          {isAdjusted && <span className="text-xs text-orange-500 font-medium">Forzato a {finalVal}</span>}
                          {finalVal && (
                            <span className={`text-sm font-bold px-2 py-1 rounded ${bonus > 0 ? 'bg-green-100 text-green-800' : bonus < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                              {bonus > 0 ? `+${bonus}` : bonus}
                            </span>
                          )}
                          <select 
                            className="p-2 border rounded font-bold"
                            value={assignedRollId || ''}
                            onChange={(e) => handleAssign(key, e.target.value)}
                          >
                            <option value="">- Tiro -</option>
                            {rolls.map(r => {
                              const isTaken = Object.values(assignments).includes(r.id) && assignments[key] !== r.id;
                              return (
                                <option key={r.id} value={r.id} disabled={isTaken}>
                                  {r.val}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {method === 'points' && (
        <div className="card" style={{ borderColor: 'var(--theme-stats-border)' }}>
          <div className="card-header flex flex-col md:flex-row justify-between items-center gap-4" style={{padding: '1rem', backgroundColor: 'var(--theme-stats-bg)', borderBottomColor: 'var(--theme-stats-border)'}}>
            <div className="flex items-center gap-4">
              <h3 className="card-title m-0" style={{fontSize: '1rem', color: 'var(--theme-stats-text)'}}>Distribuzione Punti</h3>
              <div className="flex items-center gap-2 text-sm bg-white p-1 px-3 rounded-full border" style={{ borderColor: 'var(--theme-stats-border)' }}>
                <span className="font-medium" style={{ color: 'var(--theme-stats-text)' }}>Max Pool:</span>
                <input 
                  type="number" 
                  value={maxPoints} 
                  onChange={(e) => handleMaxPointsChange(e.target.value)} 
                  className="w-16 text-center font-bold bg-transparent outline-none"
                  style={{ border: 'none', borderBottom: '1px solid var(--theme-stats-border)', color: 'var(--theme-stats-text)' }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: remainingPoints < 0 ? 'var(--danger-color)' : 'var(--theme-stats-text)' }}>{remainingPoints}</div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-stats-text)' }}>Punti Rimanenti</div>
            </div>
          </div>
          <div className="card-body">
            <div className="grid-2">
              {STAT_KEYS.map(key => {
                const val = pointStats[key];
                const cost = calculateStatCost(val);
                const nextCost = val < 100 ? calculateStatCost(val + 1) - cost : 0;
                const bonus = getBonus(val);
                
                const isMin = val === 20 || (key === primaryStat && val === 90) || (key === secondaryStat && val === 75);
                const isMax = val === 100 || remainingPoints < nextCost;

                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded bg-white">
                    <div className="flex flex-col">
                      <span className="font-semibold">{STAT_NAMES[key]}</span>
                      {key === primaryStat && <span className="text-xs font-bold" style={{ color: 'var(--theme-stats-text)' }}>Primaria</span>}
                      {key === secondaryStat && <span className="text-xs font-bold text-gray-500">Secondaria</span>}
                      <span className="text-xs text-muted mt-1">Costo: {cost} pt</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold px-2 py-1 rounded ${bonus > 0 ? 'bg-green-100 text-green-800' : bonus < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {bonus > 0 ? `+${bonus}` : bonus}
                      </span>
                      <button 
                        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${isMin ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        onClick={() => handlePointChange(key, -1)}
                        disabled={isMin}
                      >-</button>
                      <div className="w-10 text-center font-bold text-xl">{val}</div>
                      <button 
                        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${isMax ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                        style={isMax ? {} : { backgroundColor: 'var(--theme-stats-bg)', color: 'var(--theme-stats-text)' }}
                        onClick={() => handlePointChange(key, 1)}
                        disabled={isMax}
                        title={val < 100 ? `Costo prossimo punto: ${nextCost}` : 'Massimo raggiunto'}
                      >+</button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
              <span className="text-xs text-muted italic self-center mr-4">I punteggi vengono salvati automaticamente.</span>
            </div>
          </div>
        </div>
      )}

      {method === 'manual' && (
        <div className="card" style={{ borderColor: 'var(--theme-stats-border)' }}>
          <div className="card-header border-b" style={{padding: '1rem', backgroundColor: 'var(--theme-stats-bg)', borderBottomColor: 'var(--theme-stats-border)'}}>
            <h3 className="card-title m-0" style={{fontSize: '1rem', color: 'var(--theme-stats-text)'}}>Inserimento Manuale delle Caratteristiche</h3>
            <p className="text-xs m-0 mt-1" style={{ color: 'var(--theme-stats-text)', opacity: 0.85 }}>Imposta liberamente i valori delle caratteristiche. I minimi di professione vengono applicati automaticamente.</p>
          </div>
          <div className="card-body">
            <div className="grid-2">
              {STAT_KEYS.map(key => {
                const val = manualStats[key];
                const bonus = getBonus(val);
                const isMin = val === 20 || (key === primaryStat && val === 90) || (key === secondaryStat && val === 75);
                const isMax = val === 100;

                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded bg-white">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{STAT_NAMES[key]} ({key})</span>
                      {key === primaryStat && <span className="text-xs font-bold text-primary-color">Primaria (Min 90)</span>}
                      {key === secondaryStat && <span className="text-xs font-bold text-gray-500">Secondaria (Min 75)</span>}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold px-2 py-1 rounded ${bonus > 0 ? 'bg-green-100 text-green-800' : bonus < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {bonus > 0 ? `+${bonus}` : bonus}
                      </span>
                      <button 
                        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${isMin ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        onClick={() => handleManualChange(key, val - 1)}
                        disabled={isMin}
                      >-</button>
                      <input 
                        type="number" 
                        value={val} 
                        onChange={(e) => handleManualChange(key, e.target.value)} 
                        className="w-16 p-1 border rounded text-center font-bold text-lg"
                        min={20}
                        max={100}
                      />
                      <button 
                        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${isMax ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary-light hover:bg-blue-200 text-primary-color'}`}
                        onClick={() => handleManualChange(key, val + 1)}
                        disabled={isMax}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Riepilogo e Modifica Finale GM */}
      {(() => {
        const hasGeneratedStats = STAT_KEYS.every(key => characterData.stats && characterData.stats[key] !== undefined && characterData.stats[key] !== null);
        if (!hasGeneratedStats) return null;

        const finalPoolTotal = STAT_KEYS.reduce((sum, key) => sum + (characterData.stats[key] || 0), 0);

        const handleFinalStatTweak = (key, newVal) => {
          let parsed = Math.min(100, Math.max(20, parseInt(newVal) || 20));
          if (key === primaryStat && parsed < 90) parsed = 90;
          if (key === secondaryStat && parsed < 75) parsed = 75;

          if (method === 'points') {
            const updatedPoints = { ...pointStats, [key]: parsed };
            setPointStats(updatedPoints);
            setCharacterData(prev => ({
              ...prev,
              statsPointBuy: updatedPoints,
              stats: updatedPoints
            }));
          } else if (method === 'manual') {
            const updatedManual = { ...manualStats, [key]: parsed };
            setManualStats(updatedManual);
            setCharacterData(prev => ({
              ...prev,
              statsManual: updatedManual,
              stats: updatedManual
            }));
          } else {
            setCharacterData(prev => ({
              ...prev,
              stats: {
                ...prev.stats,
                [key]: parsed
              }
            }));
          }
        };

        return (
          <div className="card mt-8" style={{ borderColor: 'var(--theme-stats-border)' }}>
            <div className="card-header border-b flex justify-between items-center" style={{padding: '1rem', backgroundColor: 'var(--theme-stats-bg)', borderBottomColor: 'var(--theme-stats-border)'}}>
              <div>
                <h3 className="card-title m-0" style={{fontSize: '1.1rem', color: 'var(--theme-stats-text)'}}>Riepilogo delle Caratteristiche & Modifiche GM</h3>
                <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--theme-stats-text)', opacity: 0.85 }}>Qui puoi visualizzare e modificare ulteriormente i valori delle caratteristiche finali. Totale Pool: <strong style={{ color: 'var(--theme-stats-text)' }}>{finalPoolTotal}</strong></p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={{ backgroundColor: 'var(--theme-stats-bg)', color: 'var(--theme-stats-text)', borderColor: 'var(--theme-stats-border)' }}>
                Punteggi Modificabili
              </span>
            </div>
            <div className="card-body">
              <div className="grid-2">
                {STAT_KEYS.map(key => {
                  const val = characterData.stats[key];
                  const bonus = val ? getBonus(val) : 0;
                  const isMin = val === 20 || (key === primaryStat && val === 90) || (key === secondaryStat && val === 75);
                  const isMax = val === 100;

                  return (
                    <div key={key} className="flex items-center justify-between p-3 border border-green-100 rounded bg-white shadow-sm">
                      <div className="flex flex-col">
                        {(() => {
                          const isPR = key === 'PR';
                          const elfConstraint = isPR ? checkElfConstraint(characterData.race?.nome || characterData.race?.popolo, characterData.stats) : null;
                          let labelStyle = {};
                          let constraintBadge = null;

                          if (elfConstraint && elfConstraint.show) {
                            if (elfConstraint.respected) {
                              labelStyle = { color: '#10b981', fontWeight: 'bold' };
                              constraintBadge = (
                                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                  Vincolo PR Rispettato
                                </span>
                              );
                            } else {
                              labelStyle = { color: '#ef4444', fontWeight: 'bold' };
                              constraintBadge = (
                                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                  Vincolo PR NON Rispettato
                                </span>
                              );
                            }
                          }

                          return (
                            <>
                              <span className="font-semibold text-gray-800" style={labelStyle}>
                                {STAT_NAMES[key]} ({key}):
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {key === primaryStat && <span className="text-xs font-bold text-primary-color">Primaria (Min 90)</span>}
                                {key === secondaryStat && <span className="text-xs font-bold text-gray-500">Secondaria (Min 75)</span>}
                                {constraintBadge}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-3">
                        {val && (
                          <span className={`text-sm font-bold px-2 py-1 rounded ${bonus > 0 ? 'bg-green-100 text-green-800' : bonus < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            Naturale: {bonus > 0 ? `+${bonus}` : bonus}
                          </span>
                        )}

                        <button 
                          className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${isMin ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                          onClick={() => handleFinalStatTweak(key, val - 1)}
                          disabled={isMin}
                        >
                          -
                        </button>

                        <input 
                          type="number"
                          className="w-16 p-1 border rounded text-center font-bold text-lg"
                          value={val || ''}
                          onChange={(e) => handleFinalStatTweak(key, e.target.value)}
                          min={20}
                          max={100}
                        />

                        <button 
                          className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${isMax ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary-light hover:bg-blue-200 text-primary-color'}`}
                          onClick={() => handleFinalStatTweak(key, val + 1)}
                          disabled={isMax}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
