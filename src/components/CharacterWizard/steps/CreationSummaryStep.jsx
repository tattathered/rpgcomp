import { useState, useMemo, useEffect } from 'react';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import gradiLingue from '../../../data/TGP_1-gradi_conoscenze_lingue.json';
import { getSpellLimitInfo, getSpellsForList } from '../../../utils/magicHelpers';
import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getFinalStats,
  fmt,
  getCharacterHpTot
} from '../../../utils/skillHelpers';
import WalletBox from '../shared/WalletBox';
import AnagraficaReadOnlyBox from '../shared/AnagraficaReadOnlyBox';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STAT_KEYS = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
const STAT_NAMES = { FR: 'Forza', AG: 'Agilità', CO: 'Costituzione', IN: 'Intelligenza', IT: 'Intuizione', PR: 'Presenza' };

const getMaxRanks = (skillName) => {
  const limits = {
    'nessuna armatura': 2,
    'cuoio grezzo': 3,
    'cuoio rinforzato': 5,
    'corazza di maglia': 7,
    'corazza di piastre': 9
  };
  return limits[skillName.toLowerCase()] || null;
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ emoji, title, color = '#1e3a8a', bg = '#eff6ff', border = '#bfdbfe' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', background: bg, border: `1px solid ${border}`, borderRadius: '0.6rem 0.6rem 0 0', borderBottom: 'none', marginBottom: 0 }}>
    <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
    <h4 style={{ margin: 0, color, fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
  </div>
);

const SectionCard = ({ emoji, title, color, bg, border, children }) => (
  <div style={{ border: `1px solid ${border || '#e5e7eb'}`, borderRadius: '0.6rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
    <SectionHeader emoji={emoji} title={title} color={color} bg={bg} border={border} />
    <div style={{ background: '#fff', padding: '1rem' }}>
      {children}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function CreationSummaryStep({ characterData, setCharacterData }) {
  const race = characterData.race;
  const profession = characterData.profession;
  const stats = characterData.stats || {};
  const magicRealm = characterData.magicRealm || '—';
  const bgData = characterData.background || { languages: {}, options: [] };
  const languages = bgData.languages || {};
  const bgOptions = bgData.options || [];
  const bgModifiers = bgData.compiledModifiers || { statsBonus: {}, skillBgRanks: {}, secondarySkills: {}, gold: 0 };

  // ── Compute final stats (base + bg bonus) and lookup bonuses ──
  const finalStats = useMemo(() => {
    return getFinalStats(stats, race, bgModifiers);
  }, [stats, race, bgModifiers]);

  // ── Gestione Aspetto (PR) ──
  const prBonus = finalStats['PR']?.bonusTot || 0;
  const aspetto = characterData.aspetto || null;

  const handleRollAspetto = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    const total = roll + prBonus;
    setCharacterData(prev => ({ ...prev, aspetto: total }));
  };

  const handleManualAspetto = (val) => {
    setCharacterData(prev => ({ ...prev, aspetto: val }));
  };

  // ── Gestione Punti Ferita (HP) ──
  const coBonus = finalStats['CO']?.bonusTot || 0;
  const level1HpRoll = characterData.level1HpRoll ?? null;
  const hpD10Modifier = bgModifiers.hpD10Modifier || 0;

  // ── Validazione Step 8 ──
  useEffect(() => {
    let err = null;
    if (aspetto === null) {
      err = "Devi determinare l'Aspetto del personaggio prima di procedere.";
    } else if (level1HpRoll === null) {
      err = "Devi calcolare i Punti Ferita (HP) del personaggio prima di procedere.";
    }

    setCharacterData(prev => {
      if (prev.stepErrors?.creation_summary === err) {
        return prev;
      }
      return {
        ...prev,
        stepErrors: {
          ...(prev.stepErrors || {}),
          creation_summary: err
        }
      };
    });
  }, [aspetto, level1HpRoll, setCharacterData]);

  // ── Compute final skills ──
  const categories = [...new Set(primarySkillsList.map(s => s.categoria))];
  const skillsBase = characterData.skills || {};

  const finalSkills = useMemo(() => {
    const primarySkillsSpecialBonus = bgModifiers.primarySkillsSpecialBonus || {};
    const result = {};
    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const base = skillsBase[name] || {};
      const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';
      const bgExtra = isCogliereAlleSpalle ? 0 : (bgModifiers.skillBgRanks?.[name] || 0);
      const adRanks = isCogliereAlleSpalle ? 0 : (base.adolescenceRanks || 0);
      const profRanks = isCogliereAlleSpalle ? 0 : (base.professionRanks || 0);
      const tgp4Ranks = base.tgp4Ranks || 0;
      const totalRanks = adRanks + profRanks + tgp4Ranks + bgExtra;

      // Stat bonus for this skill
      const carattSiglaMatch = (sk['valore iniziale'] || '').match(/([A-Z]{2})$/);
      const carattSigla = carattSiglaMatch ? carattSiglaMatch[1] : '';
      const carattBonus = isCogliereAlleSpalle ? 0 : (carattSigla ? finalStats[carattSigla]?.bonusTot || 0 : 0);

      const bonusGradi = getRanksBonus(name, totalRanks);
      const ingombroBonus = getIngombroBonus(name);
      const specialBonus = primarySkillsSpecialBonus[name] || 0;

      let totalBonus;
      if (typeof bonusGradi === 'number') {
        totalBonus = bonusGradi + carattBonus + specialBonus + (ingombroBonus ?? 0);
      } else {
        totalBonus = bonusGradi; // e.g. "3d10"
      }

      result[name] = {
        category: sk.categoria,
        adRanks, profRanks, tgp4Ranks, bgExtra, totalRanks,
        carattSigla, carattBonus, bonusGradi, ingombroBonus, specialBonus, totalBonus,
        valoreIniziale: sk['valore iniziale'],
      };
    });
    return result;
  }, [skillsBase, finalStats, bgModifiers]);

  const rfRanks = finalSkills['Resistenza fisica']?.totalRanks || 0;
  const specialRfBonus = bgModifiers.primarySkillsSpecialBonus?.['Resistenza fisica'] || bgModifiers.primarySkillsSpecialBonus?.['resistenza fisica'] || 0;
  const specialHpBonus = (rfRanks * hpD10Modifier) + specialRfBonus;
  const finalHp = level1HpRoll !== null ? getCharacterHpTot(characterData) : null;

  const handleRollHp = () => {
    let sum = 0;
    for (let i = 0; i < rfRanks; i++) {
      sum += Math.floor(Math.random() * 10) + 1;
    }
    setCharacterData(prev => ({ ...prev, level1HpRoll: sum }));
  };

  const handleManualHp = (val) => {
    setCharacterData(prev => ({ ...prev, level1HpRoll: val }));
  };

  if (!race || !profession) {
    return (
      <div className="p-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 bg-gray-50" style={{ minHeight: 300 }}>
        Completa gli step precedenti per visualizzare il riepilogo.
      </div>
    );
  }

  // ── Sort languages ──
  const langEntries = Object.entries(languages).sort((a, b) => {
    const totB = (b[1].base || 0) + (b[1].added || 0);
    const totA = (a[1].base || 0) + (a[1].added || 0);
    return totB - totA;
  });

  // ── Format background option label ──
  const formatBgOption = (opt, idx) => {
    let detail = '';
    if (opt.category === 'Gradi delle abilità') {
      detail = opt.subChoice === 'A'
        ? `+2 gradi | ${opt.skillName || '—'}`
        : `+5 gradi secondaria | ${opt.skillName || '—'}`;
    } else if (opt.category === 'Aumento delle caratteristiche') {
      detail = opt.subChoice === 'A'
        ? `+2 | ${opt.stats?.[0] || '—'}`
        : `+1 ciascuna | ${opt.stats?.join(', ') || '—'}`;
    } else if (opt.category === 'Lingue') {
      detail = `Grado 5 | ${opt.skillName || '—'}`;
    } else if (opt.category === 'abilità speciali') {
      if (opt.oggetto === 'as1' || (opt.roll >= 1 && opt.roll <= 50)) {
        detail = `Bonus abilità +5 | ${opt.skillName || '—'}`;
      } else if (opt.oggetto === 'as2' || (opt.roll >= 51 && opt.roll <= 55)) {
        detail = `Bonus abilità +15 | ${opt.skillName || '—'}`;
      } else if (opt.oggetto === 'as6' || (opt.roll >= 71 && opt.roll <= 75)) {
        detail = `Esperto Magia | Lista: ${opt.skillName || '—'}`;
      } else {
        detail = opt.calculatedText || opt.oggetto || '—';
        if (opt.customNote) {
          detail += ` | ${opt.customNote}`;
        }
      }
    } else if (opt.category === 'oggetti speciali') {
      detail = `${opt.oggetto || '—'}`;
      if (opt.customNote) {
        detail += ` | ${opt.customNote}`;
      }
    } else if (opt.category === "denaro: monete d'oro") {
      detail = `${opt.calculatedMO || 0} MO (tiro ${opt.roll})`;
    } else if (opt.category === 'Incantesimi o Punti Magia' || opt.category === 'Lista incantesimi aggiuntiva') {
      detail = `Lista: ${opt.skillName || '—'}`;
      if (opt.customNote) {
        detail += ` | ${opt.customNote}`;
      }
    }
    return { idx: idx + 1, category: opt.category, detail };
  };

  // ── Combine Spell Lists ──
  const spellListAllocations = characterData.spellListAllocations || {};
  const bgSpellLists = bgModifiers.bgSpellLists || [];
  
  const allLearnedLists = new Set([
    ...Object.keys(spellListAllocations),
    ...bgSpellLists
  ]);
  const learnedListsArray = Array.from(allLearnedLists).sort();
  const spellLimitStr = profession ? getSpellLimitInfo(profession.professione) : null;

  const getMagicRealmSummaryStep8 = () => {
    if (learnedListsArray.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {learnedListsArray.map((name, i) => (
            <div key={i}>Lista incantesimi {name} appresa.</div>
          ))}
        </div>
      );
    }
    const inheritedChance = characterData.spellListChanceAccumulated !== undefined 
      ? characterData.spellListChanceAccumulated 
      : 0;
    return <div>Nessuna lista incantesimi appresa - Credito ereditato: {inheritedChance}%</div>;
  };

  // ── TR bonuses ──
  const trKeys = [
    { key: 'bonus a TR-ESS', label: 'TR Essenza', statKey: 'IN' },
    { key: 'bonus a TR-FLS', label: 'TR Flusso', statKey: 'IT' },
    { key: 'bonus a TR-VEL', label: 'TR Veleno', statKey: 'CO' },
    { key: 'bonus a TR-MAL', label: 'TR Malattia', statKey: 'CO' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <AnagraficaReadOnlyBox characterData={characterData} simple={false} />

      {/* ── HEADER BANNER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-race-border)', borderRadius: '0.6rem', background: 'var(--theme-race-bg)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-race-text)' }}>Popolo</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-race-text)', marginTop: '0.2rem' }}>{race.popolo}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-race-text)', opacity: 0.85, marginTop: '0.15rem' }}>{race['note (umani/non umani)']}</div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-profession-border)', borderRadius: '0.6rem', background: 'var(--theme-profession-bg)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-profession-text)' }}>Professione</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-profession-text)', marginTop: '0.2rem' }}>{profession.professione}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-profession-text)', opacity: 0.85, marginTop: '0.15rem' }}>
            Prim.: {profession.primaria} | Sec.: {profession.secondaria}
          </div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-spell-lists-border)', borderRadius: '0.6rem', background: 'var(--theme-spell-lists-bg)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-spell-lists-text)' }}>Reame Magico</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-spell-lists-text)', marginTop: '0.2rem' }}>{magicRealm}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-spell-lists-text)', opacity: 0.85, marginTop: '0.15rem', fontWeight: 500 }}>
            {getMagicRealmSummaryStep8()}
          </div>
        </div>
      </div>

      {/* ── CARATTERISTICHE ── */}
      <SectionCard emoji="🎯" title="Caratteristiche & Bonus" color="var(--theme-stats-text)" bg="var(--theme-stats-bg)" border="var(--theme-stats-border)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--theme-stats-border)', background: 'var(--theme-stats-bg)' }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--theme-stats-text)', fontWeight: 700 }}>Caratteristica</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>Statistiche</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: '#7e22ce', fontSize: '0.75rem' }}>Bonus BG</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: '#065f46', fontWeight: 700, fontSize: '0.75rem' }}>Bonus naturale</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>Bonus popolo</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#065f46', fontWeight: 700, fontSize: '0.8rem' }}>Bonus tot.</th>
              </tr>
            </thead>
            <tbody>
              {STAT_KEYS.map(k => {
                const s = finalStats[k];
                return (
                  <tr key={k} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{STAT_NAMES[k]} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({k})</span></td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: '#374151' }}>
                      <span style={{ fontWeight: 600 }}>{s.raw}</span>
                      {s.bgMod !== 0 && (
                        <span style={{ fontSize: '0.7rem', color: '#7e22ce', display: 'block', marginTop: '0.1rem' }}>
                          (tot: {s.statScore})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: s.bgMod !== 0 ? '#7e22ce' : '#9ca3af', fontWeight: s.bgMod !== 0 ? 700 : 400 }}>
                      {s.bgMod !== 0 ? fmt(s.bgMod) : '—'}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: s.bonusNaturale >= 0 ? '#15803d' : '#dc2626' }}>
                      {fmt(s.bonusNaturale)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: s.raceMod !== 0 ? '#1d4ed8' : '#9ca3af', fontWeight: s.raceMod !== 0 ? 600 : 400 }}>
                      {s.raceMod !== 0 ? fmt(s.raceMod) : '—'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 900, fontSize: '1.05rem', color: s.bonusTot >= 0 ? '#15803d' : '#dc2626' }}>
                      {fmt(s.bonusTot)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Tiri Resistenza */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--theme-tr-text)', marginBottom: '0.5rem' }}>Tiri Resistenza (TR):</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {trKeys.map(tr => {
              const raceTrBonus = parseBonusValue(race[tr.key] || 0);
              const statBonus = finalStats[tr.statKey]?.bonusTot || 0;
              const specialBonus = bgModifiers.trSpecialBonus || 0;
              const totalTrBonus = raceTrBonus + statBonus + specialBonus;
              return (
                <div key={tr.key} style={{ padding: '0.3rem 0.75rem', background: 'var(--theme-tr-bg)', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--theme-tr-text)', border: '1px solid var(--theme-tr-border)' }}>
                  <span style={{ color: 'var(--theme-tr-text)', fontWeight: 700 }}>{tr.label}:</span> {fmt(totalTrBonus)} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--theme-tr-text)', opacity: 0.85 }}>({fmt(raceTrBonus)} Popolo, {fmt(statBonus)} {tr.statKey}{specialBonus > 0 ? `, ${fmt(specialBonus)} Speciale` : ''})</span>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* ── ASPETTO ── */}
      <SectionCard 
        emoji="✨" 
        title="Aspetto" 
        color="var(--theme-appearance-text)" 
        bg="var(--theme-appearance-bg)" 
        border="var(--theme-appearance-border)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {aspetto === null ? (
            <div style={{ background: 'var(--theme-appearance-bg)', border: '1px solid var(--theme-appearance-border)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
              <p style={{ color: 'var(--theme-appearance-text)', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                Tira per determinare l'Aspetto fisico (tiro 1d100 + bonus Presenza (PR) di {fmt(prBonus)}).
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleRollAspetto}
                  className="btn btn-primary"
                  style={{ background: 'var(--theme-appearance-text)', borderColor: 'var(--theme-appearance-text)', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Tira 1d100
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>oppure inserisci manuale:</span>
                <input
                  type="number"
                  placeholder="Valore"
                  onChange={(e) => handleManualAspetto(e.target.value === '' ? null : parseInt(e.target.value))}
                  style={{ width: '4rem', padding: '0.3rem', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--theme-appearance-bg)', border: '1px solid var(--theme-appearance-border)', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--theme-appearance-text)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>
                {aspetto}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--theme-appearance-text)' }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Aspetto Calcolato: {aspetto}</p>
                <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                  Tiro calcolato come 1d100 + bonus Presenza (PR). Riflette il carisma e l'aspetto estetico.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCharacterData(prev => ({ ...prev, aspetto: null }))}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
              >
                Ricalcola / Cambia
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── PUNTI FERITA (HP) ── */}
      <SectionCard 
        emoji="❤️" 
        title="Punti Ferita (HP)" 
        color="#b91c1c" 
        bg="#fef2f2" 
        border="#fca5a5"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {level1HpRoll === null ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
              <p style={{ color: '#991b1b', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                Calcola i Punti Ferita (HP) iniziali.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem', background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                <div><strong>Base:</strong> +5</div>
                <div><strong>Bonus Costituzione (CO):</strong> {fmt(coBonus)}</div>
                <div><strong>Gradi Resistenza Fisica:</strong> {rfRanks} {rfRanks > 0 ? `(${rfRanks}d10)` : '(0d10)'}</div>
                {specialHpBonus > 0 && (
                  <div><strong>Modificatori Speciali:</strong> {fmt(specialHpBonus)}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleRollHp}
                  className="btn btn-primary"
                  style={{ background: '#b91c1c', borderColor: '#b91c1c', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  {rfRanks > 0 ? `Tira ${rfRanks}d10` : 'Registra PF Iniziali'}
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>oppure inserisci manuale:</span>
                <input
                  type="number"
                  placeholder="Valore"
                  min="0"
                  onChange={(e) => handleManualHp(e.target.value === '' ? null : parseInt(e.target.value))}
                  style={{ width: '4rem', padding: '0.3rem', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#b91c1c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>
                {finalHp}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Punti Ferita Iniziali (Liv. 1): {finalHp}</p>
                <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                  Calcolo: 5 (base) + {fmt(coBonus)} (CO) + {level1HpRoll} (tiro {rfRanks}d10) {specialHpBonus > 0 ? `+ ${specialHpBonus} (speciali)` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCharacterData(prev => ({ ...prev, level1HpRoll: null }))}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
              >
                Ricalcola / Cambia
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── LISTE INCANTESIMI ── */}
      <SectionCard emoji="✨" title="Liste Incantesimi" color="var(--theme-spell-lists-text)" bg="var(--theme-spell-lists-bg)" border="var(--theme-spell-lists-border)">
        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--theme-spell-lists-text)' }}>
          <span style={{ fontWeight: 600 }}>Reame:</span> {magicRealm} | <span style={{ fontWeight: 600 }}>Ammesse:</span> {profession['liste incantesimi'] || '—'} | <span style={{ fontWeight: 600 }}>Limite:</span> {profession['limite incantesimi'] || 'nessun limite'}
        </div>
        
        {learnedListsArray.length === 0 ? (
          <div style={{ padding: '0.75rem', background: 'var(--theme-spell-lists-bg)', border: '1px dashed var(--theme-spell-lists-border)', borderRadius: '0.5rem', color: 'var(--theme-spell-lists-text)', fontSize: '0.85rem', textAlign: 'center' }}>
            Nessuna lista di incantesimi appresa.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {learnedListsArray.map(listName => {
              const spells = getSpellsForList(listName, spellLimitStr);
              const isFromTgp4 = spellListAllocations[listName] !== undefined;
              const isFromBg = bgSpellLists.includes(listName);
              
              let sourceText = [];
              if (isFromTgp4) sourceText.push(spellListAllocations[listName]); // 'Adolescenza' or 'Apprendistato Liv. 1'
              if (isFromBg) sourceText.push(`Background`);

              return (
                <div key={listName} style={{ border: '1px solid var(--theme-spell-lists-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--theme-spell-lists-bg)', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--theme-spell-lists-text)' }}>{listName}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'var(--theme-spell-lists-text)', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '99px' }}>
                      {sourceText.join(' + ')}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'rgba(254, 226, 226, 0.3)', borderBottom: '1px solid var(--theme-spell-lists-border)' }}>
                        <tr>
                          <th style={{ padding: '0.4rem 1rem', textAlign: 'center', color: 'var(--theme-spell-lists-text)', fontWeight: 600, width: '10%' }}>Liv.</th>
                          <th style={{ padding: '0.4rem 1rem', textAlign: 'left', color: 'var(--theme-spell-lists-text)', fontWeight: 600, width: '25%' }}>Incantesimo</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: 'var(--theme-spell-lists-text)', fontWeight: 600, width: '10%' }}>Area/Tipo</th>
                          <th style={{ padding: '0.4rem 1rem', textAlign: 'left', color: 'var(--theme-spell-lists-text)', fontWeight: 600 }}>Descrizione</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spells.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>Nessun incantesimo disponibile per questa lista con l'attuale limite di livello.</td>
                          </tr>
                        ) : (
                          spells.map((s, i) => (
                            <tr key={i} style={{ borderBottom: i === spells.length - 1 ? 'none' : '1px solid var(--theme-spell-lists-border)' }}>
                              <td style={{ padding: '0.4rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--theme-spell-lists-text)', background: 'rgba(254, 226, 226, 0.1)' }}>{s.livello}</td>
                              <td style={{ padding: '0.4rem 1rem', fontWeight: 600, color: '#374151' }}>{s.nome_incantesimo}</td>
                              <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>{s.tipo_incantesimo || '—'}</td>
                              <td style={{ padding: '0.4rem 1rem', color: '#4b5563', fontSize: '0.75rem', lineHeight: '1.2' }}>{s.descrizione_incantesimo}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── ABILITÀ PRIMARIE ── */}
      <SectionCard emoji="⚔️" title="Abilità Primarie" color="var(--theme-primary-skills-text)" bg="var(--theme-primary-skills-bg)" border="var(--theme-primary-skills-border)">
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem', marginTop: 0 }}>
          Include gradi Adolescenza + Professione (TB_6) + Sviluppo Liv. 1 (TGP_4) + eventuali Bonus Background.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categories.map(cat => {
            const catSkills = primarySkillsList.filter(s => s.categoria === cat);
            if (catSkills.length === 0) return null;
            return (
              <div key={cat} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {cat}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <tr>
                        <th style={{ padding: '0.45rem 1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Abilità</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>G. adolescenza</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>G. bonus prof.</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>G. svil. prof.</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#7e22ce', fontWeight: 700 }}>G. background</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#1e3a8a', fontWeight: 700 }}>G. TOTALE</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontWeight: 600 }}>Bonus sviluppo</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>Bonus caratt.</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontWeight: 600 }}>Speciale</th>
                        <th style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#1e3a8a', fontWeight: 900 }}>Bonus TOTALE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catSkills.map(sk => {
                        const s = finalSkills[sk.nome];
                        if (!s) return null;
                        const isMM = cat === 'Abilità di Movimento e Manovra';
                        const hasIngombro = s.ingombroBonus !== null;
                        const specialBonus = s.specialBonus || 0;
                        const hasSpecialBonus = specialBonus !== 0;
                        const displaySpecial = (hasIngombro || hasSpecialBonus) ? (specialBonus + (s.ingombroBonus ?? 0)) : null;
                        const totalBonusStr = typeof s.totalBonus === 'number' ? fmt(s.totalBonus) : s.totalBonus;
                        const bgHighlight = s.bgExtra > 0;

                        return (
                          <tr key={sk.nome} style={{ borderBottom: '1px solid #f3f4f6', background: bgHighlight ? '#faf5ff' : 'transparent' }}>
                            <td style={{ padding: '0.45rem 1rem', fontWeight: 500, color: bgHighlight ? '#7e22ce' : '#1f2937' }}>
                              {sk.nome} {getMaxRanks(sk.nome) !== null ? <span style={{ fontSize: '10px', color: '#9ca3af' }}>({getMaxRanks(sk.nome)} max)</span> : ''}
                            </td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#9ca3af' }}>{s.adRanks}</td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#3b82f6' }}>{s.profRanks}</td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#8b5cf6' }}>{s.tgp4Ranks}</td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#7e22ce', fontWeight: s.bgExtra > 0 ? 700 : 400 }}>
                              {s.bgExtra > 0 ? `+${s.bgExtra}` : '0'}
                            </td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 900, color: '#1e3a8a' }}>{s.totalRanks}</td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontWeight: 600 }}>
                              {typeof s.bonusGradi === 'number' ? fmt(s.bonusGradi) : s.bonusGradi}
                            </td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontSize: '0.75rem' }}>
                              {s.carattSigla ? `${s.carattSigla} ${fmt(s.carattBonus)}` : '—'}
                            </td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#6b7280' }}>
                              {displaySpecial !== null ? fmt(displaySpecial) : '—'}
                            </td>
                            <td style={{ padding: '0.45rem 1rem', textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#1e3a8a' }}>
                              {totalBonusStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── ABILITÀ SECONDARIE (se presenti) ── */}
      {Object.keys(bgModifiers.secondarySkills || {}).length > 0 && (
        <SectionCard emoji="🛠️" title="Abilità Secondarie" color="var(--theme-secondary-skills-text)" bg="var(--theme-secondary-skills-bg)" border="var(--theme-secondary-skills-border)">
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem', marginTop: 0 }}>
            Abilità acquisite tramite opzioni Background.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '0.4rem 1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600, width: '20%' }}>Abilità</th>
                  <th style={{ padding: '0.4rem 1rem', textAlign: 'left', color: '#6b7280', fontWeight: 600, width: '40%' }}>Descrizione</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>Caratt.</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: '#7e22ce', fontWeight: 700 }}>Bonus BG</th>
                  <th style={{ padding: '0.4rem 1rem', textAlign: 'right', color: '#047857', fontWeight: 900 }}>Totale</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(bgModifiers.secondarySkills).map(sk => {
                  const carattSigla = sk.caratteristica_associata;
                  const carattBonus = carattSigla ? (finalStats[carattSigla]?.bonusTot || 0) : 0;
                  const ranksBonus = sk.bgRanks ? getRanksBonus(sk.abilita_secondaria, sk.bgRanks) : -25;
                  const specialBonus = sk.specialBonus || 0;
                  
                  let bgTextParts = [];
                  if (sk.bgRanks) bgTextParts.push(`Gradi: ${fmt(ranksBonus)}`);
                  else bgTextParts.push(`Non addestrata: -25`);
                  
                  if (sk.specialBonus) bgTextParts.push(`Speciale: ${fmt(specialBonus)}`);
                  
                  const totalBonus = ranksBonus + specialBonus + carattBonus;
                  
                  return (
                    <tr key={sk.abilita_secondaria} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.45rem 1rem', fontWeight: 600, color: '#1f2937' }}>{sk.abilita_secondaria}</td>
                      <td style={{ padding: '0.45rem 1rem', color: '#4b5563', fontSize: '0.75rem', whiteSpace: 'normal', lineHeight: '1.2' }}>{sk.descrizione}</td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151' }}>
                        {carattSigla} {fmt(carattBonus)}
                      </td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#7e22ce', fontSize: '0.75rem' }}>
                        {bgTextParts.join(', ')}
                      </td>
                      <td style={{ padding: '0.45rem 1rem', textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: '#047857' }}>
                        {fmt(totalBonus)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── LINGUE ── */}
      <SectionCard emoji="🌐" title="Lingue Conosciute" color="var(--theme-languages-text)" bg="var(--theme-languages-bg)" border="var(--theme-languages-border)">
        {langEntries.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Nessuna lingua registrata.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {langEntries.map(([lang, data]) => {
              const total = (data.base || 0) + (data.added || 0);
              const gradeInfo = gradiLingue.find(g => g.grado === total);
              return (
                <div key={lang} style={{ padding: '0.4rem 0.85rem', border: '1px solid var(--theme-languages-border)', borderRadius: '99px', background: data.fromBg ? 'var(--theme-background-bg)' : 'var(--theme-languages-bg)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--theme-languages-text)' }}>{lang}</span>
                  <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.1rem 0.4rem', borderRadius: '99px', fontWeight: 700 }}>Gr.{total}</span>
                  {gradeInfo && <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{gradeInfo.conoscenza}</span>}
                  {data.fromBg && <span style={{ fontSize: '0.65rem', background: 'var(--theme-background-border)', color: 'var(--theme-background-text)', padding: '0.1rem 0.3rem', borderRadius: '99px', fontWeight: 700 }}>BG</span>}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── PORTAFOGLIO ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <WalletBox 
          portafoglioMB={characterData.portafoglioMB || 0} 
          onChange={(newVal) => setCharacterData(prev => ({ ...prev, portafoglioMB: newVal }))} 
        />
      </div>

      {/* ── OPZIONI BACKGROUND ── */}
      <SectionCard emoji="🎒" title="Opzioni Background Scelte" color="var(--theme-background-text)" bg="var(--theme-background-bg)" border="var(--theme-background-border)">
        {bgOptions.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Nessuna opzione background selezionata.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {bgOptions.map((opt, idx) => {
              const formatted = formatBgOption(opt, idx);
              const catColors = {
                'Gradi delle abilità':           'var(--theme-primary-skills-bg)',
                'Aumento delle caratteristiche': 'var(--theme-stats-bg)',
                'Lingue':                         'var(--theme-languages-bg)',
                'abilità speciali':               'var(--theme-secondary-skills-bg)',
                'oggetti speciali':               'var(--theme-background-bg)',
                "denaro: monete d'oro":           '#dcfce7',
                'Incantesimi o Punti Magia':      'var(--theme-spell-lists-bg)',
                'Lista incantesimi aggiuntiva':   'var(--theme-spell-lists-bg)',
              };
              const bg = catColors[opt.category] || '#f3f4f6';
              return (
                <div key={opt.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 2fr', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fefefe' }}>
                  <div style={{ width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '99px', fontWeight: 900, fontSize: '0.75rem', color: '#374151' }}>
                    {formatted.idx}
                  </div>
                  <div style={{ padding: '0.2rem 0.5rem', background: bg, borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700, color: '#374151', display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {formatted.category}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#1f2937', fontWeight: 500 }}>
                    {formatted.detail}
                  </div>
                </div>
              );
            })}
            {bgModifiers.gold > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', padding: '0.5rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🪙</span>
                <span style={{ fontWeight: 700, color: '#14532d', fontSize: '0.9rem' }}>Totale Monete d'Oro: {bgModifiers.gold} MO</span>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── NOTE SPECIALI ── */}
      {bgModifiers.specialNotes && bgModifiers.specialNotes.length > 0 && (
        <SectionCard emoji="📝" title="Note Speciali" color="#1e293b" bg="#f1f5f9" border="#cbd5e1">
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {bgModifiers.specialNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </SectionCard>
      )}

    </div>
  );
}
