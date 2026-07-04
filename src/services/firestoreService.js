import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";

/**
 * Genera un ID Firestore univoco senza creare documenti fittizi.
 */
const generateId = () => doc(collection(db, "documents")).id;

/**
 * Salva o aggiorna un documento in una subcollection del GM.
 *
 * @param {string} gmId - ID del GM proprietario
 * @param {string} subcollection - Nome della subcollection (es. "characters", "companies")
 * @param {Object} data - Dati da salvare
 * @param {Object} [options] - Opzioni aggiuntive
 * @param {string} [options.nameField="name"] - Campo usato come nome per fallback
 * @param {string} [options.defaultName="Senza Nome"] - Nome di default
 * @param {Array} [options.extraFields] - Campi extra da inizializzare se assenti
 * @returns {Promise<Object>} Documento salvato con id, gmId, timestamps
 */
export const saveDocument = async (gmId, subcollection, data, options = {}) => {
  if (!gmId) throw new Error("gmId richiesto");

  const {
    nameField = "name",
    defaultName = "Senza Nome",
    extraFields = []
  } = options;

  const id = data.id || generateId();
  const name = data[nameField]?.trim() || defaultName;

  const updatedDoc = {
    ...data,
    id,
    gmId,
    [nameField]: name,
    updatedAt: serverTimestamp()
  };

  // Inizializza campi extra se assenti
  extraFields.forEach((field) => {
    if (updatedDoc[field] === undefined) {
      updatedDoc[field] = [];
    }
  });

  if (!data.createdAt) {
    updatedDoc.createdAt = serverTimestamp();
  }

  const docRef = doc(db, "gms", gmId, subcollection, id);
  await setDoc(docRef, updatedDoc);
  return updatedDoc;
};

/**
 * Elimina un documento da una subcollection del GM.
 *
 * @param {string} gmId - ID del GM proprietario
 * @param {string} subcollection - Nome della subcollection
 * @param {string} docId - ID del documento da eliminare
 */
export const deleteDocument = async (gmId, subcollection, docId) => {
  if (!gmId) throw new Error("gmId richiesto");
  const docRef = doc(db, "gms", gmId, subcollection, docId);
  await deleteDoc(docRef);
};

/**
 * Aggiorna campi specifici di un documento.
 *
 * @param {string} gmId - ID del GM proprietario
 * @param {string} subcollection - Nome della subcollection
 * @param {string} docId - ID del documento
 * @param {Object} fields - Campi da aggiornare
 */
export const updateDocument = async (gmId, subcollection, docId, fields) => {
  const docRef = doc(db, "gms", gmId, subcollection, docId);
  await updateDoc(docRef, { ...fields, updatedAt: serverTimestamp() });
};

/**
 * Sottoscrive in tempo reale a una subcollection del GM.
 *
 * @param {string} gmId - ID del GM proprietario
 * @param {string} subcollection - Nome della subcollection
 * @param {Function} callback - Callback con i dati ordinati
 * @param {Object} [options] - Opzioni
 * @param {string} [options.sortBy="name"] - Campo per ordinamento
 * @param {string} [options.filterField] - Campo per filtro (es. "campaignId")
 * @param {string} [options.filterValue] - Valore per filtro
 * @returns {Function} Funzione unsubscribe
 */
export const subscribeToCollection = (gmId, subcollection, callback, options = {}) => {
  if (!gmId) return () => {};

  const {
    sortBy = "name",
    filterField,
    filterValue
  } = options;

  const collRef = collection(db, "gms", gmId, subcollection);
  const q = filterField && filterValue !== undefined
    ? query(collRef, where(filterField, "==", filterValue))
    : query(collRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      list.sort((a, b) => (a[sortBy] || "").localeCompare(b[sortBy] || ""));
      callback(list);
    },
    (error) => {
      console.error(`Errore nella sottoscrizione a ${subcollection}:`, error);
    }
  );
};
