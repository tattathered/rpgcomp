import { db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
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

// Fetch one-shot di tutti i personaggi del GM
export const fetchCharacters = async (gmId) => {
  const colRef = collection(db, "gms", gmId, SUBCOLLECTION);
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Duplica un personaggio
export const duplicateCharacter = async (gmId, char) => {
  const { id, ...data } = char;
  const colRef = collection(db, "gms", gmId, SUBCOLLECTION);
  const docRef = await addDoc(colRef, {
    ...data,
    name: `${data.name} (Copia)`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...data, name: `${data.name} (Copia)` };
};

// Esporta un personaggio come file JSON scaricabile
export const exportCharacter = (char) => {
  const blob = new Blob([JSON.stringify(char, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${char.name || "personaggio"}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Importa un personaggio da file JSON
export const importCharacter = async (user, savedCharacters, setSavedCharacters) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const charData = { ...data, id: undefined };
      const saved = await saveCharacter(user.uid, charData);
      setSavedCharacters(prev => [...prev, saved]);
    } catch (err) {
      console.error("Errore importazione personaggio:", err);
      alert("Errore durante l'importazione del personaggio.");
    }
  };
  input.click();
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
