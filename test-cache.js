const AsyncStorage = require('@react-native-async-storage/async-storage');

const STORAGE_KEYS = {
  USER_ROLE: 'userRole',
  USER_EMAIL: 'userEmail',
  USER_DISPLAY_NAME: 'userDisplayName',
  LAST_LOGIN: 'lastLogin'
};

async function testCache() {
  console.log('🔍 Test du cache AsyncStorage...');
  
  try {
    // Vérifier si des données existent
    const savedData = await AsyncStorage.multiGet([
      STORAGE_KEYS.USER_ROLE,
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_DISPLAY_NAME,
      STORAGE_KEYS.LAST_LOGIN
    ]);

    console.log('📊 Données trouvées dans le cache:');
    savedData.forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Tester la sauvegarde
    console.log('\n💾 Test de sauvegarde...');
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.USER_ROLE, 'user'],
      [STORAGE_KEYS.USER_EMAIL, 'test@example.com'],
      [STORAGE_KEYS.USER_DISPLAY_NAME, 'Test User'],
      [STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()]
    ]);
    console.log('✅ Données sauvegardées avec succès');

    // Vérifier la sauvegarde
    const newData = await AsyncStorage.multiGet([
      STORAGE_KEYS.USER_ROLE,
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_DISPLAY_NAME,
      STORAGE_KEYS.LAST_LOGIN
    ]);

    console.log('\n📊 Nouvelles données:');
    newData.forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testCache(); 