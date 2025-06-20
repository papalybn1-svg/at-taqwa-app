// Script de test pour diagnostiquer les problèmes Firestore
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const serviceAccount = require('./at-taqwa-app-adc7e-firebase-adminsdk-fbsvc-611f1a991d.json');

// Initialisation Firebase Admin SDK
admin.initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function testFirestoreConnection() {
  console.log('🔍 Test de connexion Firestore...');
  
  try {
    // Test 1: Connexion de base
    console.log('📡 Test 1: Connexion de base...');
    const testCollection = db.collection('test');
    await testCollection.get();
    console.log('✅ Connexion de base réussie');
    
    // Test 2: Lecture des notifications
    console.log('📋 Test 2: Lecture des notifications...');
    const notificationsSnapshot = await db.collection('notifications').get();
    console.log(`✅ ${notificationsSnapshot.docs.length} notifications trouvées`);
    
    // Test 3: Lecture des hadiths
    console.log('📖 Test 3: Lecture des hadiths...');
    const hadithsSnapshot = await db.collection('hadiths').get();
    console.log(`✅ ${hadithsSnapshot.docs.length} hadiths trouvés`);
    
    // Test 4: Lecture des utilisateurs
    console.log('👥 Test 4: Lecture des utilisateurs...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`✅ ${usersSnapshot.docs.length} utilisateurs trouvés`);
    
    // Test 5: Créer une notification de test
    console.log('✍️ Test 5: Création d\'une notification de test...');
    const testNotification = {
      title: "Test de connexion",
      message: "Cette notification a été créée pour tester la connexion Firestore",
      type: "test",
      authorName: "Système",
      targetUsers: "all",
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('notifications').add(testNotification);
    console.log(`✅ Notification de test créée avec l'ID: ${docRef.id}`);
    
    // Supprimer la notification de test
    await docRef.delete();
    console.log('🗑️ Notification de test supprimée');
    
    console.log('🎉 Tous les tests Firestore sont réussis !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test Firestore:', error);
    console.error('🔍 Détails:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// Exécuter le test
testFirestoreConnection().then(() => {
  console.log('🏁 Test terminé');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 