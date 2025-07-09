import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { 
  Alert, 
  Dimensions, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal, 
  Animated, 
  Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Question {
  numero?: number;
  question: string;
  reponse?: string;
  contenu?: string;
  options?: string[];
  correctAnswer?: number;
}

export default function QuizGameScreen() {
  const navigation = useNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

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

  // Générer des options pour chaque question
  const generateOptions = (question: Question) => {
    const correctAnswer = question.reponse || question.contenu || '';
    const options = [correctAnswer];
    
    // Ajouter des options incorrectes basées sur d'autres questions
    const allQuestions = [
      ...exercicesChap1,
      ...exercicesChap2,
      ...exercicesChap3,
      ...exercicesChap5,
      ...exercicesChap6,
      ...exercicesChap7,
      ...exercicesChap9,
      ...exercicesChap10,
      ...exercicesChap12
    ];
    
    const otherAnswers = allQuestions
      .filter(q => q !== question)
      .map(q => (q as any).reponse || (q as any).contenu)
      .filter(answer => answer && answer.trim() !== '' && answer !== correctAnswer);
    
    // Mélanger et prendre 3 réponses incorrectes
    const shuffledIncorrect = otherAnswers.sort(() => Math.random() - 0.5).slice(0, 3);
    options.push(...shuffledIncorrect);
    
    // Mélanger toutes les options
    return options.sort(() => Math.random() - 0.5);
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (!answerSubmitted) {
      setSelectedAnswer(optionIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      setAnswerSubmitted(true);
      const correctAnswer = currentQuestion.reponse || currentQuestion.contenu || '';
      const options = generateOptions(currentQuestion);
      const isCorrect = options[selectedAnswer] === correctAnswer;
      
      if (isCorrect) {
        setScore(score + 1);
      }
      
      setTimeout(() => {
        nextQuestion();
      }, 2000);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowAnswer(false);
    setQuizFinished(false);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
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

  const openAnswerModal = () => {
    setShowAnswerModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeAnswerModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowAnswerModal(false);
    });
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

  const options = generateOptions(currentQuestion);
  const correctAnswer = currentQuestion.reponse || currentQuestion.contenu || '';

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

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = option === correctAnswer;
            const showResult = answerSubmitted;
            
            let optionStyle: any = styles.optionCard;
            let checkboxStyle: any = styles.checkbox;
            let textStyle = styles.optionText;
            
            if (isSelected) {
              optionStyle = [styles.optionCard, styles.selectedOption];
              checkboxStyle = [styles.checkbox, styles.selectedCheckbox];
            }
            
            if (showResult) {
              if (isCorrect) {
                optionStyle = [styles.optionCard, styles.correctOption];
                checkboxStyle = [styles.checkbox, styles.correctCheckbox];
              } else if (isSelected && !isCorrect) {
                optionStyle = [styles.optionCard, styles.incorrectOption];
                checkboxStyle = [styles.checkbox, styles.incorrectCheckbox];
              }
            }
            
            return (
              <TouchableOpacity
                key={index}
                style={optionStyle}
                onPress={() => handleOptionSelect(index)}
                disabled={answerSubmitted}
              >
                <View style={styles.optionContent}>
                  <View style={checkboxStyle}>
                    {isSelected && (
                      <MaterialCommunityIcons 
                        name="check" 
                        size={16} 
                        color="white" 
                      />
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.optionTextContainer}
                    onPress={openAnswerModal}
                    disabled={answerSubmitted}
                  >
                    <Text style={textStyle} numberOfLines={3}>
                      {option}
                    </Text>
                    <MaterialCommunityIcons 
                      name="book-open-variant" 
                      size={16} 
                      color="#D4AF37" 
                      style={styles.readIcon}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit Button */}
        {selectedAnswer !== null && !answerSubmitted && (
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmitAnswer}
          >
            <MaterialCommunityIcons name="send" size={24} color="white" />
            <Text style={styles.submitButtonText}>Valider ma réponse</Text>
          </TouchableOpacity>
        )}

        {/* Result Message */}
        {answerSubmitted && (
          <View style={styles.resultMessage}>
            <MaterialCommunityIcons 
              name={options[selectedAnswer!] === correctAnswer ? "check-circle" : "close-circle"} 
              size={32} 
              color={options[selectedAnswer!] === correctAnswer ? "#27AE60" : "#E74C3C"} 
            />
            <Text style={[
              styles.resultText,
              { color: options[selectedAnswer!] === correctAnswer ? "#27AE60" : "#E74C3C" }
            ]}>
              {options[selectedAnswer!] === correctAnswer ? "Correct !" : "Incorrect !"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal pour la réponse complète */}
      <Modal
        visible={showAnswerModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeAnswerModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAnswerModal}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Réponse complète</Text>
                <TouchableOpacity onPress={closeAnswerModal} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="#174C3C" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalAnswerText}>
                  {currentQuestion.reponse || currentQuestion.contenu || 'Réponse non disponible'}
                </Text>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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
  optionsContainer: {
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  correctOption: {
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  incorrectOption: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 2,
    borderColor: '#E74C3C',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  selectedCheckbox: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  correctCheckbox: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  incorrectCheckbox: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  optionTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  readIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: screenHeight * 0.8,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174C3C',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: screenHeight * 0.6,
    padding: 20,
  },
  modalAnswerText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
}); 