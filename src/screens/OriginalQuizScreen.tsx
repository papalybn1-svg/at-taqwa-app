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
  const [fadeAnim] = useState(new Animated.Value(1));
  const navigation = useNavigation();

  const goToHome = () => {
    // Utilise popToTop pour revenir à la racine de la pile
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
        goToHome();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
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
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      } else {
        logQuizResult(score);
        setShowResults(true);
      }
    });
  };

  const restartQuiz = () => {
    setShowResults(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerCorrect(null);
    setShowAnswer(false);
    fadeAnim.setValue(1);
  };

  const getOptionStyle = (index: number) => {
    const isSelected = selectedAnswerIndex === index;
    const isCorrect = index === quizData[currentQuestionIndex].correctAnswerIndex;
    const isGreen = index % 2 === 0; // A et C en vert, B et D en doré
    
    // Style de base (plus petit quand la réponse est affichée)
    const baseStyle = showAnswer ? styles.optionButtonSmall : styles.optionButton;
    
    if (showAnswer) {
      if (isCorrect) {
        return [baseStyle, styles.correctOptionButton];
      } else if (isSelected && !isCorrect) {
        return [baseStyle, styles.incorrectOptionButton];
      }
    }
    
    if (isSelected) {
      return [baseStyle, isGreen ? styles.selectedGreenOption : styles.selectedGoldOption];
    }
    
    return [baseStyle, isGreen ? styles.greenOption : styles.goldOption];
  };

  const getOptionTextStyle = (index: number) => {
    const isSelected = selectedAnswerIndex === index;
    const isCorrect = index === quizData[currentQuestionIndex].correctAnswerIndex;
    const isGreen = index % 2 === 0;
    
    // Style de base (plus petit quand la réponse est affichée)
    const baseTextStyle = showAnswer ? styles.whiteOptionTextSmall : styles.whiteOptionText;
    const greenTextStyle = showAnswer ? styles.greenOptionTextSmall : styles.greenOptionText;
    const goldTextStyle = showAnswer ? styles.goldOptionTextSmall : styles.goldOptionText;
    
    if (showAnswer) {
      if (isCorrect || (isSelected && !isCorrect)) {
        return baseTextStyle;
      }
    }
    
    if (isSelected) {
      return baseTextStyle;
    }
    
    return isGreen ? greenTextStyle : goldTextStyle;
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

        <View style={styles.characterSection}>
          <Image 
            source={require('../../assets/16.png')} 
            style={styles.characterImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.quizCard}>
          <Text style={styles.resultsTitle}>Quiz Terminé !</Text>
          <Text style={styles.scoreText}>
            Votre score : {score} / {quizData.length}
          </Text>
          <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
            <Text style={styles.restartButtonText}>Recommencer</Text>
          </TouchableOpacity>
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

      {/* Carte du quiz - Sans superposition */}
      <View style={styles.quizCardContainer}>
        {/* Carte empilée en arrière-plan */}
        <View style={styles.stackedCard} />
        
        <Animated.View style={[styles.quizCard, { opacity: fadeAnim }]}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(index)}
                onPress={() => handleAnswerPress(index)}
                disabled={showAnswer}
              >
                <View style={styles.optionContent}>
                  <View style={showAnswer ? styles.optionLabelSmall : styles.optionLabel}>
                    <Text style={showAnswer ? styles.optionLabelTextSmall : styles.optionLabelText}>{optionLabels[index]}</Text>
                  </View>
                  <Text style={getOptionTextStyle(index)}>{option}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

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
  characterSection: {
    flex: 0.4, // Augmenté de 0.3 à 0.4 pour plus d'espace pour l'image
    justifyContent: 'center', // Changé de 'flex-end' à 'center' pour mieux centrer
    alignItems: 'center',
    paddingTop: 40, // Augmenté pour pousser l'image vers le bas
    paddingBottom: 0, // Réduit pour laisser plus d'espace à la carte
  },
  characterImage: {
    width: screenWidth * 1.0, // Augmenté de 0.8 à 1.0 pour remplir la largeur
    height: screenHeight * 0.35, // Augmenté de 0.22 à 0.35 pour une image plus grande
    maxWidth: 500, // Augmenté de 350 à 500
    maxHeight: 400, // Augmenté de 220 à 400
    resizeMode: 'contain', // Ajouté pour maintenir les proportions
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
  quizCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 18, // Réduit de 20 à 18
    paddingTop: 22, // Réduit de 25 à 22
    width: '95%', // Augmenté de 90% à 95% pour une carte plus large
    maxWidth: 450, // Augmenté de 400 à 450
    minHeight: screenHeight * 0.45, // Ajusté dynamiquement selon la hauteur d'écran
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4, // Augmenté de -2 à -4 pour plus d'ombre
    },
    shadowOpacity: 0.15, // Augmenté de 0.1 à 0.15
    shadowRadius: 12, // Augmenté de 10 à 12
    elevation: 15, // Augmenté de 10 à 15
    zIndex: 3,
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
    marginBottom: 18,
  },
  optionButton: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    borderWidth: 2,
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
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  goldOptionText: {
    color: '#BB9B4E',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  whiteOptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  verifyButton: {
    backgroundColor: '#BB9B4E',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  answerSection: {
    marginTop: 8,
  },
  correctAnswerBanner: {
    backgroundColor: '#174C3C',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  correctAnswerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#BB9B4E',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
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
    backgroundColor: '#174C3C',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  restartButtonText: {
    fontSize: 19,
    color: 'white',
    fontWeight: 'bold',
  },
  stackedCard: {
    position: 'absolute',
    bottom: 25,
    left: 60,
    right: 60,
    height: 320,
    borderRadius: 30,
    backgroundColor: '#BB9B4E',
    opacity: 0.8,
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  optionButtonSmall: {
    borderRadius: 10,
    marginBottom: 6,
    padding: 8,
    borderWidth: 2,
  },
  greenOptionTextSmall: {
    color: '#174C3C',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  goldOptionTextSmall: {
    color: '#BB9B4E',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  whiteOptionTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  optionLabelSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabelTextSmall: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
