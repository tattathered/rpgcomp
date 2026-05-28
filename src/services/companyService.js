import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

// Ottiene il riferimento alla collezione delle compagnie di un GM
const getCompaniesRef = (gmId) => {
  return collection(db, "gms", gmId, "companies");
};

// Salva o aggiorna una compagnia
export const saveCompany = async (gmId, companyData) => {
  if (!gmId) throw new Error("gmId richiesto per salvare la compagnia");

  const id = companyData.id || doc(collection(db, "temp")).id;
  const updatedCompany = {
    ...companyData,
    id,
    gmId,
    name: companyData.name?.trim() || "Compagnia Senza Nome",
    characterIds: companyData.characterIds || [],
    updatedAt: serverTimestamp()
  };

  if (!companyData.createdAt) {
    updatedCompany.createdAt = serverTimestamp();
  }

  const docRef = doc(db, "gms", gmId, "companies", id);
  await setDoc(docRef, updatedCompany);
  return updatedCompany;
};

// Elimina una compagnia
export const deleteCompany = async (gmId, companyId) => {
  const docRef = doc(db, "gms", gmId, "companies", companyId);
  await deleteDoc(docRef);
};

// Sottoscrizione in tempo reale alla lista delle compagnie del GM
export const subscribeToCompanies = (gmId, callback) => {
  const collRef = getCompaniesRef(gmId);
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
      console.error("Errore nella sottoscrizione alle compagnie:", error);
    }
  );
};
