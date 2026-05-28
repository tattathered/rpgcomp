import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCwBedMnlEupSIZbAekr8kDXeiDD9m5Bh0",
  authDomain: "merp-companion-yagni.firebaseapp.com",
  projectId: "merp-companion-yagni",
  storageBucket: "merp-companion-yagni.firebasestorage.app",
  messagingSenderId: "383158262538",
  appId: "1:383158262538:web:fc798bf118a149f632b8f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "us-central1");
export default app;
