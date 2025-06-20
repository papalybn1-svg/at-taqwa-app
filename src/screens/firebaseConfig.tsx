// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_wGrGiN81UbBiLpeezXU8oHvXbXCVuk8",
  authDomain: "at-taqwa-app-adc7e.firebaseapp.com",
  projectId: "at-taqwa-app-adc7e",
  storageBucket: "at-taqwa-app-adc7e.appspot.com",
  messagingSenderId: "372160219580",
  appId: "1:372160219580:web:3e5a696faf7b6ea632c3b9"
};

// Initialisation unique pour Expo (web)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);