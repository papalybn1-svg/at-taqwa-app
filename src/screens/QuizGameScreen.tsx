import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getResponsiveStyle, useResponsive } from '../hooks/useResponsive';



const { width: screenWidth } = Dimensions.get('window');

// Import des exercices
import exercicesChap2 from '../../data/exercices_par_chapitre/chapitre_2_exercices.json';
import exercicesChap3 from '../../data/exercices_par_chapitre/chapitre_3_exercices.json';
import exercicesChap4 from '../../data/exercices_par_chapitre/chapitre_4_exercices.json';
import exercicesChap5 from '../../data/exercices_par_chapitre/chapitre_5_exercices.json';
import exercicesChap6 from '../../data/exercices_par_chapitre/chapitre_6_exercices.json';
import exercicesChap7 from '../../data/exercices_par_chapitre/chapitre_7_exercices.json';
import exercicesChap8 from '../../data/exercices_par_chapitre/chapitre_8_exercices.json';
import exercicesChap9 from '../../data/exercices_par_chapitre/chapitre_9_execrcices.json';
import exercicesChap10 from '../../data/exercices_par_chapitre/chapitre_10_exercices.json';
import exercicesChap11 from '../../data/exercices_par_chapitre/chapitre_11_exercices.json';
import exercicesChap12 from '../../data/exercices_par_chapitre/chapitre_12_exercices.json';
import exercicesChap1 from '../../data/exercices_par_chapitre/chapitre_1_exercices.json';



interface Question {
  numero?: number;
  question: string;
  reponse?: string;
  contenu?: string;
}

