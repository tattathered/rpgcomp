import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import defaultSpells from "../data/Tabella-elenco_incantesimi.json";

// Migra un singolo incantesimo dal vecchio formato (F*, A*, P*) al nuovo
function migrateSpell(spell) {
  if (!spell || typeof spell !== 'object') return spell;
  
  const newSpell = { ...spell };
  
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

// Ottiene il catalogo incantesimi personalizzato del GM da Firestore
export const getSpellCatalog = async (gmId) => {
  if (!gmId) throw new Error("gmId richiesto per caricare il catalogo incantesimi");

  const docRef = doc(db, "gms", gmId, "settings", "spellCatalog");
  try {
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().catalog) {
      // Migra vecchi dati se necessario
      const migratedCatalog = migrateCatalog(snap.data().catalog);
      
      // Se ci sono state modifiche, risalva su Firestore
      if (JSON.stringify(migratedCatalog) !== JSON.stringify(snap.data().catalog)) {
        await saveSpellCatalog(gmId, migratedCatalog);
      }
      
      return migratedCatalog;
    } else {
      // Se non esiste, salviamo e restituiamo quello di default (già migrato)
      const migratedDefault = migrateCatalog(defaultSpells);
      await saveSpellCatalog(gmId, migratedDefault);
      return migratedDefault;
    }
  } catch (error) {
    console.error("Errore nel caricamento del catalogo incantesimi:", error);
    return migrateCatalog(defaultSpells);
  }
};

// Salva il catalogo incantesimi personalizzato del GM su Firestore
export const saveSpellCatalog = async (gmId, catalog) => {
  if (!gmId) throw new Error("gmId richiesto per salvare il catalogo incantesimi");

  const docRef = doc(db, "gms", gmId, "settings", "spellCatalog");
  await setDoc(docRef, {
    catalog,
    updatedAt: serverTimestamp()
  });
};
