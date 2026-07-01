import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import defaultItems from '../data/codex_defaults.json';

const CodexContext = createContext(null);

const defaultConfig = {
  scheda_riepilogo: {
    caratteristiche: true,
    abilita: true,
    popoli: true,
    professioni: true,
    oggetti: true,
    creature: true,
    lingue: true,
    gradi_lingue: true
  }
};

export function CodexProvider({ children }) {
  const { user, isGM } = useAuth();
  const [activeGmId, setActiveGmId] = useState(null);
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);

  // Imposta l'activeGmId in base al ruolo dell'utente
  useEffect(() => {
    if (isGM && user?.uid) {
      setActiveGmId(user.uid);
    }
  }, [user, isGM]);

  // Funzione per consentire al portale giocatore di sovrascrivere il GM ID
  const setGmIdOverride = (id) => {
    if (id) {
      setActiveGmId(id);
    }
  };

  // Sottoscrizione a codex_items e codex_config di activeGmId
  useEffect(() => {
    if (!activeGmId) {
      setItems([]);
      setConfig(defaultConfig);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Sottoscrizione ai Codex Items
    const itemsRef = collection(db, 'gms', activeGmId, 'codex_items');
    const unsubItems = onSnapshot(itemsRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setItems(list);
      setLoading(false);
    }, (err) => {
      console.error("Errore nel caricamento del codex:", err);
      setLoading(false);
    });

    // 2. Sottoscrizione alla Configurazione Posizionamento
    const configDocRef = doc(db, 'gms', activeGmId, 'settings', 'codex_config');
    const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      } else {
        setConfig(defaultConfig);
      }
    });

    return () => {
      unsubItems();
      unsubConfig();
    };
  }, [activeGmId]);

  // Controlla se il tooltip è abilitato per pagina e categoria
  const isTooltipEnabled = (pageId, category) => {
    if (!config || !config[pageId]) {
      return defaultConfig[pageId]?.[category] ?? false;
    }
    // Se la categoria non è ancora definita su Firestore, usa il default
    if (config[pageId][category] === undefined) {
      return defaultConfig[pageId]?.[category] ?? false;
    }
    return config[pageId][category];
  };

  // Restituisce la descrizione di un termine (ricerca normalizzata sia su keyword che su sinonimi)
  const getTooltipText = (category, term) => {
    if (!term) return null;
    const normalizedQuery = term.trim().toLowerCase();

    const findMatch = (list) => {
      // 1. Cerca prima nella categoria specifica
      let found = list.find(item => {
        if (item.category !== category) return false;
        const normalizedKeyword = item.keyword.trim().toLowerCase();
        if (normalizedKeyword === normalizedQuery) return true;
        if (item.synonyms && Array.isArray(item.synonyms)) {
          return item.synonyms.some(syn => syn.trim().toLowerCase() === normalizedQuery);
        }
        return false;
      });

      // 2. Se non trovato, effettua una ricerca globale in qualsiasi categoria come fallback
      if (!found) {
        found = list.find(item => {
          const normalizedKeyword = item.keyword.trim().toLowerCase();
          if (normalizedKeyword === normalizedQuery) return true;
          if (item.synonyms && Array.isArray(item.synonyms)) {
            return item.synonyms.some(syn => syn.trim().toLowerCase() === normalizedQuery);
          }
          return false;
        });
      }
      return found;
    };

    // Ricerca nei dati di Firestore (GM)
    let matched = findMatch(items);

    // Fallback nei dati locali predefiniti (codex_defaults.json)
    if (!matched) {
      matched = findMatch(defaultItems);
    }

    return matched ? matched.description : null;
  };

  // Salva o aggiorna un elemento del codex
  const saveCodexItem = async (itemData) => {
    if (!activeGmId) return;
    const docId = itemData.id || itemData.keyword.trim().toLowerCase().replace(/\s+/g, '_');
    const docRef = doc(db, 'gms', activeGmId, 'codex_items', docId);
    
    await setDoc(docRef, {
      ...itemData,
      id: docId,
      lastUpdated: new Date()
    }, { merge: true });
  };

  // Rimuove un elemento dal codex
  const deleteCodexItem = async (itemId) => {
    if (!activeGmId) return;
    const docRef = doc(db, 'gms', activeGmId, 'codex_items', itemId);
    await deleteDoc(docRef);
  };

  // Aggiorna le preferenze di configurazione della visibilità
  const updateConfig = async (pageId, category, enabled) => {
    if (!activeGmId) return;
    const docRef = doc(db, 'gms', activeGmId, 'settings', 'codex_config');
    const newConfig = {
      ...config,
      [pageId]: {
        ...(config[pageId] || {}),
        [category]: enabled
      }
    };
    await setDoc(docRef, newConfig);
  };

  // Importa in massa i defaults locali su Firestore
  const importDefaultsToFirestore = async () => {
    if (!activeGmId) return;
    
    const batch = writeBatch(db);
    defaultItems.forEach(item => {
      const docRef = doc(db, 'gms', activeGmId, 'codex_items', item.id);
      batch.set(docRef, {
        ...item,
        lastUpdated: new Date()
      }, { merge: true });
    });
    
    await batch.commit();
  };

  return (
    <CodexContext.Provider value={{
      items: items.length > 0 ? items : defaultItems,
      config,
      loading,
      isTooltipEnabled,
      getTooltipText,
      saveCodexItem,
      deleteCodexItem,
      updateConfig,
      importDefaultsToFirestore,
      setGmIdOverride,
      activeGmId
    }}>
      {children}
    </CodexContext.Provider>
  );
}

export function useCodex() {
  const context = useContext(CodexContext);
  if (!context) {
    throw new Error('useCodex must be used within a CodexProvider');
  }
  return context;
}
