import { saveDocument, deleteDocument, subscribeToCollection } from "./firestoreService";

const SUBCOLLECTION = "companies";

// Salva o aggiorna una compagnia
export const saveCompany = async (gmId, companyData) => {
  return saveDocument(gmId, SUBCOLLECTION, companyData, {
    nameField: "name",
    defaultName: "Compagnia Senza Nome",
    extraFields: ["characterIds"]
  });
};

// Elimina una compagnia
export const deleteCompany = async (gmId, companyId) => {
  return deleteDocument(gmId, SUBCOLLECTION, companyId);
};

// Sottoscrizione in tempo reale alla lista delle compagnie del GM
export const subscribeToCompanies = (gmId, callback) => {
  return subscribeToCollection(gmId, SUBCOLLECTION, callback, { sortBy: "name" });
};
