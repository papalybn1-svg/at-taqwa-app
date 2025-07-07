const AsyncStorage = require('@react-native-async-storage/async-storage');

// Test de la progression
async function testProgression() {
  console.log('=== Test de la progression ===');
  
  // Simuler une progression
  const testProgress = {
    'chapterpartie1_1': 25,
    'chapterpartie1_2': 50,
    'chapterpartie1_3': 100,
    'chapterpartie2_1': 75
  };
  
  // Sauvegarder la progression
  await AsyncStorage.setItem('chapterProgress', JSON.stringify(testProgress));
  console.log('Progression sauvegardée:', testProgress);
  
  // Charger la progression
  const loadedProgress = await AsyncStorage.getItem('chapterProgress');
  const parsedProgress = JSON.parse(loadedProgress);
  console.log('Progression chargée:', parsedProgress);
  
  // Vérifier que les chapitres à 100% n'ont pas de coche
  Object.entries(parsedProgress).forEach(([key, value]) => {
    const shouldShowCheck = value > 0 && value < 100;
    console.log(`${key}: ${value}% - Coche affiché: ${shouldShowCheck}`);
  });
}

testProgression().catch(console.error); 