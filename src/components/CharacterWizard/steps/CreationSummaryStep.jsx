import { useMemo } from 'react';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import gradiLingue from '../../../data/TGP_1-gradi_conoscenze_lingue.json';
import { getSpellLimitInfo, getSpellsForList } from '../../../utils/magicHelpers';
import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getFinalStats,
  fmt
} from '../../../utils/skillHelpers';

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
export default function CreationSummaryStep({ characterData }) {
  const race = characterData.race;
  const profession = characterData.profession;
  const stats = characterData.stats || {};
  const magicRealm = characterData.magicRealm || '—';
  const bgData = characterData.background || { languages: {}, options: [] };
  const languages = bgData.languages || {};
  const bgOptions = bgData.options || [];
  const bgModifiers = bgData.compiledModifiers || { statsBonus: {}, skillBgRanks: {}, secondarySkills: {}, gold: 0 };

  if (!race || !profession) {
    return (
      <div className="p-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 bg-gray-50" style={{ minHeight: 300 }}>
        Completa gli step precedenti per visualizzare il riepilogo.
      </div>
    );
  }

  // ── Compute final stats (base + bg bonus) and lookup bonuses ──
  const finalStats = useMemo(() => {
    return getFinalStats(stats, race, bgModifiers);
  }, [stats, race, bgModifiers]);

  // ── Compute final skills ──
  const categories = [...new Set(primarySkillsList.map(s => s.categoria))];
  const skillsBase = characterData.skills || {};

  const finalSkills = useMemo(() => {
    const result = {};
    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const base = skillsBase[name] || {};
      const bgExtra = bgModifiers.skillBgRanks?.[name] || 0;
      const adRanks = base.adolescenceRanks || 0;
      const profRanks = base.professionRanks || 0;
      const tgp4Ranks = base.tgp4Ranks || 0;
      const totalRanks = adRanks + profRanks + tgp4Ranks + bgExtra;

      // Stat bonus for this skill
      const carattSiglaMatch = (sk['valore iniziale'] || '').match(/([A-Z]{2})$/);
      const carattSigla = carattSiglaMatch ? carattSiglaMatch[1] : '';
      const carattBonus = carattSigla ? finalStats[carattSigla]?.bonusTot || 0 : 0;

      const bonusGradi = getRanksBonus(name, totalRanks);
      const ingombroBonus = getIngombroBonus(name);

      let totalBonus;
      if (typeof bonusGradi === 'number') {
        totalBonus = bonusGradi + carattBonus + (ingombroBonus ?? 0);
      } else {
        totalBonus = bonusGradi; // e.g. "3d10"
      }

      result[name] = {
        category: sk.categoria,
        adRanks, profRanks, tgp4Ranks, bgExtra, totalRanks,
        carattSigla, carattBonus, bonusGradi, ingombroBonus, totalBonus,
        valoreIniziale: sk['valore iniziale'],
      };
    });
    return result;
  }, [skillsBase, finalStats, bgModifiers]);

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

  // ── TR bonuses ──
  const trKeys = [
    { key: 'bonus a TR-ESS', label: 'TR Essenza', statKey: 'IN' },
    { key: 'bonus a TR-FLS', label: 'TR Flusso', statKey: 'IT' },
    { key: 'bonus a TR-VEL', label: 'TR Veleno', statKey: 'CO' },
    { key: 'bonus a TR-MAL', label: 'TR Malattia', statKey: 'CO' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── HEADER BANNER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', border: '1px solid #bfdbfe', borderRadius: '0.6rem', background: '#eff6ff' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e3a8a' }}>Popolo</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e3a8a', marginTop: '0.2rem' }}>{race.popolo}</div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.15rem' }}>{race['note (umani/non umani)']}</div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #e9d5ff', borderRadius: '0.6rem', background: '#faf5ff' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#581c87' }}>Professione</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#581c87', marginTop: '0.2rem' }}>{profession.professione}</div>
          <div style={{ fontSize: '0.75rem', color: '#9333ea', marginTop: '0.15rem' }}>
            Prim.: {profession.primaria} | Sec.: {profession.secondaria}
          </div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #99f6e4', borderRadius: '0.6rem', background: '#f0fdfa' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#134e4a' }}>Reame Magico</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f766e', marginTop: '0.2rem' }}>{magicRealm}</div>
          <div style={{ fontSize: '0.75rem', color: '#14b8a6', marginTop: '0.15rem' }}>
            {profession['liste incantesimi'] || '—'}
          </div>
        </div>
      </div>

      {/* ── CARATTERISTICHE ── */}
      <SectionCard emoji="🎯" title="Caratteristiche & Bonus" color="#065f46" bg="#f0fdf4" border="#a7f3d0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d1fae5', background: '#f0fdf4' }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#065f46', fontWeight: 700 }}>Caratteristica</th>
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
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem' }}>Tiri Resistenza (TR):</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {trKeys.map(tr => {
              const raceTrBonus = parseBonusValue(race[tr.key] || 0);
              const statBonus = finalStats[tr.statKey]?.bonusTot || 0;
              const totalTrBonus = raceTrBonus + statBonus;
              return (
                <div key={tr.key} style={{ padding: '0.3rem 0.75rem', background: '#d1fae5', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600, color: '#065f46', border: '1px solid #a7f3d0' }}>
                  <span style={{ color: '#047857' }}>{tr.label}:</span> {fmt(totalTrBonus)} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#047857' }}>({fmt(raceTrBonus)} Popolo, {fmt(statBonus)} {tr.statKey})</span>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* ── LISTE INCANTESIMI ── */}
      <SectionCard emoji="✨" title="Liste Incantesimi" color="#4c1d95" bg="#f5f3ff" border="#c4b5fd">
        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#6d28d9' }}>
          <span style={{ fontWeight: 600 }}>Reame:</span> {magicRealm} | <span style={{ fontWeight: 600 }}>Ammesse:</span> {profession['liste incantesimi'] || '—'} | <span style={{ fontWeight: 600 }}>Limite:</span> {profession['limite incantesimi'] || 'nessun limite'}
        </div>
        
        {learnedListsArray.length === 0 ? (
          <div style={{ padding: '0.75rem', background: '#faf5ff', border: '1px dashed #a78bfa', borderRadius: '0.5rem', color: '#8b5cf6', fontSize: '0.85rem', textAlign: 'center' }}>
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
                <div key={listName} style={{ border: '1px solid #ddd6fe', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ background: '#ede9fe', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#4c1d95' }}>{listName}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#c4b5fd', color: '#4c1d95', padding: '0.1rem 0.5rem', borderRadius: '99px' }}>
                      {sourceText.join(' + ')}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                        <tr>
                          <th style={{ padding: '0.4rem 1rem', textAlign: 'center', color: '#6d28d9', fontWeight: 600, width: '10%' }}>Liv.</th>
                          <th style={{ padding: '0.4rem 1rem', textAlign: 'left', color: '#6d28d9', fontWeight: 600, width: '25%' }}>Incantesimo</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: '#6d28d9', fontWeight: 600, width: '10%' }}>Area/Tipo</th>
                          <th style={{ padding: '0.4rem 1rem', textAlign: 'left', color: '#6d28d9', fontWeight: 600 }}>Descrizione</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spells.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>Nessun incantesimo disponibile per questa lista con l'attuale limite di livello.</td>
                          </tr>
                        ) : (
                          spells.map((s, i) => (
                            <tr key={i} style={{ borderBottom: i === spells.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                              <td style={{ padding: '0.4rem 1rem', textAlign: 'center', fontWeight: 700, color: '#4c1d95' }}>{s.livello}</td>
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
      <SectionCard emoji="⚔️" title="Abilità Primarie" color="#1e3a8a" bg="#eff6ff" border="#bfdbfe">
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
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontWeight: 600 }}>Bonus caratt.</th>
                        <th style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#374151', fontWeight: 600 }}>Carico</th>
                        <th style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#1e3a8a', fontWeight: 900 }}>Bonus TOTALE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catSkills.map(sk => {
                        const s = finalSkills[sk.nome];
                        if (!s) return null;
                        const isMM = cat === 'Abilità di Movimento e Manovra';
                        const hasIngombro = s.ingombroBonus !== null;
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
                              {hasIngombro ? fmt(s.ingombroBonus) : '—'}
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
        <SectionCard emoji="🛠️" title="Abilità Secondarie" color="#047857" bg="#ecfdf5" border="#a7f3d0">
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
      <SectionCard emoji="🌐" title="Lingue Conosciute" color="#1e40af" bg="#eff6ff" border="#93c5fd">
        {langEntries.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Nessuna lingua registrata.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {langEntries.map(([lang, data]) => {
              const total = (data.base || 0) + (data.added || 0);
              const gradeInfo = gradiLingue.find(g => g.grado === total);
              return (
                <div key={lang} style={{ padding: '0.4rem 0.85rem', border: '1px solid #bfdbfe', borderRadius: '99px', background: data.fromBg ? '#ede9fe' : '#f0f9ff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e3a8a' }}>{lang}</span>
                  <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.1rem 0.4rem', borderRadius: '99px', fontWeight: 700 }}>Gr.{total}</span>
                  {gradeInfo && <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{gradeInfo.conoscenza}</span>}
                  {data.fromBg && <span style={{ fontSize: '0.65rem', background: '#ddd6fe', color: '#6d28d9', padding: '0.1rem 0.3rem', borderRadius: '99px', fontWeight: 700 }}>BG</span>}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── OPZIONI BACKGROUND ── */}
      <SectionCard emoji="🎒" title="Opzioni Background Scelte" color="#581c87" bg="#faf5ff" border="#e9d5ff">
        {bgOptions.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Nessuna opzione background selezionata.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {bgOptions.map((opt, idx) => {
              const formatted = formatBgOption(opt, idx);
              const catColors = {
                'Gradi delle abilità':           '#ddd6fe',
                'Aumento delle caratteristiche': '#bbf7d0',
                'Lingue':                         '#bfdbfe',
                'abilità speciali':               '#fde68a',
                'oggetti speciali':               '#fecaca',
                "denaro: monete d'oro":           '#bbf7d0',
                'Incantesimi o Punti Magia':      '#e9d5ff',
                'Lista incantesimi aggiuntiva':   '#e9d5ff',
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

    </div>
  );
}
