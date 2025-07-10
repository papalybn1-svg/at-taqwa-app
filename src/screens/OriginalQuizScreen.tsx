// src/screens/QuizScreen.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackActions, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Animated, BackHandler, Dimensions, Image, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import chapitre02 from '../../data/exercices_par_chapitre/chapitre_02_exercices.json';
import chapitre03 from '../../data/exercices_par_chapitre/chapitre_03_exercices.json';
import chapitre05 from '../../data/exercices_par_chapitre/chapitre_05_exercices.json';
import chapitre06 from '../../data/exercices_par_chapitre/chapitre_06_exercices.json';
import chapitre07 from '../../data/exercices_par_chapitre/chapitre_07_exercices.json';
import chapitre09 from '../../data/exercices_par_chapitre/chapitre_09_exercices.json';
import chapitre10 from '../../data/exercices_par_chapitre/chapitre_10_exercices.json';
import chapitre12 from '../../data/exercices_par_chapitre/chapitre_12_exercices.json';
import chapitre01 from '../../data/exercices_par_chapitre/chapitre_1_exercices.json';
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

  // Protection : si pas de questions, on affiche un message et on redirige
  useEffect(() => {
    if (!quizData.length) {
      navigation.navigate('QuizChapterSelect' as never);
    }
  }, [quizData.length, navigation]);

  if (!quizData.length) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#174C3C', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          Aucune question disponible pour ce chapitre.
        </Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
          Veuillez choisir un autre chapitre.
        </Text>
      </SafeAreaView>
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
      
      // Utiliser reset pour forcer un rechargement complet
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'OriginalQuiz', params: { exercicesKey: nextQuizKey } }],
      });
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
      <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
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
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
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
    backgroundColor: '#174C3C', // Vert principal de l'application
  },
  backButton: { 
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  characterSection: {
    position: 'absolute',
    top: 25, // Réduit de 40 à 25 pour faire monter l'image un peu
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50, // Augmenté de 15 à 50 pour mettre l'image en premier plan
  },
  characterImage: {
    width: screenWidth * 0.8, // Réduit de 1.4 à 0.8
    height: screenHeight * 0.25, // Réduit de 0.45 à 0.25
    maxWidth: 400, // Réduit de 650 à 400
    maxHeight: 350, // Réduit de 600 à 350
    resizeMode: 'contain', // Ajouté pour maintenir les proportions
    zIndex: 51, // Augmenté de 16 à 51 pour mettre l'image en premier plan
  },
  quizCardContainer: {
    flex: 1, // Prend tout l'espace disponible
    justifyContent: 'center',
    alignItems: 'center', 
    paddingHorizontal: 8, // Réduit de 16 à 8 pour plus d'espace
    paddingBottom: 30,
    position: 'relative',
    paddingTop: 0,
  },

  questionText: { 
    fontSize: 17,
    color: '#333',
    fontWeight: '600', 
    textAlign: 'center', 
    marginBottom: 15, // Réduit de 22 à 15
    lineHeight: 24,
    marginTop: 20, // Réduit de 30 à 20
  },
  optionsContainer: { 
    marginBottom: 8, // Réduit de 12 à 8
    marginTop: 15, // Réduit de 30 à 15
    width: '100%', // Assure que le conteneur prend toute la largeur
    maxHeight: '70%', // Limite la hauteur pour éviter le débordement
    overflow: 'hidden', // Cache le contenu qui déborde
  },

  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  verifyButton: {
    backgroundColor: '#BB9B4E',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    width: '100%', // Assure que le bouton prend toute la largeur disponible
    maxWidth: '95%', // Limite la largeur pour rester dans le cadre
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
    marginTop: 4, // Réduit de 6 à 4
  },
  correctAnswerBanner: {
    backgroundColor: '#174C3C',
    padding: 8, // Réduit de 10 à 8
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 6, // Réduit de 8 à 6
    minHeight: 40, // Réduit de 44 à 40
  },
  correctAnswerText: {
    color: 'white',
    fontSize: 13, // Réduit de 14 à 13
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
    marginTop: 20, // Ajouté pour descendre le texte
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
    backgroundColor: '#0F3A2E',
    borderRadius: 30,
    height: screenHeight * 0.55,
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
    borderRadius: 30,
    height: screenHeight * 0.535,
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
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 25,
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
    width: '92%',
    height: screenHeight * 0.525,
    position: 'absolute',
    bottom: 15,
    zIndex: 15,
    overflow: 'hidden',
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
    height: screenHeight * 0.55,
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
    height: screenHeight * 0.535,
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
    height: screenHeight * 0.525,
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


});
