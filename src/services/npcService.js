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

// Ottiene il riferimento alla collezione dei PNG di un GM
const getNpcsRef = (gmId) => {
  return collection(db, "gms", gmId, "campaign_npcs");
};

// Ottiene il riferimento alla collezione delle Creature di un GM
const getCreaturesRef = (gmId) => {
  return collection(db, "gms", gmId, "campaign_creatures");
};

// Salva o aggiorna un PNG associato a una Campagna
export const saveCampaignNpc = async (gmId, campaignId, npcData) => {
  if (!gmId) throw new Error("gmId richiesto per salvare il PNG");
  if (!campaignId) throw new Error("campaignId richiesto per salvare il PNG");

  const id = npcData.id || doc(collection(db, "temp")).id;
  const updatedNpc = {
    ...npcData,
    id,
    gmId,
    campaignId,
    name: npcData.name?.trim() || "PNG Senza Nome",
    hpCorrenti: npcData.hpCorrenti !== undefined ? npcData.hpCorrenti : npcData.hpMax,
    updatedAt: serverTimestamp()
  };

  if (!npcData.createdAt) {
    updatedNpc.createdAt = serverTimestamp();
  }

  const docRef = doc(db, "gms", gmId, "campaign_npcs", id);
  await setDoc(docRef, updatedNpc);
  return updatedNpc;
};

// Elimina un PNG associato a una Campagna
export const deleteCampaignNpc = async (gmId, npcId) => {
  if (!gmId) throw new Error("gmId richiesto");
  const docRef = doc(db, "gms", gmId, "campaign_npcs", npcId);
  await deleteDoc(docRef);
};

// Sottoscrizione ai PNG attivi di una specifica Campagna
export const subscribeToCampaignNpcs = (gmId, campaignId, callback) => {
  if (!gmId || !campaignId) return () => {};
  
  const collRef = getNpcsRef(gmId);
  const q = query(collRef, where("campaignId", "==", campaignId));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      callback(list);
    },
    (error) => {
      console.error("Errore nella sottoscrizione ai PNG della campagna:", error);
    }
  );
};

// Salva o associa una Creatura a una Campagna
export const saveCampaignCreature = async (gmId, campaignId, creatureData) => {
  if (!gmId) throw new Error("gmId richiesto");
  if (!campaignId) throw new Error("campaignId richiesto");

  const id = creatureData.id || doc(collection(db, "temp")).id;
  
  // Assicurati che hpCorrenti e punti_ferita siano valorizzati correttamenti
  const maxHp = parseInt(creatureData.punti_ferita || 0, 10);
  
  const updatedCreature = {
    ...creatureData,
    id,
    gmId,
    campaignId,
    hpCorrenti: creatureData.hpCorrenti !== undefined ? creatureData.hpCorrenti : maxHp,
    updatedAt: serverTimestamp()
  };

  if (!creatureData.createdAt) {
    updatedCreature.createdAt = serverTimestamp();
  }

  const docRef = doc(db, "gms", gmId, "campaign_creatures", id);
  await setDoc(docRef, updatedCreature);
  return updatedCreature;
};

// Elimina una Creatura associata a una Campagna
export const deleteCampaignCreature = async (gmId, creatureId) => {
  if (!gmId) throw new Error("gmId richiesto");
  const docRef = doc(db, "gms", gmId, "campaign_creatures", creatureId);
  await deleteDoc(docRef);
};

// Sottoscrizione alle Creature attive di una specifica Campagna
export const subscribeToCampaignCreatures = (gmId, campaignId, callback) => {
  if (!gmId || !campaignId) return () => {};

  const collRef = getCreaturesRef(gmId);
  const q = query(collRef, where("campaignId", "==", campaignId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => (a.Nome || "").localeCompare(b.Nome || ""));
      callback(list);
    },
    (error) => {
      console.error("Errore nella sottoscrizione alle creature della campagna:", error);
    }
  );
};

// Aggiorna velocemente gli HP di un attore (PNG o Creatura)
export const updateCampaignActorHp = async (gmId, type, actorId, newHp) => {
  if (!gmId || !actorId) throw new Error("gmId e actorId richiesti");

  const collectionName = type === "npc" ? "campaign_npcs" : "campaign_creatures";
  const docRef = doc(db, "gms", gmId, collectionName, actorId);
  
  await updateDoc(docRef, {
    hpCorrenti: parseInt(newHp, 10),
    updatedAt: serverTimestamp()
  });
};
