// src/screens/QuizScreen.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Animated, BackHandler, Dimensions, Image, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
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
import {
    getResponsiveBorderRadius,
    getResponsiveFontSize,
    getResponsivePadding,
    getResponsiveSpacing,
    hp,
    screenDimensions,
    wp
} from '../utils/responsive';
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

// 📌 On force le quiz sur le chapitre 1
const chapterId = '01';
const rawQuizData = chapterMap[chapterId] || [];

// Génère des fausses réponses pertinentes pour chaque question
function generateOptionsForQuiz(questions: {question: string, reponse?: string, contenu?: string}[]) {
  return questions.map((item, idx, arr) => {
    const correct = item.reponse || item.contenu || 'Réponse';
    // Récupère toutes les autres réponses du chapitre
    const otherAnswers = arr
      .filter((q, i) => i !== idx && (q.reponse || q.contenu))
      .map(q => q.reponse || q.contenu)
      .filter((r): r is string => !!r && r !== correct);
    // Filtrage contextuel : on évite les réponses trop similaires ou vides
    const filteredFakes = otherAnswers.filter(r => r.length > 2 && r !== correct && !correct.includes(r) && !r.includes(correct));
    // Mélange et prend jusqu'à 3 fausses réponses différentes
    const shuffledFakes = shuffleOptions(filteredFakes).slice(0, 3);
    // Si pas assez de fausses réponses, on complète avec des réponses génériques
    const genericFakes = ["Aucune des réponses", "Je ne sais pas", "Voir le livre", "Non précisé"];
    const allFakes = [...shuffledFakes, ...shuffleOptions(genericFakes)].slice(0, 3);
    // Mélange la bonne réponse avec les fausses
    const allOptions = shuffleOptions([correct, ...allFakes]);
    // Trouve l'index de la bonne réponse dans le tableau mélangé
    const correctAnswerIndex = allOptions.findIndex(opt => opt === correct);
    return {
      question: item.question,
      options: allOptions,
      correctAnswerIndex,
    };
  });
}

function shuffleOptions(options: string[]) {
  return options.slice().sort(() => Math.random() - 0.5);
}

const quizData = generateOptionsForQuiz(rawQuizData);



