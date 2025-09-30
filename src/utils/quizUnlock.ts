// Ordre explicite des quiz (pas tri de string)
export const QUIZ_ORDER = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;

// Fonction pour vérifier si un quiz est débloqué
export const isQuizUnlocked = (
  quizKey: string, 
  scores: Record<string, number>
): boolean => {
  const index = QUIZ_ORDER.indexOf(quizKey as any);
  
  // Premier quiz toujours débloqué
  if (index <= 0) return true;
  
  // Pour les autres quiz, vérifier si le quiz précédent a été complété avec 80%
  const previousQuizKey = QUIZ_ORDER[index - 1];
  const previousScore = scores[previousQuizKey] || 0;
  
  return previousScore >= 80;
};

// Fonction pour obtenir le quiz précédent requis
export const getRequiredPreviousQuiz = (quizKey: string): string | null => {
  const index = QUIZ_ORDER.indexOf(quizKey as any);
  
  if (index <= 0) return null;
  
  return QUIZ_ORDER[index - 1];
};

// Fonction pour obtenir le score requis pour débloquer un quiz
export const getRequiredScore = (): number => {
  return 80; // Score requis fixe
};

// Fonction pour obtenir le statut de déverrouillage d'un quiz
export const getQuizUnlockStatus = (
  quizKey: string,
  scores: Record<string, number>
): {
  isUnlocked: boolean;
  requiredQuiz?: string;
  requiredScore?: number;
  currentScore?: number;
  progress?: number;
} => {
  const isUnlocked = isQuizUnlocked(quizKey, scores);
  
  if (isUnlocked) {
    return { isUnlocked: true };
  }
  
  const requiredQuiz = getRequiredPreviousQuiz(quizKey);
  const requiredScore = getRequiredScore();
  const currentScore = requiredQuiz ? (scores[requiredQuiz] || 0) : 0;
  const progress = requiredScore > 0 ? Math.min((currentScore / requiredScore) * 100, 100) : 0;
  
  return {
    isUnlocked: false,
    requiredQuiz,
    requiredScore,
    currentScore,
    progress
  };
};

// Fonction pour obtenir tous les quiz débloqués
export const getUnlockedQuizzes = (scores: Record<string, number>): string[] => {
  return QUIZ_ORDER.filter(quizKey => isQuizUnlocked(quizKey, scores));
};

// Fonction pour obtenir le prochain quiz à débloquer
export const getNextQuizToUnlock = (scores: Record<string, number>): string | null => {
  for (const quizKey of QUIZ_ORDER) {
    if (!isQuizUnlocked(quizKey, scores)) {
      return quizKey;
    }
  }
  
  return null; // Tous les quiz sont débloqués
};

// Fonction pour vérifier si tous les quiz sont débloqués
export const areAllQuizzesUnlocked = (scores: Record<string, number>): boolean => {
  return QUIZ_ORDER.every(quizKey => isQuizUnlocked(quizKey, scores));
}; 