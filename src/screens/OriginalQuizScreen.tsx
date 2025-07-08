// src/screens/QuizScreen.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackActions, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Animated, BackHandler, Dimensions, Image, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const optionLabels = ['A', 'B', 'C', 'D'];

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
  const quizData = generateOptionsForQuiz(rawQuizData);
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

  const goToHome = () => {
    console.log('Bouton retour cliqué');
    // Si on est sur la page des réponses, retourner à la page question
    if (!showQuestionPage) {
      console.log('Retour à la page question');
      setShowQuestionPage(true);
      return;
    }
    // Sinon, naviguer directement vers l'accueil
    console.log('Navigation vers l\'accueil');
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
        navigation.dispatch(StackActions.popToTop());
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
    if (selectedAnswerIndex !== null) return;
    setSelectedAnswerIndex(index);
  };

  const handleLongPress = (text: string) => {
    setSelectedText(text);
    setShowTextModal(true);
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
          onPress={() => {
            console.log('Bouton retour TOUCHÉ (résultats) !');
            goToHome();
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
        onPress={() => {
          console.log('Bouton retour TOUCHÉ !');
          goToHome();
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
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(index)}
                onPress={() => handleAnswerPress(index)}
                onLongPress={() => handleLongPress(`${optionLabels[index]}: ${option}`)}
                disabled={showAnswer}
              >
                    <Text style={getOptionTextStyle(index)} numberOfLines={2} ellipsizeMode="tail">
                      {optionLabels[index]}: {option}
                    </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.hintText}>Appuie long pour voir toute la réponse</Text>
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
    paddingHorizontal: 16,
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
  },
  optionButton: { 
    borderRadius: 12, 
    marginBottom: 4, // Réduit de 6 à 4
    padding: 10, // Réduit de 12 à 10
    borderWidth: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 20, // Ajouté pour que les boutons soient au-dessus de l'image
    minHeight: 50, // Hauteur fixe pour toutes les options
    maxHeight: 50, // Hauteur maximale fixe
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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '90%',
    maxWidth: 400,
  },
  modalBackCard: {
    backgroundColor: '#0F3A2E',
    borderRadius: 30,
    height: screenHeight * 0.45, // Même hauteur que backCard
    width: '100%',
    position: 'absolute',
    bottom: -270, // Réduit de -250 à -270 pour descendre légèrement
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
    height: screenHeight * 0.46, // Même hauteur que middleCard
    width: '95%',
    position: 'absolute',
    bottom: -260, // Réduit de -240 à -260 pour descendre légèrement
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
    paddingTop: 40, // Même padding que whiteCard
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
    width: '90%',
    height: screenHeight * 0.47, // Même hauteur que whiteCard
    position: 'absolute',
    bottom: -250, // Réduit de -230 à -250 pour descendre légèrement
    zIndex: 15,
  },

});
