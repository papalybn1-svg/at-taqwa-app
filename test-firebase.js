// Test simple pour vérifier Firebase Auth
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail } = require('firebase/auth');

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

// Test avec votre email
const testEmail = "attaqwa241@gmail.com"; // Email de reply-to configuré

async function testPasswordReset() {
  try {
    console.log('🧪 Test envoi email réinitialisation...');
    console.log('📧 Email:', testEmail);
    
    await sendPasswordResetEmail(auth, testEmail);
    console.log('✅ Email envoyé avec succès !');
    console.log('📬 Vérifiez votre boîte de réception et spam');
  } catch (error) {
    console.error('❌ Erreur:', error.code, error.message);
  }
}

testPasswordReset(); 