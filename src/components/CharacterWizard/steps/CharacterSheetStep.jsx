import { useState, useMemo, useEffect } from 'react';
import { Printer, Sparkles, AlertCircle, Heart, Zap, Shield, User, Globe, BookOpen, Scroll, Save } from 'lucide-react';
import primarySkillsList from '../../../data/Tabella-abilita_primarie.json';
import secondarySkillsList from '../../../data/Tabella-abilita_secondarie.json';

import gradiLingue from '../../../data/TGP-1-gradi_conoscenze_lingue.json';
import { getSpellLimitInfo, getSpellsForList } from '../../../utils/magicHelpers';
import {
  getBonus,
  parseBonusValue,
  getRanksBonus,
  getIngombroBonus,
  getSpecificTb6Ranks,
  getFinalStats,
  fmt,
  getProfessionRanksForLevel,
  getMagicPointsPerLevel,
  calculateCargoPenalty,
  getCaseInsensitive,
  getCharacterHpTot
} from '../../../utils/skillHelpers';
import { formatMBToCoins, formatCoinsToString } from '../../../utils/moneyHelpers';
import AnagraficaReadOnlyBox from '../shared/AnagraficaReadOnlyBox';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeToCharacterNotes, saveCharacterNotes } from '../../../services/playerService';

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

const TIPO_LABELS = {
  'F': { label: 'Forza', color: '#dc2626' },
  'E': { label: 'Elementale', color: '#2563eb' },
  'A': { label: 'Accessorio', color: '#059669' },
  'I': { label: 'Informazione', color: '#7c3aed' },
  'P': { label: 'Passivo', color: '#ca8a04' },
  'U': { label: 'Utilità', color: '#0891b2' },
};

const getArmorSkillName = (armorName) => {
  if (!armorName) return 'nessuna armatura';
  const name = armorName.toLowerCase();
  if (name.includes('grezzo')) return 'cuoio grezzo';
  if (name.includes('rinforzato')) return 'cuoio rinforzato';
  if (name.includes('maglia') || name.includes('maglie')) return 'corazza di maglia';
  if (name.includes('piastre')) return 'corazza di piastre';
  return 'nessuna armatura';
};

const getSkillForWeapon = (item) => {
  const nome = (item.nome || '').toLowerCase();
  const note = (item.note || item.note_base || '').toLowerCase();
  
  if (note.includes('con asta') || nome.includes('lancia') || nome.includes('giavellotto')) {
    return 'con asta';
  }
  if (note.includes('2 mani') || note.includes('due mani') || nome.includes('a 2 mani') || nome.includes('a due mani')) {
    return 'a 2 mani';
  }
  if (note.includes('da tiro') || note.includes('tiro') || nome.includes('arco') || nome.includes('balestra') || nome.includes('fionda')) {
    return 'da tiro';
  }
  if (note.includes('lancio') || note.includes('da lancio') || nome.includes('bolas')) {
    return 'da lancio';
  }
  if (note.includes('contundente') || nome.includes('randello') || nome.includes('mazzafrusto') || nome.includes('rete') || nome.includes('martello')) {
    return 'contundenti a 1 mano';
  }
  return 'taglio a 1 mano';
};