export default function QuizGameScreen() {
  const navigation = useNavigation();
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const styles = createStyles(responsive, responsiveStyle);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  const toArray = (mod: any): any[] =>
    Array.isArray(mod) ? mod : (mod && Array.isArray((mod as any).quiz) ? (mod as any).quiz : []);

  // Combiner toutes les questions des différents chapitres
  useEffect(() => {
    const allQuestions: Question[] = [
      ...toArray(exercicesChap1),
      ...toArray(exercicesChap2).slice(0, 5), // Limiter le nombre de questions
      ...toArray(exercicesChap3).slice(0, 3),
      ...toArray(exercicesChap4).slice(0, 3),
      ...toArray(exercicesChap5).slice(0, 5),
      ...toArray(exercicesChap6).slice(0, 5),
      ...toArray(exercicesChap7).slice(0, 3),
      ...toArray(exercicesChap8).slice(0, 3),
      ...toArray(exercicesChap9).slice(0, 3),
      ...toArray(exercicesChap10).slice(0, 3),
      ...toArray(exercicesChap11).slice(0, 3),
      ...toArray(exercicesChap12).slice(0, 3)
    ].filter(q => q.question && q.question.trim() !== '' && ((q as any).reponse && (q as any).reponse.trim() !== '' || (q as any).contenu && (q as any).contenu.trim() !== ''));

    // Mélanger les questions et prendre les 10 premières
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffledQuestions);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleCorrectAnswer = () => {
    setScore(score + 1);
    nextQuestion();
  };

  const handleIncorrectAnswer = () => {
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowAnswer(false);
    setQuizFinished(false);
    // Remélanger les questions
    const allQuestions: Question[] = [
      ...toArray(exercicesChap1),
      ...toArray(exercicesChap2).slice(0, 5),
      ...toArray(exercicesChap3).slice(0, 3),
      ...toArray(exercicesChap4).slice(0, 3),
      ...toArray(exercicesChap5).slice(0, 5),
      ...toArray(exercicesChap6).slice(0, 5),
      ...toArray(exercicesChap7).slice(0, 3),
      ...toArray(exercicesChap8).slice(0, 3),
      ...toArray(exercicesChap9).slice(0, 3),
      ...toArray(exercicesChap10).slice(0, 3),
      ...toArray(exercicesChap11).slice(0, 3),
      ...toArray(exercicesChap12).slice(0, 3)
         ].filter(q => q.question && q.question.trim() !== '' && ((q as any).reponse && (q as any).reponse.trim() !== '' || (q as any).contenu && (q as any).contenu.trim() !== ''));
     
     const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffledQuestions);
  };

  const goHome = () => {
    navigation.navigate('HomeMain' as never);
  };

  // Gestionnaire de geste de swipe
  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      if ((translationX > 50 && velocityX > 500) || translationX > 150) {
        goHome();
      }
    }
  };

  if (questions.length === 0) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <PanGestureHandler onHandlerStateChange={onGestureEvent}>
          <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement du quiz...</Text>
            </View>
          </SafeAreaView>
        </PanGestureHandler>
      </GestureHandlerRootView>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <GestureHandlerRootView style={styles.container}>
        <PanGestureHandler onHandlerStateChange={onGestureEvent}>
          <SafeAreaView style={styles.container}>
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Quiz terminé !</Text>
              <Text style={styles.scoreText}>
                Votre score : {score}/{questions.length}
              </Text>
              <Text style={styles.percentageText}>{percentage}%</Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
                  <MaterialCommunityIcons name="refresh" size={responsiveStyle.fontSize.lg} color="white" />
                  <Text style={styles.buttonText}>Recommencer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.homeButton} onPress={goHome}>
                  <MaterialCommunityIcons name="home" size={responsiveStyle.fontSize.lg} color="white" />
                  <Text style={styles.buttonText}>Accueil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </PanGestureHandler>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onHandlerStateChange={onGestureEvent}>
        <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goHome} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={responsiveStyle.fontSize.lg} color="white" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
      </View>

      {/* Question */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: responsiveStyle.spacing.base, paddingBottom: responsiveStyle.spacing.xl * 2, flexGrow: 1 }}
      >
        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1}
          </Text>
          <Text style={styles.questionText}>
            {currentQuestion.question}
          </Text>
        </View>

        {/* Answer Section */}
        {showAnswer ? (
          <View style={styles.answerCard}>
            <Text style={styles.answerTitle}>Réponse :</Text>
            <Text style={styles.answerText}>
              {currentQuestion.reponse || currentQuestion.contenu || 'Réponse non disponible'}
            </Text>
            
            <View style={styles.answerButtonContainer}>
              <TouchableOpacity 
                style={styles.correctButton} 
                onPress={handleCorrectAnswer}
              >
                <MaterialCommunityIcons name="check" size={responsiveStyle.fontSize.lg} color="white" />
                <Text style={styles.answerButtonText}>Correct</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.incorrectButton} 
                onPress={handleIncorrectAnswer}
              >
                <MaterialCommunityIcons name="close" size={responsiveStyle.fontSize.lg} color="white" />
                <Text style={styles.answerButtonText}>Incorrect</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.showAnswerButton} onPress={handleShowAnswer}>
            <MaterialCommunityIcons name="eye" size={responsiveStyle.fontSize.lg} color="white" />
            <Text style={styles.showAnswerText}>Voir la réponse</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
        </SafeAreaView>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const createStyles = (responsive: any, responsiveStyle: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#174C3C',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: responsiveStyle.fontSize.base + 2, // ✅ Responsive : était 18
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsive.horizontalPadding,
    paddingVertical: responsiveStyle.spacing.base,
    justifyContent: 'space-between',
  },
  backButton: {
    width: responsiveStyle.component.iconSize * 2, // ✅ Responsive : était 44
    height: responsiveStyle.component.iconSize * 2, // ✅ Responsive : était 44
    borderRadius: responsiveStyle.component.iconSize,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: responsive.horizontalPadding,
  },
  progressText: {
    color: 'white',
    fontSize: responsiveStyle.fontSize.base, // ✅ Responsive : était 16
    fontWeight: 'bold',
    marginBottom: responsiveStyle.spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: responsiveStyle.spacing.xs, // ✅ Responsive : était 6
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: responsiveStyle.spacing.xs / 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: responsiveStyle.spacing.xs / 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontSize: responsiveStyle.fontSize.base, // ✅ Responsive : était 16
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: responsive.horizontalPadding,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: responsiveStyle.component.borderRadius,
    padding: responsiveStyle.spacing.base,
    marginBottom: responsiveStyle.spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsiveStyle.spacing.xs },
    shadowOpacity: 0.1,
    shadowRadius: responsiveStyle.spacing.sm,
    elevation: 5,
  },
  questionNumber: {
    fontSize: responsiveStyle.fontSize.base, // ✅ Responsive : était 16
    color: '#174C3C',
    fontWeight: 'bold',
    marginBottom: responsiveStyle.spacing.base,
  },
  questionText: {
    fontSize: responsiveStyle.fontSize.base + 2, // ✅ Responsive : était 18
    color: '#333',
    lineHeight: (responsiveStyle.fontSize.base + 2) * 1.4,
  },
  answerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: responsiveStyle.component.borderRadius,
    padding: responsiveStyle.spacing.base,
    marginBottom: responsiveStyle.spacing.base,
  },
  answerTitle: {
    fontSize: responsiveStyle.fontSize.base + 2, // ✅ Responsive : était 18
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: responsiveStyle.spacing.base,
  },
  answerText: {
    fontSize: responsiveStyle.fontSize.base, // ✅ Responsive : était 16
    color: '#333',
    lineHeight: responsiveStyle.fontSize.base * 1.5,
    marginBottom: responsiveStyle.spacing.base,
  },
  answerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  correctButton: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveStyle.spacing.base,
    paddingVertical: responsiveStyle.spacing.base,
    borderRadius: responsiveStyle.component.borderRadius * 2,
    flex: 0.45,
    justifyContent: 'center',
  },
  incorrectButton: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveStyle.spacing.base,
    paddingVertical: responsiveStyle.spacing.base,
    borderRadius: responsiveStyle.component.borderRadius * 2,
    flex: 0.45,
    justifyContent: 'center',
  },
  answerButtonText: {
    color: 'white',
    fontSize: responsiveStyle.fontSize.base, // ✅ Responsive : était 16
    fontWeight: 'bold',
    marginLeft: responsiveStyle.spacing.sm,
  },
  showAnswerButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveStyle.spacing.base,
    borderRadius: responsiveStyle.component.borderRadius * 2,
    marginBottom: responsiveStyle.spacing.base,
  },
  showAnswerText: {
    color: 'white',
    fontSize: responsive.isLandscape ? responsiveStyle.fontSize.base : responsiveStyle.fontSize.base + 2, // ✅ Responsive
    fontWeight: 'bold',
    marginLeft: responsive.isLandscape ? responsiveStyle.spacing.xs : responsiveStyle.spacing.sm,
    flexShrink: 1, // Permettre au texte de se réduire si nécessaire
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveStyle.spacing.xl,
  },
  resultTitle: {
    fontSize: responsiveStyle.fontSize.xxl, // ✅ Responsive : était 32
    fontWeight: 'bold',
    color: 'white',
    marginTop: responsiveStyle.spacing.base,
    marginBottom: responsiveStyle.spacing.base,
  },
  percentageText: {
    fontSize: responsiveStyle.fontSize.xxl * 1.5, // ✅ Responsive : était 48
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: responsiveStyle.spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  restartButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveStyle.spacing.base,
    paddingVertical: responsiveStyle.spacing.base,
    borderRadius: responsiveStyle.component.borderRadius * 2,
    flex: 0.45,
    justifyContent: 'center',
  },
  homeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveStyle.spacing.base,
    paddingVertical: responsiveStyle.spacing.base,
    borderRadius: responsiveStyle.component.borderRadius * 2,
    flex: 0.45,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: responsiveStyle.fontSize.base, // ✅ Responsive : était 16
    fontWeight: 'bold',
    marginLeft: responsiveStyle.spacing.sm,
  },
}); 