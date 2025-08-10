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

// Firestore optimisé pour Expo
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Firebase Functions & Storage
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Logs debug
console.log('🔥 Firebase initialisé');
console.log('📱 Project ID:', firebaseConfig.projectId);
console.log('💾 Persistance Auth: ReactNative AsyncStorage');

// Test de connexion Firestore
export const testFirestoreConnection = async () => {
  try {
    console.log('🔍 Test de connexion Firestore...');

    await enableNetwork(db);
    console.log('✅ Réseau activé');

    const testQuery = await getDocs(collection(db, 'notifications'));
    console.log(`✅ Connexion Firestore réussie - ${testQuery.docs.length} notifications trouvées`);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion Firestore:', error);
    console.error('🔍 Code d\'erreur:', error instanceof Error && 'code' in error ? (error as any).code : 'Inconnu');
    return false;
  }
};

// Reconnexion Firestore
export const reconnectFirestore = async () => {
  try {
    console.log('🔄 Tentative de reconnexion Firestore...');

    await disableNetwork(db);
    console.log('📴 Réseau désactivé');

    await new Promise(resolve => setTimeout(resolve, 1000));

    await enableNetwork(db);
    console.log('📡 Réseau réactivé');

    return true;
  } catch (error) {
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