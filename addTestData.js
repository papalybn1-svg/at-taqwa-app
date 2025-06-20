// Script pour ajouter des données de test dans Firestore
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const serviceAccount = require('./at-taqwa-app-adc7e-firebase-adminsdk-fbsvc-611f1a991d.json');

// Initialisation Firebase Admin SDK
admin.initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Données de test pour les hadiths
const testHadiths = [
  {
    text: "Les actions ne valent que par leurs intentions, et chaque homme n'a que ce qu'il a eu l'intention de faire.",
    source: "Bukhari et Muslim",
    category: "Intention",
    createdAt: new Date()
  },
  {
    text: "La foi consiste à croire en Allah, en Ses anges, en Ses livres, en Ses messagers, au Jour dernier et au destin, qu'il soit bon ou mauvais.",
    source: "Muslim",
    category: "Foi",
    createdAt: new Date()
  },
  {
    text: "L'Islam est bâti sur cinq piliers : l'attestation qu'il n'y a de divinité qu'Allah et que Muhammad est Son messager, l'accomplissement de la prière, l'acquittement de la zakat, le jeûne du mois de Ramadan et le pèlerinage à la Maison sacrée.",
    source: "Bukhari et Muslim",
    category: "Piliers de l'Islam",
    createdAt: new Date()
  },
  {
    text: "Le musulman est celui dont les musulmans sont à l'abri de sa langue et de sa main.",
    source: "Bukhari et Muslim",
    category: "Comportement",
    createdAt: new Date()
  },
  {
    text: "Celui qui ne remercie pas les gens ne remercie pas Allah.",
    source: "Abu Dawud et Tirmidhi",
    category: "Gratitude",
    createdAt: new Date()
  }
];

// Données de test pour les zikrs
const testZikrs = [
  {
    text: "Subhanallah",
    count: 33,
    category: "Matin",
    description: "Gloire à Allah",
    createdAt: new Date()
  },
  {
    text: "Alhamdulillah",
    count: 33,
    category: "Matin",
    description: "Louange à Allah",
    createdAt: new Date()
  },
  {
    text: "Allahu Akbar",
    count: 33,
    category: "Matin",
    description: "Allah est plus grand",
    createdAt: new Date()
  },
  {
    text: "La ilaha illallah",
    count: 100,
    category: "Protection",
    description: "Il n'y a de divinité qu'Allah",
    createdAt: new Date()
  },
  {
    text: "Astaghfirullah",
    count: 100,
    category: "Repentance",
    description: "Je demande pardon à Allah",
    createdAt: new Date()
  },
  {
    text: "Subhanallahi wa bihamdihi",
    count: 100,
    category: "Soir",
    description: "Gloire à Allah et Sa louange",
    createdAt: new Date()
  }
];

// Données de test pour les notifications
const testNotifications = [
  {
    title: "Bienvenue sur At-Taqwa",
    message: "Nous sommes ravis de vous accueillir dans notre application de prière. Commencez votre voyage spirituel dès aujourd'hui !",
    type: "success",
    targetUsers: "all",
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Nouveau contenu disponible",
    message: "De nouveaux hadiths et zikrs ont été ajoutés à l'application. Découvrez-les maintenant !",
    type: "info",
    targetUsers: "users",
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Rappel de prière",
    message: "N'oubliez pas d'accomplir vos prières à l'heure. La prière est le pilier de l'Islam.",
    type: "warning",
    targetUsers: "all",
    isActive: true,
    createdAt: new Date()
  },
  {
    title: "Maintenance prévue",
    message: "Une maintenance est prévue ce soir à 23h00. L'application sera temporairement indisponible.",
    type: "info",
    targetUsers: "all",
    isActive: false,
    createdAt: new Date()
  }
];

async function addTestData() {
  try {
    console.log('🚀 Début de l\'ajout des données de test...');

    // Ajouter les hadiths
    console.log('📖 Ajout des hadiths...');
    for (const hadith of testHadiths) {
      await db.collection('hadiths').add(hadith);
    }
    console.log(`✅ ${testHadiths.length} hadiths ajoutés`);

    // Ajouter les zikrs
    console.log('🙏 Ajout des zikrs...');
    for (const zikr of testZikrs) {
      await db.collection('zikrs').add(zikr);
    }
    console.log(`✅ ${testZikrs.length} zikrs ajoutés`);

    // Ajouter les notifications
    console.log('🔔 Ajout des notifications...');
    for (const notification of testNotifications) {
      await db.collection('notifications').add(notification);
    }
    console.log(`✅ ${testNotifications.length} notifications ajoutées`);

    console.log('🎉 Toutes les données de test ont été ajoutées avec succès !');
    
    // Afficher un résumé
    const hadithsSnapshot = await db.collection('hadiths').get();
    const zikrsSnapshot = await db.collection('zikrs').get();
    const notificationsSnapshot = await db.collection('notifications').get();
    
    console.log('\n📊 Résumé des données :');
    console.log(`- Hadiths : ${hadithsSnapshot.size}`);
    console.log(`- Zikrs : ${zikrsSnapshot.size}`);
    console.log(`- Notifications : ${notificationsSnapshot.size}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données :', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le script
addTestData(); 