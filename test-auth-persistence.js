// Script de test pour vérifier la persistance de l'authentification Firebase
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } = require('firebase/auth');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Configuration Firebase (même que dans l'app)
const firebaseConfig = {
  apiKey: "AIzaSyD_wGrGiN81UbBiLpeezXU8oHvXbXCVuk8",
  authDomain: "at-taqwa-app-adc7e.firebaseapp.com",
  projectId: "at-taqwa-app-adc7e",
  storageBucket: "at-taqwa-app-adc7e.appspot.com",
  messagingSenderId: "372160219580",
  appId: "1:372160219580:web:3e5a696faf7b6ea632c3b9"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log('🔥 Test de persistance Firebase Auth');
console.log('====================================');

// Test de l'état d'authentification initial
console.log('🔍 Vérification de l\'état initial...');
console.log('Current user:', auth.currentUser ? 'Connecté' : 'Non connecté');

// Écouter les changements d'état d'authentification
const unsubscribe = onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ Utilisateur connecté:');
    console.log('  - Email:', user.email);
    console.log('  - UID:', user.uid);
    console.log('  - Dernière connexion:', user.metadata.lastSignInTime);
    console.log('  - Création compte:', user.metadata.creationTime);
  } else {
    console.log('❌ Aucun utilisateur connecté');
  }
});

// Simuler les tests
async function runTests() {
  try {
    // Test 1: Vérifier si un utilisateur est déjà connecté
    console.log('\n📋 Test 1: État initial');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
    
    if (!auth.currentUser) {
      console.log('Aucun utilisateur connecté, test de connexion...');
      
      // Test 2: Connexion
      console.log('\n📋 Test 2: Connexion test');
      try {
        const userCredential = await signInWithEmailAndPassword(auth, 'ndiaye@gmail.com', 'brahim');
        console.log('✅ Connexion réussie:', userCredential.user.email);
      } catch (error) {
        console.log('❌ Erreur connexion:', error.message);
      }
    } else {
      console.log('Utilisateur déjà connecté:', auth.currentUser.email);
    }
    
    // Test 3: Attendre et vérifier la persistance
    console.log('\n📋 Test 3: Vérification persistance (5 secondes)');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (auth.currentUser) {
      console.log('✅ Session persistante:', auth.currentUser.email);
    } else {
      console.log('❌ Session non persistante');
    }
    
    // Test 4: Déconnexion (optionnel)
    console.log('\n📋 Test 4: Test déconnexion');
    if (auth.currentUser) {
      await signOut(auth);
      console.log('✅ Déconnexion effectuée');
    }
    
  } catch (error) {
    console.error('❌ Erreur durant les tests:', error);
  } finally {
    unsubscribe();
    console.log('\n🏁 Tests terminés');
    process.exit(0);
  }
}

// Démarrer les tests après 3 secondes
setTimeout(runTests, 3000); 