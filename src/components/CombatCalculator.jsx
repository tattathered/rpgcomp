import { useState, useEffect, useMemo } from 'react';
import { Swords, RotateCcw, AlertTriangle, AlertOctagon, Play, HelpCircle, Heart, Shield, Sparkles, Target, User } from 'lucide-react';
import attackTables from '../data/Tabelle-Attacco-TA-1_TA-2_TA-3_TA-4.json';
import FumbleResolver from './FumbleResolver';
import CriticalResolver from './CriticalResolver';
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
  'da lancio': 'TA-1' // default, verrà mappata dinamicamente
};

const TABLE_NAMES = {
  'TA-1': 'Armi da Taglio a una Mano (TA-1)',
  'TA-2': 'Armi Contundenti a una Mano (TA-2)',
  'TA-3': 'Armi a Due Mani (TA-3)',
  'TA-4': 'Armi da Tiro (TA-4)'
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

export default function CombatCalculator({ savedCharacters, onUpdateHpSubiti, onUpdateBoSpesoParata, onResetAllParries }) {
  // --- STATO ATTACCANTE ---
  const [attackerId, setAttackerId] = useState('custom');
  const [customAttackerName, setCustomAttackerName] = useState('Attaccante Generico');
  const [attackerBO, setAttackerBO] = useState(50);
  const [attackerWeaponCat, setAttackerWeaponCat] = useState('taglio a 1 mano');
  const [attackerWeaponName, setAttackerWeaponName] = useState('Spada Larga');
  const [attackerHpTot, setAttackerHpTot] = useState(40);
  const [attackerHpSubiti, setAttackerHpSubiti] = useState(0);

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
        'con asta'
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
      
      // 6. Inventory weapons list
      const inventoryWeapons = (char.equipment || [])
        .filter(item => item.categoria === 'armi')
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
      
      return {
        id: char.id,
        name: char.name,
        equippedArmor: mappedArmor,
        bd: finalBD,
        hpTot,
        hpSubiti: char.hpSubiti || 0,
        boSpesoParata: char.boSpesoParata || 0,
        weapons: inventoryWeapons,
        skillBonuses
      };
    });
  }, [savedCharacters]);

  // Seleziona personaggio attivo attaccante
  const activeAttackerCharacter = useMemo(() => {
    return processedRoster.find(c => c.id === attackerId) || null;
  }, [processedRoster, attackerId]);

  // Seleziona personaggio attivo difensore
  const activeDefenderCharacter = useMemo(() => {
    return processedRoster.find(c => c.id === defenderId) || null;
  }, [processedRoster, defenderId]);

  // Seleziona arma per attaccante da roster
  const [selectedWeaponIdx, setSelectedWeaponIdx] = useState(0);
  const activeAttackerWeapon = useMemo(() => {
    if (!activeAttackerCharacter) return null;
    return activeAttackerCharacter.weapons[selectedWeaponIdx] || activeAttackerCharacter.weapons[0] || null;
  }, [activeAttackerCharacter, selectedWeaponIdx]);

  // Seleziona arma per difensore da roster
  const activeDefenderWeapon = useMemo(() => {
    if (!activeDefenderCharacter) return null;
    return activeDefenderCharacter.weapons[selectedDefenderWeaponIdx] || activeDefenderCharacter.weapons[0] || null;
  }, [activeDefenderCharacter, selectedDefenderWeaponIdx]);

  const defenderWeaponBO = useMemo(() => {
    if (defenderId === 'custom') {
      return customDefenderBO;
    }
    return activeDefenderWeapon ? activeDefenderWeapon.bo : 0;
  }, [defenderId, customDefenderBO, activeDefenderWeapon]);

  // BO effettivo dell'attaccante detratto del BO speso per parare in precedenza
  const attackerBoSpesoParata = activeAttackerCharacter ? (activeAttackerCharacter.boSpesoParata || 0) : 0;
  
  const attackerBOEffective = useMemo(() => {
    return Math.max(0, attackerBO - attackerBoSpesoParata);
  }, [attackerBO, attackerBoSpesoParata]);

  // --- SINCRONIZZAZIONE DATI ROSTER IN INPUTS ---
  useEffect(() => {
    if (activeAttackerCharacter) {
      setAttackerHpTot(activeAttackerCharacter.hpTot);
      setAttackerHpSubiti(activeAttackerCharacter.hpSubiti || 0);
      if (activeAttackerWeapon) {
        setAttackerBO(activeAttackerWeapon.bo);
        setAttackerWeaponCat(activeAttackerWeapon.skillName);
        setAttackerWeaponName(activeAttackerWeapon.nome);
      }
    }
  }, [activeAttackerCharacter, activeAttackerWeapon]);

  useEffect(() => {
    if (activeDefenderCharacter) {
      setDefenderBD(activeDefenderCharacter.bd);
      setDefenderArmor(activeDefenderCharacter.equippedArmor);
      setDefenderHpTot(activeDefenderCharacter.hpTot);
      setDefenderHpSubiti(activeDefenderCharacter.hpSubiti || 0);
      setDefenderParry(activeDefenderCharacter.boSpesoParata || 0); 
    }
  }, [activeDefenderCharacter]);

  // Calcolo del BO effettivo dell'arma selezionata
  const attackerWeaponCategoryResolved = activeAttackerCharacter && activeAttackerWeapon
    ? activeAttackerWeapon.skillName 
    : attackerWeaponCat;

  const isRangedOrThrown = ['da tiro', 'da lancio'].includes(attackerWeaponCategoryResolved);

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
    
    mods += parseInt(gmBonus) || 0;
    return mods;
  }, [flankAttack, backAttack, surprisedDefender, stunnedDefender, movementMetres, drawOrSwapWeapon, isAttackerGravelyInjured, gmBonus, isRangedOrThrown]);

  // Calcolo del risultato finale del tiro
  const finalAttackResult = useMemo(() => {
    const roll = parseInt(diceRoll) || 0;
    const bo = parseInt(attackerBOEffective) || 0;
    const bd = parseInt(defenderBD) || 0;
    const parry = parseInt(defenderParry) || 0;
    
    let result = roll + bo - bd - parry + computedModifiers;
    return Math.min(150, Math.max(1, result));
  }, [diceRoll, attackerBOEffective, defenderBD, defenderParry, computedModifiers]);


  // Sincronizzazione ed eventuale clamp del valore di parata del difensore
  useEffect(() => {
    const maxBO = defenderWeaponBO;
    if (defenderParry > maxBO) {
      const clamped = maxBO;
      setDefenderParry(clamped);
      if (defenderId !== 'custom' && onUpdateBoSpesoParata) {
        onUpdateBoSpesoParata(defenderId, clamped);
      }
    }
  }, [defenderWeaponBO, defenderId, defenderParry, onUpdateBoSpesoParata]);

  const handleDefenderParryChange = (val) => {
    const maxBO = defenderWeaponBO;
    const clamped = Math.max(0, Math.min(maxBO, val));
    setDefenderParry(clamped);
    if (defenderId !== 'custom' && onUpdateBoSpesoParata) {
      onUpdateBoSpesoParata(defenderId, clamped);
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
      const wName = (activeAttackerWeapon ? activeAttackerWeapon.nome : attackerWeaponName).toLowerCase();
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

    // Cerca nel JSON delle tabelle d'attacco
    const row = attackTables.find(r => r.tabella === tableCode && r.risultato_del_tiro === finalResult);

    if (!row) {
      setCombatOutcome({
        type: 'error',
        message: `Nessun dato trovato per il tiro ${finalResult} sulla tabella ${tableCode}.`
      });
      return;
    }

    const cellValue = String(row[armorColName] || '').trim();

    if (cellValue === 'Possibilità di Colpo Maldestro' || diceRoll <= 8) {
      // Fumble! (In MERP, un tiro basso o un esito maldestro genera fumble)
      setCombatOutcome({
        type: 'fumble',
        roll: diceRoll,
        finalResult,
        tableCode,
        armorColName,
        message: 'FALLIMENTO GRAVE - COLPO MALDESTRO!',
        details: 'Il colpo è andato malissimo. Il Master chiederà di effettuare un tiro d100 sulla tabella dei Colpi Maldestri per risolverne le conseguenze.'
      });
      setShowFumbleResolver(true);
      setShowCriticalResolver(false);
      const fTable = isRangedOrThrown ? 'TTM-2' : 'TTM-1';
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
        const critMod = critType ? CRITICAL_MODIFIERS[critType] : 0;

        setCombatOutcome({
          type: 'hit',
          roll: diceRoll,
          finalResult,
          tableCode,
          armorColName,
          damage,
          criticalType: critType,
          criticalModifier: critMod,
          message: `COLPO A SEGNO! (${cellValue})`,
          details: `Il colpo infligge ${damage} PF al difensore. ${
            critType 
              ? `Genera un Colpo Critico di tipo ${critType}. L'attaccante effettuerà un secondo tiro d100 con modificatore ${fmt(critMod)} per determinare le conseguenze del critico.`
              : 'Nessun colpo critico generato.'
          }`
        });

        if (critType) {
          const suggestedTable = getCriticalTableForWeapon(attackerWeaponCategoryResolved, activeAttackerWeapon ? activeAttackerWeapon.nome : attackerWeaponName);
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
        setCombatOutcome({
          type: 'hit',
          roll: diceRoll,
          finalResult,
          tableCode,
          armorColName,
          damage: parseInt(cellValue) || 0,
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
                <label className="block text-xs font-bold text-blue-900 mb-1">Seleziona Attaccante dal Roster:</label>
                <select
                  className="w-full p-2 border border-blue-250 rounded text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                  value={attackerId}
                  onChange={e => setAttackerId(e.target.value)}
                >
                  <option value="custom">- Inserimento Manuale (Custom) -</option>
                  {processedRoster.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name} (HP: {char.hpTot})
                    </option>
                  ))}
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
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{activeAttackerCharacter?.name}</p>
                  </div>
                  {activeAttackerCharacter && activeAttackerCharacter.weapons.length > 0 ? (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Seleziona Arma in Inventario:</label>
                      <select
                        className="w-full p-1.5 border border-blue-200 rounded text-xs bg-white font-medium focus:ring-blue-500 focus:border-blue-500"
                        value={selectedWeaponIdx}
                        onChange={e => setSelectedWeaponIdx(parseInt(e.target.value))}
                      >
                        {activeAttackerCharacter.weapons.map((w, idx) => (
                          <option key={idx} value={idx}>
                            {w.nome} (BO: {fmt(w.bo)} | {w.skillName})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <p className="text-xs italic text-orange-600">Nessuna arma in inventario. Caricata skill predefinita.</p>
                    </div>
                  )}
                  <div>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase">BO Disponibile</span>
                    <strong className="text-sm text-gray-950 block font-bold">{fmt(attackerBOEffective)}</strong>
                    {attackerBoSpesoParata > 0 && (
                      <span className="text-[9px] text-blue-700 block leading-tight">({fmt(attackerBO)} base - {attackerBoSpesoParata} parata)</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase">HP Totali PG</span>
                    <strong className="text-sm text-gray-900 block">{attackerHpTot}</strong>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase mb-1">HP Subiti (Ferite)</span>
                    <input
                      type="number"
                      min="0"
                      max={attackerHpTot}
                      className="w-16 p-1 border border-blue-200 rounded text-xs text-center font-bold text-red-655 bg-white focus:ring-blue-500 focus:border-blue-500"
                      value={attackerHpSubiti}
                      onChange={e => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setAttackerHpSubiti(val);
                        if (attackerId !== 'custom' && onUpdateHpSubiti) {
                          onUpdateHpSubiti(attackerId, val);
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
                <label className="block text-xs font-bold text-red-900 mb-1">Seleziona Difensore dal Roster:</label>
                <select
                  className="w-full p-2 border border-red-250 rounded text-sm bg-white focus:ring-red-500 focus:border-red-500"
                  value={defenderId}
                  onChange={e => setDefenderId(e.target.value)}
                >
                  <option value="custom">- Inserimento Manuale (Custom) -</option>
                  {processedRoster.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name} (Armatura: {ARMOR_DISPLAY[char.equippedArmor] || 'Nessuna'})
                    </option>
                  ))}
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
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{activeDefenderCharacter?.name}</p>
                  </div>
                  {activeDefenderCharacter && activeDefenderCharacter.weapons.length > 0 ? (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-red-900 uppercase mb-1">Seleziona Arma per Parare:</label>
                      <select
                        className="w-full p-1.5 border border-red-200 rounded text-xs bg-white font-medium focus:ring-red-500 focus:border-red-500"
                        value={selectedDefenderWeaponIdx}
                        onChange={e => setSelectedDefenderWeaponIdx(parseInt(e.target.value))}
                      >
                        {activeDefenderCharacter.weapons.map((w, idx) => (
                          <option key={idx} value={idx}>
                            {w.nome} (BO: {fmt(w.bo)} | {w.skillName})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <p className="text-xs italic text-orange-600">Nessuna arma in inventario. Caricata skill predefinita.</p>
                    </div>
                  )}
                  <div>
                    <span className="block text-[9px] font-bold text-gray-550 uppercase">Armatura Attiva</span>
                    <strong className="text-sm text-gray-900 block font-semibold">{ARMOR_DISPLAY[defenderArmor] || 'Nessuna'}</strong>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-555 uppercase">BD Consolidato</span>
                    <strong className="text-sm text-gray-900 block font-semibold">{fmt(defenderBD)}</strong>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-555 uppercase">HP Totali PG</span>
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
                        if (defenderId !== 'custom' && onUpdateHpSubiti) {
                          onUpdateHpSubiti(defenderId, val);
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
                  <span className="text-xs font-bold text-red-700">-{defenderParry} al tiro</span>
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
              {ARMOR_DISPLAY[defenderArmor] || 'Nessuna'}
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
              Tiro ({diceRoll}) + BO ({attackerBO}) - BD ({defenderBD}) - Parata ({defenderParry}) {computedModifiers >= 0 ? `+ Mod. (${computedModifiers})` : `- Mod. (${Math.abs(computedModifiers)})`}
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
                {/* Box Danni HP */}
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
                  
                  {defenderId !== 'custom' && onUpdateHpSubiti && (
                    <button
                      onClick={() => {
                        const newHpSubiti = Math.min(defenderHpTot, defenderHpSubiti + combatOutcome.damage);
                        onUpdateHpSubiti(defenderId, newHpSubiti);
                        setDefenderHpSubiti(newHpSubiti);
                        alert(`Applicati ${combatOutcome.damage} danni a ${activeDefenderCharacter?.name}. PF Subiti totali: ${newHpSubiti}/${defenderHpTot}.`);
                      }}
                      className="w-full sm:w-auto px-3 py-1.5 bg-emerald-655 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition active:scale-95 text-center whitespace-nowrap"
                      style={{ backgroundColor: 'var(--success-color, #10b981)', border: 'none', cursor: 'pointer' }}
                    >
                      Applica Danni al PG
                    </button>
                  )}
                </div>

                {/* Box Dettagli Critico */}
                {combatOutcome.criticalType && (
                  <div className="p-4 bg-white/70 border border-emerald-250 rounded-lg shadow-sm flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4 md:col-span-2 lg:col-span-1 animate-fadeIn">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-xl font-black shadow uppercase shrink-0">
                        {combatOutcome.criticalType}
                      </div>
                      <div>
                        <strong className="block text-sm text-gray-900 font-bold">Colpo Critico (Tipo {combatOutcome.criticalType})</strong>
                        <span className="text-xs text-amber-800 font-medium">Modificatore Tiro Critico: {fmt(combatOutcome.criticalModifier)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCriticalResolver(true);
                        setShowFumbleResolver(false);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition active:scale-95 text-center whitespace-nowrap"
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      Risolvi Critico
                    </button>
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
            weaponName={activeAttackerWeapon ? activeAttackerWeapon.nome : attackerWeaponName}
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
