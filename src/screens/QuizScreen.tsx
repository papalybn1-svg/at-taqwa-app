// src/screens/QuizScreen.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function QuizScreen() {
  const { user } = useContext(AuthContext);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const navigation = useNavigation();

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
    const correct = index === quizData[currentQuestionIndex].correctAnswerIndex;
    setIsAnswerCorrect(correct);
    if (correct) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswerIndex(null);
        setIsAnswerCorrect(null);
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
    fadeAnim.setValue(1);
  };

  const getOptionStyle = (index: number) => {
    if (selectedAnswerIndex === null) return styles.optionButton;
    if (index === quizData[currentQuestionIndex].correctAnswerIndex) return styles.correctOption;
    if (index === selectedAnswerIndex) return styles.incorrectOption;
    return styles.optionButton;
  };

  if (showResults) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.container}>
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Quiz Terminé !</Text>
            <Text style={styles.scoreText}>
              Votre score : {score} / {quizData.length}
            </Text>
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
    <SafeAreaView style={styles.safeArea}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz</Text>
        <View style={styles.placeholder} />
      </View>

    <View style={styles.container}>
        <Animated.View style={[styles.quizCard, { opacity: fadeAnim }]}>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} / {quizData.length}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(index)}
                onPress={() => handleAnswerPress(index)}
                disabled={selectedAnswerIndex !== null}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.nextButton, selectedAnswerIndex === null && styles.disabledButton]}
            onPress={handleNext}
            disabled={selectedAnswerIndex === null}
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        </Animated.View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: { 
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text 
  },
  placeholder: { 
    flex: 1 
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.background, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  quizCard: { 
    backgroundColor: colors.white, 
    borderRadius: 20, 
    padding: 25, 
    width: '100%', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5 
  },
  questionCounter: { 
    fontSize: 16, 
    color: colors.gray, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 15 
  },
  questionText: { 
    fontSize: 20, 
    color: colors.text, 
    fontWeight: '600', 
    textAlign: 'center', 
    marginBottom: 30, 
    minHeight: 60 
  },
  optionsContainer: { 
    marginBottom: 20 
  },
  optionButton: { 
    backgroundColor: '#F7F7FA', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  correctOption: { 
    backgroundColor: '#E6F4EA', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#4CAF50' 
  },
  incorrectOption: { 
    backgroundColor: '#FDEDED', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#F44336' 
  },
  optionText: { 
    fontSize: 16, 
    color: colors.text, 
    fontWeight: '500' 
  },
  nextButton: { 
    backgroundColor: colors.primary, 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  disabledButton: { 
    backgroundColor: colors.gray 
  },
  nextButtonText: { 
    fontSize: 18, 
    color: colors.white, 
    fontWeight: 'bold' 
  },
  resultsCard: { 
    backgroundColor: colors.white, 
    borderRadius: 20, 
    padding: 30, 
    width: '100%', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5 
  },
  resultsTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: colors.primary, 
    marginBottom: 20 
  },
  scoreText: { 
    fontSize: 18, 
    color: colors.text, 
    marginBottom: 30 
  },
  restartButton: { 
    backgroundColor: colors.primary, 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 12 
  },
  restartButtonText: { 
    fontSize: 18, 
    color: colors.white, 
    fontWeight: 'bold' 
  },
});
