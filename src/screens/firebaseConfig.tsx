// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { collection, disableNetwork, enableNetwork, getDocs, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD_wGrGiN81UbBiLpeezXU8oHvXbXCVuk8",
  authDomain: "at-taqwa-app-adc7e.firebaseapp.com",
  projectId: "at-taqwa-app-adc7e",
  storageBucket: "at-taqwa-app-adc7e.appspot.com",
  messagingSenderId: "372160219580",
  appId: "1:372160219580:web:3e5a696faf7b6ea632c3b9"
};

// Initialisation unique pour Expo
export const app = initializeApp(firebaseConfig);

// Configuration Firebase Auth avec persistance automatique
export const auth = getAuth(app);

// Configuration Firestore optimisée pour Expo
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Force le polling long pour Expo
});

// Configuration pour un meilleur débogage
console.log('🔥 Firebase config initialisée avec persistance Auth automatique');
console.log('📱 Project ID:', firebaseConfig.projectId);
console.log('🔧 Configuration Firestore optimisée pour Expo');
console.log('💾 Persistance Auth native Firebase activée');

// Test de connexion Firestore
export const testFirestoreConnection = async () => {
  try {
    console.log('🔍 Test de connexion Firestore...');
    
    // Forcer la connexion réseau
    await enableNetwork(db);
    console.log('✅ Réseau activé');
    
    // Test simple de lecture
    const testQuery = await getDocs(collection(db, 'notifications'));
    console.log(`✅ Connexion Firestore réussie - ${testQuery.docs.length} notifications trouvées`);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion Firestore:', error);
    console.error('🔍 Code d\'erreur:', error instanceof Error && 'code' in error ? (error as any).code : 'Inconnu');
    return false;
  }
};

// Fonction pour forcer la reconnexion
export const reconnectFirestore = async () => {
  try {
    console.log('🔄 Tentative de reconnexion Firestore...');
    
    // Désactiver puis réactiver le réseau
    await disableNetwork(db);
    console.log('📴 Réseau désactivé');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
    
    await enableNetwork(db);
    console.log('📡 Réseau réactivé');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de reconnexion:', error);
    return false;
  }
};

// Fonction pour vérifier l'état de la connexion
export const checkFirestoreStatus = async () => {
  try {
    const testQuery = await getDocs(collection(db, 'notifications'));
    return {
      connected: true,
      documentsCount: testQuery.docs.length
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

// Fonction pour vérifier l'état d'authentification
export const checkAuthStatus = () => {
  const currentUser = auth.currentUser;
  console.log('🔐 Auth Status:', {
    isSignedIn: !!currentUser,
    email: currentUser?.email,
    uid: currentUser?.uid,
    lastSignInTime: currentUser?.metadata?.lastSignInTime,
    creationTime: currentUser?.metadata?.creationTime
  });
  return !!currentUser;
};