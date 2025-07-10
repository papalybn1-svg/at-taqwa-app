import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



const { width: screenWidth } = Dimensions.get('window');

// Import des exercices
import exercicesChap1 from '../../data/exercices_par_chapitre/chapitre_1_exercices.json';
import exercicesChap2 from '../../data/exercices_par_chapitre/chapitre_02_exercices.json';
import exercicesChap3 from '../../data/exercices_par_chapitre/chapitre_03_exercices.json';
import exercicesChap5 from '../../data/exercices_par_chapitre/chapitre_05_exercices.json';
import exercicesChap6 from '../../data/exercices_par_chapitre/chapitre_06_exercices.json';
import exercicesChap7 from '../../data/exercices_par_chapitre/chapitre_07_exercices.json';
import exercicesChap9 from '../../data/exercices_par_chapitre/chapitre_09_exercices.json';
import exercicesChap10 from '../../data/exercices_par_chapitre/chapitre_10_exercices.json';
import exercicesChap12 from '../../data/exercices_par_chapitre/chapitre_12_exercices.json';



interface Question {
  numero?: number;
  question: string;
  reponse?: string;
  contenu?: string;
}

export default function QuizGameScreen() {
  const navigation = useNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  // Combiner toutes les questions des différents chapitres
  useEffect(() => {
    const allQuestions: Question[] = [
      ...exercicesChap1,
      ...exercicesChap2.slice(0, 5), // Limiter le nombre de questions
      ...exercicesChap3.slice(0, 3),
      ...exercicesChap5.slice(0, 5),
      ...exercicesChap6.slice(0, 5),
      ...exercicesChap7.slice(0, 3),
      ...exercicesChap9.slice(0, 3),
      ...exercicesChap10.slice(0, 3),
      ...exercicesChap12.slice(0, 3)
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
      ...exercicesChap1,
      ...exercicesChap2.slice(0, 5),
      ...exercicesChap3.slice(0, 3),
      ...exercicesChap5.slice(0, 5),
      ...exercicesChap6.slice(0, 5),
      ...exercicesChap7.slice(0, 3),
      ...exercicesChap9.slice(0, 3),
      ...exercicesChap10.slice(0, 3),
      ...exercicesChap12.slice(0, 3)
         ].filter(q => q.question && q.question.trim() !== '' && ((q as any).reponse && (q as any).reponse.trim() !== '' || (q as any).contenu && (q as any).contenu.trim() !== ''));
     
     const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffledQuestions);
  };

  const goHome = () => {
    navigation.navigate('HomeMain' as never);
  };

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement du quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <MaterialCommunityIcons name="trophy" size={80} color="#D4AF37" />
          <Text style={styles.resultTitle}>Quiz terminé !</Text>
          <Text style={styles.scoreText}>
            Votre score : {score}/{questions.length}
          </Text>
          <Text style={styles.percentageText}>{percentage}%</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
              <MaterialCommunityIcons name="refresh" size={24} color="white" />
              <Text style={styles.buttonText}>Recommencer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.homeButton} onPress={goHome}>
              <MaterialCommunityIcons name="home" size={24} color="white" />
              <Text style={styles.buttonText}>Accueil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goHome} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                <MaterialCommunityIcons name="check" size={24} color="white" />
                <Text style={styles.answerButtonText}>Correct</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.incorrectButton} 
                onPress={handleIncorrectAnswer}
              >
                <MaterialCommunityIcons name="close" size={24} color="white" />
                <Text style={styles.answerButtonText}>Incorrect</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.showAnswerButton} onPress={handleShowAnswer}>
            <MaterialCommunityIcons name="eye" size={24} color="white" />
            <Text style={styles.showAnswerText}>Voir la réponse</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  questionNumber: {
    fontSize: 16,
    color: '#174C3C',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
  },
  answerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  answerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 10,
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  answerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  correctButton: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.45,
    justifyContent: 'center',
  },
  incorrectButton: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.45,
    justifyContent: 'center',
  },
  answerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  showAnswerButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 20,
  },
  showAnswerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 20,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 40,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.45,
    justifyContent: 'center',
  },
  homeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.45,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 