export default function CharacterSheetStep({ characterData, setCharacterData, readOnly = false }) {
  const { user, isGM, isPlayer } = useAuth();
  const statsReadOnly = readOnly || isPlayer;

  const [notes, setNotes] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!characterData?.id) return;
    const unsub = subscribeToCharacterNotes(characterData.id, (notesData) => {
      setNotes(notesData);
      setNotesText(notesData?.content || "");
    });
    return unsub;
  }, [characterData?.id]);

  const handleSaveNotes = async () => {
    if (!characterData?.id) return;
    setSavingNotes(true);
    setSaveSuccess(false);
    try {
      const gmId = characterData.gmId || "";
      const playerId = user?.uid || "";
      await saveCharacterNotes(characterData.id, gmId, playerId, notesText);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Errore durante il salvataggio delle note:", err);
      alert("Impossibile salvare il taccuino: " + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const race = characterData.race;
  const profession = characterData.profession;
  const stats = characterData.stats || {};
  const magicRealm = characterData.magicRealm || 'Essenza';
  const levelDevelopments = characterData.levelDevelopments || [];
  const finalLevel = 1 + levelDevelopments.length;

  const bgData = characterData.background || { languages: {}, options: [] };
  const bgOptions = bgData.options || [];
  const bgModifiers = bgData.compiledModifiers || { statsBonus: {}, skillBgRanks: {}, secondarySkills: {}, gold: 0 };

  // Calcolo in tempo reale peso del carico e penalità di carico
  const caricoKg = useMemo(() => {
    const items = characterData.equipment || [];
    let tot = 0;
    items.forEach(item => {
      tot += (item.qtyCarico || 0) * (item["peso in kg"] || 0);
    });
    return tot;
  }, [characterData.equipment]);

  const { penalitaCarico, caricoBloccato } = useMemo(() => {
    const pesoPG = characterData.peso || 70;
    const { penalita, caricoBloccato } = calculateCargoPenalty(pesoPG, caricoKg);
    return { penalitaCarico: penalita, caricoBloccato };
  }, [characterData.peso, caricoKg]);

  const equippedItems = useMemo(() => {
    return characterData.equipment?.filter(x => x.qtyEquip > 0) || [];
  }, [characterData.equipment]);

  const activeArmor = characterData.equippedArmor || 'Nessuna armatura';
  const activeArmorMM = useMemo(() => {
    const skillName = getArmorSkillName(activeArmor);
    return getIngombroBonus(skillName) ?? 0;
  }, [activeArmor]);

  const activeShield = useMemo(() => {
    return equippedItems.some(x => x.nome.toLowerCase().includes('scudo'));
  }, [equippedItems]);

  const activeBracciali = useMemo(() => {
    const item = equippedItems.find(x => x.nome.toLowerCase().includes('bracciali'));
    if (!item) return null;
    const isMetal = item.nome.toLowerCase().includes('metallo');
    return { material: isMetal ? 'metallo' : 'cuoio', malus: -5 };
  }, [equippedItems]);

  const activeSchinieri = useMemo(() => {
    const item = equippedItems.find(x => x.nome.toLowerCase().includes('schinieri'));
    if (!item) return null;
    const isMetal = item.nome.toLowerCase().includes('metallo');
    return { material: isMetal ? 'metallo' : 'cuoio', malus: -5 };
  }, [equippedItems]);

  const activeElmo = useMemo(() => {
    const item = equippedItems.find(x => x.nome.toLowerCase().includes('elmo'));
    if (!item) return null;
    const isMetal = item.nome.toLowerCase().includes('metallo');
    return { material: isMetal ? 'metallo' : 'cuoio', malus: -5 };
  }, [equippedItems]);

  const presentArmors = useMemo(() => {
    const list = [];
    const items = characterData.equipment || [];
    items.forEach(item => {
      const name = item.nome.toLowerCase();
      if (name.includes('grezzo')) list.push('cuoio grezzo');
      else if (name.includes('rinforzato')) list.push('cuoio rinforzato');
      else if (name.includes('maglia') || name.includes('maglies')) list.push('corazza di maglia');
      else if (name.includes('piastre')) list.push('corazza di piastre');
    });
    return list;
  }, [characterData.equipment]);

  const presentWeapons = useMemo(() => {
    const list = [];
    const items = characterData.equipment || [];
    items.forEach(item => {
      if (item.categoria === 'armi') {
        const skillName = getSkillForWeapon(item);
        list.push({ item, skillName });
      }
    });
    return list;
  }, [characterData.equipment]);

  // Calcolo caratteristiche finali consolidando i bonus del background
  const finalStats = useMemo(() => {
    return getFinalStats(stats, race, bgModifiers);
  }, [stats, race, bgModifiers]);

  const coBonus = finalStats['CO']?.bonusTot || 0;
  const prBonus = finalStats['PR']?.bonusTot || 0;
  const inBonus = finalStats['IN']?.bonusTot || 0;
  const itBonus = finalStats['IT']?.bonusTot || 0;

  // Calcolo Gradi Resistenza Fisica del Livello 1 per calcolare quanti d10 tirare
  const rfRanksLevel1 = useMemo(() => {
    if (!profession) return 0;
    const name = 'Resistenza fisica';
    const base = getCaseInsensitive(characterData.skills, name) || {};
    const adRanks = base.adolescenceRanks || 0;
    const level1Tb6 = characterData.level1Tb6 || {};
    const profRanks = getSpecificTb6Ranks(name, profession) + (getCaseInsensitive(level1Tb6, name) || 0);
    const tgp4RanksL1 = getCaseInsensitive(characterData.level1Tgp4, name) || 0;
    const bgExtra = getCaseInsensitive(bgModifiers.skillBgRanks, name) || 0;
    return adRanks + profRanks + tgp4RanksL1 + bgExtra;
  }, [characterData.skills, characterData.level1Tb6, characterData.level1Tgp4, profession, bgModifiers]);

  // Gestione tiro HP del Livello 1
  const level1HpRoll = characterData.level1HpRoll ?? null;

  const handleRollLevel1Hp = () => {
    const numD10 = rfRanksLevel1;
    if (numD10 <= 0) {
      setCharacterData(prev => ({ ...prev, level1HpRoll: 0 }));
      return;
    }
    let sum = 0;
    for (let i = 0; i < numD10; i++) {
      sum += Math.floor(Math.random() * 10) + 1;
    }
    setCharacterData(prev => ({ ...prev, level1HpRoll: sum }));
  };

  const handleManualLevel1Hp = (val) => {
    setCharacterData(prev => ({ ...prev, level1HpRoll: val }));
  };

  // Somma roll HP di tutti i livelli
  const totalHpRolls = useMemo(() => {
    const l1Roll = level1HpRoll || 0;
    const laterRolls = levelDevelopments.reduce((sum, d) => sum + (d.hpRoll || 0), 0);
    return l1Roll + laterRolls;
  }, [level1HpRoll, levelDevelopments]);

  // Calcolo gradi totali Resistenza Fisica per calcolare bonus speciale Resistente al Dolore
  const totalRanksRf = useMemo(() => {
    if (!profession) return 0;
    const name = 'Resistenza fisica';
    const base = getCaseInsensitive(characterData.skills, name) || {};
    const adRanks = base.adolescenceRanks || 0;
    const profRanks = base.professionRanks || 0; // fissi + L1 distribuiti
    const tgp4RanksL1 = getCaseInsensitive(characterData.level1Tgp4, name) || 0;
    const tgp4RanksLater = levelDevelopments.reduce((sum, d) => sum + (getCaseInsensitive(d.tgp4Distribution, name) || 0), 0);
    const bgExtra = getCaseInsensitive(bgModifiers.skillBgRanks, name) || 0;
    return adRanks + profRanks + tgp4RanksL1 + tgp4RanksLater + bgExtra;
  }, [characterData.skills, profession, levelDevelopments, bgModifiers]);

  // Punti Ferita Totali: tiri HP + bonus CO + 5 + (gradi RF * hpD10Modifier) + specialRfBonus
  const hpD10Modifier = bgModifiers.hpD10Modifier || 0;
  const specialRfBonus = getCaseInsensitive(bgModifiers.primarySkillsSpecialBonus, 'Resistenza fisica') || 0;
  const specialHpBonus = (totalRanksRf * hpD10Modifier) + specialRfBonus;
  const finalHitPoints = getCharacterHpTot(characterData);

  // Punti Magia Totali: livello * PM per livello
  const pmPerLevel = useMemo(() => {
    const activeStatScore = magicRealm === 'Essenza' ? finalStats['IN']?.statScore : finalStats['IT']?.statScore;
    return getMagicPointsPerLevel(activeStatScore || 0);
  }, [magicRealm, finalStats]);

  const finalMagicPoints = finalLevel * pmPerLevel;

  // Aspetto has been moved to step 7 (CreationSummaryStep)

  // Consolidamento finale abilità primarie
  const finalSkills = useMemo(() => {
    const result = {};
    primarySkillsList.forEach(sk => {
      const name = sk.nome;
      const isCogliereAlleSpalle = name.toLowerCase() === 'cogliere alle spalle';

      // Adolescenza
      const adRanks = isCogliereAlleSpalle ? 0 : (baseSkills => {
        return characterData.adolescenceSkills?.[name]?.adolescenceRanks || 0;
      })();

      // Base Professione scalata al livello finale
      const l1Tb6Ranks = characterData.level1Tb6?.[name] || 0;
      const baseProfRanks = isCogliereAlleSpalle ? 0 : (getSpecificTb6Ranks(name, profession) + l1Tb6Ranks);
      const professionRanks = isCogliereAlleSpalle ? 0 : getProfessionRanksForLevel(baseProfRanks, finalLevel);

      // Gradi TGP_4 Livello 1 + Livelli Successivi
      const tgp4RanksL1 = characterData.level1Tgp4?.[name] || 0;
      const tgp4RanksLater = levelDevelopments.reduce((sum, d) => sum + (d.tgp4Distribution?.[name] || 0), 0);
      const tgp4Ranks = tgp4RanksL1 + tgp4RanksLater;

      // Background
      const bgExtra = isCogliereAlleSpalle ? 0 : (bgModifiers.skillBgRanks?.[name] || 0);

      const totalRanks = adRanks + professionRanks + tgp4Ranks + bgExtra;

      // Bonus
      const carattSiglaMatch = (sk['valore iniziale'] || '').match(/([A-Z]{2})$/);
      const carattSigla = carattSiglaMatch ? carattSiglaMatch[1] : '';
      const carattBonus = isCogliereAlleSpalle ? 0 : (carattSigla ? finalStats[carattSigla]?.bonusTot || 0 : 0);

      const bonusGradi = getRanksBonus(name, totalRanks);
      const ingombroBonus = getIngombroBonus(name);
      const specialBonus = bgModifiers.primarySkillsSpecialBonus?.[name] || 0;

      let totalBonus;
      if (typeof bonusGradi === 'number') {
        totalBonus = bonusGradi + carattBonus + specialBonus + (ingombroBonus ?? 0);
        // Applica malus da penalità di carico per le Manovre in Movimento (MM)
        if (sk.tipo === 'Manovre in Movimento (MM)' || (sk.categoria && sk.categoria.toLowerCase() === 'di manovra e movimento')) {
          totalBonus -= penalitaCarico;
        }
      } else {
        totalBonus = bonusGradi;
      }

      result[name] = {
        category: sk.categoria,
        adRanks,
        profRanks: professionRanks,
        tgp4Ranks,
        bgExtra,
        totalRanks,
        carattSigla,
        carattBonus,
        bonusGradi,
        ingombroBonus,
        specialBonus,
        totalBonus,
        valoreIniziale: sk['valore iniziale']
      };
    });
    return result;
  }, [characterData, profession, finalLevel, levelDevelopments, finalStats, bgModifiers]);

  const highlightedArmorSkill = useMemo(() => {
    if (presentArmors.length === 0) return 'nessuna armatura';
    if (presentArmors.length === 1) return presentArmors[0];
    
    let bestSkill = presentArmors[0];
    let maxBonus = -Infinity;
    presentArmors.forEach(arm => {
      const skillData = finalSkills[arm];
      if (skillData) {
        const bonusVal = typeof skillData.totalBonus === 'number' ? skillData.totalBonus : -999;
        if (bonusVal > maxBonus) {
          maxBonus = bonusVal;
          bestSkill = arm;
        }
      }
    });
    return bestSkill;
  }, [presentArmors, finalSkills]);

  const highlightedWeaponSkill = useMemo(() => {
    if (presentWeapons.length === 0) return null;
    if (presentWeapons.length === 1) return presentWeapons[0].skillName;
    
    let bestSkill = presentWeapons[0].skillName;
    let maxBonus = -Infinity;
    presentWeapons.forEach(w => {
      const skillData = finalSkills[w.skillName];
      if (skillData) {
        const bonusVal = typeof skillData.totalBonus === 'number' ? skillData.totalBonus : -999;
        if (bonusVal > maxBonus) {
          maxBonus = bonusVal;
          bestSkill = w.skillName;
        }
      }
    });
    return bestSkill;
  }, [presentWeapons, finalSkills]);

  // Consolidamento lingue finali
  const finalLanguages = useMemo(() => {
    const langs = {};
    const baseLangs = characterData.background?.languages || {};

    Object.keys(baseLangs).forEach(l => {
      langs[l] = {
        base: baseLangs[l].base || 0,
        added: baseLangs[l].added || 0,
        fromBg: baseLangs[l].fromBg || false
      };
    });

    return Object.entries(langs).sort((a, b) => {
      const totB = (b[1].base || 0) + (b[1].added || 0);
      const totA = (a[1].base || 0) + (a[1].added || 0);
      return totB - totA;
    });
  }, [characterData.background]);

  // Liste Incantesimi apprese e filtri per incantesimi
  const spellListAllocations = characterData.spellListAllocations || {};
  const bgSpellLists = bgModifiers.bgSpellLists || [];
  const allLearnedLists = useMemo(() => {
    const list = new Set([...Object.keys(spellListAllocations), ...bgSpellLists]);
    return Array.from(list).sort();
  }, [spellListAllocations, bgSpellLists]);

  const getMagicRealmSummaryStep10 = () => {
    if (allLearnedLists.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {allLearnedLists.map((name, i) => (
            <div key={i}>Lista incantesimi {name} appresa.</div>
          ))}
        </div>
      );
    }
    const inheritedChance = characterData.levelDevelopments?.length > 0
      ? characterData.levelDevelopments[characterData.levelDevelopments.length - 1].spellListChanceAccumulated
      : (characterData.spellListChanceAccumulated || 0);
      
    return <div>Nessuna lista incantesimi appresa - Credito ereditato: {inheritedChance}%</div>;
  };

  // Limiti incantesimi per la professione
  const getSpellLimitForProfessionAndRealm = (profName, listTipo, charLevel) => {
    const p = (profName || '').toLowerCase().trim();
    let limit = charLevel; // Default: livello del personaggio

    if (p === 'guerriero') limit = Math.min(charLevel, 3);
    else if (p === 'scout') limit = Math.min(charLevel, 5);
    else if (p === 'ranger') {
      if (listTipo.toLowerCase().includes('ranger') || listTipo.toLowerCase().includes('flusso')) {
        limit = Math.min(charLevel, 5);
      }
    }
    else if (p === 'bardo') {
      if (listTipo.toLowerCase().includes('bardo') || listTipo.toLowerCase().includes('essenza')) {
        limit = Math.min(charLevel, 5);
      }
    }
    return limit;
  };

  const handlePrint = () => {
    window.print();
  };

  // Tiri Resistenza (TR)
  const trKeys = [
    { key: 'bonus a TR-ESS', label: 'TR Essenza', statKey: 'IN', sigla: 'TR-ESS' },
    { key: 'bonus a TR-FLS', label: 'TR Flusso', statKey: 'IT', sigla: 'TR-FLU' },
    { key: 'bonus a TR-VEL', label: 'TR Veleno', statKey: 'CO', sigla: 'TR-VEL' },
    { key: 'bonus a TR-MAL', label: 'TR Malattia', statKey: 'CO', sigla: 'TR-MAL' },
  ];

  if (!race || !profession) {
    return (
      <div className="p-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 bg-gray-50">
        Completa gli step precedenti prima di accedere alla scheda finale.
      </div>
    );
  }

  const categories = [...new Set(primarySkillsList.map(s => s.categoria))];

  return (
    <div className="space-y-6 sheet-print-container">
      {/* Intestazione con pulsante Stampa (nascosta in stampa) */}
      <div className="flex justify-between items-center print:hidden border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-1.5">
            <Printer className="text-indigo-600 w-5 h-5" />
            Scheda Personaggio Consolidata
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Visualizza, esporta o stampa la scheda finale del tuo personaggio MERP.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-sm rounded-lg flex items-center gap-1.5 shadow-md"
        >
          <Printer className="w-4 h-4" />
          Stampa Scheda / PDF
        </button>
      </div>

      {/* SCHEDA PERSONAGGIO DI GIOCO */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 print:border-0 print:shadow-none print:p-0">
        
        {/* Banner Titolo ed Info Generali */}
        <div className="border-b-2 border-indigo-600 pb-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">
                Middle-earth Role Playing (MERP) - SCHEDA PERSONAGGIO
              </h1>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-1">
                (c)2026 TattaTheRed
              </p>
            </div>
          </div>

          <AnagraficaReadOnlyBox characterData={characterData} simple={false} />

          {/* ── HEADER BANNER ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--theme-race-border)', borderRadius: '0.6rem', background: 'var(--theme-race-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-race-text)' }}>Popolo</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-race-text)', marginTop: '0.2rem' }}>{race?.nome || race?.popolo}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--theme-race-text)', opacity: 0.85, marginTop: '0.15rem' }}>{race?.categoria || race?.['note (umani/non umani)']}</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--theme-profession-border)', borderRadius: '0.6rem', background: 'var(--theme-profession-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-profession-text)' }}>Professione</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-profession-text)', marginTop: '0.2rem' }}>{profession?.professione} (Liv. {finalLevel})</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--theme-profession-text)', opacity: 0.85, marginTop: '0.15rem' }}>
                {profession && `Primaria: ${profession.primaria} | Secondaria: ${profession.secondaria}`}
              </div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--theme-spell-lists-border)', borderRadius: '0.6rem', background: 'var(--theme-spell-lists-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-spell-lists-text)' }}>Reame Magico</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-spell-lists-text)', marginTop: '0.2rem' }}>{characterData.magicRealm || 'Nessuno'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--theme-spell-lists-text)', opacity: 0.85, marginTop: '0.15rem', fontWeight: 500 }}>
                {getMagicRealmSummaryStep10()}
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Principali: Statistiche, TR, HP, PM, Aspetto */}
        <div className="space-y-6 mb-6">
          
          {/* Colonna Statistiche */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-2 border-b flex items-center gap-1.5" style={{ backgroundColor: 'var(--theme-stats-bg)', borderBottomColor: 'var(--theme-stats-border)', color: 'var(--theme-stats-text)' }}>
              <User className="w-4 h-4 text-emerald-800" style={{ color: 'var(--theme-stats-text)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-stats-text)' }}>Caratteristiche e TR</span>
            </div>
            <div className="p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 font-bold uppercase">
                    <th className="px-3 py-2">Caratteristica</th>
                    <th className="px-2 py-2 text-center">Punteggio</th>
                    <th className="px-2 py-2 text-center">Bonus BG</th>
                    <th className="px-2 py-2 text-center">Bonus Naturale</th>
                    <th className="px-2 py-2 text-center">Bonus Popolo</th>
                    <th className="px-3 py-2 text-center">Bonus Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {STAT_KEYS.map(k => {
                    const s = finalStats[k];
                    return (
                      <tr key={k} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-bold text-gray-800">{STAT_NAMES[k]} ({k})</td>
                        <td className="px-2 py-2 text-center font-bold text-gray-900">{s.raw + s.bgMod}</td>
                        <td className="px-2 py-2 text-center text-purple-700">{s.bgMod !== 0 ? fmt(s.bgMod) : '—'}</td>
                        <td className="px-2 py-2 text-center font-semibold text-gray-700">{fmt(s.bonusNaturale)}</td>
                        <td className="px-2 py-2 text-center text-blue-700">{s.raceMod !== 0 ? fmt(s.raceMod) : '—'}</td>
                        <td className="px-3 py-2 text-center font-black text-sm text-indigo-900">{fmt(s.bonusTot)}</td>
                      </tr>
                    );
                  })}
                  <tr className="hover:bg-gray-50/50" style={{ color: '#0f5132' }}>
                    <td className="px-3 py-2 font-bold" style={{ color: '#0f5132' }}>
                      Aspetto Fisico {prBonus !== 0 ? '(PR)' : ''}
                    </td>
                    <td className="px-2 py-2 text-center font-bold" style={{ color: '#0f5132' }}>
                      {characterData.aspetto || '—'}
                    </td>
                    <td className="px-2 py-2 text-center">—</td>
                    <td className="px-2 py-2 text-center">—</td>
                    <td className="px-2 py-2 text-center">—</td>
                    <td className="px-3 py-2 text-center font-black text-sm" style={{ color: '#0f5132' }}>
                      —
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tiri Resistenza */}
              <div className="mt-5 border-t border-gray-200 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--theme-tr-text)' }}>Tiri Resistenza</span>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 font-bold uppercase">
                      <th className="px-3 py-2">Tiro Resistenza</th>
                      <th className="px-2 py-2 text-center">Bonus Caratteristica</th>
                      <th className="px-2 py-2 text-center">Bonus Popolo</th>
                      <th className="px-2 py-2 text-center">Bonus Speciale</th>
                      <th className="px-3 py-2 text-center">Bonus Totale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trKeys.map(tr => {
                      const raceTrBonus = parseBonusValue(race[tr.key] || 0);
                      const statBonus = finalStats[tr.statKey]?.bonusTot || 0;
                      const specialBonus = bgModifiers.trSpecialBonus
                        ? (typeof bgModifiers.trSpecialBonus === 'object' ? (bgModifiers.trSpecialBonus[tr.key] || 0) : bgModifiers.trSpecialBonus)
                        : 0;
                      const totalTrBonus = raceTrBonus + statBonus + specialBonus;
                      return (
                        <tr key={tr.key} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 font-bold text-gray-800">{tr.label}</td>
                          <td className="px-2 py-2 text-center text-gray-700">
                            {statBonus !== 0 ? `${fmt(statBonus)} (${tr.statKey})` : `0 (${tr.statKey})`}
                          </td>
                          <td className="px-2 py-2 text-center text-blue-700">{raceTrBonus !== 0 ? fmt(raceTrBonus) : '—'}</td>
                          <td className="px-2 py-2 text-center text-purple-700">{specialBonus !== 0 ? fmt(specialBonus) : '—'}</td>
                          <td className="px-3 py-2 text-center font-black text-sm text-indigo-900">{fmt(totalTrBonus)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            
          {/* Box HP & PM */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs">
            <div className="bg-indigo-900/5 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Vitalità e Magia</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4 items-stretch">
              
              {/* Punti Ferita */}
              <div className="border border-gray-150 rounded-lg p-3 bg-gray-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700">Punti Ferita (HP)</span>
                    <span className="text-[10px] text-gray-500 font-medium">Tiri + CO ({fmt(coBonus)}) + 5 {specialHpBonus > 0 ? `+ Spec. (${fmt(specialHpBonus)})` : ''}</span>
                  </div>
                  {level1HpRoll === null ? (
                    <div className="bg-red-50 border border-red-150 p-2.5 rounded text-xs space-y-2">
                      <p className="text-red-900">Devi lanciare gli HP iniziali. (RF: {rfRanksLevel1}d10)</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleRollLevel1Hp}
                          className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2 py-1 rounded transition"
                        >
                          Tira
                        </button>
                        <input
                          type="number"
                          placeholder="Manuale"
                          onChange={(e) => handleManualLevel1Hp(e.target.value === '' ? null : parseInt(e.target.value))}
                          className="w-16 text-[11px] p-1 border border-red-300 rounded bg-white text-center font-bold"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 bg-red-50/50 border border-red-100 rounded-lg p-3">
                        <div className="w-12 h-12 rounded-full bg-white text-red-600 border border-red-200 flex items-center justify-center text-lg font-black shadow-xs shrink-0">
                          {finalHitPoints}
                        </div>
                        <div className="text-xs text-red-900 space-y-0.5">
                          <p><strong>Roll:</strong> {totalHpRolls} ({level1HpRoll} L1)</p>
                          <p><strong>Bonus CO:</strong> {fmt(coBonus)}</p>
                          <p><strong>Fisso:</strong> +5</p>
                          {specialHpBonus > 0 && (
                            <p><strong>Speciale:</strong> {fmt(specialHpBonus)}</p>
                          )}
                        </div>
                      </div>

                      {/* Campo PF Subiti */}
                      <div className="mt-2 pt-2 border-t border-red-200/40 text-xs">
                        <label className="block text-[10px] font-bold text-red-950 uppercase mb-1">
                          PF Subiti (Ferite):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={finalHitPoints}
                            value={characterData.hpSubiti || 0}
                            disabled={statsReadOnly}
                            onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setCharacterData(prev => ({ ...prev, hpSubiti: val }));
                            }}
                            className="w-16 p-1 border border-red-300 rounded text-center text-xs font-bold text-red-750 bg-white"
                            style={statsReadOnly ? { opacity: 0.8, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                          />
                          <span className="text-[10px] text-red-800 font-medium">
                            PF Rimanenti: <strong>{Math.max(0, finalHitPoints - (characterData.hpSubiti || 0))}</strong>
                          </span>
                        </div>
                        {(characterData.hpSubiti || 0) > (finalHitPoints / 2) && (
                          <div className="text-[10px] text-red-700 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                            ⚠️ Gravemente Ferito (-20 BO)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bonus Difensivo (BD) */}
              <div className="border border-gray-150 rounded-lg p-3 bg-gray-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700">Bonus Difensivo (BD)</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      Agilità ({fmt(finalStats['AG']?.bonusTot || 0)}) + Spec. ({fmt(bgModifiers.bdSpecialBonus || 0)})
                    </span>
                  </div>
                  <div className="flex items-center gap-4 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                    <div className="w-12 h-12 rounded-full bg-white text-blue-700 border border-blue-200 flex items-center justify-center text-lg font-black shadow-xs shrink-0">
                      {fmt((finalStats['AG']?.bonusTot || 0) + (bgModifiers.bdSpecialBonus || 0))}
                    </div>
                    <div className="text-xs text-blue-900 space-y-0.5">
                      <p><strong>Bonus Agilità:</strong> {fmt(finalStats['AG']?.bonusTot || 0)}</p>
                      {bgModifiers.bdSpecialBonus > 0 && <p><strong>Speciale:</strong> {fmt(bgModifiers.bdSpecialBonus)}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 text-[11px] text-gray-750 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Scudo:</span>
                    <span className={`font-semibold ${activeShield ? 'text-green-700' : 'text-gray-500'}`}>
                      {activeShield ? 'Sì (+25 BD)' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bracciali:</span>
                    <span className={`font-semibold ${activeBracciali ? 'text-red-700' : 'text-gray-500'}`}>
                      {activeBracciali ? `Sì (${activeBracciali.material}) -5 BO` : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Schinieri:</span>
                    <span className={`font-semibold ${activeSchinieri ? 'text-red-700' : 'text-gray-500'}`}>
                      {activeSchinieri ? `Sì (${activeSchinieri.material}) -5 MM` : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Elmo:</span>
                    <span className={`font-semibold ${activeElmo ? 'text-red-700' : 'text-gray-500'}`}>
                      {activeElmo ? `Sì (${activeElmo.material}) -5 Percezione` : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Punti Magia */}
              <div className="border border-gray-155 rounded-lg p-3 bg-gray-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700">Punti Magia (PM)</span>
                    <span className="text-[10px] text-gray-500 font-medium">Lvl {finalLevel} × PM/lvl ({pmPerLevel})</span>
                  </div>
                  <div className="flex items-center gap-4 bg-teal-50/50 border border-teal-100 rounded-lg p-3">
                    <div className="w-12 h-12 rounded-full bg-white text-teal-700 border border-teal-300 flex items-center justify-center text-lg font-black shadow-xs shrink-0">
                      {finalMagicPoints}
                    </div>
                    <div className="text-xs text-teal-900 space-y-0.5">
                      <p><strong>Reame:</strong> {magicRealm}</p>
                      <p><strong>PM/lvl:</strong> x{pmPerLevel}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Box Carico e Movimento */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs">
            <div className="bg-blue-900/5 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Carico e Movimento</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4 items-stretch">
              <div className="border border-gray-150 rounded-lg p-3 bg-gray-50/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-700">Carico Trasportato</span>
                  <span className="text-[10px] text-gray-500 font-medium">Soglia: 7 kg</span>
                </div>
                <div className="flex items-center gap-4 bg-white border border-gray-150 rounded-lg p-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 border border-gray-300 flex items-center justify-center text-lg font-black shadow-xs shrink-0">
                    {Math.floor(caricoKg).toFixed(0)} kg
                  </div>
                  <div className="text-xs text-gray-800 space-y-0.5">
                    <p><strong>Peso:</strong> {caricoKg.toFixed(2)} kg</p>
                    <p className="text-[10px] text-gray-505">(Abiti/armature esclusi)</p>
                  </div>
                </div>
              </div>

              <div className={`border rounded-lg p-3 bg-gray-50/30 ${caricoBloccato ? 'border-red-200 bg-red-50/10' : (penalitaCarico > 0 ? 'border-red-200' : 'border-green-200')}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-700">Penalità di Carico</span>
                  <span className="text-[10px] text-gray-500 font-medium">TB_5</span>
                </div>
                <div className={`flex items-center gap-4 border rounded-lg p-3 bg-white ${caricoBloccato ? 'border-red-100' : (penalitaCarico > 0 ? 'border-red-100' : 'border-green-100')}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shadow-xs shrink-0 ${caricoBloccato ? 'bg-red-100 text-red-700 border-red-300' : (penalitaCarico > 0 ? 'bg-red-55 text-red-600 border-red-200' : 'bg-green-55 text-green-600 border-green-200')}`}>
                    {caricoBloccato ? 'NA' : (penalitaCarico > 0 ? `-${penalitaCarico}` : '0')}
                  </div>
                  <div className={`text-xs space-y-0.5 ${caricoBloccato || penalitaCarico > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    <p><strong>Malus:</strong> {caricoBloccato ? 'NA (ECCESSO)' : (penalitaCarico > 0 ? `-${penalitaCarico}` : 'Nessuno')}</p>
                    <p className="text-[10px] opacity-75">{caricoBloccato ? 'Peso insostenibile' : 'Applicato alle MM'}</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-550 bg-gray-50 p-3 rounded-lg border border-gray-150 flex items-center leading-relaxed">
                <span>
                  <strong>Nota:</strong> Se il personaggio corre, la penalità di carico va calcolata prima di raddoppiare la velocità.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabella Abilità Primarie Consolidate */}
        <div className="border rounded-lg overflow-hidden shadow-xs mb-6 print:break-inside-avoid" style={{ borderColor: 'var(--theme-primary-skills-border)' }}>
          <div className="px-4 py-2 border-b flex items-center gap-1.5" style={{ backgroundColor: 'var(--theme-primary-skills-bg)', borderBottomColor: 'var(--theme-primary-skills-border)', color: 'var(--theme-primary-skills-text)' }}>
            <Shield className="w-4 h-4" style={{ color: 'var(--theme-primary-skills-text)' }} />
            <span className="text-xs font-bold uppercase tracking-wider">Riepilogo Abilità Primarie</span>
          </div>
          <div className="p-4 space-y-4">
            {categories.map(cat => {
              const catSkills = primarySkillsList.filter(s => s.categoria === cat);
              if (catSkills.length === 0) return null;
              return (
                <div key={cat} className="border border-gray-100 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                    {cat}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-gray-50/20 border-b border-gray-100 text-[9px] text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-1.5">Abilità</th>
                          <th className="px-2 py-1.5 text-center">Adol.</th>
                          <th className="px-2 py-1.5 text-center">Bonus Prof.</th>
                          <th className="px-2 py-1.5 text-center">Bonus Sviluppo</th>
                          <th className="px-2 py-1.5 text-center">Bonus BG</th>
                          <th className="px-2 py-1.5 text-center font-bold">Gradi Tot.</th>
                          <th className="px-2 py-1.5 text-center">Bonus Gradi</th>
                          <th className="px-2 py-1.5 text-center">Bonus Caratt.</th>
                          <th className="px-2 py-1.5 text-center">Bonus Speciale</th>
                          <th className="px-3 py-1.5 text-center font-bold">Bonus Totale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {catSkills.map(sk => {
                          const s = finalSkills[sk.nome];
                          if (!s) return null;
                          let totalBonusStr;
                          if (sk.nome.toLowerCase() === 'resistenza fisica') {
                            // In step 10 il tiro HP è sempre già stato effettuato (prerequisito di step 8).
                            // Mostra il valore numerico finale dei PF.
                            totalBonusStr = String(finalHitPoints);
                          } else {
                            totalBonusStr = typeof s.totalBonus === 'number' ? fmt(s.totalBonus) : s.totalBonus;
                          }


                          const specialBonus = s.specialBonus || 0;
                          const hasIngombro = s.ingombroBonus !== null;
                          const hasSpecialBonus = specialBonus !== 0;
                          const displaySpecial = (hasIngombro || hasSpecialBonus) ? (specialBonus + (s.ingombroBonus ?? 0)) : null;

                          let rowClass = "hover:bg-gray-50/30 transition-colors";
                          const isArmorHighlight = cat === 'di manovra e movimento' && sk.nome.toLowerCase() === highlightedArmorSkill.toLowerCase();
                          const isWeaponHighlight = cat === 'con le armi' && highlightedWeaponSkill && sk.nome.toLowerCase() === highlightedWeaponSkill.toLowerCase();
                          
                          if (isArmorHighlight || isWeaponHighlight) {
                            rowClass = "bg-teal-50 hover:bg-teal-100/50 font-medium transition-colors";
                          }

                          return (
                            <tr key={sk.nome} className={rowClass}>
                              <td className="px-3 py-2 font-medium text-gray-800">{sk.nome}</td>
                              <td className="px-2 py-2 text-center text-gray-400">{s.adRanks}</td>
                              <td className="px-2 py-2 text-center text-blue-700">{s.profRanks}</td>
                              <td className="px-2 py-2 text-center text-purple-700">{s.tgp4Ranks}</td>
                              <td className="px-2 py-2 text-center text-purple-900">{s.bgExtra > 0 ? `+${s.bgExtra}` : '0'}</td>
                              <td className="px-2 py-2 text-center font-bold text-gray-900">{s.totalRanks}</td>
                              <td className="px-2 py-2 text-center text-gray-700">{typeof s.bonusGradi === 'number' ? fmt(s.bonusGradi) : s.bonusGradi}</td>
                              <td className="px-2 py-2 text-center text-gray-500 font-light">{s.carattSigla} {fmt(s.carattBonus)}</td>
                              <td className="px-2 py-2 text-center text-gray-400">{displaySpecial !== null ? fmt(displaySpecial) : '—'}</td>
                              <td className="px-3 py-2 text-center font-black text-sm text-indigo-950">{totalBonusStr}</td>
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
        </div>

        {/* Abilità Secondarie consolidata (se presenti) */}
        {Object.keys(bgModifiers.secondarySkills || {}).length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs mb-6 print:break-inside-avoid">
            <div className="px-4 py-2 border-b flex items-center gap-1.5" style={{ backgroundColor: 'var(--theme-secondary-skills-bg)', borderBottomColor: 'var(--theme-secondary-skills-border)', color: 'var(--theme-secondary-skills-text)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--theme-secondary-skills-text)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-secondary-skills-text)' }}>Abilità Secondarie</span>
            </div>
            <div className="p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 font-bold uppercase">
                    <th className="px-3 py-2">Abilità</th>
                    <th className="px-3 py-2">Descrizione</th>
                    <th className="px-2 py-2 text-center">Bonus Caratteristica</th>
                    <th className="px-2 py-2 text-center">Bonus BG</th>
                    <th className="px-3 py-2 text-center">Bonus Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.values(bgModifiers.secondarySkills).map(sk => {
                    const carattSigla = sk.caratteristica_associata;
                    const carattBonus = carattSigla ? (finalStats[carattSigla]?.bonusTot || 0) : 0;
                    const ranksBonus = sk.bgRanks ? getRanksBonus(sk.abilita_secondaria, sk.bgRanks) : -25;
                    const specialBonus = sk.specialBonus || 0;

                    let bgTextParts = [];
                    if (sk.bgRanks) bgTextParts.push(`Gradi: ${fmt(ranksBonus)}`);
                    else bgTextParts.push(`Non add.: -25`);
                    if (sk.specialBonus) bgTextParts.push(`Spec.: ${fmt(specialBonus)}`);

                    const totalBonus = ranksBonus + specialBonus + carattBonus;

                    return (
                      <tr key={sk.abilita_secondaria} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-bold text-gray-800">{sk.abilita_secondaria}</td>
                        <td className="px-3 py-2 text-gray-600 text-[11px] whitespace-normal leading-relaxed">{sk.descrizione}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{carattSigla} {fmt(carattBonus)}</td>
                        <td className="px-2 py-2 text-center text-purple-700 text-[10px]">{bgTextParts.join(', ')}</td>
                        <td className="px-3 py-2 text-center font-black text-indigo-900">{fmt(totalBonus)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Liste Incantesimi consolidata */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs mb-6 print:break-inside-avoid">
          <div className="px-4 py-2 border-b flex items-center gap-1.5" style={{ backgroundColor: 'var(--theme-spell-lists-bg)', borderBottomColor: 'var(--theme-spell-lists-border)', color: 'var(--theme-spell-lists-text)' }}>
            <BookOpen className="w-4 h-4" style={{ color: 'var(--theme-spell-lists-text)' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-spell-lists-text)' }}>Liste e Incantesimi Appresi</span>
          </div>
          <div className="p-4 space-y-4">
            {allLearnedLists.length === 0 ? (
              <div className="p-4 border border-dashed border-purple-200 rounded-lg text-center text-purple-500 italic text-sm">
                Nessuna lista di incantesimi appresa.
              </div>
            ) : (
              <div className="space-y-4">
                {allLearnedLists.map(listName => {
                  const limit = getSpellLimitForProfessionAndRealm(profession.professione, listName, finalLevel);
                  const rawSpells = getSpellsForList(listName);
                  const spells = rawSpells.filter(s => parseInt(s.livello) <= limit);

                  const isFromTgp4 = spellListAllocations[listName] !== undefined;
                  const isFromBg = bgSpellLists.includes(listName);
                  let sourceText = [];
                  if (isFromTgp4) sourceText.push(spellListAllocations[listName]);
                  if (isFromBg) sourceText.push(`Background`);

                  return (
                    <div key={listName} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--theme-spell-lists-border)' }}>
                      <div className="px-4 py-2 flex justify-between items-center border-b" style={{ backgroundColor: 'var(--theme-spell-lists-bg)', borderBottomColor: 'var(--theme-spell-lists-border)' }}>
                        <span className="font-bold text-sm" style={{ color: 'var(--theme-spell-lists-text)' }}>{listName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-spell-lists-text)', color: '#fff' }}>
                          Appresa in: {sourceText.join(' + ')} (Limite liv. {limit})
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-[10px] font-bold border-b" style={{ backgroundColor: 'rgba(254, 226, 226, 0.3)', borderBottomColor: 'var(--theme-spell-lists-border)', color: 'var(--theme-spell-lists-text)' }}>
                              <th className="px-2 py-1.5 text-center w-8">#</th>
                              <th className="px-2 py-1.5">Incantesimo</th>
                              <th className="px-2 py-1.5 w-20">Classe</th>
                              <th className="px-2 py-1.5 text-center w-4" title="Istantaneo">*</th>
                              <th className="px-2 py-1.5 w-16">Efficacia</th>
                              <th className="px-2 py-1.5 w-14">Durata</th>
                              <th className="px-2 py-1.5 w-14">Raggio</th>
                              <th className="px-2 py-1.5">Descrizione</th>
                            </tr>
                          </thead>
                          <tbody>
                            {spells.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="p-3 text-center text-gray-400 italic">
                                  Nessun incantesimo utilizzabile a questo livello.
                                </td>
                              </tr>
                            ) : (
                              spells.map((s, i) => {
                                const tipoInfo = TIPO_LABELS[s.tipo_incantesimo] || { label: s.tipo_incantesimo || '—', color: '#6b7280' };
                                return (
                                <tr key={i} className="hover:bg-red-50/10" style={{ borderBottom: i === spells.length - 1 ? 'none' : '1px solid var(--theme-spell-lists-border)' }}>
                                  <td className="px-2 py-2 text-center font-bold" style={{ color: 'var(--theme-spell-lists-text)', fontSize: '0.75rem' }}>{s.livello}</td>
                                  <td className="px-2 py-2 font-bold text-gray-900" style={{ fontSize: '0.75rem' }}>{s.nome_incantesimo}</td>
                                  <td className="px-2 py-2 text-center" style={{ fontSize: '0.65rem', fontWeight: 700, color: tipoInfo.color }}>{tipoInfo.label}</td>
                                  <td className="px-2 py-2 text-center" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626' }}>{s.istantaneo ? '*' : ''}</td>
                                  <td className="px-2 py-2" style={{ fontSize: '0.68rem', color: '#64748b' }}>{s.efficacia || '—'}</td>
                                  <td className="px-2 py-2" style={{ fontSize: '0.68rem', color: '#64748b' }}>{s.durata || '—'}</td>
                                  <td className="px-2 py-2" style={{ fontSize: '0.68rem', color: '#64748b' }}>{s.raggio_azione || '—'}</td>
                                  <td className="px-2 py-2 text-gray-600" style={{ fontSize: '0.68rem', lineHeight: '1.3' }}>{s.descrizione_incantesimo}</td>
                                </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Inventario Personaggio */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs mb-6 print:break-inside-avoid">
          <div className="px-4 py-2 border-b flex items-center justify-between bg-amber-500/5 border-amber-200 text-amber-950">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Inventario & Equipaggiamento</span>
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-850 px-2.5 py-0.5 rounded">
              Portafoglio Residuo: {formatCoinsToString(formatMBToCoins(characterData.portafoglioMB || 0))}
            </span>
          </div>
          <div className="p-4">
            {(!characterData.equipment || characterData.equipment.length === 0) ? (
              <div className="text-center py-6 text-gray-400 italic text-xs">Inventario vuoto. Acquista oggetti nello step di Equipaggiamento.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Colonna EQUIP */}
                <div className="border border-gray-100 rounded-md p-3 bg-gray-50/30">
                  <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">Equipaggiamento Indossato / Pronto (EQUIP)</h5>
                  <ul className="space-y-1.5 text-xs">
                    {characterData.equipment.filter(x => x.qtyEquip > 0).map((item, idx) => {
                      const isScasso = item.nome.toLowerCase().includes('attrezzi da scasso');
                      return (
                        <li key={idx} className={`flex justify-between items-start py-1 border-b border-gray-100/50 last:border-0 px-2 rounded ${isScasso ? 'bg-teal-50' : ''}`}>
                          <div>
                            <strong className="text-gray-900">{item.nome}</strong> {item.qtyEquip > 1 && <span className="text-gray-500 font-bold">x{item.qtyEquip}</span>}
                            {item.note && <span className="text-[10px] text-gray-500 block italic">{item.note}</span>}
                          </div>
                          <span className="text-[10px] text-gray-450 font-semibold">(Non genera carico)</span>
                        </li>
                      );
                    })}
                    {characterData.equipment.filter(x => x.qtyEquip > 0).length === 0 && (
                      <li className="text-gray-400 italic">Nessun oggetto.</li>
                    )}
                  </ul>
                </div>

                {/* Colonna CARICO */}
                <div className="border border-gray-100 rounded-md p-3 bg-gray-50/30">
                  <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">Carico Trasportato (Genera Peso)</h5>
                  <ul className="space-y-1.5 text-xs">
                    {characterData.equipment.filter(x => x.qtyCarico > 0).map((item, idx) => {
                      const itemPeso = item["peso in kg"] || 0;
                      const totPeso = item.qtyCarico * itemPeso;
                      const isScasso = item.nome.toLowerCase().includes('attrezzi da scasso');
                      return (
                        <li key={idx} className={`flex justify-between items-start py-1 border-b border-gray-100/50 last:border-0 px-2 rounded ${isScasso ? 'bg-teal-50' : ''}`}>
                          <div>
                            <strong className="text-gray-900">{item.nome}</strong> {item.qtyCarico > 1 && <span className="text-gray-500 font-bold">x{item.qtyCarico}</span>}
                            {item.note && <span className="text-[10px] text-gray-500 block italic">{item.note}</span>}
                          </div>
                          <span className="text-[10px] text-gray-600 font-bold">{totPeso.toFixed(1)} kg</span>
                        </li>
                      );
                    })}
                    {characterData.equipment.filter(x => x.qtyCarico > 0).length === 0 ? (
                      <li className="text-gray-400 italic">Nessun oggetto.</li>
                    ) : (
                      <li className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 font-bold text-gray-900">
                        <span>Peso Totale Trasportato</span>
                        <span className="text-[10px] text-gray-800">{caricoKg.toFixed(1)} kg</span>
                      </li>
                    )}
                  </ul>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Lingue e Dettagli */}
        <div className="grid md:grid-cols-2 gap-6 print:break-inside-avoid">
          
          {/* Box Lingue */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-2 border-b flex items-center gap-1.5" style={{ backgroundColor: 'var(--theme-languages-bg)', borderBottomColor: 'var(--theme-languages-border)', color: 'var(--theme-languages-text)' }}>
              <Globe className="w-4 h-4" style={{ color: 'var(--theme-languages-text)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-languages-text)' }}>Gradi di Lingue</span>
            </div>
            <div className="p-4">
              <div className="grid gap-2">
                {finalLanguages.map(([lang, data]) => {
                  // Recupera la somma dei gradi (base + aggiunti in creazione + acquistati in activeLevels)
                  const lvlDevelopmentsLangs = levelDevelopments.reduce((sum, d) => sum + (d.languages?.[lang] || 0), 0);
                  const total = (data.base || 0) + (data.added || 0) + lvlDevelopmentsLangs;
                  const desc = gradiLingue.find(g => g.grado === Math.min(5, Math.max(1, total)));

                  return (
                    <div key={lang} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-gray-800 block">{lang}</span>
                        {desc && <span className="text-[10px] text-gray-500 leading-snug block mt-0.5">{desc.conoscenza}</span>}
                      </div>
                      <span className="text-[11px] font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full whitespace-nowrap self-start">
                        Grado {total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Box Dettagli Background */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-2 border-b flex items-center gap-1.5" style={{ backgroundColor: 'var(--theme-background-bg)', borderBottomColor: 'var(--theme-background-border)', color: 'var(--theme-background-text)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--theme-background-text)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-background-text)' }}>Note e Background</span>
            </div>
            <div className="p-4 space-y-3">
              {bgOptions.map((opt, idx) => {
                let detail = '';
                if (opt.category === 'Gradi delle abilità') {
                  detail = opt.subChoice === 'A' ? `+2 gradi | ${opt.skillName}` : `+5 gradi sec. | ${opt.skillName}`;
                } else if (opt.category === 'Aumento delle caratteristiche') {
                  detail = opt.subChoice === 'A' ? `+2 | ${opt.stats?.[0]}` : `+1 ciascuna | ${opt.stats?.join(', ')}`;
                } else if (opt.category === 'Lingue') {
                  detail = `Grado 5 | ${opt.skillName}`;
                } else if (opt.category === 'abilità speciali') {
                  detail = opt.calculatedText || opt.oggetto;
                  if (opt.customNote) detail += ` | ${opt.customNote}`;
                } else if (opt.category === 'oggetti speciali') {
                  detail = opt.oggetto;
                  if (opt.customNote) detail += ` | ${opt.customNote}`;
                } else if (opt.category === "denaro: monete d'oro") {
                  detail = `${opt.calculatedMO} MO`;
                } else if (opt.category === 'Lista incantesimi aggiuntiva') {
                  detail = `Lista: ${opt.skillName}`;
                }

                return (
                  <div key={opt.id} className="flex gap-2.5 items-start text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[10px] text-indigo-700 shrink-0 mt-0.5">{idx + 1}</span>
                    <div>
                      <strong className="text-gray-900 text-[11px] block">{opt.category}</strong>
                      <span className="text-gray-600 block">{detail}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Note Speciali */}
        {bgModifiers.specialNotes && bgModifiers.specialNotes.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs mt-6 print:break-inside-avoid">
            <div className="px-4 py-2 border-b flex items-center gap-1.5 bg-slate-100 border-b-slate-200 text-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider">Note Speciali</span>
            </div>
            <div className="p-4">
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                {bgModifiers.specialNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Storia del personaggio */}
        {characterData.history && characterData.history.trim() !== '' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs mt-6 print:break-inside-avoid">
            <div className="px-4 py-2 border-b flex items-center gap-1.5 text-gray-700 bg-gray-50 border-b-gray-200">
              <Scroll className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Storia del personaggio</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-750 leading-relaxed whitespace-pre-wrap font-serif italic" style={{ fontStyle: 'italic' }}>
                {characterData.history}
              </p>
            </div>
          </div>
        )}

        {/* Taccuino Personale / Note del Giocatore */}
        {characterData.id && (
          <div className="border rounded-lg overflow-hidden shadow-xs mt-6 print:break-inside-avoid" style={{ borderColor: 'var(--warning-color)', backgroundColor: 'rgba(217, 119, 6, 0.03)' }}>
            <div className="px-4 py-2 border-b flex items-center justify-between" style={{ backgroundColor: 'rgba(217, 119, 6, 0.08)', borderBottomColor: 'rgba(217, 119, 6, 0.2)' }}>
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs" style={{ color: 'var(--warning-color)' }}>
                <BookOpen className="w-4 h-4" />
                <span>Taccuino del Giocatore</span>
              </div>
              {isGM ? (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                  Sola Lettura (GM)
                </span>
              ) : (
                <span className="text-[9px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded uppercase" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                  Modificabile
                </span>
              )}
            </div>
            <div className="p-4">
              {isGM ? (
                <div 
                  className="p-3 bg-white border rounded-lg min-h-[100px] whitespace-pre-wrap text-xs text-gray-700 font-serif italic leading-relaxed"
                  style={{ fontStyle: 'italic', borderColor: 'var(--border-color)' }}
                >
                  {notesText.trim() || "Il giocatore non ha ancora scritto note per questo personaggio."}
                </div>
              ) : (
                <div className="space-y-3 flex flex-col gap-2">
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Scrivi qui i tuoi appunti personali per questo personaggio (es. indizi, quest, inventario aggiuntivo, relazioni)..."
                    className="w-full min-h-[150px] p-3 text-xs border rounded-lg focus:outline-none bg-white text-gray-800 font-serif leading-relaxed"
                    style={{ resize: "vertical", borderColor: 'var(--border-color)' }}
                  />
                  <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-[10px] text-gray-500">
                      {notes?.updatedAt ? `Ultimo aggiornamento: ${new Date(notes.updatedAt.seconds * 1000).toLocaleString()}` : "Nessun salvataggio precedente"}
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="btn btn-primary"
                      style={{ 
                        backgroundColor: 'var(--warning-color)', 
                        borderColor: 'var(--warning-color)', 
                        color: 'white', 
                        padding: '0.4rem 1rem', 
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        opacity: savingNotes ? 0.6 : 1
                      }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingNotes ? "Salvataggio..." : "Salva Note"}
                    </button>
                  </div>
                  {saveSuccess && (
                    <div className="text-[10px] text-green-700 font-bold mt-1 text-right" style={{ textAlign: 'right', color: '#15803d', fontWeight: 'bold' }}>
                      ✓ Note salvate correttamente su Cloud Firestore!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
