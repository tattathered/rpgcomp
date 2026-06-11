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
    const upperRealm = (realm || '').toUpperCase().trim();
    effectiveRules = (upperRealm === 'ESSENZA' || upperRealm === 'FLUSSO') ? [upperRealm] : ['ESSENZA'];
  }

  const categoryMap = {
    'ESSENZA': 'Lista Aperta Essenza',
    'FLUSSO': 'Lista Aperta Flusso',
    'RANGER': 'Ranger',
    'BARDO': 'Bardo',
    'MAGO': 'Mago',
    'ANIMISTA': 'Animista'
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
  
  // New nested structure: elencoIncantesimi has { liste_incantesimi: [...] }
  const listData = (elencoIncantesimi.liste_incantesimi || []).find(
    l => (l.nome_lista || '').toLowerCase().trim() === normalizedListName
  );
  
  if (!listData) return [];
  
  const note = listData.note || undefined;
  
  return (listData.incantesimi || [])
    .map(inc => ({
      livello: inc.numero,
      nome_incantesimo: inc.nome,
      tipo_incantesimo: inc.tipologia || null,
      istantaneo: inc.istantaneo || false,
      efficacia: inc.efficacia || null,
      durata: inc.durata || null,
      raggio_azione: inc.raggio_azione || null,
      descrizione_incantesimo: inc.descrizione || null,
      note_lista: note,
    }))
    .sort((a, b) => a.livello - b.livello);
}