export default function OriginalQuizScreen() {
  const route = useRoute();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  // On récupère la clé du fichier d'exercices à charger
  const exercicesKey = (route.params && (route.params as any).exercicesKey) || '1';
  // Mapping centralisé des fichiers d'exercices
  const exercicesFiles: { [key: string]: any[] } = {
    '1': require('../../data/exercices_par_chapitre/chapitre_1_exercices.json'),
    '2': require('../../data/exercices_par_chapitre/chapitre_02_exercices.json'),
    '3': require('../../data/exercices_par_chapitre/chapitre_03_exercices.json'),
    '5': require('../../data/exercices_par_chapitre/chapitre_05_exercices.json'),
    '6': require('../../data/exercices_par_chapitre/chapitre_06_exercices.json'),
    '7': require('../../data/exercices_par_chapitre/chapitre_07_exercices.json'),
    '9': require('../../data/exercices_par_chapitre/chapitre_09_exercices.json'),
    '10': require('../../data/exercices_par_chapitre/chapitre_10_exercices.json'),
    '12': require('../../data/exercices_par_chapitre/chapitre_12_exercices.json'),
  };
  const rawQuizData = exercicesFiles[exercicesKey] || [];
  
  // Générer les questions une seule fois et les stocker dans un état
  const [quizData, setQuizData] = useState(() => generateOptionsForQuiz(rawQuizData));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showQuestionPage, setShowQuestionPage] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [starAnim] = useState(new Animated.Value(1));

  // Protection : si pas de questions, on affiche un message et on redirige
  useEffect(() => {
    if (!quizData.length) {
      navigation.navigate('QuizChapterSelect' as never);
    }
  }, [quizData.length, navigation]);

  // Recharger le quiz quand les paramètres changent
  useEffect(() => {
    const newExercicesKey = (route.params && (route.params as any).exercicesKey) || '1';
    if (newExercicesKey !== exercicesKey) {
      // Les paramètres ont changé, recharger le quiz
      const newRawQuizData = exercicesFiles[newExercicesKey] || [];
      setQuizData(generateOptionsForQuiz(newRawQuizData));
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswerIndex(null);
      setIsAnswerCorrect(null);
      setShowAnswer(false);
      setShowResults(false);
      setShowQuestionPage(true);
      fadeAnim.setValue(1);
    }
  }, [route.params, exercicesKey, exercicesFiles]);

  // Animation de l'étoile qui scintille
  useEffect(() => {
    const animateStar = () => {
      Animated.sequence([
        Animated.timing(starAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(starAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => animateStar());
    };
    
    animateStar();
  }, [starAnim]);

  // Gestionnaire de geste de swipe
  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      if ((translationX > 50 && velocityX > 500) || translationX > 150) {
        goToQuizSelection();
      }
    }
  };

  if (!quizData.length) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
        <PanGestureHandler onHandlerStateChange={onGestureEvent}>
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <Text style={{ color: '#174C3C', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              Aucune question disponible pour ce chapitre.
            </Text>
            <Text style={{ color: '#888', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
              Veuillez choisir un autre chapitre.
            </Text>
          </SafeAreaView>
        </PanGestureHandler>
      </GestureHandlerRootView>
    );
  }

  const goToQuizSelection = () => {
    console.log('Bouton retour cliqué');
    // Si on est sur la page des réponses, retourner à la page question
    if (!showQuestionPage) {
      console.log('Retour à la page question');
      setShowQuestionPage(true);
      return;
    }
    // Sinon, naviguer vers la page de sélection des chapitres
    console.log('Navigation vers la sélection des chapitres');
    navigation.navigate('QuizChapterSelect' as never);
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
      // Si c'est un swipe de gauche à droite suffisant, aller à la sélection des chapitres
      if (gestureState.dx > 100 && Math.abs(gestureState.dy) < 100) {
        console.log('Swipe détecté depuis Quiz - retour à la sélection des chapitres');
        goToQuizSelection();
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
        // Sinon, aller à la sélection des chapitres
        navigation.navigate('QuizChapterSelect' as never);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [showQuestionPage, navigation]) // Ajout de navigation dans les dépendances
  );

  const logQuizResult = async (finalScore: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'quizResults'), {
        userId: user.uid,
        userEmail: user.email,
        quizId: `chapitre_${exercicesKey}`,
        score: finalScore,
        totalQuestions: quizData.length,
        completedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging quiz result: ", error);
    }
  };

  const handleAnswerPress = (index: number) => {
    // Si on clique sur la même réponse déjà sélectionnée, on la décoche
    if (selectedAnswerIndex === index) {
      setSelectedAnswerIndex(null);
    } else {
      // Sinon on sélectionne la nouvelle réponse
      setSelectedAnswerIndex(index);
    }
  };

  const handleTextPress = (text: string) => {
    setSelectedText(text);
    setShowTextModal(true);
  };

  const handleLongPress = (text: string) => {
    setSelectedText(text);
    setShowTextModal(true);
  };

  const handleVerify = () => {
    if (selectedAnswerIndex === null || showAnswer) return; // Empêche la vérification multiple
    
    const correct = selectedAnswerIndex === quizData[currentQuestionIndex].correctAnswerIndex;
    setIsAnswerCorrect(correct);
    setShowAnswer(true);
    
    // Incrémenter le score seulement si c'est correct ET si on n'a pas déjà vérifié
    if (correct) {
      setScore(prev => prev + 1);
    }
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
        // Calculer le pourcentage de score
        const finalScorePercentage = Math.round((score / quizData.length) * 100);
        
        // Sauvegarder le score localement
        saveQuizScore(exercicesKey, finalScorePercentage);
        
        // Logger le résultat sur Firebase
        logQuizResult(score);
        setShowResults(true);
      }
    });
  };

  // Fonction pour sauvegarder le score localement
  const saveQuizScore = async (chapterKey: string, scorePercentage: number) => {
    try {
      // Récupérer les scores existants
      const existingScores = await AsyncStorage.getItem('quizScores');
      const scores = existingScores ? JSON.parse(existingScores) : {};
      
      // Mettre à jour le score seulement s'il est meilleur ou s'il n'existe pas
      if (!scores[chapterKey] || scorePercentage > scores[chapterKey]) {
        scores[chapterKey] = scorePercentage;
        await AsyncStorage.setItem('quizScores', JSON.stringify(scores));
        console.log(`Score sauvegardé pour le chapitre ${chapterKey}: ${scorePercentage}%`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du score:', error);
    }
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
    
    // Régénérer les questions pour un nouveau quiz
    setQuizData(generateOptionsForQuiz(rawQuizData));
  };

  // Fonction pour naviguer vers le quiz suivant
  const goToNextQuiz = () => {
    console.log('🔄 goToNextQuiz appelé avec exercicesKey:', exercicesKey);
    
    // Séquence correcte des chapitres disponibles
    const availableChapters = ['1', '2', '3', '5', '6', '7', '9', '10', '12'];
    const currentIndex = availableChapters.indexOf(exercicesKey);
    
    console.log('📍 Index actuel:', currentIndex, 'sur', availableChapters.length, 'chapitres');
    
    if (currentIndex !== -1 && currentIndex < availableChapters.length - 1) {
      // Il y a un quiz suivant
      const nextQuizKey = availableChapters[currentIndex + 1];
      console.log('➡️ Navigation vers le quiz suivant:', nextQuizKey);
      
      // Utiliser replace pour forcer le rechargement de l'écran
      (navigation as any).replace('OriginalQuiz', { exercicesKey: nextQuizKey });
    } else {
      // C'était le dernier quiz, retourner à la sélection des chapitres
      console.log('🏠 Retour à la sélection des chapitres (dernier quiz)');
      navigation.navigate('QuizChapterSelect' as never);
    }
  };



  if (showResults) {
    const scorePercentage = Math.round((score / quizData.length) * 100);
    const canProceedToNext = scorePercentage >= 80;
    
    return (
      <SafeAreaView key={`results-${exercicesKey}`} style={styles.container} {...panResponder.panHandlers}>
        {/* Bouton de retour */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            console.log('Bouton retour TOUCHÉ (résultats) !');
            goToQuizSelection();
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>

        {/* Section du personnage - identique aux autres pages */}
        <View style={styles.characterSection}>
          <Image 
            source={require('../../assets/16 (copie).png')} 
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
            
            {/* Message de félicitations pour 100% */}
            {scorePercentage === 100 && (
              <View style={styles.congratulationsContainer}>
                <Text style={styles.congratulationsText}>Bravo, vous avez réussi le quiz</Text>
                <Animated.View style={[styles.starContainer, { opacity: starAnim }]}>
                  <MaterialCommunityIcons name="star" size={30} color="#D4AF37" />
                </Animated.View>
              </View>
            )}
            
            {/* Espace pour pousser le bouton vers le bas */}
            <View style={styles.spacer} />
            
            {canProceedToNext ? (
              <TouchableOpacity style={styles.restartButton} onPress={goToNextQuiz}>
                <Text style={styles.restartButtonText}>Quiz suivant</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
                <Text style={styles.restartButtonText}>Recommencer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];

  return (
    <SafeAreaView key={`quiz-${exercicesKey}`} style={styles.container} {...panResponder.panHandlers}>
      {/* Bouton de retour */}
      <TouchableOpacity 
        style={styles.backButton} 
                  onPress={() => {
            console.log('Bouton retour TOUCHÉ !');
            goToQuizSelection();
          }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

      {/* Section du personnage - Plus compacte */}
      <View style={styles.characterSection}>
        <Image 
            source={require('../../assets/16 (copie).png')} 
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
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswerIndex === index;
              const isCorrect = index === currentQuestion.correctAnswerIndex;
              const isWrongSelected = showAnswer && isSelected && !isCorrect;
              const showCorrectAnswer = showAnswer && isCorrect;
              
              return (
                <View key={`${currentQuestionIndex}-${index}`} style={styles.optionRow}>
                  {/* Checkbox pour la sélection */}
                  <TouchableOpacity
                    style={[
                      styles.checkboxContainer,
                      isSelected && !showAnswer && styles.checkboxSelected,
                      showCorrectAnswer && styles.checkboxCorrect,
                      isWrongSelected && styles.checkboxIncorrect
                    ]}
                    onPress={() => handleAnswerPress(index)}
                    disabled={showAnswer}
                  >
                    {isSelected && !showAnswer && (
                      <MaterialCommunityIcons 
                        name="check" 
                        size={16} 
                        color="white" 
                      />
                    )}
                    {showCorrectAnswer && (
                      <MaterialCommunityIcons 
                        name="check" 
                        size={16} 
                        color="white" 
                      />
                    )}
                    {isWrongSelected && (
                      <MaterialCommunityIcons 
                        name="close" 
                        size={16} 
                        color="white" 
                      />
                    )}
                  </TouchableOpacity>

                  {/* Zone de texte cliquable */}
                  <TouchableOpacity
                    style={[
                      styles.textContainer,
                      isSelected && !showAnswer && styles.textContainerSelected,
                      showCorrectAnswer && styles.textContainerCorrect,
                      isWrongSelected && styles.textContainerIncorrect
                    ]}
                    onPress={() => handleTextPress(option)}
                    onLongPress={() => handleLongPress(option)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionText,
                        isSelected && !showAnswer && styles.optionTextSelected,
                        showCorrectAnswer && styles.optionTextCorrect,
                        isWrongSelected && styles.optionTextIncorrect
                      ]} numberOfLines={2} ellipsizeMode="tail">
                        {option}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
            <Text style={styles.hintText}>Clique sur le texte pour voir toute la réponse</Text>
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
                        Réponse correcte
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

    {/* Modal pour afficher le texte complet avec design empilé */}
    {showTextModal && (
      <View style={styles.modalOverlay}>
        <View style={styles.modalCardContainer}>
          {/* Carte arrière (la plus profonde) - Vert foncé */}
          <View style={styles.modalBackCard} />
          
          {/* Carte du milieu - Dorée */}
          <View style={styles.modalMiddleCard} />
          
          {/* Carte blanche principale */}
          <View style={styles.modalWhiteCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Réponse complète</Text>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setShowTextModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
              <Text style={styles.modalText}>{selectedText}</Text>
            </ScrollView>
          </View>
        </View>
      </View>
    )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#174C3C',
  },
  backButton: { 
    position: 'absolute',
    top: screenDimensions.isSmallDevice ? 40 : 50,
    left: getResponsivePadding(),
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: getResponsiveBorderRadius(20),
    padding: getResponsiveSpacing(8),
  },
  characterSection: {
    position: 'absolute',
    top: screenDimensions.isSmallDevice ? 15 : 25,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  characterImage: {
    width: wp(80),
    height: hp(25),
    maxWidth: screenDimensions.isSmallDevice ? 300 : 400,
    maxHeight: screenDimensions.isSmallDevice ? 250 : 350,
    resizeMode: 'contain',
    zIndex: 51,
  },
  quizCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', 
    paddingHorizontal: getResponsivePadding(),
    paddingBottom: getResponsiveSpacing(30),
    position: 'relative',
    paddingTop: 0,
  },
  questionText: { 
    fontSize: getResponsiveFontSize(17),
    color: '#333',
    fontWeight: '600', 
    textAlign: 'center', 
    marginBottom: getResponsiveSpacing(15),
    lineHeight: getResponsiveFontSize(17) * 1.4,
    marginTop: getResponsiveSpacing(20),
    paddingHorizontal: getResponsivePadding(),
  },
  optionsContainer: { 
    marginBottom: getResponsiveSpacing(8),
    marginTop: getResponsiveSpacing(15),
    width: '100%',
    maxHeight: screenDimensions.isSmallDevice ? '60%' : '70%',
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#BB9B4E',
    padding: getResponsiveSpacing(10),
    borderRadius: getResponsiveBorderRadius(10),
    alignItems: 'center',
    marginTop: getResponsiveSpacing(6),
    width: '100%',
    maxWidth: '95%',
  },
  disabledButton: { 
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    fontSize: getResponsiveFontSize(14),
    color: 'white',
    fontWeight: 'bold',
  },
  answerSection: {
    marginTop: getResponsiveSpacing(4),
  },
  correctAnswerBanner: {
    backgroundColor: '#174C3C',
    padding: getResponsiveSpacing(8),
    borderRadius: getResponsiveBorderRadius(10),
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(6),
    minHeight: screenDimensions.isSmallDevice ? 35 : 40,
  },
  correctAnswerText: {
    color: 'white',
    fontSize: getResponsiveFontSize(13),
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#BB9B4E',
    padding: getResponsiveSpacing(10),
    borderRadius: getResponsiveBorderRadius(10),
    alignItems: 'center', 
    minHeight: screenDimensions.isSmallDevice ? 40 : 44,
  },
  nextButtonText: {
    fontSize: getResponsiveFontSize(14),
    color: 'white',
    fontWeight: 'bold',
  },
  resultsTitle: { 
    fontSize: getResponsiveFontSize(26),
    fontWeight: 'bold', 
    color: '#174C3C',
    textAlign: 'center',
    marginTop: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(22),
  },
  scoreText: { 
    fontSize: getResponsiveFontSize(19),
    color: '#333',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(32),
  },
  restartButton: { 
    backgroundColor: '#BB9B4E',
    padding: getResponsiveSpacing(16),
    borderRadius: getResponsiveBorderRadius(12),
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
    fontSize: getResponsiveFontSize(16),
    color: 'white',
    fontWeight: 'bold',
  },
  backCard: {
    backgroundColor: '#0F3A2E',
    borderRadius: getResponsiveBorderRadius(30),
    height: screenDimensions.isSmallDevice ? hp(50) : hp(55),
    width: '98%',
    position: 'absolute',
    bottom: 3,
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
    backgroundColor: '#BB9B4E',
    borderRadius: getResponsiveBorderRadius(30),
    height: screenDimensions.isSmallDevice ? hp(48) : hp(53.5),
    width: '95%',
    position: 'absolute',
    bottom: 10,
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
    borderRadius: getResponsiveBorderRadius(30),
    paddingHorizontal: getResponsivePadding(),
    paddingTop: getResponsiveSpacing(25),
    paddingBottom: getResponsiveSpacing(20),
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
    width: '92%',
    height: screenDimensions.isSmallDevice ? hp(47) : hp(52.5),
    position: 'absolute',
    bottom: 15,
    zIndex: 15,
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
    minHeight: screenDimensions.isSmallDevice ? 80 : 100,
  },
  answerButton: {
    backgroundColor: '#BB9B4E',
    padding: getResponsiveSpacing(16),
    borderRadius: getResponsiveBorderRadius(12),
    alignItems: 'center',
    marginTop: getResponsiveSpacing(20),
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
    fontSize: getResponsiveFontSize(16),
    color: 'white',
    fontWeight: 'bold',
  },
  buttonSection: {
    marginTop: getResponsiveSpacing(8),
    minHeight: screenDimensions.isSmallDevice ? 40 : 45,
  },
  // Styles pour le modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalButton: {
    padding: 5,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  modalHint: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  hintText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Styles pour les cartes empilées du modal
  modalCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  modalBackCard: {
    backgroundColor: '#0F3A2E',
    borderRadius: 30,
    height: screenDimensions.isSmallDevice ? hp(50) : hp(55),
    width: '92%',
    position: 'absolute',
    bottom: 35,
    borderWidth: 2,
    borderColor: '#0A2D23',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1,
  },
  modalMiddleCard: {
    backgroundColor: '#BB9B4E',
    borderRadius: 30,
    height: screenDimensions.isSmallDevice ? hp(48) : hp(53.5),
    width: '89%',
    position: 'absolute',
    bottom: 42,
    borderWidth: 2,
    borderColor: '#A08642',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 7,
    zIndex: 2,
  },
  modalWhiteCard: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    width: '86%',
    height: screenDimensions.isSmallDevice ? hp(47) : hp(52.5),
    position: 'absolute',
    bottom: 47,
    zIndex: 15,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, // Réduit pour économiser l'espace
    paddingVertical: 10, // Réduit pour économiser l'espace
    paddingHorizontal: 12, // Ajouté pour plus d'espace horizontal
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    width: '100%', // Assure que la boîte prend toute la largeur disponible
    minHeight: 55, // Réduit pour économiser l'espace
    maxHeight: 55, // Hauteur maximale fixe pour éviter le débordement
  },
  checkboxContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#BB9B4E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#BB9B4E',
    borderColor: '#BB9B4E',
  },
  checkboxCorrect: {
    backgroundColor: '#174C3C',
    borderColor: '#174C3C',
  },
  checkboxIncorrect: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
  },
  textContainer: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textContainerSelected: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  textContainerCorrect: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  textContainerIncorrect: {
    backgroundColor: '#FDE6E6',
    borderRadius: 8,
  },

  optionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    lineHeight: 16,
    textAlignVertical: 'center',
  },
  optionTextSelected: {
    color: '#174C3C',
  },
  optionTextCorrect: {
    color: '#174C3C',
  },
  optionTextIncorrect: {
    color: '#DC3545',
  },
  congratulationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  congratulationsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#174C3C',
    marginRight: 8,
  },
  starContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },


});
