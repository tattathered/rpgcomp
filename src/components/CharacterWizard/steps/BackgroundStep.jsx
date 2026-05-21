import React, { useState, useEffect, useMemo } from 'react';
import lingueTerraDiMezzo from '../../../data/TS_1-lingue_della_terra_di_mezzo-v2.json';
import gradiLingue from '../../../data/TGP_1-gradi_conoscenze_lingue.json';
import bgOpzioni from '../../../data/TGP_2-opzioni_background-v1.json';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import secondarySkillsList from '../../../data/Tabella-abilita_secondarie.json';
import { getAvailableSpellLists } from '../../../utils/magicHelpers';
import tb1 from '../../../data/TB_1-caratteristiche_bonus.json';

const STAT_KEYS = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
const STAT_NAMES = { FR: 'Forza', AG: 'Agilità', CO: 'Costituzione', IN: 'Intelligenza', IT: 'Intuizione', PR: 'Presenza' };
const BG_CATEGORIES = ['Gradi delle abilità', 'Aumento delle caratteristiche', 'Lingue', 'abilità speciali', 'oggetti speciali', "denaro: monete d'oro", 'Lista incantesimi aggiuntiva'];

// Helper: parse "da XX a YY" range strings from the JSON
const parseRange = (s) => {
  if (!s) return [0, 0];
  const str = s.toString().toLowerCase().trim();
  if (str === 'n/a') return [0, 0];
  const simple = parseInt(str);
  if (!isNaN(simple)) return [simple, simple];
  // "da 01 a 50" or "da 01 a 02"
  const m = str.match(/da\s*(\d+)\s*a\s*(\d+)/);
  if (m) return [parseInt(m[1]), parseInt(m[2])];
  // "da 96 a 00" → 96-100
  const m2 = str.match(/da\s*(\d+)\s*a\s*0+$/);
  if (m2) return [parseInt(m2[1]), 100];
  return [0, 0];
};

const findBgRecord = (tipologia, roll) => {
  return bgOpzioni.find(r => {
    if (r.tipologia !== tipologia) return false;
    const [min, max] = parseRange(r['tiro del dado']);
    return roll >= min && roll <= max;
  });
};

const getBonus = (val) => {
  if (!val) return 0;
  const record = tb1.find(b => b.punteggio === parseInt(val));
  return record ? record.bonus : 0;
};

const OGGETTI_OPTIONS = [
  { id: 'mag10', label: 'Oggetto magico +10 (tiro 01-60)', roll_min: 1, roll_max: 60 },
  { id: 'add1',  label: 'Oggetto addizionatore incantesimo +1 (tiro 01-60)', roll_min: 1, roll_max: 60 },
  { id: 'inc1',  label: 'Incantesimo lv.1 × 4/giorno (tiro 61-89)', roll_min: 61, roll_max: 89 },
  { id: 'inc2',  label: 'Incantesimo lv.2 × 3/giorno (tiro 61-89)', roll_min: 61, roll_max: 89 },
  { id: 'inc3',  label: 'Incantesimo lv.3 × 2/giorno (tiro 61-89)', roll_min: 61, roll_max: 89 },
  { id: 'inc4',  label: 'Incantesimo lv.4 × 1/giorno (tiro 61-89)', roll_min: 61, roll_max: 89 },
  { id: 'mag15', label: 'Oggetto magico +15 (tiro 99-100)', roll_min: 99, roll_max: 100 },
  { id: 'add2',  label: 'Oggetto addizionatore incantesimo +2 (tiro 99-100)', roll_min: 99, roll_max: 100 },
];

const ABILITA_SPECIALI_OPTIONS = [
  { id: 'as1', label: 'Bonus Speciale +5 in una Abilità primaria (tiro 01-50)', roll_min: 1, roll_max: 50 },
  { id: 'as2', label: 'Bonus Speciale +15 in una Abilità secondaria (tiro 51-55)', roll_min: 51, roll_max: 55 },
  { id: 'as3', label: 'Empatia verso una specie animale: +25 manovre (tiro 56-60)', roll_min: 56, roll_max: 60 },
  { id: 'as4', label: 'Infravisione: percezione calore fino a 30m (tiro 61-65)', roll_min: 61, roll_max: 65 },
  { id: 'as5', label: 'Resistenza: Bonus Speciale +10 ai TR (tiro 66-70)', roll_min: 66, roll_max: 70 },
  { id: 'as6', label: 'Esperto di magia: +1 lista di incantesimi (tiro 71-75)', roll_min: 71, roll_max: 75 },
  { id: 'as7', label: 'Abile nelle Manovre in Movimento: Bonus +10 (tiro 76-80)', roll_min: 76, roll_max: 80 },
  { id: 'as8', label: 'Attento osservatore: Bonus +10 a Percezione/Tracce (tiro 81-85)', roll_min: 81, roll_max: 85 },
  { id: 'as9', label: 'Riflessi fulminei: +5 ai BD e +5 ai BO (tiro 86-90)', roll_min: 86, roll_max: 90 },
  { id: 'as10', label: 'Carismatico: Bonus Speciale +10 alla leadership (tiro 91-95)', roll_min: 91, roll_max: 95 },
  { id: 'as11', label: 'Resistente al dolore: +3 per ogni D10 alla Resistenza Fisica (tiro 96-00)', roll_min: 96, roll_max: 100 },
];

