import { db } from "../firebase";
import {
  collection,
  collectionGroup,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// Trova tutti i workspace dei GM a cui è invitato il giocatore
export const subscribeToPlayerWorkspaces = (playerId, callback) => {
  const q = query(collectionGroup(db, "players"), where("uid", "==", playerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        // docSnap.ref.parent è la collezione "players"
        // docSnap.ref.parent.parent è il documento GM
        const gmId = docSnap.ref.parent.parent.id;
        list.push({
          gmId,
          ...docSnap.data()
        });
      });
      callback(list);
    },
    (error) => {
      console.error("Errore nel recupero dei workspace del giocatore:", error);
    }
  );
};

// Sottoscrive in tempo reale a ciascun PG assegnato al giocatore
export const subscribeToPlayerCharacters = (gmId, characterIds, callback) => {
  if (!characterIds || characterIds.length === 0) {
    callback([]);
    return () => {};
  }

  const unsubs = [];
  const chars = {};

  characterIds.forEach((charId) => {
    const docRef = doc(db, "gms", gmId, "characters", charId);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        chars[charId] = docSnap.data();
      } else {
        delete chars[charId];
      }
      callback(Object.values(chars));
    }, (error) => {
      console.error(`Errore nella lettura del personaggio ${charId}:`, error);
    });
    unsubs.push(unsub);
  });

  return () => unsubs.forEach((f) => f());
};

// Sottoscrizione alle note/taccuino di un personaggio
export const subscribeToCharacterNotes = (charId, callback) => {
  const docRef = doc(db, "notes", charId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Errore nel caricamento delle note:", error);
  });
};

// Salva o aggiorna le note di un personaggio
export const saveCharacterNotes = async (charId, gmId, playerId, content) => {
  const docRef = doc(db, "notes", charId);
  await setDoc(docRef, {
    charId,
    gmId,
    playerId,
    content,
    updatedAt: serverTimestamp()
  });
};
