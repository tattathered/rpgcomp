import { db } from "../firebase";
import {
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { saveDocument, deleteDocument, subscribeToCollection } from "./firestoreService";

const NPC_SUBCOLLECTION = "campaign_npcs";
const CREATURE_SUBCOLLECTION = "campaign_creatures";

// Salva o aggiorna un PNG associato a una Campagna
export const saveCampaignNpc = async (gmId, campaignId, npcData) => {
  if (!campaignId) throw new Error("campaignId richiesto per salvare il PNG");

  const data = { ...npcData, campaignId };
  return saveDocument(gmId, NPC_SUBCOLLECTION, data, {
    nameField: "name",
    defaultName: "PNG Senza Nome",
    extraFields: ["hpCorrenti"]
  });
};

// Elimina un PNG associato a una Campagna
export const deleteCampaignNpc = async (gmId, npcId) => {
  return deleteDocument(gmId, NPC_SUBCOLLECTION, npcId);
};

// Sottoscrizione ai PNG attivi di una specifica Campagna
export const subscribeToCampaignNpcs = (gmId, campaignId, callback) => {
  return subscribeToCollection(gmId, NPC_SUBCOLLECTION, callback, {
    sortBy: "name",
    filterField: "campaignId",
    filterValue: campaignId
  });
};

// Salva o associa una Creatura a una Campagna
export const saveCampaignCreature = async (gmId, campaignId, creatureData) => {
  if (!campaignId) throw new Error("campaignId richiesto");

  // Assicurati che hpCorrenti e punti_ferita siano valorizzati correttamente
  const maxHp = parseInt(creatureData.punti_ferita || 0, 10);
  const data = {
    ...creatureData,
    campaignId,
    hpCorrenti: creatureData.hpCorrenti !== undefined ? creatureData.hpCorrenti : maxHp
  };

  return saveDocument(gmId, CREATURE_SUBCOLLECTION, data, {
    nameField: "Nome",
    defaultName: "Creatura Senza Nome"
  });
};

// Elimina una Creatura associata a una Campagna
export const deleteCampaignCreature = async (gmId, creatureId) => {
  return deleteDocument(gmId, CREATURE_SUBCOLLECTION, creatureId);
};

// Sottoscrizione alle Creature attive di una specifica Campagna
export const subscribeToCampaignCreatures = (gmId, campaignId, callback) => {
  return subscribeToCollection(gmId, CREATURE_SUBCOLLECTION, callback, {
    sortBy: "Nome",
    filterField: "campaignId",
    filterValue: campaignId
  });
};

// Aggiorna velocemente gli HP di un attore (PNG o Creatura)
export const updateCampaignActorHp = async (gmId, type, actorId, newHp) => {
  if (!gmId || !actorId) throw new Error("gmId e actorId richiesti");

  const collectionName = type === "npc" ? NPC_SUBCOLLECTION : CREATURE_SUBCOLLECTION;
  const docRef = doc(db, "gms", gmId, collectionName, actorId);

  await updateDoc(docRef, {
    hpCorrenti: parseInt(newHp, 10),
    updatedAt: serverTimestamp()
  });
};
