import {
  getFinalStats,
  getCharacterHpTot,
  getCharacterSkillBonus
} from './skillHelpers';
import {
  getSkillForWeapon,
  getCreatureAttackDetails,
  mapCreatureArmor
} from './combatHelpers';

/**
 * Processa il roster dei PG per il CombatCalculator.
 * Calcola stats finali, bonus abilità armi, BD, armatura, HP, armi inventario.
 */
export const processPcRoster = (savedCharacters) => {
  return savedCharacters.map(char => {
    const race = char.race;
    const profession = char.profession;
    const stats = char.stats || {};
    const levelDevelopments = char.levelDevelopments || [];
    const finalLevel = 1 + levelDevelopments.length;

    const bgData = char.background || { languages: {}, options: [] };
    const bgModifiers = bgData.compiledModifiers || { statsBonus: {}, skillBgRanks: {}, secondarySkills: {}, gold: 0 };

    const finalStats = getFinalStats(stats, race, bgModifiers);

    const weaponSkillNames = [
      'taglio a 1 mano', 'contundenti a 1 mano', 'a 2 mani',
      'da tiro', 'da lancio', 'con asta', 'dardo', 'sfera'
    ];

    const skillBonuses = {};
    weaponSkillNames.forEach(name => {
      skillBonuses[name] = getCharacterSkillBonus(char, name);
    });

    const bdBase = finalStats['AG']?.bonusTot || 0;
    const bdSpecial = bgModifiers.bdSpecialBonus || 0;
    const finalBD = bdBase + bdSpecial;

    let mappedArmor = 'nessuna';
    const eqArmor = (char.equippedArmor || '').toLowerCase();
    if (eqArmor.includes('grezzo')) mappedArmor = 'cuoio_grezzo';
    else if (eqArmor.includes('rinforzato')) mappedArmor = 'cuoio_rinforzato';
    else if (eqArmor.includes('maglia')) mappedArmor = 'maglia';
    else if (eqArmor.includes('piastre')) mappedArmor = 'piastre';

    const hpTot = getCharacterHpTot(char);

    const inventoryWeapons = (char.equipment || [])
      .filter(item => {
        const isWeapon = (item.categoria || '').toLowerCase().trim() === 'armi';
        const hasQty = (item.qtyEquip || 0) > 0 || (item.qtyCarico || 0) > 0 || (item.qty || 0) > 0;
        return isWeapon && hasQty;
      })
      .map(item => {
        const skillName = getSkillForWeapon(item);
        return { nome: item.nome, skillName, bo: skillBonuses[skillName] || 0 };
      })
      .sort((a, b) => b.bo - a.bo);

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
};

/**
 * Costruisce l'oggetto informativo dell'attaccante.
 */
export const buildAttackerInfo = (attackerId, customAttackerName, attackerBO, attackerHpTot, attackerHpSubiti, processedRoster, campaignNpcs, campaignCreatures, selectedWeaponIdx) => {
  if (attackerId === 'custom') {
    return {
      type: 'custom', name: customAttackerName, bo: attackerBO,
      hpTot: attackerHpTot, hpSubiti: attackerHpSubiti, weapons: [], size: 'medio'
    };
  }

  if (attackerId.startsWith('pc-')) {
    const pcId = attackerId.substring(3);
    const pc = processedRoster.find(c => c.id === pcId);
    if (!pc) return null;
    return {
      type: 'pc', id: pc.id, name: pc.name,
      bo: pc.weapons[selectedWeaponIdx]?.bo || 0,
      hpTot: pc.hpTot, hpSubiti: pc.hpSubiti || 0,
      boSpesoParata: pc.boSpesoParata || 0,
      weapons: pc.weapons, size: 'medio',
      hasShield: pc.hasShield, hasMetalBracciali: pc.hasMetalBracciali,
      hasMetalSchinieri: pc.hasMetalSchinieri, hasMetalElmo: pc.hasMetalElmo
    };
  }

  if (attackerId.startsWith('npc-')) {
    const npcId = attackerId.substring(4);
    const npc = campaignNpcs.find(n => n.id === npcId);
    if (!npc) return null;

    const npcWeapons = [];
    if (npc.skills) {
      if (npc.skills["Arma primaria"] !== undefined) npcWeapons.push({ nome: "Arma Primaria", bo: npc.skills["Arma primaria"], skillName: "taglio a 1 mano" });
      if (npc.skills["Arma secondaria"] !== undefined) npcWeapons.push({ nome: "Arma Secondaria", bo: npc.skills["Arma secondaria"], skillName: "taglio a 1 mano" });
      if (npc.skills["Arma terziaria"] !== undefined) npcWeapons.push({ nome: "Arma Terziaria", bo: npc.skills["Arma terziaria"], skillName: "taglio a 1 mano" });
      if (npc.skills["Arma altre"] !== undefined) npcWeapons.push({ nome: "Arma Altre", bo: npc.skills["Arma altre"], skillName: "taglio a 1 mano" });
      if (npc.skills["Incantesimi diretti"] !== undefined) npcWeapons.push({ nome: "Incantesimi Diretti", bo: npc.skills["Incantesimi diretti"], skillName: "dardo" });
    }
    if (npcWeapons.length === 0) npcWeapons.push({ nome: "Attacco Base", bo: 0, skillName: "taglio a 1 mano" });

    const selectedW = npcWeapons[selectedWeaponIdx] || npcWeapons[0];
    return {
      type: 'npc', id: npc.id, name: npc.name, bo: selectedW.bo,
      hpTot: npc.hpMax || 0,
      hpSubiti: (npc.hpMax || 0) - (npc.hpCorrenti !== undefined ? npc.hpCorrenti : (npc.hpMax || 0)),
      weapons: npcWeapons, size: 'medio'
    };
  }

  if (attackerId.startsWith('creature-')) {
    const creatureId = attackerId.substring(9);
    const creature = campaignCreatures.find(c => c.id === creatureId);
    if (!creature) return null;

    const creatureWeapons = [];
    if (creature.Attacco_uno) creatureWeapons.push({ nome: creature.Attacco_uno, bo: creature.Attacco_uno_BO || 0, isCreatureAttack: true, attackType: 'Attacco_uno' });
    if (creature.Attacco_due) creatureWeapons.push({ nome: creature.Attacco_due, bo: creature.Attacco_due_BO || 0, isCreatureAttack: true, attackType: 'Attacco_due' });
    if (creatureWeapons.length === 0) creatureWeapons.push({ nome: "Attacco Base", bo: 0, isCreatureAttack: true, attackType: 'Attacco_uno' });

    const selectedW = creatureWeapons[selectedWeaponIdx] || creatureWeapons[0];
    return {
      type: 'creature', id: creature.id, name: creature.Nome, bo: selectedW.bo,
      hpTot: creature.punti_ferita || 0,
      hpSubiti: (creature.punti_ferita || 0) - (creature.hpCorrenti !== undefined ? creature.hpCorrenti : (creature.punti_ferita || 0)),
      weapons: creatureWeapons, size: creature.Dimensioni_animale || 'medio'
    };
  }

  return null;
};

/**
 * Costruisce l'oggetto informativo del difensore.
 */
export const buildDefenderInfo = (defenderId, customDefenderName, defenderBD, defenderArmor, defenderHpTot, defenderHpSubiti, processedRoster, campaignNpcs, campaignCreatures) => {
  if (defenderId === 'custom') {
    return {
      type: 'custom', name: customDefenderName, bd: defenderBD,
      armor: defenderArmor, hpTot: defenderHpTot, hpSubiti: defenderHpSubiti
    };
  }

  if (defenderId.startsWith('pc-')) {
    const pcId = defenderId.substring(3);
    const pc = processedRoster.find(c => c.id === pcId);
    if (!pc) return null;
    return {
      type: 'pc', id: pc.id, name: pc.name, bd: pc.bd, armor: pc.equippedArmor,
      hpTot: pc.hpTot, hpSubiti: pc.hpSubiti || 0, weapons: pc.weapons,
      hasShield: pc.hasShield, hasMetalBracciali: pc.hasMetalBracciali,
      hasMetalSchinieri: pc.hasMetalSchinieri, hasMetalElmo: pc.hasMetalElmo
    };
  }

  if (defenderId.startsWith('npc-')) {
    const npcId = defenderId.substring(4);
    const npc = campaignNpcs.find(n => n.id === npcId);
    if (!npc) return null;

    const npcWeapons = [];
    if (npc.skills) {
      if (npc.skills["Arma primaria"] !== undefined) npcWeapons.push({ nome: "Arma Primaria", bo: npc.skills["Arma primaria"] });
      if (npc.skills["Arma secondaria"] !== undefined) npcWeapons.push({ nome: "Arma Secondaria", bo: npc.skills["Arma secondaria"] });
      if (npc.skills["Arma terziaria"] !== undefined) npcWeapons.push({ nome: "Arma Terziaria", bo: npc.skills["Arma terziaria"] });
      if (npc.skills["Arma altre"] !== undefined) npcWeapons.push({ nome: "Arma Altre", bo: npc.skills["Arma altre"] });
    }

    return {
      type: 'npc', id: npc.id, name: npc.name, bd: npc.db || 0,
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
    if (creature.Attacco_uno) creatureWeapons.push({ nome: creature.Attacco_uno, bo: creature.Attacco_uno_BO || 0, isCreatureAttack: true, attackType: 'Attacco_uno' });
    if (creature.Attacco_due) creatureWeapons.push({ nome: creature.Attacco_due, bo: creature.Attacco_due_BO || 0, isCreatureAttack: true, attackType: 'Attacco_due' });
    if (creatureWeapons.length === 0) creatureWeapons.push({ nome: "Attacco Base", bo: 0, isCreatureAttack: true, attackType: 'Attacco_uno' });

    return {
      type: 'creature', id: creature.id, name: creature.Nome,
      bd: creature.bonus_difensivo || 0, armor: mapCreatureArmor(creature.tipo_armatura),
      hpTot: creature.punti_ferita || 0,
      hpSubiti: (creature.punti_ferita || 0) - (creature.hpCorrenti !== undefined ? creature.hpCorrenti : (creature.punti_ferita || 0)),
      weapons: creatureWeapons
    };
  }

  return null;
};
