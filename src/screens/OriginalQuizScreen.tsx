// src/screens/QuizScreen.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, CommonActions, StackActions } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState, useCallback, useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, BackHandler, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import chapitre02 from '../../data/exercices_par_chapitre/chapitre_02_exercices.json';
import chapitre03 from '../../data/exercices_par_chapitre/chapitre_03_exercices.json';
import chapitre05 from '../../data/exercices_par_chapitre/chapitre_05_exercices.json';
import chapitre06 from '../../data/exercices_par_chapitre/chapitre_06_exercices.json';
import chapitre07 from '../../data/exercices_par_chapitre/chapitre_07_exercices.json';
import chapitre09 from '../../data/exercices_par_chapitre/chapitre_09_exercices.json';
import chapitre10 from '../../data/exercices_par_chapitre/chapitre_10_exercices.json';
import chapitre12 from '../../data/exercices_par_chapitre/chapitre_12_exercices.json';
import chapitre01 from '../../data/exercices_par_chapitre/chapitre_1_exercices.json';
import colors from '../theme/colors';
import { db } from './firebaseConfig';
import { AuthContext } from './LoginScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 🗺️ Mapping des chapitres
const chapterMap: Record<string, { question: string, reponse?: string, contenu?: string }[]> = {
  '01': chapitre01,
  '02': chapitre02,
  '03': chapitre03,
  '05': chapitre05,
  '06': chapitre06,
  '07': chapitre07,
  '09': chapitre09,
  '10': chapitre10,
  '12': chapitre12,
};

// 📌 À rendre dynamique via navigation
const chapterId = '01';
const rawQuizData = chapterMap[chapterId] || [];

const quizData = rawQuizData.map((item) => ({
  question: item.question,
  options: shuffleOptions([item.reponse || item.contenu || "Réponse", "Réponse A", "Réponse B", "Réponse C"]),
  correctAnswerIndex: 0,
}));

function shuffleOptions(options: string[]) {
  return options.sort(() => Math.random() - 0.5);
}

const optionLabels = ['A', 'B', 'C', 'D'];

