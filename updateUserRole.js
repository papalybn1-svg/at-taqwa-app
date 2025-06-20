// Script Node.js pour mettre à jour le champ 'role' d'un utilisateur Firestore
// Usage : node updateUserRole.js <email> <role>

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const serviceAccount = require('./at-taqwa-app-adc7e-firebase-adminsdk-fbsvc-611f1a991d.json');

if (process.argv.length < 4) {
  console.log('Usage: node updateUserRole.js <email> <role>');
  process.exit(1);
}

const email = process.argv[2];
const role = process.argv[3];

// Initialisation Firebase Admin SDK
admin.initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function updateRoleByEmail(email, role) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  if (snapshot.empty) {
    console.log('Aucun utilisateur trouvé avec cet email.');
    return;
  }
  snapshot.forEach(async (doc) => {
    await doc.ref.update({ role });
    console.log(`Rôle de ${email} mis à jour en '${role}'.`);
  });
}

updateRoleByEmail(email, role).then(() => process.exit(0)); 