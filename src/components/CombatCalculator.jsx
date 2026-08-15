import { useState, useEffect, useMemo } from 'react';
import { RotateCcw, AlertTriangle, AlertOctagon, Play } from 'lucide-react';
import FumbleResolver from './FumbleResolver';
import CriticalResolver from './CriticalResolver';
import AttackerPanel from './CombatCalculator/AttackerPanel';
import DefenderPanel from './CombatCalculator/DefenderPanel';
import ModifiersPanel from './CombatCalculator/ModifiersPanel';
import CombatOutcomePanel from './CombatCalculator/CombatOutcomePanel';
import {
  WEAPON_SKILL_TO_TABLE,
  TABLE_NAMES,
  CRITICAL_MODIFIERS,
  getCriticalTableForWeapon,
  getCreatureSizeCap,
  getCreatureAttackDetails,
  mapCreatureCritToTable,
  resolveTableValue
} from '../utils/combatHelpers';
import {
  processPcRoster,
  buildAttackerInfo,
  buildDefenderInfo
} from '../utils/combatRosterProcessor';

export default function CombatCalculator({ 
  savedCharacters, 
  campaignNpcs = [], 
  campaignCreatures = [], 
  onUpdateActorHp, 
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
  const [roundResults, setRoundResults] = useState([]);
  const [roundTotalDamage, setRoundTotalDamage] = useState(0);

  // --- DATI ROSTER COMPUTATI ---
  const processedRoster = useMemo(() => {
    return processPcRoster(savedCharacters);
  }, [savedCharacters]);

  const [selectedWeaponIdx, setSelectedWeaponIdx] = useState(0);

  const attackerInfo = useMemo(() => {
    return buildAttackerInfo(attackerId, customAttackerName, attackerBO, attackerHpTot, attackerHpSubiti, processedRoster, campaignNpcs, campaignCreatures, selectedWeaponIdx);
  }, [attackerId, customAttackerName, attackerBO, attackerHpTot, attackerHpSubiti, processedRoster, campaignNpcs, campaignCreatures, selectedWeaponIdx]);

  const defenderInfo = useMemo(() => {
    return buildDefenderInfo(defenderId, customDefenderName, defenderBD, defenderArmor, defenderHpTot, defenderHpSubiti, processedRoster, campaignNpcs, campaignCreatures);
  }, [defenderId, customDefenderName, defenderBD, defenderArmor, defenderHpTot, defenderHpSubiti, processedRoster, campaignNpcs, campaignCreatures]);

  const defenderWeaponBO = useMemo(() => {
    if (defenderId === 'custom') {
      return customDefenderBO;
    }
    if (defenderInfo?.type === 'pc' || defenderInfo?.type === 'npc' || defenderInfo?.type === 'creature') {
      const activeW = defenderInfo.weapons?.[selectedDefenderWeaponIdx] || defenderInfo.weapons?.[0];
      return activeW ? activeW.bo : 0;
    }
    return 0;
  }, [defenderId, customDefenderBO, defenderInfo, selectedDefenderWeaponIdx]);

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
      // Don't override user choice for custom defender
    } else {
      setUseShield(false);
    }
  }, [defenderId, defenderInfo]);

  const attackerWeaponCategoryResolved = attackerWeaponCat;

  const isRangedOrThrown = ['da tiro', 'da lancio', 'dardo', 'sfera'].includes(attackerWeaponCategoryResolved);

  useEffect(() => {
    if (isRangedOrThrown) {
      setFlankAttack(false);
      setBackAttack(false);
      setSurprisedDefender(false);
      setStunnedDefender(false);
    }
  }, [isRangedOrThrown]);

  const isAttackerGravelyInjured = useMemo(() => {
    if (attackerHpTot <= 0) return false;
    return attackerHpSubiti > (attackerHpTot / 2);
  }, [attackerHpTot, attackerHpSubiti]);

  const computedModifiers = useMemo(() => {
    let mods = 0;
    if (flankAttack && !isRangedOrThrown) mods += 15;
    if (backAttack && !isRangedOrThrown) mods += 20;
    if (surprisedDefender && !isRangedOrThrown) mods += 20;
    if (stunnedDefender && !isRangedOrThrown) mods += 20;
    
    const movM = parseInt(movementMetres) || 0;
    if (movM >= 3) {
      mods -= Math.floor(movM / 3) * 10;
    }
    
    if (drawOrSwapWeapon) mods -= 30;
    if (isAttackerGravelyInjured) mods -= 20;
    
    if (attackerInfo?.hasMetalBracciali) {
      mods -= 5;
    }
    
    mods += parseInt(gmBonus) || 0;
    return mods;
  }, [flankAttack, backAttack, surprisedDefender, stunnedDefender, movementMetres, drawOrSwapWeapon, isAttackerGravelyInjured, gmBonus, isRangedOrThrown, attackerInfo]);

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

  // Registra l'esito dell'attacco nel round e avanza al prossimo attacco (se creatura multi-attacco)
  const recordAttackResult = (type, damage, criticalType) => {
    setRoundResults(prev => [...prev, {
      attackName: attackerWeaponName || 'Attacco',
      roll: diceRoll,
      finalResult: finalAttackResult,
      type,
      damage: damage || 0,
      criticalType: criticalType || null
    }]);
    if (damage) {
      setRoundTotalDamage(prev => prev + damage);
    }

    // Auto-avanzamento: solo creature con più attacchi nello stesso round
    const totalAttacks = attackerInfo?.weapons?.length || 1;
    if (attackerInfo?.type === 'creature' && selectedWeaponIdx < totalAttacks - 1) {
      setSelectedWeaponIdx(selectedWeaponIdx + 1);
      setDiceRoll(50);
      setManualRoll('50');
    }
  };

  // --- LOGICA DI RISOLUZIONE ATTACCO ---
  const handleResolveAttack = () => {
    const rollVal = parseInt(diceRoll);
    if (isNaN(rollVal) || rollVal < 1 || rollVal > 100) {
      alert('Inserisci un tiro di dado d100 valido (da 1 a 100).');
      return;
    }

    let tableCode = WEAPON_SKILL_TO_TABLE[attackerWeaponCategoryResolved] || 'TA-1';
    
    if (attackerWeaponCategoryResolved === 'da lancio') {
      const wName = attackerWeaponName.toLowerCase();
      if (wName.includes('lancia') || wName.includes('giavellotto')) {
        tableCode = 'TA-3';
      } else if (wName.includes('bolas')) {
        tableCode = 'TA-2';
      } else {
        tableCode = 'TA-1';
      }
    }

    const finalResult = finalAttackResult;

    let cellValue = resolveTableValue(tableCode, finalResult, defenderArmor);

    if (cellValue === null || cellValue === undefined) {
      setCombatOutcome({
        type: 'error',
        message: `Nessun dato trovato per il tiro ${finalResult} sulla tabella ${tableCode}.`
      });
      return;
    }

    const isSpell = tableCode === 'TA-7' || tableCode === 'TA-8';

    const isFumble = isSpell 
      ? (diceRoll <= 2) 
      : (cellValue === 'fallimento' || cellValue === 'Possibilità di Colpo Maldestro' || diceRoll <= 8);

    if (isFumble) {
      setCombatOutcome({
        type: 'fumble',
        roll: diceRoll,
        finalResult,
        tableCode,
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
      recordAttackResult('fumble', 0, null);
    } else if (cellValue === '0' || cellValue === '') {
      setCombatOutcome({
        type: 'miss',
        roll: diceRoll,
        finalResult,
        tableCode,
        message: 'COLPO MANCATO',
        details: 'L\'attacco non è abbastanza forte da superare le difese o l\'armatura del bersaglio. Nessun danno inflitto.'
      });
      recordAttackResult('miss', 0, null);
    } else {
      const match = cellValue.match(/^(\d+)([A-E])?$/);
      if (match) {
        const damage = parseInt(match[1]);
        const critType = match[2] || null;
        
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
        recordAttackResult('hit', finalDamage, critType);
      } else {
        const damage = parseInt(cellValue) || 0;
        setCombatOutcome({
          type: 'hit',
          roll: diceRoll,
          finalResult,
          tableCode,
          damage,
          criticalType: null,
          message: `COLPO A SEGNO: ${cellValue}`,
          details: 'Danni calcolati dal sistema.'
        });
        setShowCriticalResolver(false);
        recordAttackResult('hit', damage, null);
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
  };

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-indigo-600 w-5 h-5">⚔</span>
            Risoluzione Combattimenti (Calcolatore Attacchi)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Risolvi gli attacchi fisici in tempo reale. Seleziona i personaggi dal Roster per caricarne le statistiche BO/BD/Armatura o inserisci i dati manualmente.
          </p>
        </div>
        <button
          onClick={() => {
            setRoundResults([]);
            setRoundTotalDamage(0);
            setSelectedWeaponIdx(0);
            setCombatOutcome(null);
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
        <AttackerPanel
          attackerId={attackerId}
          setAttackerId={setAttackerId}
          customAttackerName={customAttackerName}
          setCustomAttackerName={setCustomAttackerName}
          attackerBO={attackerBO}
          setAttackerBO={setAttackerBO}
          attackerWeaponCat={attackerWeaponCat}
          setAttackerWeaponCat={setAttackerWeaponCat}
          attackerWeaponName={attackerWeaponName}
          attackerHpTot={attackerHpTot}
          setAttackerHpTot={setAttackerHpTot}
          attackerHpSubiti={attackerHpSubiti}
          setAttackerHpSubiti={setAttackerHpSubiti}
          processedRoster={processedRoster}
          campaignNpcs={campaignNpcs}
          campaignCreatures={campaignCreatures}
          attackerInfo={attackerInfo}
          selectedWeaponIdx={selectedWeaponIdx}
          setSelectedWeaponIdx={setSelectedWeaponIdx}
          attackerBOEffective={attackerBOEffective}
          attackerBoSpesoParata={attackerBoSpesoParata}
          onUpdateHpSubiti={onUpdateHpSubiti}
          onUpdateActorHp={onUpdateActorHp}
        />

        <DefenderPanel
          defenderId={defenderId}
          setDefenderId={setDefenderId}
          customDefenderName={customDefenderName}
          setCustomDefenderName={setCustomDefenderName}
          defenderArmor={defenderArmor}
          setDefenderArmor={setDefenderArmor}
          defenderBD={defenderBD}
          setDefenderBD={setDefenderBD}
          customDefenderBO={customDefenderBO}
          setCustomDefenderBO={setCustomDefenderBO}
          defenderHpTot={defenderHpTot}
          setDefenderHpTot={setDefenderHpTot}
          defenderHpSubiti={defenderHpSubiti}
          setDefenderHpSubiti={setDefenderHpSubiti}
          processedRoster={processedRoster}
          campaignNpcs={campaignNpcs}
          campaignCreatures={campaignCreatures}
          defenderInfo={defenderInfo}
          selectedDefenderWeaponIdx={selectedDefenderWeaponIdx}
          setSelectedDefenderWeaponIdx={setSelectedDefenderWeaponIdx}
          useShield={useShield}
          setUseShield={setUseShield}
          backAttack={backAttack}
          defenderParry={defenderParry}
          handleDefenderParryChange={handleDefenderParryChange}
          defenderWeaponBO={defenderWeaponBO}
          onUpdateHpSubiti={onUpdateHpSubiti}
          onUpdateActorHp={onUpdateActorHp}
        />
      </div>

      <ModifiersPanel
        flankAttack={flankAttack}
        setFlankAttack={setFlankAttack}
        backAttack={backAttack}
        setBackAttack={setBackAttack}
        surprisedDefender={surprisedDefender}
        setSurprisedDefender={setSurprisedDefender}
        stunnedDefender={stunnedDefender}
        setStunnedDefender={setStunnedDefender}
        movementMetres={movementMetres}
        setMovementMetres={setMovementMetres}
        drawOrSwapWeapon={drawOrSwapWeapon}
        setDrawOrSwapWeapon={setDrawOrSwapWeapon}
        isRangedOrThrown={isRangedOrThrown}
        isAttackerGravelyInjured={isAttackerGravelyInjured}
        gmBonus={gmBonus}
        setGmBonus={setGmBonus}
        computedModifiers={computedModifiers}
      />

      {/* --- PANNELLO LANCIO DEL DADO & CALCOLO --- */}
      <div className="card p-6 border-2 border-indigo-600 rounded-xl bg-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <button
              onClick={handleRollDice}
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Play className="w-5 h-5" />
              Tira Dado (1D100)
            </button>

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

      <CombatOutcomePanel
        combatOutcome={combatOutcome}
        defenderId={defenderId}
        defenderInfo={defenderInfo}
        defenderHpSubiti={defenderHpSubiti}
        setDefenderHpSubiti={setDefenderHpSubiti}
        onUpdateHpSubiti={onUpdateHpSubiti}
        onUpdateActorHp={onUpdateActorHp}
        setCritTableCode={setCritTableCode}
        setCritSeverity={setCritSeverity}
        setCritDiceRoll={setCritDiceRoll}
        setShowCriticalResolver={setShowCriticalResolver}
        setShowFumbleResolver={setShowFumbleResolver}
        handleReset={handleReset}
      />

      {/* --- STORICO ATTACCHI DEL ROUND --- */}
      {roundResults.length > 0 && (
        <div className="card p-5 border border-indigo-200 rounded-xl bg-indigo-50/10 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-150 mb-3">
            <h4 className="font-bold text-sm text-indigo-950 uppercase tracking-wider">Attacchi del Round</h4>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
              Totale danni: {roundTotalDamage} PF
            </span>
          </div>
          <ul className="space-y-2">
            {roundResults.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-xs bg-white border border-gray-150 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-700">{i + 1}. {r.attackName}</span>
                  <span className={`font-bold uppercase ${r.type === 'hit' ? 'text-emerald-700' : r.type === 'miss' ? 'text-slate-500' : 'text-red-700'}`}>
                    {r.type === 'hit' ? `${r.damage} PF${r.criticalType ? ` + Critico ${r.criticalType}` : ''}` : r.type === 'miss' ? 'Mancato' : 'Colpo Maldestro'}
                  </span>
                </div>
                <span className="text-gray-400 whitespace-nowrap">Tiro {r.roll} → {r.finalResult}</span>
              </li>
            ))}
          </ul>
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
