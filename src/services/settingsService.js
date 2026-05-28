import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import defaultEquipment from "../data/TS_4-equipaggiamento.json";

// Ottiene l'equipaggiamento personalizzato del GM da Firestore
export const getEquipmentCatalog = async (gmId) => {
  if (!gmId) throw new Error("gmId richiesto per caricare il catalogo");

  const docRef = doc(db, "gms", gmId, "settings", "equipmentCatalog");
  try {
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().catalog) {
      return snap.data().catalog;
    } else {
      // Se non esiste, salviamo e restituiamo quello di default
      await saveEquipmentCatalog(gmId, defaultEquipment);
      return defaultEquipment;
    }
  } catch (error) {
    console.error("Errore nel caricamento del catalogo attrezzatura:", error);
    return defaultEquipment;
  }
};

// Salva l'equipaggiamento personalizzato del GM su Firestore
export const saveEquipmentCatalog = async (gmId, catalog) => {
  if (!gmId) throw new Error("gmId richiesto per salvare il catalogo");

  const docRef = doc(db, "gms", gmId, "settings", "equipmentCatalog");
  await setDoc(docRef, {
    catalog,
    updatedAt: serverTimestamp()
  });
};
