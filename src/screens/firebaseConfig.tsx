// src/firebaseConfig.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import { collection, disableNetwork, enableNetwork, getDocs, initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAxEHjynhNxiWP6HFdeWamSFk3YJy0-rto",
  authDomain: "at-taqwa-app-14b7f.firebaseapp.com",
  projectId: "at-taqwa-app-14b7f",
  storageBucket: "at-taqwa-app-14b7f.appspot.com",
  messagingSenderId: "569440550273",
  appId: "1:569440550273:web:70b659a16255e0a643fc80"
};

// Initialisation unique pour Expo
export const app = initializeApp(firebaseConfig);

// Firebase Auth avec persistance native React Native (corrige la déconnexion à chaque ouverture)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Langue de l'auth
auth.useDeviceLanguage();

// Firestore optimisé pour Expo - Initialisation unique avec garde-fou
let firestoreInitialized = false;
let firestoreInstance: ReturnType<typeof initializeFirestore> | null = null;

export const db = (() => {
  if (!firestoreInitialized) {
    try {
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
      firestoreInitialized = true;
    } catch (error: any) {
      // Si déjà initialisé, réutiliser l'instance existante
      if (error?.code === 'already-exists' || error?.message?.includes('already exists')) {
        console.warn('⚠️ Firestore déjà initialisé, réutilisation de l\'instance existante');
        // Essayer de récupérer l'instance existante
        const { getFirestore } = require('firebase/firestore');
        return getFirestore(app);
      }
      throw error;
    }
  }
  return firestoreInstance!;
})();

// Firebase Functions & Storage
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Logs debug
console.log('🔥 Firebase initialisé');
console.log('📱 Project ID:', firebaseConfig.projectId);
console.log('💾 Persistance Auth: ReactNative AsyncStorage');

// Garde-fou pour éviter les appels multiples à enableNetwork/disableNetwork
let networkOperationInProgress = false;
let lastNetworkOperation = 0;
const NETWORK_OPERATION_COOLDOWN = 2000; // 2 secondes entre les opérations réseau

// Test de connexion Firestore
export const testFirestoreConnection = async () => {
  try {
    console.log('🔍 Test de connexion Firestore...');

    // Éviter les appels multiples
    if (networkOperationInProgress) {
      console.log('⏳ Opération réseau en cours, attente...');
      return false;
    }
    const now = Date.now();
    if (now - lastNetworkOperation < NETWORK_OPERATION_COOLDOWN) {
      console.log('⏳ Cooldown réseau actif, attente...');
      return false;
    }

    networkOperationInProgress = true;
    lastNetworkOperation = now;

    try {
      await enableNetwork(db);
      console.log('✅ Réseau activé');

      const testQuery = await getDocs(collection(db, 'notifications'));
      console.log(`✅ Connexion Firestore réussie - ${testQuery.docs.length} notifications trouvées`);
      return true;
    } catch (networkError: any) {
      // Ignorer les erreurs "already-exists" qui sont non-bloquantes
      if (networkError?.code === 'already-exists' || networkError?.message?.includes('already exists')) {
        console.warn('⚠️ Target ID déjà existant (non-bloquant)');
        // Essayer quand même la requête
        try {
          const testQuery = await getDocs(collection(db, 'notifications'));
          console.log(`✅ Connexion Firestore réussie - ${testQuery.docs.length} notifications trouvées`);
          return true;
        } catch {
          return false;
        }
      }
      throw networkError;
    } finally {
      networkOperationInProgress = false;
    }
  } catch (error) {
    networkOperationInProgress = false;
    // Ne pas logger les erreurs "already-exists" comme des erreurs critiques
    if (error instanceof Error && 'code' in error && (error as any).code === 'already-exists') {
      console.warn('⚠️ Erreur Firestore (non-bloquant): Target ID already exists');
      return false;
    }
    console.error('❌ Erreur de connexion Firestore:', error);
    console.error('🔍 Code d\'erreur:', error instanceof Error && 'code' in error ? (error as any).code : 'Inconnu');
    return false;
  }
};

// Reconnexion Firestore
export const reconnectFirestore = async () => {
  try {
    // Éviter les appels multiples
    if (networkOperationInProgress) {
      console.log('⏳ Opération réseau en cours, reconnexion ignorée');
      return false;
    }
    const now = Date.now();
    if (now - lastNetworkOperation < NETWORK_OPERATION_COOLDOWN) {
      console.log('⏳ Cooldown réseau actif, reconnexion ignorée');
      return false;
    }

    console.log('🔄 Tentative de reconnexion Firestore...');

    networkOperationInProgress = true;
    lastNetworkOperation = now;

    try {
      await disableNetwork(db);
      console.log('📴 Réseau désactivé');

      await new Promise(resolve => setTimeout(resolve, 1000));

      await enableNetwork(db);
      console.log('📡 Réseau réactivé');

      return true;
    } catch (networkError: any) {
      // Ignorer les erreurs "already-exists" qui sont non-bloquantes
      if (networkError?.code === 'already-exists' || networkError?.message?.includes('already exists')) {
        console.warn('⚠️ Target ID déjà existant lors de la reconnexion (non-bloquant)');
        return true; // Considérer comme réussi car non-bloquant
      }
      throw networkError;
    } finally {
      networkOperationInProgress = false;
    }
  } catch (error) {
    networkOperationInProgress = false;
    // Ne pas logger les erreurs "already-exists" comme des erreurs critiques
    if (error instanceof Error && 'code' in error && (error as any).code === 'already-exists') {
      console.warn('⚠️ Erreur Firestore (non-bloquant): Target ID already exists');
      return true; // Considérer comme réussi car non-bloquant
    }
    console.error('❌ Erreur de reconnexion:', error);
    return false;
  }
};

// État Firestore
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

// État Auth
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