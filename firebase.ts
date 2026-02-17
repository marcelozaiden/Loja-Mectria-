import * as FirebaseApp from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração única do projeto Mectria Store
const firebaseConfig = {
  apiKey: "AIzaSyBv4JmHoLoPeBFmRXdJmCgOIt0Ivw6aGtk",
  authDomain: "loja-mectria-2026.firebaseapp.com",
  projectId: "loja-mectria-2026",
  storageBucket: "loja-mectria-2026.firebasestorage.app",
  messagingSenderId: "688951928786",
  appId: "1:688951928786:web:fae8da454286bd7c6d8a0b",
  measurementId: "G-JBK19V6HME"
};

// Use namespaced access for Firebase App members to resolve export identification issues in specific build environments.
// We verify existing app instances to prevent re-initialization errors during Hot Module Replacement (HMR).
const app = FirebaseApp.getApps().length === 0 
  ? FirebaseApp.initializeApp(firebaseConfig) 
  : FirebaseApp.getApp();

// Exporta o banco de dados para uso em toda a aplicação seguindo o padrão modular v9.
export const db = getFirestore(app);

export default app;
