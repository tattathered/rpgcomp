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
