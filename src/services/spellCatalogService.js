import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import defaultSpells from "../data/Tabella-elenco_incantesimi.json";

// Migra un singolo incantesimo dal vecchio formato (F*, A*, P*) al nuovo
function migrateSpell(spell) {
  if (!spell || typeof spell !== 'object') return spell;
  
  const newSpell = { ...spell };
  
  // 0. Assicura ID unico
  if (!newSpell.id) {
    newSpell.id = Math.random().toString(36).substring(2, 11);
  }
  
  // 1. Rimuovi asterisco dalla tipologia, sposta in istantaneo
  const tipo = (spell.tipologia || '').trim();
  if (tipo.endsWith('*')) {
    newSpell.tipologia = tipo.slice(0, -1).trim();
    newSpell.istantaneo = true;
  }
  
  // 2. Assicura che istantaneo sia sempre presente
  if (newSpell.istantaneo === undefined || newSpell.istantaneo === null) {
    newSpell.istantaneo = false;
  }
  if (typeof newSpell.istantaneo === 'string') {
    newSpell.istantaneo = newSpell.istantaneo === 'true' || newSpell.istantaneo === 'sì' || newSpell.istantaneo === 'istantaneo';
  }
  
  // 3. Campi assenti → stringa vuota
  if (newSpell.efficacia === undefined || newSpell.efficacia === null) newSpell.efficacia = '';
  if (newSpell.durata === undefined || newSpell.durata === null) newSpell.durata = '';
  if (newSpell.raggio_azione === undefined || newSpell.raggio_azione === null) newSpell.raggio_azione = '';
  if (newSpell.descrizione === undefined || newSpell.descrizione === null) newSpell.descrizione = '';
  
  // 4. Rimuovi vecchio campo preparazione_incantesimo se presente
  if (newSpell.preparazione_incantesimo !== undefined) {
    delete newSpell.preparazione_incantesimo;
  }
  
  // 5. Assicura che attivo sia sempre presente (default true)
  if (newSpell.attivo === undefined || newSpell.attivo === null) {
    newSpell.attivo = true;
  }
  
  return newSpell;
}

// Migra un intero catalogo dal vecchio formato al nuovo
function migrateCatalog(catalog) {
  if (!catalog || !catalog.liste_incantesimi) return catalog;
  
  const migrated = {
    ...catalog,
    liste_incantesimi: catalog.liste_incantesimi.map(lista => ({
      ...lista,
      incantesimi: (lista.incantesimi || []).map(migrateSpell),
    })),
  };
  
  return migrated;
}

// Percorso del catalogo incantesimi condiviso (unico per tutti i GM)
const SHARED_CATALOG_PATH = ['catalogs', 'spellCatalog'];

// Normalizza il catalogo assicurando la struttura {liste_incantesimi: []}
function normalizeCatalog(catalog) {
  if (!catalog || Array.isArray(catalog)) return { liste_incantesimi: [] };
  return catalog;
}

// Ottiene il catalogo incantesimi condiviso (punto di verità unico).
// - Se il documento condiviso esiste, lo restituisce (migrando se serve).
// - Altrimenti fa fallback sul vecchio catalogo per-GM (legacy) e lo promuove a condiviso.
// - Se non esiste nulla, inizializza con struttura vuota (il GM popolerà dal manager).
export const getSpellCatalog = async (gmId) => {
  const sharedRef = doc(db, ...SHARED_CATALOG_PATH);
  try {
    const snap = await getDoc(sharedRef);
    if (snap.exists() && snap.data().catalog) {
      const migratedCatalog = migrateCatalog(snap.data().catalog);
      if (JSON.stringify(migratedCatalog) !== JSON.stringify(snap.data().catalog)) {
        await saveSpellCatalog(migratedCatalog);
      }
      return normalizeCatalog(migratedCatalog);
    }

    // Fallback legacy: vecchio catalogo per-GM (pre-migrazione)
    if (gmId) {
      const legacyRef = doc(db, 'gms', gmId, 'settings', 'spellCatalog');
      const legacySnap = await getDoc(legacyRef);
      if (legacySnap.exists() && legacySnap.data().catalog) {
        const migrated = migrateCatalog(legacySnap.data().catalog);
        await saveSpellCatalog(migrated); // promuove a condiviso
        return normalizeCatalog(migrated);
      }
    }

    // Seed: nessun catalogo presente → struttura vuota (niente dati statici stale)
    const seeded = normalizeCatalog(migrateCatalog(defaultSpells));
    await saveSpellCatalog(seeded);
    return seeded;
  } catch (error) {
    console.error('Errore nel caricamento del catalogo incantesimi:', error);
    return normalizeCatalog(migrateCatalog(defaultSpells));
  }
};

// Salva il catalogo incantesimi condiviso (unico per tutti i GM)
export const saveSpellCatalog = async (catalog) => {
  const sharedRef = doc(db, ...SHARED_CATALOG_PATH);
  await setDoc(sharedRef, {
    catalog: normalizeCatalog(catalog),
    updatedAt: serverTimestamp()
  });
};

// Alias per compatibilità con App.jsx
export const fetchSpellCatalog = (gmId) => getSpellCatalog(gmId);
