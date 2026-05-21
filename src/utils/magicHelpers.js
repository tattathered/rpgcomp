import utilizLimiti from '../data/Tabella-elenco_utilizzatori_limiti.json';
import listeIncantesimi from '../data/Tabella-liste_incantesimi.json';
import elencoIncantesimi from '../data/Tabella-elenco_incantesimi.json';

export function getAvailableSpellLists(professionName, realm) {
  const limitRule = utilizLimiti.find(u => u.professione === professionName);
  if (!limitRule) return [];
  
  let allowedCategories = [];
  const rules = limitRule.liste_incantesimi.split(/ e | o /).map(s => s.trim().toUpperCase());
  
  let effectiveRules = rules;
  if (limitRule.liste_incantesimi === "ESSENZA o FLUSSO") {
     effectiveRules = [realm?.toUpperCase() || 'ESSENZA']; // Default if not selected
  }

  const categoryMap = {
    'ESSENZA': 'Lista Aperta Essenza',
    'FLUSSO': 'Lista Aperta Flusso',
    'RANGER': 'Ranger Ranger',
    'BARDO': 'Bardi Bardi',
    'MAGO': 'Maghi Maghi',
    'ANIMISTA': 'Animisti Animisti'
  };

  effectiveRules.forEach(rule => {
    if (categoryMap[rule]) {
      allowedCategories.push(categoryMap[rule]);
    }
  });

  return listeIncantesimi.filter(lista => allowedCategories.includes(lista.tipo_lista));
}

export function getSpellLimitInfo(professionName) {
  const limitRule = utilizLimiti.find(u => u.professione === professionName);
  if (!limitRule) return null;
  return limitRule.limite_incantesimi;
}

export function getSpellsForList(listName) {
  const normalizedListName = (listName || '').toLowerCase().trim();
  const spells = elencoIncantesimi.filter(s => (s.nome_lista || '').toLowerCase().trim() === normalizedListName);
  
  return spells.sort((a,b) => parseInt(a.livello, 10) - parseInt(b.livello, 10));
}
