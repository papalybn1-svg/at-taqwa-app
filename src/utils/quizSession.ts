import AsyncStorage from '@react-native-async-storage/async-storage';

// Type pour une session de quiz
export type QuizSession = {
  version: 1;
  userId: string;
  exercicesKey: string;
  sessionId: string;
  questionIds: string[]; // ordre figé
  currentIndex: number;
  answers: Record<string, { value: string; correct?: boolean }>;
  score?: number;
  completedAt?: number;
  startedAt: number;
};

// Fonction pour générer un ID de session unique
const generateSessionId = (userId: string, exercicesKey: string, startedAt: number): string => {
  return `${userId}_${exercicesKey}_${startedAt}`;
};

// Fonction pour mélanger de manière déterministe (seed = uid + exercicesKey + startedAt)
const deterministicShuffle = <T>(array: T[], seed: string): T[] => {
  const shuffled = [...array];
  let hash = 0;
  
  // Générer un hash simple à partir du seed
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Mélanger avec le hash comme seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = (hash * 9301 + 49297) % 233280;
    const j = Math.floor((hash / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Fonction pour créer une nouvelle session
export const createQuizSession = async (
  userId: string,
  exercicesKey: string,
  questions: string[]
): Promise<QuizSession> => {
  const startedAt = Date.now();
  const sessionId = generateSessionId(userId, exercicesKey, startedAt);
  
  // Mélanger les questions de manière déterministe
  const seed = `${userId}_${exercicesKey}_${startedAt}`;
  const shuffledQuestionIds = deterministicShuffle(questions, seed);
  
  const session: QuizSession = {
    version: 1,
    userId,
    exercicesKey,
    sessionId,
    questionIds: shuffledQuestionIds,
    currentIndex: 0,
    answers: {},
    startedAt,
  };
  
  // Sauvegarder la session
  const key = `quiz:session:${userId}:${exercicesKey}`;
  await AsyncStorage.setItem(key, JSON.stringify(session));
  
  console.log('🆕 Nouvelle session créée:', {
    exercicesKey,
    sessionId,
    questionCount: questions.length,
    currentIndex: 0
  });
  
  return session;
};

// Fonction pour charger une session existante
export const loadQuizSession = async (
  userId: string,
  exercicesKey: string
): Promise<QuizSession | null> => {
  try {
    const key = `quiz:session:${userId}:${exercicesKey}`;
    const sessionData = await AsyncStorage.getItem(key);
    
    if (sessionData) {
      const session: QuizSession = JSON.parse(sessionData);
      
      // Vérifier la version
      if (session.version !== 1) {
        console.log('⚠️ Version de session obsolète, suppression');
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      console.log('📦 Session chargée:', {
        exercicesKey,
        sessionId: session.sessionId,
        currentIndex: session.currentIndex,
        totalQuestions: session.questionIds.length,
        completed: session.completedAt ? 'Oui' : 'Non'
      });
      
      return session;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur chargement session:', error);
    return null;
  }
};

// Fonction pour sauvegarder une session
export const saveQuizSession = async (session: QuizSession): Promise<void> => {
  try {
    const key = `quiz:session:${session.userId}:${session.exercicesKey}`;
    await AsyncStorage.setItem(key, JSON.stringify(session));
    
    console.log('💾 Session sauvegardée:', {
      exercicesKey: session.exercicesKey,
      currentIndex: session.currentIndex,
      answersCount: Object.keys(session.answers).length
    });
  } catch (error) {
    console.error('❌ Erreur sauvegarde session:', error);
  }
};

// Fonction pour mettre à jour une réponse
export const updateQuizAnswer = async (
  session: QuizSession,
  questionId: string,
  answer: string,
  isCorrect: boolean
): Promise<QuizSession> => {
  const updatedSession = {
    ...session,
    answers: {
      ...session.answers,
      [questionId]: {
        value: answer,
        correct: isCorrect
      }
    }
  };
  
  await saveQuizSession(updatedSession);
  return updatedSession;
};

// Fonction pour passer à la question suivante
export const nextQuizQuestion = async (session: QuizSession): Promise<QuizSession> => {
  const updatedSession = {
    ...session,
    currentIndex: session.currentIndex + 1
  };
  
  await saveQuizSession(updatedSession);
  return updatedSession;
};

// Fonction pour terminer une session
export const completeQuizSession = async (
  session: QuizSession,
  finalScore: number
): Promise<QuizSession> => {
  const completedSession = {
    ...session,
    score: finalScore,
    completedAt: Date.now()
  };
  
  await saveQuizSession(completedSession);
  
  console.log('✅ Session terminée:', {
    exercicesKey: session.exercicesKey,
    score: finalScore,
    totalQuestions: session.questionIds.length
  });
  
  return completedSession;
};

// Fonction pour supprimer une session
export const deleteQuizSession = async (
  userId: string,
  exercicesKey: string
): Promise<void> => {
  try {
    const key = `quiz:session:${userId}:${exercicesKey}`;
    await AsyncStorage.removeItem(key);
    
    console.log('🗑️ Session supprimée:', { exercicesKey });
  } catch (error) {
    console.error('❌ Erreur suppression session:', error);
  }
};

// Fonction pour nettoyer toutes les sessions d'un utilisateur
export const cleanupUserQuizSessions = async (userId: string): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sessionKeys = keys.filter(key => key.startsWith(`quiz:session:${userId}:`));
    
    if (sessionKeys.length > 0) {
      await AsyncStorage.multiRemove(sessionKeys);
      console.log('🧹 Sessions utilisateur nettoyées:', sessionKeys.length);
    }
  } catch (error) {
    console.error('❌ Erreur nettoyage sessions:', error);
  }
};

// Fonction pour vérifier si une session est complète
export const isSessionComplete = (session: QuizSession): boolean => {
  return session.completedAt !== undefined;
};

// Fonction pour vérifier si une session peut être reprise
export const canResumeSession = (session: QuizSession): boolean => {
  return !isSessionComplete(session) && session.currentIndex < session.questionIds.length;
};

// Fonction pour calculer le score d'une session
export const calculateSessionScore = (session: QuizSession): number => {
  const correctAnswers = Object.values(session.answers).filter(answer => answer.correct).length;
  const totalQuestions = session.questionIds.length;
  
  if (totalQuestions === 0) return 0;
  
  return Math.round((correctAnswers / totalQuestions) * 100);
};

// Fonction pour obtenir le profil de quiz d'un utilisateur
export const getQuizProfile = async (userId: string): Promise<{
  bestScores: Record<string, number>;
  attempts: Record<string, number>;
}> => {
  try {
    const key = `quiz:profile:${userId}`;
    const profileData = await AsyncStorage.getItem(key);
    
    if (profileData) {
      return JSON.parse(profileData);
    }
    
    return { bestScores: {}, attempts: {} };
  } catch (error) {
    console.error('❌ Erreur chargement profil quiz:', error);
    return { bestScores: {}, attempts: {} };
  }
};

// Fonction pour mettre à jour le profil de quiz
export const updateQuizProfile = async (
  userId: string,
  exercicesKey: string,
  score: number
): Promise<void> => {
  try {
    const profile = await getQuizProfile(userId);
    
    // Mettre à jour le meilleur score
    const currentBest = profile.bestScores[exercicesKey] || 0;
    if (score > currentBest) {
      profile.bestScores[exercicesKey] = score;
    }
    
    // Incrémenter le nombre de tentatives
    profile.attempts[exercicesKey] = (profile.attempts[exercicesKey] || 0) + 1;
    
    // Sauvegarder le profil
    const key = `quiz:profile:${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(profile));
    
    console.log('📊 Profil quiz mis à jour:', {
      exercicesKey,
      score,
      bestScore: profile.bestScores[exercicesKey],
      attempts: profile.attempts[exercicesKey]
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour profil quiz:', error);
  }
}; 