import { useState, useEffect, useMemo } from 'react';
import { Swords, RotateCcw, AlertTriangle, AlertOctagon, Play, HelpCircle, Heart, Shield, Sparkles, Target, User } from 'lucide-react';
import attackTables from '../data/Tabelle-Attacco-TA-1_TA-2_TA-3_TA-4.json';
import ta5ZanneArtigli from '../data/TA-5-zanne_e_artigli.json';
import ta6ImmobilizzSbilanc from '../data/TA-6-immobilizzazione_sbilanciamento.json';
import animalAttackStats from '../data/TSC-2-statistiche_degli_animali.json';
import FumbleResolver from './FumbleResolver';
import CriticalResolver from './CriticalResolver';
import { resolveSpellAttack } from '../utils/spellHelpers';
import {
  getFinalStats,
  getSpecificTb6Ranks,
  getProfessionRanksForLevel,
  getRanksBonus,
  getIngombroBonus,
  parseBonusValue,
  fmt,
  getCharacterHpTot,
  getCharacterSkillBonus
} from '../utils/skillHelpers';

const WEAPON_SKILL_TO_TABLE = {
  'taglio a 1 mano': 'TA-1',
  'contundenti a 1 mano': 'TA-2',
  'a 2 mani': 'TA-3',
  'da tiro': 'TA-4',
  'con asta': 'TA-3', // le armi con asta usano armi a due mani TA-3
  'da lancio': 'TA-1', // default, verrà mappata dinamicamente
  'dardo': 'TA-7',
  'sfera': 'TA-8',
  'zanne_e_artigli': 'TA-5',
  'immobilizzazione_sbilanciamento': 'TA-6'
};

const TABLE_NAMES = {
  'TA-1': 'Armi da Taglio a una Mano (TA-1)',
  'TA-2': 'Armi Contundenti a una Mano (TA-2)',
  'TA-3': 'Armi a Due Mani (TA-3)',
  'TA-4': 'Armi da Tiro (TA-4)',
  'TA-5': 'Zanne e Artigli (TA-5)',
  'TA-6': 'Immobilizzazione e Sbilanciamento (TA-6)',
  'TA-7': 'Incantesimi Dardo (TA-7)',
  'TA-8': 'Incantesimi Sfera (TA-8)'
};

const ARMOR_COLUMNS = {
  'nessuna': 'nessuna_armatura',
  'cuoio_grezzo': 'cuoio_grezzo',
  'cuoio_rinforzato': 'cuoio_rinforzato',
  'maglia': 'corazza_di_maglie',
  'piastre': 'corazza_di_piastre'
};

const ARMOR_DISPLAY = {
  'nessuna': 'Nessuna Armatura',
  'cuoio_grezzo': 'Cuoio Grezzo',
  'cuoio_rinforzato': 'Cuoio Rinforzato',
  'maglia': 'Corazza di Maglia',
  'piastre': 'Corazza di Piastre'
};

const CRITICAL_MODIFIERS = {
  'A': -20,
  'B': -10,
  'C': 0,
  'D': 10,
  'E': 20,
  'T': -50
};

