import { db } from "../firebase";
import { doc, getDocs, collection, writeBatch, serverTimestamp } from "firebase/firestore";
import { saveDocument, deleteDocument, subscribeToCollection } from "./firestoreService";

const SUBCOLLECTION = "campaigns";

// Salva o aggiorna una campagna
export const saveCampaign = async (gmId, campaignData) => {
  return saveDocument(gmId, SUBCOLLECTION, campaignData, {
    nameField: "name",
    defaultName: "Campagna Senza Nome",
    extraFields: ["companyIds", "npcIds"]
  });
};

// Elimina una campagna
export const deleteCampaign = async (gmId, campaignId) => {
  return deleteDocument(gmId, SUBCOLLECTION, campaignId);
};

// Sottoscrizione in tempo reale alla lista delle campagne del GM
export const subscribeToCampaigns = (gmId, callback) => {
  return subscribeToCollection(gmId, SUBCOLLECTION, callback, { sortBy: "name" });
};

// Fetch one-shot di tutte le campagne del GM
export const fetchCampaigns = async (gmId) => {
  const colRef = collection(db, "gms", gmId, SUBCOLLECTION);
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Imposta una campagna come attiva (disattiva tutte le altre)
export const setActiveCampaign = async (gmId, campaignId) => {
  const colRef = collection(db, "gms", gmId, SUBCOLLECTION);
  const snap = await getDocs(colRef);
  const batch = writeBatch(db);
  snap.docs.forEach(docSnap => {
    batch.update(docSnap.ref, { active: docSnap.id === campaignId, updatedAt: serverTimestamp() });
  });
  await batch.commit();
};
