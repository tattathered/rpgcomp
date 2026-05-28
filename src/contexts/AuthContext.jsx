import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        setUser(authUser);
        try {
          const userDocRef = doc(db, "users", authUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          } else {
            // Se il documento dell'utente non esiste, stiamo effettuando il primo login
            // di un GM (poiché i Giocatori vengono creati dalla Cloud Function che crea
            // contemporaneamente Auth e il documento Firestore in /users/{playerId}).
            const initialUserData = {
              uid: authUser.uid,
              role: "GM",
              displayName: authUser.displayName || authUser.email.split("@")[0],
              enabled: true,
              createdAt: serverTimestamp()
            };

            // Inizializza l'utente GM
            await setDoc(userDocRef, initialUserData);

            // Inizializza il workspace del GM
            const gmDocRef = doc(db, "gms", authUser.uid);
            await setDoc(gmDocRef, {
              uid: authUser.uid,
              createdAt: serverTimestamp()
            });

            setUserData(initialUserData);
          }
        } catch (error) {
          console.error("Errore nel caricamento del profilo utente:", error);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    userData,
    role: userData?.role || null,
    isGM: userData?.role === "GM",
    isPlayer: userData?.role === "player",
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth deve essere utilizzato all'interno di un AuthProvider");
  }
  return context;
}
