// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, disableNetwork, enableNetwork, getDocs, initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDuMPU5-gMrwaPYngnCWnUsgTtOK8FKLXY",
  authDomain: "at-taqwa-app-14b7f.firebaseapp.com",
  projectId: "at-taqwa-app-14b7f",
  storageBucket: "at-taqwa-app-14b7f.appspot.com",
  messagingSenderId: "569440550273",
  appId: "1:569440550273:web:70b659a16255e0a643fc80"
};

// Initialisation unique pour Expo
export const app = initializeApp(firebaseConfig);

// Configuration Firebase Auth avec persistance automatique
export const auth = getAuth(app);

// Configuration de la persistance Firebase Auth
// En production, Firebase Auth gère automatiquement la persistance
// Cette configuration assure que la persistance fonctionne correctement
auth.useDeviceLanguage();

// Configuration de la persistance pour différents environnements
// En production, la persistance est automatique
// En développement (Expo Go), on utilise AsyncStorage comme fallback

// Configuration Firestore optimisée pour Expo
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Force le polling long pour Expo
});

// Configuration Firebase Functions
export const functions = getFunctions(app);

// Configuration Firebase Storage
export const storage = getStorage(app);

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