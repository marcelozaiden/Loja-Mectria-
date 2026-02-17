import { initializeApp, getApp, getApps } from "firebase/app";
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

// Use named imports for Firebase v9+ to ensure compatibility and correct typing.
// Inicializa o Firebase apenas se ainda não houver uma instância ativa para prevenir erros de re-inicialização (HMR).
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exporta o banco de dados para uso em toda a aplicação seguindo o padrão modular v9.
export const db = getFirestore(app);

export default app;