import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { saveDocument, deleteDocument, subscribeToCollection } from "./firestoreService";

const SUBCOLLECTION = "characters";

// Salva o aggiorna un personaggio
export const saveCharacter = async (gmId, charData) => {
  return saveDocument(gmId, SUBCOLLECTION, charData, {
    nameField: "name",
    defaultName: "Senza Nome"
  });
};

// Carica un singolo personaggio
export const getCharacter = async (gmId, charId) => {
  const docRef = doc(db, "gms", gmId, SUBCOLLECTION, charId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

// Elimina un personaggio
export const deleteCharacter = async (gmId, charId) => {
  return deleteDocument(gmId, SUBCOLLECTION, charId);
};

// Sottoscrizione in tempo reale alla lista dei personaggi del GM
export const subscribeToCharacters = (gmId, callback) => {
  return subscribeToCollection(gmId, SUBCOLLECTION, callback, { sortBy: "name" });
};

// Aggiorna gli HP subiti di un personaggio
export const updateCharacterHp = async (gmId, charId, hpSubiti) => {
  const docRef = doc(db, "gms", gmId, SUBCOLLECTION, charId);
  await updateDoc(docRef, { hpSubiti, updatedAt: serverTimestamp() });
};

// Aggiorna la parata attiva (B.O. speso per parare) di un personaggio
export const updateCharacterParry = async (gmId, charId, boSpesoParata) => {
  const docRef = doc(db, "gms", gmId, SUBCOLLECTION, charId);
  await updateDoc(docRef, { boSpesoParata, updatedAt: serverTimestamp() });
};

// Resetta tutte le parate dei personaggi indicati
export const resetAllParries = async (gmId, characterIds) => {
  if (!characterIds || characterIds.length === 0) return;
  const batch = writeBatch(db);

  characterIds.forEach((charId) => {
    const docRef = doc(db, "gms", gmId, SUBCOLLECTION, charId);
    batch.update(docRef, { boSpesoParata: 0, updatedAt: serverTimestamp() });
  });

  await batch.commit();
};
