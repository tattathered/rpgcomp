import racesData from '../data/TB-3-modifiche_speciali_popolo.json';
import skillsData from '../data/skills.json';

/**
 * Lookup e mapping di ID per razze, abilità, professioni.
 */

export const STAT_KEYS = ['FR', 'AG', 'CO', 'IN', 'IT', 'PR'];
export const STAT_NAMES = { FR: 'Forza', AG: 'Agilità', CO: 'Costituzione', IN: 'Intelligenza', IT: 'Intuizione', PR: 'Presenza' };

export const getRaceId = (name) => {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  const race = racesData.find(r => r.id_popolo === n || r.nome.toLowerCase().trim() === n);
  return race ? race.id_popolo : null;
};

export const getSkillId = (name) => {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  const mapping = {
    'corazza di maglia': 'chain_mail',
    'cotta di maglia': 'chain_mail',
    'corazza di maglie': 'chain_mail',
    'taglio a 1 mano': 'one_handed_edged',
    'armi da taglio a 1 mano': 'one_handed_edged',
    'contundenti a 1 mano': 'one_handed_crushing',
    'armi contundenti a 1 mano': 'one_handed_crushing',
    'a 2 mani': 'two_handed',
    'armi a 2 mani': 'two_handed',
    'da tiro': 'missile',
    'armi da tiro': 'missile',
    'da lancio': 'thrown',
    'armi da lancio': 'thrown',
    'con asta': 'polearm',
    'armi con asta': 'polearm',
    'cogliere alle spalle': 'ambush',
    'colpire alle spalle': 'ambush',
    'muoversi silenziosamente': 'stalking',
    'muov. silenz. / nasc.': 'stalking',
    'nascondersi': 'hiding',
    'scassinare serrature': 'pick_locks',
    'scassinare': 'pick_locks',
    'disattivare trappole': 'disarm_traps',
    'uso oggetti magici': 'use_items',
    'uso di oggetti magici': 'use_items',
    'lettura rune': 'read_runes',
    'incantesimi diretti': 'directed_spells',
    'incantesimi base': 'base_spells',
    'percezione': 'perception',
    'resistenza fisica': 'body_development',
    'nessuna armatura': 'no_armor',
    'cuoio grezzo': 'soft_leather',
    'cuoio rinforzato': 'rigid_leather',
    'corazza di piastre': 'plate_mail'
  };
  const mapped = mapping[n];
  if (mapped) return mapped;
  const skill = skillsData.find(s => s.id === n || s.name_it.toLowerCase().trim() === n || s.name_en.toLowerCase().trim() === n);
  return skill ? skill.id : null;
};

export const getProfessionId = (prof) => {
  if (!prof) return null;
  if (typeof prof === 'object') {
    const id = prof.id || prof.professione;
    if (id) return id.toLowerCase().trim();
  }
  const n = String(prof).toLowerCase().trim();
  const enToIt = {
    'warrior': 'guerriero',
    'scout': 'scout',
    'mage': 'mago',
    'bard': 'bardo',
    'animist': 'animista',
    'ranger': 'ranger'
  };
  return enToIt[n] || n;
};

export const getCaseInsensitive = (map, key) => {
  if (!map || !key) return undefined;
  const kLower = key.toLowerCase().trim();
  const foundKey = Object.keys(map).find(k => k.toLowerCase().trim() === kLower);
  return foundKey ? map[foundKey] : undefined;
};

export const fmt = (n) => (typeof n === 'number' ? (n >= 0 ? `+${n}` : `${n}`) : n);