export default function BackgroundStep({ characterData, setCharacterData }) {
  const race = characterData.race;
  const profession = characterData.profession;
  const magicRealm = characterData.magicRealm || '—';
  
  const knownLists = Object.keys(characterData.spellListAllocations || {});
  const rawAvailableLists = profession ? getAvailableSpellLists(profession.professione, magicRealm) : [];
  const availableLists = rawAvailableLists.filter(l => !knownLists.includes(l.nome_lista));
  
  const bgSpellLists = characterData.background?.compiledModifiers?.bgSpellLists || [];

  const languagePointsTotal = characterData.skills?.['Punti Lingue Addizionali']?.totalRanks || 0;
  const backgroundPointsTotal = characterData.skills?.['Punti Background']?.totalRanks || 0;

  // Init languages from race
  useEffect(() => {
    if (race && (!characterData.background?.languages)) {
      const baseLangs = {};
      lingueTerraDiMezzo.forEach(l => {
        if (l.popolo === race.popolo) {
          baseLangs[l.lingua] = { base: l.livello, added: 0 };
        }
      });
      setCharacterData(prev => ({
        ...prev,
        background: { languages: baseLangs, options: prev.background?.options || [] }
      }));
    }
  }, [race]);

  if (!race) return (
    <div style={{padding:'2rem',color:'#888',textAlign:'center'}}>Torna allo Step 1 e seleziona un Popolo.</div>
  );

  const bgData = characterData.background || { languages: {}, options: [] };
  const languages = bgData.languages || {};
  const options = bgData.options || [];

  const languagePointsSpent = Object.values(languages).reduce((s, l) => s + (l.added || 0), 0);
  const languagePointsLeft = languagePointsTotal - languagePointsSpent;
  const backgroundPointsLeft = backgroundPointsTotal - options.length;

  // All language names
  const allLanguages = useMemo(() => [...new Set(lingueTerraDiMezzo.map(l => l.lingua))].sort(), []);

  // Commit update helper
  const update = (nextLangs, nextOptions) => {
    // Compile stat bonuses from options
    const statsBonus = {};
    nextOptions.forEach(opt => {
      if (opt.category === 'Aumento delle caratteristiche') {
        if (opt.subChoice === 'A' && opt.stats?.[0]) {
          statsBonus[opt.stats[0]] = (statsBonus[opt.stats[0]] || 0) + 2;
        } else if (opt.subChoice === 'B' && opt.stats) {
          opt.stats.filter(Boolean).forEach(s => { statsBonus[s] = (statsBonus[s] || 0) + 1; });
        }
      }
    });

    // Compile skill bonuses
    const skillBgRanks = {};
    nextOptions.forEach(opt => {
      if (opt.category === 'Gradi delle abilità' && opt.subChoice === 'A' && opt.skillName) {
        skillBgRanks[opt.skillName] = (skillBgRanks[opt.skillName] || 0) + 2;
      }
    });

    // Secondary skills from bg
    const secondarySkills = {};
    nextOptions.forEach(opt => {
      if (opt.category === 'Gradi delle abilità' && opt.subChoice === 'B' && opt.skillName) {
        const def = secondarySkillsList.find(s => s.abilita_secondaria === opt.skillName);
        if (def) {
          const prev = secondarySkills[opt.skillName] || { bgRanks: 0 };
          secondarySkills[opt.skillName] = { ...def, bgRanks: prev.bgRanks + 5 };
        }
      }
      if (opt.category === 'abilità speciali' && opt.roll >= 51 && opt.roll <= 55 && opt.skillName) {
        const def = secondarySkillsList.find(s => s.abilita_secondaria === opt.skillName);
        if (def) {
          const prev = secondarySkills[opt.skillName] || { specialBonus: 0 };
          secondarySkills[opt.skillName] = { ...def, bgRanks: prev.bgRanks || 0, specialBonus: (prev.specialBonus || 0) + 15 };
        }
      }
    });

    // Gold
    let gold = 0;
    nextOptions.forEach(opt => {
      if (opt.category === "denaro: monete d'oro" && opt.calculatedMO) gold += opt.calculatedMO;
    });

    // Spell Lists from Esperto di magia (roll 71-75) or Lista incantesimi aggiuntiva
    const bgSpellLists = [];
    nextOptions.forEach(opt => {
      if ((opt.category === 'abilità speciali' && opt.roll >= 71 && opt.roll <= 75) || opt.category === 'Lista incantesimi aggiuntiva') {
        if (opt.skillName) {
          bgSpellLists.push(opt.skillName);
        }
      }
    });

    setCharacterData(prev => ({
      ...prev,
      background: {
        languages: nextLangs,
        options: nextOptions,
        compiledModifiers: { statsBonus, skillBgRanks, secondarySkills, gold, bgSpellLists }
      }
    }));
  };

  // Language handlers
  const addLangPoint = (lang) => {
    if (languagePointsLeft <= 0) return;
    const cur = languages[lang] || { base: 0, added: 0 };
    if (cur.base + cur.added >= 5) return;
    update({ ...languages, [lang]: { ...cur, added: (cur.added || 0) + 1 } }, options);
  };
  const removeLangPoint = (lang) => {
    const cur = languages[lang];
    if (!cur || cur.added <= 0) return;
    const next = { ...languages };
    if (cur.base === 0 && cur.added === 1) delete next[lang];
    else next[lang] = { ...cur, added: cur.added - 1 };
    update(next, options);
  };
  const addNewLang = (lang) => {
    if (!lang || languagePointsLeft <= 0) return;
    const cur = languages[lang] || { base: 0, added: 0 };
    if (cur.base + cur.added >= 5) return;
    update({ ...languages, [lang]: { ...cur, added: (cur.added || 0) + 1 } }, options);
  };
  const addLangFromBg = (lang) => {
    // background 'Lingue' category → sets language to level 5
    if (!lang) return;
    update({ ...languages, [lang]: { base: 0, added: 5, fromBg: true } }, options);
  };

  // Option handlers
  const addOption = (category) => {
    if (backgroundPointsLeft <= 0) return;
    const newOpt = { id: Date.now(), category, subChoice: (category === 'Gradi delle abilità' || category === 'Aumento delle caratteristiche') ? 'A' : null, skillName: '', stats: [], roll: '', calculatedMO: 0, calculatedText: '', oggetto: '', customNote: '' };
    update(languages, [...options, newOpt]);
  };
  const removeOption = (id) => update(languages, options.filter(o => o.id !== id));
  const patchOption = (id, patch) => {
    const next = options.map(o => {
      if (o.id !== id) return o;
      const merged = { ...o, ...patch };
      // Auto-calculate MO
      if (merged.category === "denaro: monete d'oro" && patch.roll !== undefined) {
        const r = parseInt(patch.roll) || 0;
        const rec = findBgRecord("denaro: monete d'oro", r);
        merged.calculatedMO = rec ? parseInt(rec.opzione) : 0;
      }
      // Auto-lookup text for abilità speciali / oggetti speciali
      if ((merged.category === 'abilità speciali' || merged.category === 'oggetti speciali') && patch.roll !== undefined) {
        const r = parseInt(patch.roll) || 0;
        const rec = findBgRecord(merged.category, r);
        merged.calculatedText = rec ? rec.opzione : '';
        merged.roll = r;
      }
      return merged;
    });
    update(languages, next);
  };
  const roll1d100 = (id) => patchOption(id, { roll: Math.floor(Math.random() * 100) + 1 });

  const primarySkillNames = primarySkillsList
    .filter(s => s.nome && s.categoria && !s.categoria.includes('Altre Abilità'))
    .map(s => ({ nome: s.nome, categoria: s.categoria }));

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>

      {/* ── LINGUE ── */}
      <div className="card" style={{borderColor:'#bfdbfe'}}>
        <div className="card-header" style={{background:'#eff6ff',borderBottom:'1px solid #bfdbfe',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h4 style={{margin:0,color:'#1e3a8a'}}>🌐 Lingue Conosciute</h4>
          <div style={{display:'flex',gap:'1rem'}}>
            <span style={{fontSize:'0.8rem',background:'#fff',border:'1px solid #dbeafe',padding:'0.25rem 0.75rem',borderRadius:'0.5rem'}}>
              Punti totali: <strong>{languagePointsTotal}</strong>
            </span>
            <span style={{fontSize:'0.8rem',background: languagePointsLeft > 0 ? '#2563eb' : '#e5e7eb',color: languagePointsLeft > 0 ? '#fff' : '#6b7280',border:'1px solid transparent',padding:'0.25rem 0.75rem',borderRadius:'0.5rem'}}>
              Rimasti: <strong>{languagePointsLeft}</strong>
            </span>
          </div>
        </div>
        <div className="card-body">
          <p style={{fontSize:'0.875rem',color:'#64748b',marginBottom:'1rem'}}>Migliora le lingue base o apprendi nuove lingue (max Grado 5).</p>
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {Object.entries(languages).sort((a,b)=>a[0].localeCompare(b[0])).map(([lang, data]) => {
              const total = (data.base || 0) + (data.added || 0);
              const gradeInfo = gradiLingue.find(g => g.grado === total);
              return (
                <div key={lang} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.6rem 0.75rem',border:'1px solid #e5e7eb',borderRadius:'0.5rem',background:'#fff'}}>
                  <div>
                    <strong style={{fontSize:'0.9rem'}}>{lang}</strong>
                    {data.base > 0 && <span style={{marginLeft:'0.5rem',fontSize:'0.7rem',background:'#f3f4f6',padding:'0.1rem 0.4rem',borderRadius:'99px'}}>Base ({data.base})</span>}
                    {data.added > 0 && <span style={{marginLeft:'0.4rem',fontSize:'0.7rem',background:'#dbeafe',color:'#1d4ed8',padding:'0.1rem 0.4rem',borderRadius:'99px'}}>+{data.added}</span>}
                    {data.fromBg && <span style={{marginLeft:'0.4rem',fontSize:'0.7rem',background:'#d8b4fe',color:'#6b21a8',padding:'0.1rem 0.4rem',borderRadius:'99px'}}>BG</span>}
                    <div style={{fontSize:'0.75rem',color:'#6b7280',marginTop:'0.15rem'}}>{gradeInfo?.conoscenza || ''}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <strong style={{fontSize:'1.1rem',minWidth:'1.5rem',textAlign:'center',color:'#1e3a8a'}}>{total}</strong>
                    <button onClick={() => addLangPoint(lang)} disabled={languagePointsLeft<=0||total>=5} style={{width:'1.75rem',height:'1.75rem',border:'1px solid #d1d5db',borderRadius:'0.375rem',background:'#f9fafb',cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    <button onClick={() => removeLangPoint(lang)} disabled={!data.added||data.added<=0} style={{width:'1.75rem',height:'1.75rem',border:'1px solid #d1d5db',borderRadius:'0.375rem',background:'#f9fafb',cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                  </div>
                </div>
              );
            })}
          </div>

          {languagePointsLeft > 0 && (
            <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid #e5e7eb',display:'flex',gap:'0.75rem',alignItems:'center'}}>
              <select defaultValue="" id="lang-add-select" style={{flex:1,padding:'0.5rem',border:'1px solid #d1d5db',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
                <option value="" disabled>-- Nuova lingua da apprendere --</option>
                {allLanguages.filter(l => !languages[l] || (languages[l].base + languages[l].added) < 5).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => { const s = document.getElementById('lang-add-select'); addNewLang(s.value); s.value=''; }}>+ Apprendi</button>
            </div>
          )}
        </div>
      </div>

      {/* ── OPZIONI DI BACKGROUND ── */}
      <div className="card" style={{borderColor:'#e9d5ff'}}>
        <div className="card-header" style={{background:'#faf5ff',borderBottom:'1px solid #e9d5ff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h4 style={{margin:0,color:'#581c87'}}>🎒 Opzioni di Background</h4>
          <div style={{display:'flex',gap:'1rem'}}>
            <span style={{fontSize:'0.8rem',background:'#fff',border:'1px solid #f3e8ff',padding:'0.25rem 0.75rem',borderRadius:'0.5rem'}}>
              Punti totali: <strong>{backgroundPointsTotal}</strong>
            </span>
            <span style={{fontSize:'0.8rem',background: backgroundPointsLeft > 0 ? '#9333ea' : '#e5e7eb',color: backgroundPointsLeft > 0 ? '#fff' : '#6b7280',padding:'0.25rem 0.75rem',borderRadius:'0.5rem'}}>
              Rimasti: <strong>{backgroundPointsLeft}</strong>
            </span>
          </div>
        </div>
        <div className="card-body">
          <p style={{fontSize:'0.875rem',color:'#64748b',marginBottom:'1rem'}}>Scegli come spendere i punti background. Ogni punto = 1 opzione.</p>

          {/* Lista opzioni aggiunte */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
            {options.length === 0 && (
              <div style={{textAlign:'center',padding:'1.5rem',color:'#9ca3af',border:'1px dashed #e5e7eb',borderRadius:'0.5rem'}}>Nessuna opzione ancora aggiunta.</div>
            )}
            {options.map((opt, idx) => (
              <OptionCard
                key={opt.id}
                opt={opt}
                idx={idx}
                characterData={characterData}
                primarySkillNames={primarySkillNames}
                languages={languages}
                allLanguages={allLanguages}
                availableLists={availableLists}
                bgSpellLists={bgSpellLists}
                addLangFromBg={addLangFromBg}
                onRemove={() => removeOption(opt.id)}
                onPatch={(patch) => patchOption(opt.id, patch)}
                onRoll={() => roll1d100(opt.id)}
              />
            ))}
          </div>

          {/* Aggiungi opzione */}
          {backgroundPointsLeft > 0 && (
            <div style={{paddingTop:'1rem',borderTop:'1px solid #e5e7eb',display:'flex',gap:'0.75rem',alignItems:'center'}}>
              <select defaultValue="" id="bg-cat-select" style={{flex:1,padding:'0.5rem',border:'1px solid #d1d5db',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
                <option value="" disabled>-- Seleziona categoria --</option>
                {BG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-primary" style={{background:'#9333ea',borderColor:'#7e22ce'}} onClick={() => { const s = document.getElementById('bg-cat-select'); if(s.value){ addOption(s.value); s.value=''; }}}>+ Aggiungi</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: single option card ───────────────────────────────────────
function OptionCard({ opt, idx, characterData, primarySkillNames, languages, allLanguages, availableLists, bgSpellLists, addLangFromBg, onRemove, onPatch, onRoll }) {
  const catColors = {
    'Gradi delle abilità':        { border:'#d8b4fe', bg:'#faf5ff', label:'#7e22ce' },
    'Aumento delle caratteristiche': { border:'#6ee7b7', bg:'#f0fdf4', label:'#065f46' },
    'Lingue':                     { border:'#93c5fd', bg:'#eff6ff', label:'#1e40af' },
    'abilità speciali':           { border:'#fcd34d', bg:'#fffbeb', label:'#92400e' },
    'oggetti speciali':           { border:'#34d399', bg:'#ecfdf5', label:'#065f46' },
    "denaro: monete d'oro":       { border:'#86efac', bg:'#f0fdf4', label:'#14532d' },
    'Lista incantesimi aggiuntiva': { border:'#c4b5fd', bg:'#f5f3ff', label:'#4c1d95' },
  };
  const col = catColors[opt.category] || { border:'#e5e7eb', bg:'#f9fafb', label:'#374151' };

  return (
    <div style={{border:`1px solid ${col.border}`,borderRadius:'0.75rem',background:col.bg,overflow:'hidden'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.6rem 1rem',borderBottom:`1px solid ${col.border}`}}>
        <span style={{fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:col.label}}>
          Opzione {idx+1}: {opt.category}
        </span>
        <button onClick={onRemove} style={{background:'#fee2e2',border:'1px solid #fecaca',color:'#991b1b',borderRadius:'0.375rem',padding:'0.2rem 0.5rem',cursor:'pointer',fontSize:'0.75rem'}}>✕ Rimuovi</button>
      </div>

      <div style={{padding:'0.85rem 1rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>

        {/* 1. GRADI ABILITÀ */}
        {opt.category === 'Gradi delle abilità' && (
          <>
            <div style={{display:'flex',gap:'0.5rem'}}>
              {['A','B'].map(choice => (
                <button key={choice} onClick={() => onPatch({subChoice:choice,skillName:''})} style={{flex:1,padding:'0.4rem',border:`2px solid ${opt.subChoice===choice?'#9333ea':'#d8b4fe'}`,borderRadius:'0.5rem',background:opt.subChoice===choice?'#9333ea':'#fff',color:opt.subChoice===choice?'#fff':'#7e22ce',fontWeight:700,cursor:'pointer',fontSize:'0.8rem'}}>
                  {choice==='A' ? 'A — +2 Gradi Abilità Primaria' : 'B — +5 Gradi Abilità Secondaria'}
                </button>
              ))}
            </div>
            {opt.subChoice === 'A' && (
              <div>
                <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:'0.25rem'}}>Scegli Abilità Primaria:</label>
                <select value={opt.skillName||''} onChange={e=>onPatch({skillName:e.target.value})} style={{width:'100%',padding:'0.4rem',border:'1px solid #d1d5db',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
                  <option value="" disabled>-- Seleziona --</option>
                  {primarySkillNames.map(s=>(<option key={s.nome} value={s.nome}>{s.nome} ({s.categoria})</option>))}
                </select>
              </div>
            )}
            {opt.subChoice === 'B' && (
              <div>
                <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:'0.25rem'}}>Scegli Abilità Secondaria:</label>
                <select value={opt.skillName||''} onChange={e=>onPatch({skillName:e.target.value})} style={{width:'100%',padding:'0.4rem',border:'1px solid #d1d5db',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
                  <option value="" disabled>-- Seleziona --</option>
                  {secondarySkillsList.map(s=>(<option key={s.abilita_secondaria} value={s.abilita_secondaria}>{s.abilita_secondaria} (ass. {s.caratteristica_associata})</option>))}
                </select>
              </div>
            )}
          </>
        )}

        {/* 2. AUMENTO CARATTERISTICHE */}
        {opt.category === 'Aumento delle caratteristiche' && (
          <>
            <div style={{display:'flex',gap:'0.5rem'}}>
              {['A','B'].map(choice => (
                <button key={choice} onClick={() => onPatch({subChoice:choice,stats:[]})} style={{flex:1,padding:'0.4rem',border:`2px solid ${opt.subChoice===choice?'#059669':'#6ee7b7'}`,borderRadius:'0.5rem',background:opt.subChoice===choice?'#059669':'#fff',color:opt.subChoice===choice?'#fff':'#065f46',fontWeight:700,cursor:'pointer',fontSize:'0.8rem'}}>
                  {choice==='A' ? 'A — +2 a 1 Caratteristica' : 'B — +1 a 3 Caratteristiche'}
                </button>
              ))}
            </div>
            {opt.subChoice === 'A' && (
              <div>
                <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:'0.25rem'}}>Scegli caratteristica (+2):</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.4rem'}}>
                  {STAT_KEYS.map(k => {
                    const cur = characterData.stats?.[k] || 0;
                    const bonusCur = getBonus(cur);
                    const bonusNew = getBonus(cur + 2);
                    const improved = bonusNew > bonusCur;
                    const sel = opt.stats?.[0]===k;
                    return (
                      <button key={k} onClick={() => onPatch({stats:[k]})} style={{padding:'0.4rem',border:`2px solid ${sel?'#059669':'#d1d5db'}`,borderRadius:'0.5rem',background:sel?'#d1fae5':'#fff',cursor:'pointer',textAlign:'center'}}>
                        <div style={{fontWeight:700,color:'#065f46'}}>{k}</div>
                        <div style={{fontSize:'0.7rem',color:'#374151'}}>{cur} → {cur+2}</div>
                        <div style={{fontSize:'0.7rem',color: improved?'#15803d':'#6b7280'}}>{improved?`Bonus: ${bonusCur>=0?'+':''}${bonusCur} → ${bonusNew>=0?'+':''}${bonusNew} ✓`:`Bonus: ${bonusCur>=0?'+':''}${bonusCur}`}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {opt.subChoice === 'B' && (
              <div>
                <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:'0.25rem'}}>Scegli 3 caratteristiche (+1 ciascuna):</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.4rem'}}>
                  {STAT_KEYS.map(k => {
                    const cur = characterData.stats?.[k] || 0;
                    const bonusCur = getBonus(cur);
                    const bonusNew = getBonus(cur + 1);
                    const improved = bonusNew > bonusCur;
                    const selected = opt.stats?.includes(k);
                    const disabled = !selected && (opt.stats?.filter(Boolean).length >= 3);
                    return (
                      <button key={k} onClick={() => {
                        if (disabled) return;
                        const cur2 = [...(opt.stats||[])];
                        const idx2 = cur2.indexOf(k);
                        if (idx2 >= 0) cur2.splice(idx2,1); else cur2.push(k);
                        onPatch({stats:cur2});
                      }} style={{padding:'0.4rem',border:`2px solid ${selected?'#059669':disabled?'#f3f4f6':'#d1d5db'}`,borderRadius:'0.5rem',background:selected?'#d1fae5':disabled?'#f9fafb':'#fff',cursor:disabled?'not-allowed':'pointer',textAlign:'center',opacity:disabled?0.5:1}}>
                        <div style={{fontWeight:700,color:'#065f46'}}>{k}</div>
                        <div style={{fontSize:'0.7rem',color:'#374151'}}>{cur} → {cur+1}</div>
                        <div style={{fontSize:'0.7rem',color: improved?'#15803d':'#6b7280'}}>{improved?`Bonus migliora ✓`:`Bonus: ${bonusCur>=0?'+':''}${bonusCur}`}</div>
                      </button>
                    );
                  })}
                </div>
                {opt.stats?.filter(Boolean).length > 0 && (
                  <div style={{fontSize:'0.75rem',color:'#065f46',marginTop:'0.35rem'}}>Selezionate ({opt.stats.filter(Boolean).length}/3): {opt.stats.filter(Boolean).join(', ')}</div>
                )}
              </div>
            )}
          </>
        )}

        {/* 3. LINGUE */}
        {opt.category === 'Lingue' && (
          <div>
            <p style={{fontSize:'0.8rem',color:'#64748b',marginBottom:'0.5rem'}}>Scegli una lingua — la apprenderai a Grado 5 (le lingue madri già a grado 5 non possono essere selezionate).</p>
            <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:'0.25rem'}}>Lingua:</label>
            <select value={opt.skillName||''} onChange={e=>{ onPatch({skillName:e.target.value}); addLangFromBg(e.target.value); }} style={{width:'100%',padding:'0.4rem',border:'1px solid #93c5fd',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
              <option value="" disabled>-- Seleziona lingua --</option>
              {allLanguages.filter(l => {
                const ld = languages[l];
                if (!ld) return true;
                return (ld.base + (ld.added||0)) < 5;
              }).map(l=>(<option key={l} value={l}>{l}</option>))}
            </select>
          </div>
        )}

        {/* 4. ABILITÀ SPECIALI */}
        {opt.category === 'abilità speciali' && (
          <>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151'}}>Seleziona l'abilità speciale:</label>
              {ABILITA_SPECIALI_OPTIONS.map(o => (
                <button key={o.id} onClick={() => onPatch({oggetto:o.id, roll: o.roll_max, calculatedText: o.label})} style={{textAlign:'left',padding:'0.5rem 0.75rem',border:`2px solid ${opt.oggetto===o.id?'#d97706':'#fde68a'}`,borderRadius:'0.5rem',background:opt.oggetto===o.id?'#fef3c7':'#fff',cursor:'pointer',fontSize:'0.8rem',color:opt.oggetto===o.id?'#92400e':'#374151',fontWeight:opt.oggetto===o.id?700:400}}>
                  {o.label}
                </button>
              ))}
            </div>

            {opt.roll >= 1 && opt.roll <= 50 && (
              <div style={{marginTop:'0.5rem'}}>
                <label style={{fontSize:'0.8rem',fontWeight:600,display:'block',marginBottom:'0.25rem'}}>Scegli Abilità Primaria (+5 Bonus Speciale):</label>
                <select value={opt.skillName||''} onChange={e=>onPatch({skillName:e.target.value})} style={{width:'100%',padding:'0.4rem',border:'1px solid #fcd34d',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
                  <option value="" disabled>-- Seleziona --</option>
                  {primarySkillNames.map(s=>(<option key={s.nome} value={s.nome}>{s.nome}</option>))}
                </select>
              </div>
            )}
            
            {opt.roll >= 51 && opt.roll <= 55 && (
              <div style={{marginTop:'0.5rem'}}>
                <label style={{fontSize:'0.8rem',fontWeight:600,display:'block',marginBottom:'0.25rem'}}>Scegli Abilità Secondaria (+15 Bonus Speciale):</label>
                <select value={opt.skillName||''} onChange={e=>onPatch({skillName:e.target.value})} style={{width:'100%',padding:'0.4rem',border:'1px solid #fcd34d',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
                  <option value="" disabled>-- Seleziona --</option>
                  {secondarySkillsList.map(s=>(<option key={s.abilita_secondaria} value={s.abilita_secondaria}>{s.abilita_secondaria} (ass. {s.caratteristica_associata})</option>))}
                </select>
              </div>
            )}

            {opt.roll >= 71 && opt.roll <= 75 && (
              <div style={{marginTop:'0.5rem'}}>
                <label style={{fontSize:'0.8rem',fontWeight:600,display:'block',marginBottom:'0.25rem'}}>Scegli Lista Incantesimi:</label>
                <select value={opt.skillName||''} onChange={e=>onPatch({skillName:e.target.value})} style={{width:'100%',padding:'0.4rem',border:'1px solid #fcd34d',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
                  <option value="" disabled>-- Seleziona --</option>
                  {availableLists.map(l=>(<option key={l.nome_lista} value={l.nome_lista}>{l.nome_lista} ({l.tipo_lista})</option>))}
                </select>
              </div>
            )}

            {opt.roll > 55 && opt.roll !== 71 && opt.roll !== 72 && opt.roll !== 73 && opt.roll !== 74 && opt.roll !== 75 && opt.calculatedText && (
              <div style={{fontSize:'0.8rem',color:'#92400e',marginTop:'0.5rem'}}><em>Questa opzione aggiunge il bonus descritto alla tua scheda. Puoi specificare dettagli (es. animale scelto, tipo di TR) nelle note se vuoi.</em>
                <input type="text" value={opt.customNote||''} onChange={e=>onPatch({customNote:e.target.value})} placeholder="Dettagli aggiuntivi..." style={{width:'100%',padding:'0.4rem',border:'1px solid #fcd34d',borderRadius:'0.375rem',fontSize:'0.875rem',marginTop:'0.5rem'}} />
              </div>
            )}
          </>
        )}

        {/* 5. OGGETTI SPECIALI */}
        {opt.category === 'oggetti speciali' && (
          <>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151'}}>Seleziona il tipo di oggetto:</label>
              {OGGETTI_OPTIONS.map(o => (
                <button key={o.id} onClick={() => onPatch({oggetto:o.id})} style={{textAlign:'left',padding:'0.5rem 0.75rem',border:`2px solid ${opt.oggetto===o.id?'#dc2626':'#fecaca'}`,borderRadius:'0.5rem',background:opt.oggetto===o.id?'#fee2e2':'#fff',cursor:'pointer',fontSize:'0.8rem',color:opt.oggetto===o.id?'#991b1b':'#374151',fontWeight:opt.oggetto===o.id?700:400}}>
                  {o.label}
                </button>
              ))}
            </div>
            {opt.oggetto && (
              <div>
                <label style={{fontSize:'0.8rem',fontWeight:600,display:'block',marginBottom:'0.25rem'}}>Descrizione oggetto (tipo, nome, abilità associata):</label>
                <input type="text" value={opt.customNote||''} onChange={e=>onPatch({customNote:e.target.value})} placeholder="Es: Spada corta +10, Manto dell'oscurità..." style={{width:'100%',padding:'0.4rem',border:'1px solid #fca5a5',borderRadius:'0.375rem',fontSize:'0.875rem'}} />
                <div style={{fontSize:'0.7rem',color:'#9ca3af',marginTop:'0.25rem'}}>⚠️ Il GM aggiornerà la scheda con i bonus definitivi.</div>
              </div>
            )}
          </>
        )}

        {/* 6. DENARO MO */}
        {opt.category === "denaro: monete d'oro" && (
          <>
            <div style={{display:'flex',gap:'0.75rem',alignItems:'flex-end'}}>
              <div style={{flex:1}}>
                <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:'0.25rem'}}>Tiro 1D100:</label>
                <input type="number" min="1" max="100" value={opt.roll||''} onChange={e=>onPatch({roll:parseInt(e.target.value)||''})} style={{width:'100%',padding:'0.4rem',border:'1px solid #86efac',borderRadius:'0.375rem',fontSize:'0.875rem',fontWeight:700}} placeholder="1-100" />
              </div>
              <button onClick={onRoll} style={{padding:'0.4rem 0.9rem',background:'#16a34a',color:'#fff',border:'1px solid #15803d',borderRadius:'0.375rem',fontWeight:700,cursor:'pointer'}}>🎲 Tira</button>
            </div>
            {opt.roll > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.6rem 0.75rem',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'0.5rem'}}>
                <span style={{fontSize:'1.4rem'}}>🪙</span>
                <div>
                  <div style={{fontSize:'0.75rem',color:'#166534'}}>Tiro {opt.roll}</div>
                  <div style={{fontSize:'1.1rem',fontWeight:900,color:'#14532d'}}>{opt.calculatedMO || 0} Monete d'Oro</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 7. LISTA INCANTESIMI AGGIUNTIVA */}
        {opt.category === 'Lista incantesimi aggiuntiva' && (
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            <div>
              <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:'0.25rem'}}>Scegli Lista Incantesimi:</label>
              <select value={opt.skillName||''} onChange={e=>onPatch({skillName:e.target.value})} style={{width:'100%',padding:'0.4rem',border:'1px solid #c4b5fd',borderRadius:'0.375rem',fontSize:'0.875rem'}}>
                <option value="" disabled>-- Seleziona --</option>
                {availableLists.filter(l => !bgSpellLists.includes(l.nome_lista) || l.nome_lista === opt.skillName).map(l=>(<option key={l.nome_lista} value={l.nome_lista}>{l.nome_lista} ({l.tipo_lista})</option>))}
              </select>
            </div>
            <div>
              <label style={{fontSize:'0.8rem',fontWeight:600,color:'#374151',display:'block',marginBottom:'0.25rem'}}>Altra Descrizione (punti magia, note):</label>
              <textarea rows={2} value={opt.customNote||''} onChange={e=>onPatch({customNote:e.target.value})} placeholder="Es: +2 Punti Magia..." style={{width:'100%',padding:'0.4rem',border:'1px solid #c4b5fd',borderRadius:'0.375rem',fontSize:'0.875rem',resize:'vertical'}} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
