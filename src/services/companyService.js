import { db } from "../firebase";
import { getDocs, collection } from "firebase/firestore";
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

// Fetch one-shot di tutte le compagnie del GM
export const fetchCompanies = async (gmId) => {
  const colRef = collection(db, "gms", gmId, SUBCOLLECTION);
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
