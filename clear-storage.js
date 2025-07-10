// Script pour nettoyer le stockage local des quiz
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonction pour nettoyer tous les scores de quiz
export const clearQuizScores = async () => {
  try {
    await AsyncStorage.removeItem('quizScores');
    console.log('✅ Scores de quiz supprimés avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des scores:', error);
    return false;
  }
};

// Fonction pour afficher les scores actuels
export const showCurrentScores = async () => {
  try {
    const scores = await AsyncStorage.getItem('quizScores');
    if (scores) {
      console.log('📊 Scores actuels:', JSON.parse(scores));
    } else {
      console.log('📊 Aucun score trouvé');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la lecture des scores:', error);
  }
};

// Fonction pour supprimer un score spécifique
export const clearSpecificScore = async (chapterKey) => {
  try {
    const scores = await AsyncStorage.getItem('quizScores');
    if (scores) {
      const parsedScores = JSON.parse(scores);
      delete parsedScores[chapterKey];
      await AsyncStorage.setItem('quizScores', JSON.stringify(parsedScores));
      console.log(`✅ Score du chapitre ${chapterKey} supprimé`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  }
}; 