// Helper per determinare la categoria di skill associata ad un'arma
const getSkillForWeapon = (item) => {
  const nome = (item.nome || '').toLowerCase();
  const note = (item.note || item.note_base || '').toLowerCase();
  
  if (nome.includes('dardo') || note.includes('dardo')) {
    return 'dardo';
  }
  if (nome.includes('sfera') || note.includes('sfera')) {
    return 'sfera';
  }
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

const getFumbleModifierForWeapon = (category, name) => {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (cat === 'da tiro' || cat === 'da lancio') {
    if (n.includes('balestra')) return 20;
    if (n.includes('arco lungo')) return 10;
    if (n.includes('arco composto')) return 0;
    if (n.includes('arco corto')) return -10;
    if (n.includes('fionda')) return -20;
    return 0;
  } else {
    if (cat === 'taglio a 1 mano') return -10;
    if (cat === 'contundenti a 1 mano') return -20;
    if (cat === 'con asta') return 10;
    if (cat === 'a 2 mani') return 0;
    return 0;
  }
};

const getCriticalTableForWeapon = (category, name) => {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  
  if (cat === 'dardo' || cat === 'sfera') {
    if (n.includes('fuoco') || n.includes('calore')) return 'TC-6';
    if (n.includes('ghiaccio') || n.includes('freddo')) return 'TC-7';
    if (n.includes('fulmine') || n.includes('elettricità') || n.includes('fulm')) return 'TC-8';
    if (n.includes('impatto') || n.includes('energia') || n.includes('acqua')) return 'TC-1';
    return 'TC-6'; // default
  }
  if (cat === 'contundenti a 1 mano') return 'TC-1'; // Impatto
  if (cat === 'da tiro' || cat === 'da lancio') {
    if (n.includes('fionda') || n.includes('sasso') || n.includes('pietra') || n.includes('bolas')) {
      if (n.includes('bolas')) return 'TC-4'; // Perdita equilibrio
      return 'TC-1'; // Impatto
    }
    return 'TC-3'; // Punta
  }
  if (cat === 'con asta') {
    if (n.includes('ascia') || n.includes('alabarda')) return 'TC-2'; // Taglio
    return 'TC-3'; // Punta
  }
  if (cat === 'a 2 mani') {
    if (n.includes('martello') || n.includes('mazza')) return 'TC-1'; // Impatto
    return 'TC-2'; // Taglio
  }
  // Taglio a 1 mano
  if (n.includes('stocco') || n.includes('daga') || n.includes('pugnale')) {
    return 'TC-3'; // Punta
  }
  return 'TC-2'; // Taglio (default)
};

export default function CombatCalculator({ 
  savedCharacters, 
  campaignNpcs = [], 
  campaignCreatures = [], 
  onUpdateActorHp, 
  equipmentCatalog = [], 
  onUpdateHpSubiti, 
  onUpdateBoSpesoParata, 
  onResetAllParries 
}) {
  // --- STATO ATTACCANTE ---
  const [attackerId, setAttackerId] = useState('custom');
  const [customAttackerName, setCustomAttackerName] = useState('Attaccante Generico');
  const [attackerBO, setAttackerBO] = useState(50);
  const [attackerWeaponCat, setAttackerWeaponCat] = useState('taglio a 1 mano');
  const [attackerWeaponName, setAttackerWeaponName] = useState('Spada Larga');
  const [attackerHpTot, setAttackerHpTot] = useState(40);
  const [attackerHpSubiti, setAttackerHpSubiti] = useState(0);
  const [selectedCreatureAttackIdx, setSelectedCreatureAttackIdx] = useState(0); // 0 per Attacco_uno, 1 per Attacco_due

  // --- STATO DIFENSORE ---
  const [defenderId, setDefenderId] = useState('custom');
  const [customDefenderName, setCustomDefenderName] = useState('Difensore Generico');
  const [defenderBD, setDefenderBD] = useState(15);
  const [defenderArmor, setDefenderArmor] = useState('cuoio_grezzo');
  const [defenderParry, setDefenderParry] = useState(0);
  const [defenderHpTot, setDefenderHpTot] = useState(40);
  const [defenderHpSubiti, setDefenderHpSubiti] = useState(0);
  const [selectedDefenderWeaponIdx, setSelectedDefenderWeaponIdx] = useState(0);
  const [customDefenderBO, setCustomDefenderBO] = useState(50);
  const [useShield, setUseShield] = useState(false);

  // --- STATO FUMBLE ---
  const [showFumbleResolver, setShowFumbleResolver] = useState(false);
  const [fumbleTableCode, setFumbleTableCode] = useState('TTM-1');
  const [fumbleDiceRoll, setFumbleDiceRoll] = useState(50);

  // --- STATO CRITICO ---
  const [showCriticalResolver, setShowCriticalResolver] = useState(false);
  const [critTableCode, setCritTableCode] = useState('TC-2');
  const [critSeverity, setCritSeverity] = useState('C');
  const [critDiceRoll, setCritDiceRoll] = useState(50);

  // --- MODIFICATORI E DADO ---
  const [flankAttack, setFlankAttack] = useState(false);
  const [backAttack, setBackAttack] = useState(false);
  const [surprisedDefender, setSurprisedDefender] = useState(false);
  const [stunnedDefender, setStunnedDefender] = useState(false);
  const [movementMetres, setMovementMetres] = useState(0);
  const [drawOrSwapWeapon, setDrawOrSwapWeapon] = useState(false);
  const [gmBonus, setGmBonus] = useState(0);

  const [diceRoll, setDiceRoll] = useState(50);
  const [manualRoll, setManualRoll] = useState('50');
  const [combatOutcome, setCombatOutcome] = useState(null);

  // --- DATI ROSTER COMPUTATI ---
  const processedRoster = useMemo(() => {
    return savedCharacters.map(char => {
      const race = char.race;
      const profession = char.profession;
      const stats = char.stats || {};
      const levelDevelopments = char.levelDevelopments || [];
      const finalLevel = 1 + levelDevelopments.length;
      
      const bgData = char.background || { languages: {}, options: [] };
      const bgModifiers = bgData.compiledModifiers || { statsBonus: {}, skillBgRanks: {}, secondarySkills: {}, gold: 0 };
      
      // 1. Final stats
      const finalStats = getFinalStats(stats, race, bgModifiers);
      
      // 2. Weapon skills
      const weaponSkillNames = [
        'taglio a 1 mano',
        'contundenti a 1 mano',
        'a 2 mani',
        'da tiro',
        'da lancio',
        'con asta',
        'dardo',
        'sfera'
      ];
      
      const skillBonuses = {};
      weaponSkillNames.forEach(name => {
        skillBonuses[name] = getCharacterSkillBonus(char, name);
      });
      
      // 3. Bonus Difensivo (BD)
      const bdBase = finalStats['AG']?.bonusTot || 0;
      const bdSpecial = bgModifiers.bdSpecialBonus || 0;
      const finalBD = bdBase + bdSpecial;
      
      // 4. Equipped Armor type mapping
      let mappedArmor = 'nessuna';
      const eqArmor = (char.equippedArmor || '').toLowerCase();
      if (eqArmor.includes('grezzo')) mappedArmor = 'cuoio_grezzo';
      else if (eqArmor.includes('rinforzato')) mappedArmor = 'cuoio_rinforzato';
      else if (eqArmor.includes('maglia')) mappedArmor = 'maglia';
      else if (eqArmor.includes('piastre')) mappedArmor = 'piastre';
      
      // 5. HP Totali
      const hpTot = getCharacterHpTot(char);
      
      // 6. Inventory weapons list (case-insensitive category match & qty check)
      const inventoryWeapons = (char.equipment || [])
        .filter(item => {
          const isWeapon = (item.categoria || '').toLowerCase().trim() === 'armi';
          const hasQty = (item.qtyEquip || 0) > 0 || (item.qtyCarico || 0) > 0 || (item.qty || 0) > 0;
          return isWeapon && hasQty;
        })
        .map(item => {
          const skillName = getSkillForWeapon(item);
          const baseBO = skillBonuses[skillName] || 0;
          return {
            nome: item.nome,
            skillName,
            bo: baseBO
          };
        });
      
      // Fallback armi generiche se l'inventario è vuoto
      if (inventoryWeapons.length === 0) {
        weaponSkillNames.forEach(skillName => {
          if (skillBonuses[skillName] > 0 || skillName === 'taglio a 1 mano') {
            inventoryWeapons.push({
              nome: `Arma da ${skillName} (Generica)`,
              skillName,
              bo: skillBonuses[skillName] || 0
            });
          }
        });
      }

      // Rilevamento protezioni aggiuntive (scudo, bracciali metallo, schinieri metallo, elmo metallo)
      const equippedItems = (char.equipment || []).filter(x => (x.qtyEquip || 0) > 0);
      const hasShield = equippedItems.some(x => x.nome.toLowerCase().includes('scudo'));
      
      const braccialiItem = equippedItems.find(x => x.nome.toLowerCase().includes('bracciali'));
      const hasMetalBracciali = braccialiItem ? braccialiItem.nome.toLowerCase().includes('metallo') : false;
      
      const schinieriItem = equippedItems.find(x => x.nome.toLowerCase().includes('schinieri'));
      const hasMetalSchinieri = schinieriItem ? schinieriItem.nome.toLowerCase().includes('metallo') : false;
      
      const elmoItem = equippedItems.find(x => x.nome.toLowerCase().includes('elmo'));
      const hasMetalElmo = elmoItem ? elmoItem.nome.toLowerCase().includes('metallo') : false;
      
      return {
        id: char.id,
        name: char.name,
        equippedArmor: mappedArmor,
        bd: finalBD,
        hpTot,
        hpSubiti: char.hpSubiti || 0,
        boSpesoParata: char.boSpesoParata || 0,
        weapons: inventoryWeapons,
        skillBonuses,
        hasShield,
        hasMetalBracciali,
        hasMetalSchinieri,
        hasMetalElmo
      };
    });
  }, [savedCharacters]);

  // Helper per determinare la taglia e la sua riga massima (capping)
  const getCreatureSizeCap = (sizeStr) => {
    const norm = (sizeStr || '').toLowerCase().trim();
    if (norm.includes('piccolissimo') || norm === 'minuscolo') return 85;
    if (norm.includes('piccolo')) return 105;
    if (norm.includes('medio')) return 120;
    if (norm.includes('grande')) return 135;
    if (norm.includes('enorme')) return 150;
    return 150;
  };

  // Helper per mappare la taglia della creatura all'armatura MERP standard
  const mapCreatureArmor = (armorStr) => {
    const norm = (armorStr || '').toLowerCase().trim();
    if (norm.includes('piastra') || norm.includes('piastre')) return 'piastre';
    if (norm.includes('maglia') || norm.includes('maglie')) return 'maglia';
    if (norm.includes('rinforzato') || norm.includes('rinforzata')) return 'cuoio_rinforzato';
    if (norm.includes('grezzo') || norm.includes('morbido') || norm.includes('morbida') || norm.includes('cuoio')) return 'cuoio_grezzo';
    return 'nessuna';
  };

  // Helper per trovare l'attacco della creatura nel dataset TSC-2
  const getCreatureAttackDetails = (attackString) => {
    if (!attackString) return null;
    const match = attackString.match(/\(([^)]+)\)/);
    if (!match) return null;
    const abbr = match[1].toLowerCase().trim();
    
    const stat = animalAttackStats.find(s => {
      const sAbbr = (s["(Abbreviazione)"] || "").replace(/[()]/g, "").toLowerCase().trim();
      return sAbbr === abbr;
    });
    return stat || null;
  };

  // Helper per mappare abbreviazione critico creatura alla tabella MERP
  const mapCreatureCritToTable = (critStr) => {
    const norm = (critStr || '').trim().toUpperCase();
    if (norm.startsWith('IM')) return 'TC-1';
    if (norm.startsWith('TA')) return 'TC-2';
    if (norm.startsWith('PU')) return 'TC-3';
    if (norm.startsWith('PE')) return 'TC-4';
    if (norm.startsWith('PR')) return 'TC-5';
    return 'TC-2';
  };

  // Helper per cercare il risultato per range (TA-5 e TA-6)
  const findRangeRow = (jsonList, rollResult) => {
    return jsonList.find(row => {
      const rawRange = row.risultato_del_tiro;
      if (!rawRange) return false;
      
      let cleanRange = rawRange.replace(/[a-zA-Z]/g, "").trim();
      const parts = cleanRange.split('-');
      if (parts.length === 2) {
        const min = parseInt(parts[0], 10);
        const max = parseInt(parts[1], 10);
        return rollResult >= min && rollResult <= max;
      }
      
      const parsedVal = parseInt(cleanRange, 10);
      if (!isNaN(parsedVal)) {
        return rollResult === parsedVal;
      }
      
      return false;
    });
  };

  // Seleziona arma per attaccante da roster
  const [selectedWeaponIdx, setSelectedWeaponIdx] = useState(0);

  // Risoluzione compatta dell'attaccante attivo (PG, PNG o Creatura)
  const attackerInfo = useMemo(() => {
    if (attackerId === 'custom') {
      return {
        type: 'custom',
        name: customAttackerName,
        bo: attackerBO,
        hpTot: attackerHpTot,
        hpSubiti: attackerHpSubiti,
        weapons: [],
        size: 'medio'
      };
    }
    
    if (attackerId.startsWith('pc-')) {
      const pcId = attackerId.substring(3);
      const pc = processedRoster.find(c => c.id === pcId);
      if (!pc) return null;
      return {
        type: 'pc',
        id: pc.id,
        name: pc.name,
        bo: pc.weapons[selectedWeaponIdx]?.bo || 0,
        hpTot: pc.hpTot,
        hpSubiti: pc.hpSubiti || 0,
        boSpesoParata: pc.boSpesoParata || 0,
        weapons: pc.weapons,
        size: 'medio',
        hasShield: pc.hasShield,
        hasMetalBracciali: pc.hasMetalBracciali,
        hasMetalSchinieri: pc.hasMetalSchinieri,
        hasMetalElmo: pc.hasMetalElmo
      };
    }
    
    if (attackerId.startsWith('npc-')) {
      const npcId = attackerId.substring(4);
      const npc = campaignNpcs.find(n => n.id === npcId);
      if (!npc) return null;
      
      const npcWeapons = [];
      if (npc.skills) {
        if (npc.skills["Arma primaria"] !== undefined) {
          npcWeapons.push({ nome: `Arma Primaria`, bo: npc.skills["Arma primaria"], skillName: "taglio a 1 mano" });
        }
        if (npc.skills["Arma secondaria"] !== undefined) {
          npcWeapons.push({ nome: `Arma Secondaria`, bo: npc.skills["Arma secondaria"], skillName: "taglio a 1 mano" });
        }
        if (npc.skills["Arma terziaria"] !== undefined) {
          npcWeapons.push({ nome: `Arma Terziaria`, bo: npc.skills["Arma terziaria"], skillName: "taglio a 1 mano" });
        }
        if (npc.skills["Arma altre"] !== undefined) {
          npcWeapons.push({ nome: `Arma Altre`, bo: npc.skills["Arma altre"], skillName: "taglio a 1 mano" });
        }
        if (npc.skills["Incantesimi diretti"] !== undefined) {
          npcWeapons.push({ nome: `Incantesimi Diretti`, bo: npc.skills["Incantesimi diretti"], skillName: "dardo" });
        }
      }
      
      if (npcWeapons.length === 0) {
        npcWeapons.push({ nome: "Attacco Base", bo: 0, skillName: "taglio a 1 mano" });
      }
      
      const selectedW = npcWeapons[selectedWeaponIdx] || npcWeapons[0];
      
      return {
        type: 'npc',
        id: npc.id,
        name: npc.name,
        bo: selectedW.bo,
        hpTot: npc.hpMax || 0,
        hpSubiti: (npc.hpMax || 0) - (npc.hpCorrenti !== undefined ? npc.hpCorrenti : (npc.hpMax || 0)),
        weapons: npcWeapons,
        size: 'medio'
      };
    }
    
    if (attackerId.startsWith('creature-')) {
      const creatureId = attackerId.substring(9);
      const creature = campaignCreatures.find(c => c.id === creatureId);
      if (!creature) return null;
      
      const creatureWeapons = [];
      if (creature.Attacco_uno) {
        creatureWeapons.push({
          nome: creature.Attacco_uno,
          bo: creature.Attacco_uno_BO || 0,
          isCreatureAttack: true,
          attackType: 'Attacco_uno'
        });
      }
      if (creature.Attacco_due) {
        creatureWeapons.push({
          nome: creature.Attacco_due,
          bo: creature.Attacco_due_BO || 0,
          isCreatureAttack: true,
          attackType: 'Attacco_due'
        });
      }
      
      if (creatureWeapons.length === 0) {
        creatureWeapons.push({ nome: "Attacco Base", bo: 0, isCreatureAttack: true, attackType: 'Attacco_uno' });
      }
      
      const selectedW = creatureWeapons[selectedWeaponIdx] || creatureWeapons[0];
      
      return {
        type: 'creature',
        id: creature.id,
        name: creature.Nome,
        bo: selectedW.bo,
        hpTot: creature.punti_ferita || 0,
        hpSubiti: (creature.punti_ferita || 0) - (creature.hpCorrenti !== undefined ? creature.hpCorrenti : (creature.punti_ferita || 0)),
        weapons: creatureWeapons,
        size: creature.Dimensioni_animale || 'medio'
      };
    }
    
    return null;
  }, [attackerId, customAttackerName, attackerBO, attackerHpTot, attackerHpSubiti, processedRoster, campaignNpcs, campaignCreatures, selectedWeaponIdx]);

  // Risoluzione compatta del difensore attivo (PG, PNG o Creatura)
  const defenderInfo = useMemo(() => {
    if (defenderId === 'custom') {
      return {
        type: 'custom',
        name: customDefenderName,
        bd: defenderBD,
        armor: defenderArmor,
        hpTot: defenderHpTot,
        hpSubiti: defenderHpSubiti
      };
    }
    
    if (defenderId.startsWith('pc-')) {
      const pcId = defenderId.substring(3);
      const pc = processedRoster.find(c => c.id === pcId);
      if (!pc) return null;
      return {
        type: 'pc',
        id: pc.id,
        name: pc.name,
        bd: pc.bd,
        armor: pc.equippedArmor,
        hpTot: pc.hpTot,
        hpSubiti: pc.hpSubiti || 0,
        weapons: pc.weapons,
        hasShield: pc.hasShield,
        hasMetalBracciali: pc.hasMetalBracciali,
        hasMetalSchinieri: pc.hasMetalSchinieri,
        hasMetalElmo: pc.hasMetalElmo
      };
    }
    
    if (defenderId.startsWith('npc-')) {
      const npcId = defenderId.substring(4);
      const npc = campaignNpcs.find(n => n.id === npcId);
      if (!npc) return null;
      
      const npcWeapons = [];
      if (npc.skills) {
        if (npc.skills["Arma primaria"] !== undefined) npcWeapons.push({ nome: `Arma Primaria`, bo: npc.skills["Arma primaria"] });
        if (npc.skills["Arma secondaria"] !== undefined) npcWeapons.push({ nome: `Arma Secondaria`, bo: npc.skills["Arma secondaria"] });
        if (npc.skills["Arma terziaria"] !== undefined) npcWeapons.push({ nome: `Arma Terziaria`, bo: npc.skills["Arma terziaria"] });
        if (npc.skills["Arma altre"] !== undefined) npcWeapons.push({ nome: `Arma Altre`, bo: npc.skills["Arma altre"] });
      }
      
      return {
        type: 'npc',
        id: npc.id,
        name: npc.name,
        bd: npc.db || 0,
        armor: npc.equippedArmor || 'nessuna',
        hpTot: npc.hpMax || 0,
        hpSubiti: (npc.hpMax || 0) - (npc.hpCorrenti !== undefined ? npc.hpCorrenti : (npc.hpMax || 0)),
        weapons: npcWeapons
      };
    }
    
    if (defenderId.startsWith('creature-')) {
      const creatureId = defenderId.substring(9);
      const creature = campaignCreatures.find(c => c.id === creatureId);
      if (!creature) return null;
      
      const creatureWeapons = [];
      if (creature.Attacco_uno) {
        creatureWeapons.push({
          nome: creature.Attacco_uno,
          bo: creature.Attacco_uno_BO || 0,
          isCreatureAttack: true,
          attackType: 'Attacco_uno'
        });
      }
      if (creature.Attacco_due) {
        creatureWeapons.push({
          nome: creature.Attacco_due,
          bo: creature.Attacco_due_BO || 0,
          isCreatureAttack: true,
          attackType: 'Attacco_due'
        });
      }
      if (creatureWeapons.length === 0) {
        creatureWeapons.push({ nome: "Attacco Base", bo: 0, isCreatureAttack: true, attackType: 'Attacco_uno' });
      }

      return {
        type: 'creature',
        id: creature.id,
        name: creature.Nome,
        bd: creature.bonus_difensivo || 0,
        armor: mapCreatureArmor(creature.tipo_armatura),
        hpTot: creature.punti_ferita || 0,
        hpSubiti: (creature.punti_ferita || 0) - (creature.hpCorrenti !== undefined ? creature.hpCorrenti : (creature.punti_ferita || 0)),
        weapons: creatureWeapons
      };
    }
    
    return null;
  }, [defenderId, customDefenderName, defenderBD, defenderArmor, defenderHpTot, defenderHpSubiti, processedRoster, campaignNpcs, campaignCreatures]);

  const defenderWeaponBO = useMemo(() => {
    if (defenderId === 'custom') {
      return customDefenderBO;
    }
    if (defenderInfo?.type === 'pc') {
      const activeDefenderWeapon = defenderInfo.weapons?.[selectedDefenderWeaponIdx] || defenderInfo.weapons?.[0];
      return activeDefenderWeapon ? activeDefenderWeapon.bo : 0;
    }
    if (defenderInfo?.type === 'npc') {
      const activeW = defenderInfo.weapons?.[selectedDefenderWeaponIdx] || defenderInfo.weapons?.[0];
      return activeW ? activeW.bo : 0;
    }
    if (defenderInfo?.type === 'creature') {
      const activeW = defenderInfo.weapons?.[selectedDefenderWeaponIdx] || defenderInfo.weapons?.[0];
      return activeW ? activeW.bo : 0;
    }
    return 0;
  }, [defenderId, customDefenderBO, defenderInfo, selectedDefenderWeaponIdx]);

  // BO speso per la parata precedentemente dall'attaccante
  const attackerBoSpesoParata = attackerInfo?.type === 'pc' ? (attackerInfo.boSpesoParata || 0) : 0;

  const attackerBOEffective = useMemo(() => {
    return Math.max(0, attackerBO - attackerBoSpesoParata);
  }, [attackerBO, attackerBoSpesoParata]);

  // --- SINCRONIZZAZIONE DATI ROSTER IN INPUTS ---
  useEffect(() => {
    if (attackerInfo && attackerId !== 'custom') {
      setAttackerHpTot(attackerInfo.hpTot);
      setAttackerHpSubiti(attackerInfo.hpSubiti);
      setAttackerBO(attackerInfo.bo);
      
      const activeWeapon = attackerInfo.weapons?.[selectedWeaponIdx] || attackerInfo.weapons?.[0];
      if (activeWeapon) {
        setAttackerWeaponName(activeWeapon.nome);
        if (attackerInfo.type === 'pc' || attackerInfo.type === 'npc') {
          setAttackerWeaponCat(activeWeapon.skillName || 'taglio a 1 mano');
        } else if (attackerInfo.type === 'creature') {
          const details = getCreatureAttackDetails(activeWeapon.nome);
          if (details) {
            const tableStr = details["Tabella d’Attacco"] || "";
            if (tableStr.includes("TA-6") || tableStr.includes("Immobilizz") || tableStr.includes("Sbilanc")) {
              setAttackerWeaponCat("immobilizzazione_sbilanciamento");
            } else {
              setAttackerWeaponCat("zanne_e_artigli");
            }
          } else {
            setAttackerWeaponCat("zanne_e_artigli");
          }
        }
      }
    }
  }, [attackerId, selectedWeaponIdx, attackerInfo]);

  useEffect(() => {
    if (defenderInfo && defenderId !== 'custom') {
      setDefenderBD(defenderInfo.bd);
      setDefenderArmor(defenderInfo.armor);
      setDefenderHpTot(defenderInfo.hpTot);
      setDefenderHpSubiti(defenderInfo.hpSubiti);
      if (defenderInfo.type === 'pc') {
        setUseShield(!!defenderInfo.hasShield);
      } else {
        setUseShield(false);
      }
    } else if (defenderId === 'custom') {
      // Don't override user choice for custom defender, but clean up if no defender
    } else {
      setUseShield(false);
    }
  }, [defenderId, defenderInfo]);

  const attackerWeaponCategoryResolved = attackerWeaponCat;

  const isRangedOrThrown = ['da tiro', 'da lancio', 'dardo', 'sfera'].includes(attackerWeaponCategoryResolved);

  // Forza i modificatori a disabilitarsi se è un'arma da tiro/lancio
  useEffect(() => {
    if (isRangedOrThrown) {
      setFlankAttack(false);
      setBackAttack(false);
      setSurprisedDefender(false);
      setStunnedDefender(false);
    }
  }, [isRangedOrThrown]);

  // Calcolo automatico della penalità ferite (>50% HP persi)
  const isAttackerGravelyInjured = useMemo(() => {
    if (attackerHpTot <= 0) return false;
    return attackerHpSubiti > (attackerHpTot / 2);
  }, [attackerHpTot, attackerHpSubiti]);

  // Calcolo dei modificatori totali sul BO
  const computedModifiers = useMemo(() => {
    let mods = 0;
    if (flankAttack && !isRangedOrThrown) mods += 15;
    if (backAttack && !isRangedOrThrown) mods += 20;
    if (surprisedDefender && !isRangedOrThrown) mods += 20;
    if (stunnedDefender && !isRangedOrThrown) mods += 20;
    
    // Movimento: -10 per ogni 3 metri
    const movM = parseInt(movementMetres) || 0;
    if (movM >= 3) {
      mods -= Math.floor(movM / 3) * 10;
    }
    
    if (drawOrSwapWeapon) mods -= 30;
    if (isAttackerGravelyInjured) mods -= 20;
    
    // Malus bracciali metallo: -5 BO
    if (attackerInfo?.hasMetalBracciali) {
      mods -= 5;
    }
    
    mods += parseInt(gmBonus) || 0;
    return mods;
  }, [flankAttack, backAttack, surprisedDefender, stunnedDefender, movementMetres, drawOrSwapWeapon, isAttackerGravelyInjured, gmBonus, isRangedOrThrown, attackerInfo]);

  // Calcolo del risultato finale del tiro
  const finalAttackResult = useMemo(() => {
    const roll = parseInt(diceRoll) || 0;
    const bo = parseInt(attackerBOEffective) || 0;
    const bd = parseInt(defenderBD) || 0;
    const parry = parseInt(defenderParry) || 0;
    
    const shieldBonus = (useShield && !backAttack) ? 25 : 0;
    let result = roll + bo - (bd + shieldBonus) - parry + computedModifiers;
    
    if (attackerInfo?.type === 'creature') {
      const cap = getCreatureSizeCap(attackerInfo.size);
      result = Math.min(cap, result);
    }
    
    return Math.min(150, Math.max(1, result));
  }, [diceRoll, attackerBOEffective, defenderBD, defenderParry, computedModifiers, attackerInfo, useShield, backAttack]);


  // Sincronizzazione ed eventuale clamp del valore di parata del difensore
  useEffect(() => {
    const maxBO = defenderWeaponBO;
    if (defenderParry > maxBO) {
      const clamped = maxBO;
      setDefenderParry(clamped);
      if (defenderInfo?.type === 'pc' && onUpdateBoSpesoParata) {
        onUpdateBoSpesoParata(defenderInfo.id, clamped);
      }
    }
  }, [defenderWeaponBO, defenderId, defenderParry, onUpdateBoSpesoParata, defenderInfo]);

  const handleDefenderParryChange = (val) => {
    const maxBO = defenderWeaponBO;
    const clamped = Math.max(0, Math.min(maxBO, val));
    setDefenderParry(clamped);
    if (defenderInfo?.type === 'pc' && onUpdateBoSpesoParata) {
      onUpdateBoSpesoParata(defenderInfo.id, clamped);
    }
  };

  // --- LOGICA DI RISOLUZIONE ATTACCO ---
  const handleResolveAttack = () => {
    const rollVal = parseInt(diceRoll);
    if (isNaN(rollVal) || rollVal < 1 || rollVal > 100) {
      alert('Inserisci un tiro di dado d100 valido (da 1 a 100).');
      return;
    }

    // Tabella corretta da cercare
    let tableCode = WEAPON_SKILL_TO_TABLE[attackerWeaponCategoryResolved] || 'TA-1';
    
    // Per le armi da lancio determiniamo specificamente in base al nome
    if (attackerWeaponCategoryResolved === 'da lancio') {
      const wName = attackerWeaponName.toLowerCase();
      if (wName.includes('lancia') || wName.includes('giavellotto')) {
        tableCode = 'TA-3'; // due mani / asta
      } else if (wName.includes('bolas')) {
        tableCode = 'TA-2'; // contundenti
      } else {
        tableCode = 'TA-1'; // taglio ad una mano (coltello da lancio)
      }
    }

    const armorColName = ARMOR_COLUMNS[defenderArmor] || 'nessuna_armatura';
    const finalResult = finalAttackResult;

    let cellValue = '';
    const isSpell = tableCode === 'TA-7' || tableCode === 'TA-8';
    const isCreatureTable = tableCode === 'TA-5' || tableCode === 'TA-6';

    if (isSpell) {
      const outcome = resolveSpellAttack(finalResult, tableCode, defenderArmor);
      cellValue = outcome ? String(outcome.valore).trim() : '0';
      if (cellValue === 'F' && diceRoll > 2) {
        cellValue = '0'; // treated as miss since natural roll is > 2
      }
    } else if (isCreatureTable) {
      const jsonList = tableCode === 'TA-5' ? ta5ZanneArtigli : ta6ImmobilizzSbilanc;
      const row = findRangeRow(jsonList, finalResult);
      if (!row) {
        setCombatOutcome({
          type: 'error',
          message: `Nessun dato trovato per il tiro ${finalResult} sulla tabella ${tableCode}.`
        });
        return;
      }
      cellValue = String(row[armorColName] || '').trim();
    } else {
      // Cerca nel JSON delle tabelle d'attacco
      const row = attackTables.find(r => r.tabella === tableCode && r.risultato_del_tiro === finalResult);

      if (!row) {
        setCombatOutcome({
          type: 'error',
          message: `Nessun dato trovato per il tiro ${finalResult} sulla tabella ${tableCode}.`
        });
        return;
      }
      cellValue = String(row[armorColName] || '').trim();
    }

    const isFumble = isSpell 
      ? (diceRoll <= 2) 
      : (cellValue === 'fallimento' || cellValue === 'Possibilità di Colpo Maldestro' || diceRoll <= 8);

    if (isFumble) {
      // Fumble! (In MERP, un tiro basso o un esito maldestro genera fumble; per gli incantesimi è F)
      setCombatOutcome({
        type: 'fumble',
        roll: diceRoll,
        finalResult,
        tableCode,
        armorColName,
        message: isSpell ? 'FALLIMENTO INCANTESIMO!' : 'FALLIMENTO GRAVE - COLPO MALDESTRO!',
        details: isSpell 
          ? 'Il lancio dell\'incantesimo è fallito. Il Master chiederà di effettuare un tiro d100 sulla tabella dei Fallimenti Incantesimi (TTM-3) per risolverne le conseguenze.'
          : 'Il colpo è andato malissimo. Il Master chiederà di effettuare un tiro d100 sulla tabella dei Colpi Maldestri per risolverne le conseguenze.'
      });
      setShowFumbleResolver(true);
      setShowCriticalResolver(false);
      const fTable = isSpell ? 'TTM-3' : (isRangedOrThrown ? 'TTM-2' : 'TTM-1');
      setFumbleTableCode(fTable);
      const fRoll = Math.floor(Math.random() * 100) + 1;
      setFumbleDiceRoll(fRoll);
    } else if (cellValue === '0' || cellValue === '') {
      setCombatOutcome({
        type: 'miss',
        roll: diceRoll,
        finalResult,
        tableCode,
        armorColName,
        message: 'COLPO MANCATO',
        details: 'L\'attacco non è abbastanza forte da superare le difese o l\'armatura del bersaglio. Nessun danno inflitto.'
      });
    } else {
      // Danno riuscito! Analizziamo la cella (es: "12B" o "8")
      const match = cellValue.match(/^(\d+)([A-E])?$/);
      if (match) {
        const damage = parseInt(match[1]);
        const critType = match[2] || null;
        
        // Calcolo moltiplicatori per creature
        let damageMultiplier = 1;
        let matchedTsc2Attack = null;
        if (attackerInfo?.type === 'creature') {
          matchedTsc2Attack = getCreatureAttackDetails(attackerWeaponName);
          const attackNameLower = attackerWeaponName.toLowerCase();
          const tsc2NameLower = (matchedTsc2Attack?.["Tipo di Attacco"] || '').toLowerCase();
          
          if (attackNameLower.includes('§') || tsc2NameLower.includes('§')) {
            damageMultiplier = 2;
          } else if (attackNameLower.includes('$$') || tsc2NameLower.includes('$$')) {
            damageMultiplier = 0.5;
          }
        }
        
        const finalDamage = Math.max(0, Math.floor(damage * damageMultiplier));
        const critMod = isSpell ? 0 : (critType ? CRITICAL_MODIFIERS[critType] : 0);

        // Risoluzione tipo e tabella critico primario e secondario
        let suggestedTable = 'TC-2';
        let secondaryCritSeverity = null;
        let secondaryCritTable = null;
        let hasSecondaryCrit = false;

        if (attackerInfo?.type === 'creature' && matchedTsc2Attack) {
          suggestedTable = mapCreatureCritToTable(matchedTsc2Attack["Critico Primario"]);
          
          const secCrit = matchedTsc2Attack["Critico Secondario"] || "";
          if (secCrit && secCrit !== "-") {
            const hasAsterisk = secCrit.includes('*') || (matchedTsc2Attack["nota crit_secondario"] || "").includes('*');
            const size = (attackerInfo.size || '').toLowerCase();
            const sizeIsLargeOrHuge = size === 'grande' || size === 'enorme';
            
            if (!hasAsterisk || sizeIsLargeOrHuge) {
              const severityOrder = ['A', 'B', 'C', 'D', 'E'];
              const primIndex = severityOrder.indexOf(critType);
              if (primIndex > 0) {
                secondaryCritSeverity = severityOrder[primIndex - 1];
                secondaryCritTable = mapCreatureCritToTable(secCrit);
                hasSecondaryCrit = true;
              }
            }
          }
        } else {
          suggestedTable = getCriticalTableForWeapon(attackerWeaponCategoryResolved, attackerWeaponName);
        }

        setCombatOutcome({
          type: 'hit',
          roll: diceRoll,
          finalResult,
          tableCode,
          armorColName,
          damage: finalDamage,
          criticalType: critType,
          criticalModifier: critMod,
          message: `COLPO A SEGNO! (${cellValue})`,
          details: `Il colpo infligge ${finalDamage} PF${damageMultiplier !== 1 ? ` (applicato moltiplicatore x${damageMultiplier})` : ''} al difensore. ${
            critType 
              ? `Genera un Colpo Critico di tipo ${critType} sulla tabella ${TABLE_NAMES[suggestedTable] || suggestedTable}.${
                  hasSecondaryCrit 
                    ? ` Conseguente Colpo Critico Secondario di tipo ${secondaryCritSeverity} sulla tabella ${TABLE_NAMES[secondaryCritTable] || secondaryCritTable}.` 
                    : ''
                }`
              : 'Nessun colpo critico generato.'
          }`,
          suggestedTable,
          hasSecondaryCrit,
          secondaryCritSeverity,
          secondaryCritTable
        });

        if (critType) {
          setCritTableCode(suggestedTable);
          setCritSeverity(critType);
          setCritDiceRoll(Math.floor(Math.random() * 100) + 1);
          setShowCriticalResolver(true);
          setShowFumbleResolver(false);
        } else {
          setShowCriticalResolver(false);
        }
      } else {
        // Valore non tipico, mostriamo la stringa così com'è
        const damage = parseInt(cellValue) || 0;
        setCombatOutcome({
          type: 'hit',
          roll: diceRoll,
          finalResult,
          tableCode,
          armorColName,
          damage,
          criticalType: null,
          message: `COLPO A SEGNO: ${cellValue}`,
          details: 'Danni calcolati dal sistema.'
        });
        setShowCriticalResolver(false);
      }
    }
  };

  const handleRollDice = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    setDiceRoll(roll);
    setManualRoll(String(roll));
  };

  const handleManualRollChange = (val) => {
    setManualRoll(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      setDiceRoll(parsed);
    }
  };

  const handleReset = () => {
    setFlankAttack(false);
    setBackAttack(false);
    setSurprisedDefender(false);
    setStunnedDefender(false);
    setMovementMetres(0);
    setDrawOrSwapWeapon(false);
    setGmBonus(0);
    setDefenderParry(0);
    setDiceRoll(50);
    setManualRoll('50');
    setCombatOutcome(null);
    setShowFumbleResolver(false);
    setShowCriticalResolver(false);
    setFumbleDiceRoll(50);
    setFumbleManualRoll('50');
    setFumbleModifierCustom(0);
    setFumbleResultOverride(null);
    setFumbleSpellClass('P');
    setFumbleManoeuvreDifficulty('Difficile');
  };

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Swords className="text-indigo-600 w-5 h-5" />
            Risoluzione Combattimenti (Calcolatore Attacchi)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Risolvi gli attacchi fisici in tempo reale. Seleziona i personaggi dal Roster per caricarne le statistiche BO/BD/Armatura o inserisci i dati manualmente.
          </p>
        </div>
        <button
          onClick={() => {
            if (onResetAllParries) {
              onResetAllParries();
              setDefenderParry(0);
              alert('Nuovo Round: tutte le parate dei personaggi sono state azzerate.');
            }
          }}
          className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 flex items-center gap-2 transition active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Nuovo Round (Azzera Parate)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- PANNELLO ATTACCANTE --- */}
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
                // Campi Custom Attaccante
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
                // Dati caricati da Roster Attaccante
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
              {TABLE_NAMES[WEAPON_SKILL_TO_TABLE[attackerWeaponCategoryResolved]] || TABLE_NAMES['TA-1']}
            </span>
          </div>
        </div>
             {/* --- PANNELLO DIFENSORE --- */}
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
                // Campi Custom Difensore
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
                // Dati caricati da Roster Difensore
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
      </div>

      {/* --- PANNELLO MODIFICATORI DI CONTESTO --- */}
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
              <span className="text-[9px] text-red-750">HP subiti &gt; 50% HP Totali</span>
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

      {/* --- PANNELLO LANCIO DEL DADO & CALCOLO --- */}
      <div className="card p-6 border-2 border-indigo-600 rounded-xl bg-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            {/* Pulsante Tira Dado */}
            <button
              onClick={handleRollDice}
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Play className="w-5 h-5" />
              Tira Dado (1D100)
            </button>

            {/* Inserimento Manuale Dado */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-center">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Tiro Dado:</label>
              <input
                type="number"
                min="1"
                max="100"
                className="w-16 p-2 border border-indigo-300 rounded-lg text-center font-black text-lg bg-slate-50 text-indigo-900"
                value={manualRoll}
                onChange={e => handleManualRollChange(e.target.value)}
              />
              <span className="text-xs text-gray-450 italic">(1-100)</span>
            </div>
          </div>

          <div className="text-center md:text-right bg-slate-50 border border-gray-150 rounded-xl p-3 px-6 w-full md:w-auto">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Formula Risultato Attacco</span>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Tiro ({diceRoll}) + BO ({attackerBO}) - BD ({defenderBD}{useShield && !backAttack ? ' + 25 Scudo' : ''}) - Parata ({defenderParry}) {computedModifiers >= 0 ? `+ Mod. (${computedModifiers})` : `- Mod. (${Math.abs(computedModifiers)})`}
            </p>
            <strong className="text-2xl font-black text-indigo-950 block mt-1">
              Risultato Finale: {finalAttackResult}
            </strong>
          </div>

          <button
            onClick={handleResolveAttack}
            className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 text-center"
          >
            Risolvi Attacco
          </button>
        </div>
      </div>

      {/* --- RISULTATO DEL COMBATTIMENTO --- */}
      {combatOutcome && (
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
      )}

      {/* --- RISOLUTORE COLPI MALDESTRI (FUMBLE) --- */}
      <div className="card p-5 border border-red-200 rounded-xl bg-red-50/20 shadow-xs mt-6">
        <div className="flex items-center justify-between pb-3 border-b border-red-150 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-red-950 uppercase tracking-wider">Risolutore Colpi Maldestri</h4>
          </div>
          
          <button
            onClick={() => setShowFumbleResolver(!showFumbleResolver)}
            className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-250 rounded text-xs font-bold transition"
          >
            {showFumbleResolver ? 'Nascondi Risolutore' : 'Mostra Risolutore'}
          </button>
        </div>

        {showFumbleResolver && (
          <FumbleResolver
            key={`${fumbleTableCode}-${fumbleDiceRoll}`}
            initialTableCode={fumbleTableCode}
            initialDiceRoll={fumbleDiceRoll}
            weaponCategory={attackerWeaponCategoryResolved}
            weaponName={attackerWeaponName}
            showTitle={false}
          />
        )}
      </div>

      {/* --- RISOLUTORE COLPI CRITICI --- */}
      <div className="card p-5 border border-amber-200 rounded-xl bg-amber-50/20 shadow-xs mt-6">
        <div className="flex items-center justify-between pb-3 border-b border-amber-150 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-amber-950 uppercase tracking-wider">Risolutore Colpi Critici</h4>
          </div>
          
          <button
            onClick={() => setShowCriticalResolver(!showCriticalResolver)}
            className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-250 rounded text-xs font-bold transition"
          >
            {showCriticalResolver ? 'Nascondi Risolutore' : 'Mostra Risolutore'}
          </button>
        </div>

        {showCriticalResolver && (
          <CriticalResolver
            key={`${critTableCode}-${critSeverity}-${critDiceRoll}`}
            initialTableCode={critTableCode}
            initialSeverity={critSeverity}
            initialDiceRoll={critDiceRoll}
            showTitle={false}
          />
        )}
      </div>

    </div>
  );
}
