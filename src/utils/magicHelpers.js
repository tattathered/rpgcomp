import utilizLimiti from '../data/Tabella-elenco_utilizzatori_limiti.json';
import {
  CATEGORIA_ESSENZA, CATEGORIA_FLUSSO, CATEGORIA_MAGHI,
  CATEGORIA_BARDI, CATEGORIA_RANGER, CATEGORIA_ANIMISTI, CATEGORY_ORDER
} from './spellListTypes';

// Normalizza un tipo_lista (canonico o legacy) alla categoria canonica
function normalizeCategory(tipoLista) {
  const norm = (tipoLista || '').toLowerCase();
  if (norm.includes('essenza')) return CATEGORIA_ESSENZA;
  if (norm.includes('flusso')) return CATEGORIA_FLUSSO;
  if (norm.includes('mag')) return CATEGORIA_MAGHI;
  if (norm.includes('bard')) return CATEGORIA_BARDI;
  if (norm.includes('ranger')) return CATEGORIA_RANGER;
  if (norm.includes('animist')) return CATEGORIA_ANIMISTI;
  return tipoLista;
}

// Indice ordine canonico delle categorie
const CATEGORY_INDEX = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));

// Ordina le liste: categoria (ordine canonico) poi alfabetico per nome lista
function sortSpellLists(lists) {
  return [...lists].sort((a, b) => {
    const ca = CATEGORY_INDEX.get(normalizeCategory(a.tipo_lista)) ?? 999;
    const cb = CATEGORY_INDEX.get(normalizeCategory(b.tipo_lista)) ?? 999;
    if (ca !== cb) return ca - cb;
    return (a.nome_lista || '').localeCompare(b.nome_lista || '', 'it');
  });
}

export function getAvailableSpellLists(professionName, realm, spellCatalog) {
  const limitRule = utilizLimiti.find(u => u.professione === professionName);
  if (!limitRule) return [];
  
  const rules = limitRule.liste_incantesimi.split(/ e | o /).map(s => s.trim().toUpperCase());
  
  let effectiveRules = rules;
  if (limitRule.liste_incantesimi === "ESSENZA o FLUSSO") {
    const upperRealm = (realm || '').toUpperCase().trim();
    effectiveRules = (upperRealm === 'ESSENZA' || upperRealm === 'FLUSSO') ? [upperRealm] : ['ESSENZA'];
  }

  const categoryMap = {
    'ESSENZA': CATEGORIA_ESSENZA,
    'FLUSSO': CATEGORIA_FLUSSO,
    'RANGER': CATEGORIA_RANGER,
    'BARDO': CATEGORIA_BARDI,
    'MAGO': CATEGORIA_MAGHI,
    'ANIMISTA': CATEGORIA_ANIMISTI
  };

  const allowedCategories = [];
  effectiveRules.forEach(rule => {
    if (categoryMap[rule]) {
      allowedCategories.push(categoryMap[rule]);
    }
  });

  // Punto di verità: catalogo condiviso (Firestore). Fallback [] se non ancora caricato.
  const catalogLists = spellCatalog?.liste_incantesimi || [];
  const filtered = catalogLists.filter(lista => allowedCategories.includes(normalizeCategory(lista.tipo_lista)));
  return sortSpellLists(filtered);
}

export function getSpellLimitInfo(professionName) {
  const limitRule = utilizLimiti.find(u => u.professione === professionName);
  if (!limitRule) return null;
  return limitRule.limite_incantesimi;
}

export function getSpellsForList(listName, customCatalog) {
  const normalizedListName = (listName || '').toLowerCase().trim();
  
  // Punto di verità: catalogo incantesimi (Firestore). Nessun fallback su JSON statico stale.
  const listData = (customCatalog?.liste_incantesimi || []).find(
    l => (l.nome_lista || '').toLowerCase().trim() === normalizedListName
  );
  
  if (!listData) return [];
  
  const note = listData.note || undefined;
  
  return (listData.incantesimi || [])
    .filter(inc => inc.attivo !== false)
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
