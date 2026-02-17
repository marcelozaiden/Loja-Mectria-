import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBv4JmHoLoPeBFmRXdJmCgOIt0Ivw6aGtk",
  authDomain: "loja-mectria-2026.firebaseapp.com",
  projectId: "loja-mectria-2026",
  storageBucket: "loja-mectria-2026.firebasestorage.app",
  messagingSenderId: "688951928786",
  appId: "1:688951928786:web:fae8da454286bd7c6d8a0b",
  measurementId: "G-JBK19V6HME"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
export default app;