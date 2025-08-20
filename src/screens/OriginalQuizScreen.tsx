// src/screens/QuizScreen.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Animated, BackHandler, Dimensions, Image, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import chapitre02 from '../../data/exercices_par_chapitre/chapitre_2_exercices.json';
import chapitre03 from '../../data/exercices_par_chapitre/chapitre_3_exercices.json';
import chapitre05 from '../../data/exercices_par_chapitre/chapitre_5_exercices.json';
import chapitre06 from '../../data/exercices_par_chapitre/chapitre_6_exercices.json';
import chapitre07 from '../../data/exercices_par_chapitre/chapitre_7_exercices.json';
import chapitre09 from '../../data/exercices_par_chapitre/chapitre_9_execrcices.json';
import chapitre10 from '../../data/exercices_par_chapitre/chapitre_10_exercices.json';
import chapitre12 from '../../data/exercices_par_chapitre/chapitre_12_exercices.json';
import chapitre01 from '../../data/exercices_par_chapitre/chapitre_1_exercices.json';
import { read as readUserStorage, remove as removeUserStorage, write as writeUserStorage } from '../utils/userStorage';
import { db } from './firebaseConfig';
import { AuthContext } from './LoginScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 🗺️ Mapping des chapitres
const chapterMap: Record<string, { question: string, reponse?: string, contenu?: string, fausses_reponses?: string[] }[]> = {
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

// Fonction pour mélanger un tableau
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Génère les options de quiz avec les vraies fausses réponses
function generateOptionsForQuiz(questions: {question: string, reponse?: string, contenu?: string, fausses_reponses?: string[]}[]) {
  return questions.map((item) => {
    const correctAnswer = item.reponse || item.contenu || 'Réponse';
    const falseAnswers = item.fausses_reponses || [];
    
    // S'assurer qu'on a exactement 3 fausses réponses
    let finalFalseAnswers = [...falseAnswers];
    
    // Si on n'a pas assez de fausses réponses, ajouter des réponses génériques
    while (finalFalseAnswers.length < 3) {
      finalFalseAnswers.push(`Option ${finalFalseAnswers.length + 1}`);
    }
    
    // Prendre seulement les 3 premières fausses réponses
    finalFalseAnswers = finalFalseAnswers.slice(0, 3);
    
    // Créer toutes les options (1 bonne + 3 mauvaises)
    const allOptions = [correctAnswer, ...finalFalseAnswers];
    
    // Mélanger aléatoirement les positions
    const shuffledOptions = shuffleArray(allOptions);
    
    // Trouver l'index de la bonne réponse après mélange
    const correctAnswerIndex = shuffledOptions.findIndex(option => option === correctAnswer);
    
    return {
      question: item.question,
      options: shuffledOptions,
      correctAnswerIndex,
      correctAnswer: correctAnswer
    };
  });
}

// Les données seront générées dans le composant



export default function OriginalQuizScreen() {
  const route = useRoute();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  // On récupère la clé du fichier d'exercices à charger
  const exercicesKey = (route.params && (route.params as any).exercicesKey) || '1';
  // Mapping centralisé des fichiers d'exercices
  const exercicesFiles: { [key: string]: any[] } = {
    '1': require('../../data/exercices_par_chapitre/chapitre_1_exercices.json'),
    '2': require('../../data/exercices_par_chapitre/chapitre_2_exercices.json'),
    '3': require('../../data/exercices_par_chapitre/chapitre_3_exercices.json'),
    '5': require('../../data/exercices_par_chapitre/chapitre_5_exercices.json'),
    '6': require('../../data/exercices_par_chapitre/chapitre_6_exercices.json'),
    '7': require('../../data/exercices_par_chapitre/chapitre_7_exercices.json'),
    '9': require('../../data/exercices_par_chapitre/chapitre_9_execrcices.json'),
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
  // Reprise automatique d'une session de quiz en cours
  useEffect(() => {
    const resumeSession = async () => {
      // Attendre que les données du quiz soient chargées
      if (!quizData.length) {
        console.log('⏳ Données du quiz pas encore chargées, attente...');
        return;
      }

      const chapterKey = exercicesKey;
      const sessionKey = `quizSession:${chapterKey}`;
      const saved = await readUserStorage<{ index: number; score: number; answers: Array<number|null> }>(user?.uid, sessionKey);
      
      console.log(`🔍 Vérification session pour chapitre ${chapterKey}:`, {
        saved: saved ? `index ${saved.index}` : 'aucune',
        quizLength: quizData.length,
        currentIndex: currentQuestionIndex
      });

      // Vérifier si la session est valide
      if (saved && typeof saved.index === 'number') {
        if (saved.index < quizData.length) {
          // Limiter le score à ne pas dépasser le nombre de questions
          const limitedScore = Math.min(saved.score || 0, quizData.length);
          console.log(`🔄 Reprise de session pour chapitre ${chapterKey} à la question ${saved.index} avec score ${limitedScore}`);
          setCurrentQuestionIndex(saved.index);
          setScore(limitedScore);
          setShowQuestionPage(true);
        } else {
          console.log(`⚠️ Session invalide pour chapitre ${chapterKey}: index ${saved.index} >= ${quizData.length}`);
          // Nettoyer la session invalide
          await removeUserStorage(user?.uid, sessionKey);
          console.log(`🗑️ Session invalide supprimée pour chapitre ${chapterKey}`);
          setCurrentQuestionIndex(0);
          setShowQuestionPage(true);
        }
      } else {
        console.log(`🆕 Nouvelle session pour chapitre ${chapterKey} (question 0)`);
        setCurrentQuestionIndex(0);
        setShowQuestionPage(true);
      }
    };
    resumeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercicesKey, quizData.length, user?.uid]);

  // Sauvegarder la session au fil de l'eau
  useEffect(() => {
    const persist = async () => {
      const chapterKey = exercicesKey;
      const sessionKey = `quizSession:${chapterKey}`;
      await writeUserStorage(user?.uid, sessionKey, { index: currentQuestionIndex, score: score, answers: [] });
      // Maintenir un index des sessions pour l'écran Quiz initial
      const indexKey = 'quizSessionsIndex';
      const index = (await readUserStorage<Record<string, boolean>>(user?.uid, indexKey)) || {};
      index[chapterKey] = true;
      await writeUserStorage(user?.uid, indexKey, index);
    };
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, score, exercicesKey]);
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

  // Nettoyer les sessions corrompues et les scores > 100% au démarrage
  useEffect(() => {
    const cleanupSessions = async () => {
      try {
        const indexKey = 'quizSessionsIndex';
        const index = (await readUserStorage<Record<string, boolean>>(user?.uid, indexKey)) || {};
        
        console.log('🧹 Nettoyage des sessions au démarrage...');
        
        // Vérifier chaque session enregistrée
        for (const [chapterKey, hasSession] of Object.entries(index)) {
          if (hasSession) {
            const sessionKey = `quizSession:${chapterKey}`;
            const session = await readUserStorage<{ index: number; score: number }>(user?.uid, sessionKey);
            
            if (!session) {
              console.log(`🗑️ Session manquante supprimée de l'index: ${chapterKey}`);
              delete index[chapterKey];
            }
          }
        }
        
        await writeUserStorage(user?.uid, indexKey, index);
        
        // Nettoyer les scores qui dépassent 100%
        const scores = (await readUserStorage<Record<string, number>>(user?.uid, 'quizScores')) || {};
        let scoresUpdated = false;
        
        for (const [chapterKey, score] of Object.entries(scores)) {
          if (score > 100) {
            console.log(`🔧 Correction du score pour chapitre ${chapterKey}: ${score}% -> 100%`);
            scores[chapterKey] = 100;
            scoresUpdated = true;
          }
        }
        
        if (scoresUpdated) {
          await writeUserStorage(user?.uid, 'quizScores', scores);
          console.log('✅ Scores corrigés et sauvegardés');
        }
        
        console.log('✅ Nettoyage des sessions terminé');
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage des sessions:', error);
      }
    };
    
    if (user?.uid) {
      cleanupSessions();
    }
  }, [user?.uid]);

  // Recharger le quiz quand les paramètres changent
  useEffect(() => {
    const newExercicesKey = (route.params && (route.params as any).exercicesKey) || '1';
    if (newExercicesKey !== exercicesKey) {
      console.log(`🔄 Changement de chapitre: ${exercicesKey} -> ${newExercicesKey}`);
      
      // Réinitialiser complètement l'état pour le nouveau chapitre
      setScore(0);
      setSelectedAnswerIndex(null);
      setIsAnswerCorrect(null);
      setShowAnswer(false);
      setShowResults(false);
      setShowQuestionPage(true);
      fadeAnim.setValue(1);
      
      // Charger les nouvelles données du quiz
      const newRawQuizData = exercicesFiles[newExercicesKey] || [];
      const newQuizData = generateOptionsForQuiz(newRawQuizData);
      setQuizData(newQuizData);
      
      console.log(`📊 Nouveau quiz chargé: ${newQuizData.length} questions pour chapitre ${newExercicesKey}`);
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
    
    // Vérifier si on doit retourner à un chapitre spécifique
    const returnToChapter = (route.params as any)?.returnToChapter;
    if (returnToChapter) {
      console.log('Retour vers le chapitre avec section spécifique:', returnToChapter);
      (navigation as any).navigate('Chapter', {
        chapter: {
          image: returnToChapter.image,
          title: returnToChapter.title,
          desc: returnToChapter.title
        },
        initialSection: returnToChapter.section
      });
    } else {
    // Sinon, naviguer vers la page de sélection des chapitres
    console.log('Navigation vers la sélection des chapitres');
    navigation.navigate('QuizChapterSelect' as never);
    }
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
              // Vérifier si on doit retourner à un chapitre spécifique
      const returnToChapter = (route.params as any)?.returnToChapter;
      if (returnToChapter) {
        (navigation as any).navigate('Chapter', {
          chapter: {
            image: returnToChapter.image,
            title: returnToChapter.title,
            desc: returnToChapter.title
          },
          initialSection: returnToChapter.section
        });
      } else {
        // Sinon, aller à la sélection des chapitres
        navigation.navigate('QuizChapterSelect' as never);
      }
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
        
        // Sauvegarder le score localement (meilleur score uniquement)
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
      console.log(`💾 Sauvegarde du score pour chapitre ${chapterKey}: ${scorePercentage}%`);
      
      // Limiter le score à 100% maximum
      const limitedScorePercentage = Math.min(scorePercentage, 100);
      
      // Sauvegarder le score
      const scores = (await readUserStorage<Record<string, number>>(user?.uid, 'quizScores')) || {};
      if (!scores[chapterKey] || limitedScorePercentage > scores[chapterKey]) {
        scores[chapterKey] = limitedScorePercentage;
        await writeUserStorage(user?.uid, 'quizScores', scores);
        console.log(`✅ Score sauvegardé pour le chapitre ${chapterKey}: ${limitedScorePercentage}%`);
      }
      
      // Nettoyer complètement la session terminée
      const sessionKey = `quizSession:${chapterKey}`;
      await removeUserStorage(user?.uid, sessionKey);
      console.log(`🗑️ Session supprimée: ${sessionKey}`);
      
      // Mettre à jour l'index des sessions
      const indexKey = 'quizSessionsIndex';
      const index = (await readUserStorage<Record<string, boolean>>(user?.uid, indexKey)) || {};
      if (index[chapterKey]) {
        delete index[chapterKey];
        await writeUserStorage(user?.uid, indexKey, index);
        console.log(`📝 Index mis à jour: session ${chapterKey} supprimée`);
      }
      
      console.log(`🎯 Quiz terminé pour chapitre ${chapterKey} - session nettoyée`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du score:', error);
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



  // Fonction pour déterminer si on vient d'un chapitre
  const isComingFromChapter = () => {
    return !!(route.params as any)?.returnToChapter;
  };

  // Fonction pour naviguer vers le quiz suivant ou le chapitre suivant
  const goToNextQuiz = () => {
    console.log('🔄 goToNextQuiz appelé avec exercicesKey:', exercicesKey);
    
    // Si on vient d'un chapitre, naviguer vers le chapitre suivant
    if (isComingFromChapter()) {
      console.log('📖 Navigation vers le chapitre suivant (venant d\'un chapitre)');
      
      // Récupérer les données des chapitres pour déterminer la partie actuelle
      const chaptersData = require('../../data/chapitres.json');
      
      // Trouver le chapitre actuel et sa partie
      let currentChapter = null;
      let currentPartieKey = null;
      
      Object.entries(chaptersData).forEach(([partieKey, partie]: any) => {
        partie.chapitres.forEach((ch: any) => {
          const num = (ch as any).numero || ch.image || '1';
          const numKey = String(parseInt(num, 10));
          if (numKey === exercicesKey) {
            currentChapter = ch;
            currentPartieKey = partieKey;
          }
        });
      });
      
      if (!currentPartieKey) {
        console.log('❌ Partie non trouvée pour le quiz:', exercicesKey);
        navigation.navigate('QuizChapterSelect' as never);
        return;
      }
      
      // Trouver le chapitre suivant dans la même partie
      const partieChapters = chaptersData[currentPartieKey].chapitres;
      const currentIndex = partieChapters.findIndex((ch: any) => {
        const num = (ch as any).numero || ch.image || '1';
        const numKey = String(parseInt(num, 10));
        return numKey === exercicesKey;
      });
      
      if (currentIndex !== -1 && currentIndex < partieChapters.length - 1) {
        // Il y a un chapitre suivant
        const nextChapter = partieChapters[currentIndex + 1];
        console.log('➡️ Navigation vers le chapitre suivant:', nextChapter.title);
        
        (navigation as any).navigate('Chapter', {
          chapter: {
            image: nextChapter.image,
            title: nextChapter.title,
            desc: nextChapter.desc || nextChapter.title
          }
        });
      } else {
        // C'était le dernier chapitre de la partie, retourner à la sélection des chapitres
        console.log('🏠 Retour à la sélection des chapitres (dernier chapitre de la partie)');
        (navigation as any).navigate('Books', { selectedPart: currentPartieKey });
      }
      return;
    }
    
    // Sinon, navigation normale vers le quiz suivant
    // Récupérer les données des chapitres pour déterminer la partie actuelle
    const chaptersData = require('../../data/chapitres.json');
    
    // Trouver le chapitre actuel et sa partie
    let currentChapter = null;
    let currentPartieKey = null;
    
    Object.entries(chaptersData).forEach(([partieKey, partie]: any) => {
      partie.chapitres.forEach((ch: any) => {
        const num = (ch as any).numero || ch.image || '1';
        const numKey = String(parseInt(num, 10));
        if (numKey === exercicesKey) {
          currentChapter = ch;
          currentPartieKey = partieKey;
        }
      });
    });
    
    if (!currentPartieKey) {
      console.log('❌ Partie non trouvée pour le quiz:', exercicesKey);
      navigation.navigate('QuizChapterSelect' as never);
      return;
    }
    
    console.log('📍 Quiz actuel:', exercicesKey, 'dans la partie:', currentPartieKey);
    
    // Obtenir tous les chapitres de la partie actuelle qui ont des quiz
    const availableChapters = ['1', '2', '3', '5', '6', '7', '9', '10', '12'];
    const partieChapters = chaptersData[currentPartieKey].chapitres
      .map((ch: any) => {
        const num = (ch as any).numero || ch.image || '1';
        const numKey = String(parseInt(num, 10));
        return numKey;
      })
      .filter((numKey: string) => availableChapters.includes(numKey));
    
    console.log('📚 Chapitres de la partie avec quiz:', partieChapters);
    
    // Trouver l'index du quiz actuel dans sa partie
    const currentIndexInPartie = partieChapters.indexOf(exercicesKey);
    
    if (currentIndexInPartie !== -1 && currentIndexInPartie < partieChapters.length - 1) {
      // Il y a un quiz suivant dans la même partie
      const nextQuizKey = partieChapters[currentIndexInPartie + 1];
      console.log('➡️ Navigation vers le quiz suivant dans la même partie:', nextQuizKey);
      
      // Utiliser replace pour forcer le rechargement de l'écran
      (navigation as any).replace('OriginalQuiz', { exercicesKey: nextQuizKey });
    } else {
      // C'était le dernier quiz de la partie, retourner à la sélection des chapitres
      console.log('🏠 Retour à la sélection des chapitres (dernier quiz de la partie)');
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
          style={styles.resultsBackButton} 
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
                <Text style={styles.restartButtonText}>
                  {isComingFromChapter() ? 'Chapitre suivant' : 'Quiz suivant'}
                </Text>
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
      {/* Boutons de navigation */}
      <View style={styles.headerButtons}>
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
      </View>

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
              {/* Conteneur scrollable pour la question */}
              <ScrollView 
                style={styles.questionScrollContainer}
                contentContainerStyle={styles.questionScrollContent}
                showsVerticalScrollIndicator={false}
              >
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
              </ScrollView>

              {/* Bouton toujours visible en bas */}
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
                    <View style={[
                      styles.correctAnswerBanner,
                      !isAnswerCorrect && styles.incorrectAnswerBanner
                    ]}>
                      <Text style={[
                        styles.correctAnswerText,
                        !isAnswerCorrect && styles.incorrectAnswerText
                      ]}>
                        {isAnswerCorrect ? 'Réponse correcte' : 'Réponse fausse'}
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
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backButton: { 
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsBackButton: { 
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  incorrectAnswerBanner: {
    backgroundColor: '#DC3545',
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 6,
    minHeight: 40,
  },
  incorrectAnswerText: {
    color: 'white',
    fontSize: 13,
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
    fontSize: 14,
    color: '#19514A',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
    fontWeight: '500',
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
  // Nouveaux styles pour le scroll de la question
  questionScrollContainer: {
    maxHeight: '70%',
    marginBottom: 20,
  },
  questionScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },


});
