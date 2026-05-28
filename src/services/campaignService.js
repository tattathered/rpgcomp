import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

// Ottiene il riferimento alla collezione delle campagne di un GM
const getCampaignsRef = (gmId) => {
  return collection(db, "gms", gmId, "campaigns");
};

// Salva o aggiorna una campagna
export const saveCampaign = async (gmId, campaignData) => {
  if (!gmId) throw new Error("gmId richiesto per salvare la campagna");

  const id = campaignData.id || doc(collection(db, "temp")).id;
  const updatedCampaign = {
    ...campaignData,
    id,
    gmId,
    name: campaignData.name?.trim() || "Campagna Senza Nome",
    companyIds: campaignData.companyIds || [],
    npcIds: campaignData.npcIds || [], // In v1 NPG/Mostri sono opzionali
    updatedAt: serverTimestamp()
  };

  if (!campaignData.createdAt) {
    updatedCampaign.createdAt = serverTimestamp();
  }

  const docRef = doc(db, "gms", gmId, "campaigns", id);
  await setDoc(docRef, updatedCampaign);
  return updatedCampaign;
};

// Elimina una campagna
export const deleteCampaign = async (gmId, campaignId) => {
  const docRef = doc(db, "gms", gmId, "campaigns", campaignId);
  await deleteDoc(docRef);
};

// Sottoscrizione in tempo reale alla lista delle campagne del GM
export const subscribeToCampaigns = (gmId, callback) => {
  const collRef = getCampaignsRef(gmId);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      callback(list);
    },
    (error) => {
      console.error("Errore nella sottoscrizione alle campagne:", error);
    }
  );
};
