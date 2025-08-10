// Test simple pour diagnostiquer le problème Firebase
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail } = require('firebase/auth');

// Configuration Firebase de votre projet
const firebaseConfig = {
  apiKey: "AIzaSyAxEHjynhNxiWP6HFdeWamSFk3YJy0-rto",
  authDomain: "at-taqwa-app-14b7f.firebaseapp.com",
  projectId: "at-taqwa-app-14b7f",
  storageBucket: "at-taqwa-app-14b7f.appspot.com",
  messagingSenderId: "569440550273",
  appId: "1:569440550273:web:70b659a16255e0a643fc80"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Test avec plusieurs emails
const testEmails = [
  "attaqwa241@gmail.com",
  "papalybn1@gmail.com", 
  "test@example.com" // Email de test
];

async function testMultipleEmails() {
  console.log('🧪 Test diagnostic Firebase Auth...');
  console.log('📧 Configuration Firebase:', firebaseConfig.authDomain);
  
  for (const email of testEmails) {
    try {
      console.log(`\n📧 Test avec: ${email}`);
      await sendPasswordResetEmail(auth, email);
      console.log(`✅ Email envoyé avec succès à: ${email}`);
    } catch (error) {
      console.error(`❌ Erreur pour ${email}:`, error.code, error.message);
    }
  }
  
  console.log('\n🔍 Diagnostic terminé. Vérifiez vos emails.');
}

testMultipleEmails(); 