export default function OriginalQuizScreen() {
  const { user } = useContext(AuthContext);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showQuestionPage, setShowQuestionPage] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));
  const navigation = useNavigation();

  const goToHome = () => {
    // Si on est sur la page des réponses, retourner à la page question
    if (!showQuestionPage) {
      setShowQuestionPage(true);
      return;
    }
    // Sinon, utilise popToTop pour revenir à la racine de la pile
    navigation.dispatch(StackActions.popToTop());
  };

  // Gestionnaire de swipe personnalisé pour iOS
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Détecter un swipe horizontal de gauche à droite
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 50;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Optionnel: ajouter un feedback visuel pendant le swipe
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Si c'est un swipe de gauche à droite suffisant, aller à l'accueil
      if (gestureState.dx > 100 && Math.abs(gestureState.dy) < 100) {
        console.log('Swipe détecté depuis Quiz - retour à l\'accueil');
        goToHome();
      }
    },
  });

  // Gestionnaire pour le bouton retour Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Si on est sur la page des réponses, retourner à la page question
        if (!showQuestionPage) {
          setShowQuestionPage(true);
          return true;
        }
        // Sinon, aller à l'accueil
        goToHome();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [showQuestionPage]) // Ajout de showQuestionPage dans les dépendances
  );

  const logQuizResult = async (finalScore: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'quizResults'), {
        userId: user.uid,
        userEmail: user.email,
        quizId: `chapitre_${chapterId}`,
        score: finalScore,
        totalQuestions: quizData.length,
        completedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging quiz result: ", error);
    }
  };

  const handleAnswerPress = (index: number) => {
    if (selectedAnswerIndex !== null) return;
    setSelectedAnswerIndex(index);
  };

  const handleVerify = () => {
    if (selectedAnswerIndex === null) return;
    
    const correct = selectedAnswerIndex === quizData[currentQuestionIndex].correctAnswerIndex;
    setIsAnswerCorrect(correct);
    setShowAnswer(true);
    if (correct) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswerIndex(null);
        setIsAnswerCorrect(null);
        setShowAnswer(false);
        setShowQuestionPage(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      } else {
        logQuizResult(score);
        setShowResults(true);
      }
    });
  };

  const goToAnswersPage = () => {
    setShowQuestionPage(false);
  };

  const restartQuiz = () => {
    setShowResults(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerCorrect(null);
    setShowAnswer(false);
    setShowQuestionPage(true);
    fadeAnim.setValue(1);
  };

  const getOptionStyle = (index: number) => {
    const isSelected = selectedAnswerIndex === index;
    const isCorrect = index === quizData[currentQuestionIndex].correctAnswerIndex;
    const isGreen = index % 2 === 0; // A et C en vert, B et D en doré
    
    if (showAnswer) {
      if (isCorrect) {
        return [styles.optionButton, styles.correctOptionButton];
      } else if (isSelected && !isCorrect) {
        return [styles.optionButton, styles.incorrectOptionButton];
      }
      // Options non sélectionnées et incorrectes gardent leur couleur de base
      return [styles.optionButton, isGreen ? styles.greenOption : styles.goldOption];
    }
    
    if (isSelected) {
      return [styles.optionButton, isGreen ? styles.selectedGreenOption : styles.selectedGoldOption];
    }
    
    return [styles.optionButton, isGreen ? styles.greenOption : styles.goldOption];
  };

  const getOptionTextStyle = (index: number) => {
    const isSelected = selectedAnswerIndex === index;
    const isCorrect = index === quizData[currentQuestionIndex].correctAnswerIndex;
    const isGreen = index % 2 === 0;
    
    if (showAnswer) {
      if (isCorrect || (isSelected && !isCorrect)) {
        return styles.whiteOptionText; // Texte blanc pour les réponses correctes/incorrectes
      }
      // Options non sélectionnées gardent leur couleur de base
      return isGreen ? styles.greenOptionText : styles.goldOptionText;
    }
    
    if (isSelected) {
      return styles.whiteOptionText; // Texte blanc pour les options sélectionnées
    }
    
    return isGreen ? styles.greenOptionText : styles.goldOptionText;
  };

  if (showResults) {
    return (
      <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
        {/* Bouton de retour */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={goToHome}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        {/* Section du personnage - identique aux autres pages */}
        <View style={styles.characterSection}>
          <Image 
            source={require('../../assets/16.png')} 
            style={styles.characterImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Cartes empilées - identiques aux autres pages */}
        <View style={styles.quizCardContainer}>
          {/* Carte arrière (la plus profonde) - Vert foncé */}
          <View style={styles.backCard} />
          
          {/* Carte du milieu - Dorée */}
          <View style={styles.middleCard} />
          
          {/* Carte blanche principale avec résultats */}
          <View style={styles.whiteCard}>
            <Text style={styles.resultsTitle}>Quiz Terminé !</Text>
            <Text style={styles.scoreText}>
              Votre score : {score} / {quizData.length}
            </Text>
            
            {/* Espace pour pousser le bouton vers le bas */}
            <View style={styles.spacer} />
            
            <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
              <Text style={styles.restartButtonText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      {/* Bouton de retour */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={goToHome}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
      </TouchableOpacity>

      {/* Section du personnage - Plus compacte */}
      <View style={styles.characterSection}>
        <Image 
          source={require('../../assets/16.png')} 
          style={styles.characterImage}
          resizeMode="contain"
        />
      </View>

      {/* Carte du quiz - Système à 2 pages */}
      <View style={styles.quizCardContainer}>
        {/* Cartes empilées exactement comme dans QuizStartScreen */}
        {/* Carte arrière (la plus profonde) - Vert foncé */}
        <View style={styles.backCard} />
        
        {/* Carte du milieu - Dorée */}
        <View style={styles.middleCard} />
        
        {/* Carte blanche principale */}
        <Animated.View style={[styles.whiteCard, { opacity: fadeAnim }]}>
          {showQuestionPage ? (
            // PAGE 1: QUESTION SEULEMENT
            <>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
              
              {/* Espace réservé pour maintenir la hauteur */}
              <View style={styles.spacer} />
              
              <TouchableOpacity
                style={styles.answerButton}
                onPress={goToAnswersPage}
                activeOpacity={0.7}
              >
                <Text style={styles.answerButtonText}>Répondre</Text>
              </TouchableOpacity>
            </>
          ) : (
            // PAGE 2: RÉPONSES MULTIPLES
            <>
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={getOptionStyle(index)}
                    onPress={() => handleAnswerPress(index)}
                    disabled={showAnswer}
                  >
                    <Text style={getOptionTextStyle(index)}>
                      {optionLabels[index]}: {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Section des boutons avec espace réservé */}
              <View style={styles.buttonSection}>
                {!showAnswer ? (
                  <TouchableOpacity
                    style={[styles.verifyButton, selectedAnswerIndex === null && styles.disabledButton]}
                    onPress={handleVerify}
                    disabled={selectedAnswerIndex === null}
                  >
                    <Text style={styles.verifyButtonText}>Vérifier</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.answerSection}>
                    <View style={styles.correctAnswerBanner}>
                      <Text style={styles.correctAnswerText}>
                        Réponse correcte : {optionLabels[quizData[currentQuestionIndex].correctAnswerIndex]}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                      <Text style={styles.nextButtonText}>
                        {currentQuestionIndex < quizData.length - 1 ? 'Suivant' : 'Terminer'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#174C3C', // Vert principal de l'application
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  characterSection: {
    flex: 0.4, // Augmenté de 0.3 à 0.4 pour plus d'espace pour l'image
    justifyContent: 'center', // Changé de 'flex-end' à 'center' pour mieux centrer
    alignItems: 'center',
    paddingTop: 30, // Réduit de 50 à 30 pour faire remonter l'image
    paddingBottom: 0, // Réduit pour laisser plus d'espace à la carte
    zIndex: 25, // Augmenté de 5 à 25 pour passer au-dessus de tout
    position: 'relative', // Ajouté pour que z-index fonctionne
  },
  characterImage: {
    width: screenWidth * 1.3, // Augmenté de 1.1 à 1.3
    height: screenHeight * 0.4, // Augmenté de 0.35 à 0.4
    maxWidth: 600, // Augmenté de 500 à 600
    maxHeight: 550, // Augmenté de 450 à 550
    resizeMode: 'contain', // Ajouté pour maintenir les proportions
    zIndex: 30, // Augmenté de 6 à 30 pour être au-dessus de tout
  },
  quizCardContainer: {
    flex: 0.6, // Augmenté de 0.7 à 0.6 pour équilibrer avec characterSection
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16, // Réduit de 20 à 16 pour plus d'espace
    paddingBottom: 30, // Réduit de 40 à 30
    position: 'relative',
    paddingTop: 0, // Réduit de 5 à 0 pour coller à l'image
  },

  questionText: {
    fontSize: 17,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 24,
    marginTop: 0,
  },
  optionsContainer: {
    marginBottom: 12,
    marginTop: 15,
  },
  optionButton: {
    borderRadius: 12,
    marginBottom: 6,
    padding: 12,
    borderWidth: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  greenOption: {
    backgroundColor: '#E8F5E8',
    borderColor: '#174C3C',
  },
  goldOption: {
    backgroundColor: '#FFF8E1',
    borderColor: '#BB9B4E',
  },
  selectedGreenOption: {
    backgroundColor: '#174C3C',
    borderColor: '#174C3C',
  },
  selectedGoldOption: {
    backgroundColor: '#BB9B4E',
    borderColor: '#BB9B4E',
  },
  correctOptionButton: {
    backgroundColor: '#174C3C',
    borderColor: '#174C3C',
  },
  incorrectOptionButton: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabelText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  greenOptionText: {
    color: '#174C3C',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 18,
  },
  goldOptionText: {
    color: '#BB9B4E',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 18,
  },
  whiteOptionText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 18,
  },
  verifyButton: {
    backgroundColor: '#BB9B4E',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  answerSection: {
    marginTop: 6,
  },
  correctAnswerBanner: {
    backgroundColor: '#174C3C',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 44,
  },
  correctAnswerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#BB9B4E',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 44,
  },
  nextButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 22,
  },
  scoreText: {
    fontSize: 19,
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  restartButton: {
    backgroundColor: '#BB9B4E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  restartButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  backCard: {
    backgroundColor: '#0F3A2E', // Vert plus foncé que #174C3C (comme QuizStartScreen)
    borderRadius: 30,
    height: screenHeight * 0.45,
    width: '100%',
    position: 'absolute',
    bottom: 60, // Augmenté de 30 à 60 pour faire monter
    borderWidth: 2,
    borderColor: '#0A2D23',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1,
  },
  middleCard: {
    backgroundColor: '#BB9B4E', // Même couleur que le bouton (comme QuizStartScreen)
    borderRadius: 30,
    height: screenHeight * 0.46,
    width: '95%',
    position: 'absolute',
    bottom: 70, // Augmenté de 40 à 70 pour faire monter
    borderWidth: 2,
    borderColor: '#A08642',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 7,
    zIndex: 2,
  },
  whiteCard: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 40, // Augmenté de 25 à 40 pour faire descendre le contenu
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    width: '90%',
    height: screenHeight * 0.47,
    position: 'absolute',
    bottom: 80, // Augmenté de 50 à 80 pour faire monter
    zIndex: 15, // Augmenté de 3 à 15 pour être au-dessus de tout
  },

  spacer: {
    flex: 1,
    minHeight: 100,
  },
  answerButton: {
    backgroundColor: '#BB9B4E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    zIndex: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  answerButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },

  buttonSection: {
    marginTop: 8,
    minHeight: 45,
  },

});
