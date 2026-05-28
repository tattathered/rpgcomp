import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";

// Ottiene il riferimento alla collezione characters di un GM
const getCharactersRef = (gmId) => {
  return collection(db, "gms", gmId, "characters");
};

// Salva o aggiorna un personaggio
export const saveCharacter = async (gmId, charData) => {
  if (!gmId) throw new Error("gmId richiesto per salvare il personaggio");

  const name = charData.name?.trim() || "Senza Nome";
  const id = charData.id || doc(collection(db, "temp")).id; // Usa ID Firestore se assente
  
  const updatedChar = {
    ...charData,
    id,
    name,
    gmId,
    updatedAt: serverTimestamp()
  };

  // Se è un nuovo personaggio, aggiungiamo createdAt
  if (!charData.createdAt) {
    updatedChar.createdAt = serverTimestamp();
  }

  const docRef = doc(db, "gms", gmId, "characters", id);
  await setDoc(docRef, updatedChar);
  return updatedChar;
};

// Carica un singolo personaggio
export const getCharacter = async (gmId, charId) => {
  const docRef = doc(db, "gms", gmId, "characters", charId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
};

// Elimina un personaggio
export const deleteCharacter = async (gmId, charId) => {
  const docRef = doc(db, "gms", gmId, "characters", charId);
  await deleteDoc(docRef);
};

// Sottoscrizione in tempo reale alla lista dei personaggi del GM
export const subscribeToCharacters = (gmId, callback) => {
  const collRef = getCharactersRef(gmId);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const chars = [];
      snapshot.forEach((doc) => {
        chars.push(doc.data());
      });
      // Ordina per nome per default
      chars.sort((a, b) => a.name.localeCompare(b.name));
      callback(chars);
    },
    (error) => {
      console.error("Errore nella sottoscrizione ai personaggi:", error);
    }
  );
};

// Aggiorna gli HP subiti di un personaggio
export const updateCharacterHp = async (gmId, charId, hpSubiti) => {
  const docRef = doc(db, "gms", gmId, "characters", charId);
  await updateDoc(docRef, { hpSubiti, updatedAt: serverTimestamp() });
};

// Aggiorna la parata attiva (B.O. speso per parare) di un personaggio
export const updateCharacterParry = async (gmId, charId, boSpesoParata) => {
  const docRef = doc(db, "gms", gmId, "characters", charId);
  await updateDoc(docRef, { boSpesoParata, updatedAt: serverTimestamp() });
};

// Resetta tutte le parate dei personaggi indicati
export const resetAllParries = async (gmId, characterIds) => {
  if (!characterIds || characterIds.length === 0) return;
  const batch = writeBatch(db);
  
  characterIds.forEach((charId) => {
    const docRef = doc(db, "gms", gmId, "characters", charId);
    batch.update(docRef, { boSpesoParata: 0, updatedAt: serverTimestamp() });
  });

  await batch.commit();
};
