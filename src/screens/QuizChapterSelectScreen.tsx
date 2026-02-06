import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import { useAuthContext } from '../contexts/AuthContext';
import colors from '../theme/colors';
import { migrateUnscopedKeyToUser, read as readUserStorage } from '../utils/userStorage';
import { isQuizUnlocked } from '../utils/quizUnlock';
import { usePaymentService } from '../lib/paymentService';
import { useEntitlements } from '../contexts/EntitlementsContext';
import { getQuizProfile, loadQuizSession } from '../utils/quizSession';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResponsiveStyle, useResponsive } from '../hooks/useResponsive';

// Liste centralisée des fichiers d'exercices (clé = numéro de chapitre sous forme de string)
const exercicesFiles: { [key: string]: any[] | { quiz: any[] } } = {
  '1': require('../../data/exercices_par_chapitre/chapitre_1_exercices.json'),
    '2': require('../../data/exercices_par_chapitre/chapitre_2_exercices.json'),
    '3': require('../../data/exercices_par_chapitre/chapitre_3_exercices.json'),
    '4': require('../../data/exercices_par_chapitre/chapitre_4_exercices.json'),
    '5': require('../../data/exercices_par_chapitre/chapitre_5_exercices.json'),
    '6': require('../../data/exercices_par_chapitre/chapitre_6_exercices.json'),
    '7': require('../../data/exercices_par_chapitre/chapitre_7_exercices.json'),
    '8': require('../../data/exercices_par_chapitre/chapitre_8_exercices.json'),
    '9': require('../../data/exercices_par_chapitre/chapitre_9_execrcices.json'),
  '10': require('../../data/exercices_par_chapitre/chapitre_10_exercices.json'),
    '11': require('../../data/exercices_par_chapitre/chapitre_11_exercices.json'),
  '12': require('../../data/exercices_par_chapitre/chapitre_12_exercices.json'),
};

// SplashFamille copié depuis App.tsx avec responsive
function SplashFamille({ responsive, responsiveStyle }: { responsive: any, responsiveStyle: any }) {
  const splashStyles = createSplashStyles(responsive, responsiveStyle);
  return (
    <View style={splashStyles.splashFamilleBg}>
      {/* Bloc image + texte en haut */}
      <View style={splashStyles.topContentBlock}>
        {/* Logo en haut */}
        <Image 
          source={require('../../assets/Page_acceuil_dome_mosquee.png')} 
          style={splashStyles.splashFamilleLogo}
        />
        {/* Texte principal */}
        <View style={splashStyles.splashFamilleTextContainer}>
          <Text style={splashStyles.splashMainTitle}>Assalamu Alaikum,</Text>
          <Text style={splashStyles.splashSubtitleGreen}>Bienvenue sur AT-Taqwa</Text>
          <Text style={splashStyles.splashDescription}>Votre guide pour la réparation de la Prière</Text>
        </View>
      </View>
      {/* Image de la famille en bas */}
      <Image 
        source={require('../../assets/femme_et_enfant_2.png')} 
        style={splashStyles.splashFamilleImageXL}
      />
    </View>
  );
}

export default function QuizChapterSelectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  
  // TOUS les hooks doivent être appelés AVANT tout return conditionnel
  const [quizScores, setQuizScores] = useState<{ [key: string]: number }>({});
  const [quizBestScores, setQuizBestScores] = useState<{ [key: string]: number }>({});
  const [quizPartialScores, setQuizPartialScores] = useState<{ [key: string]: number }>({});
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockedChapter, setLockedChapter] = useState<any>(null);
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  // Service de paiement
  const { checkEntitlements } = usePaymentService();
  
  // Entitlements globaux
  const { entitlements: userEntitlements, refreshEntitlements } = useEntitlements();
  // Entitlements frais lus côté backend pour éviter tout état périmé
  const [freshEntitlements, setFreshEntitlements] = useState<{ part2: boolean; part3: boolean } | null>(null);
  
  // loadQuizScores doit être un useCallback pour être utilisé dans les hooks
  const loadQuizScores = useCallback(async () => {
    try {
      console.log('📥 Chargement des scores de quiz...');
      await migrateUnscopedKeyToUser(user?.uid, 'quizScores');
      const scores = await readUserStorage<Record<string, number>>(user?.uid, 'quizScores');
      if (scores) {
        console.log('✅ Scores finaux chargés:', scores);
        setQuizScores(scores);
      }
      
      // Charger aussi les meilleurs scores depuis le profil
      if (user?.uid) {
        const profile = await getQuizProfile(user.uid);
        if (profile.bestScores) {
          setQuizBestScores(profile.bestScores);
        }
        
        // Charger les scores partiels depuis les sessions en cours
        const partialScores: Record<string, number> = {};
        
        // Vérifier les sessions dans AsyncStorage (nouveau système)
        const allKeys = await AsyncStorage.getAllKeys();
        const sessionKeys = allKeys.filter(key => key.startsWith(`quiz:session:${user.uid}:`));
        
        for (const sessionKey of sessionKeys) {
          try {
            const sessionData = await AsyncStorage.getItem(sessionKey);
            if (sessionData) {
              const session = JSON.parse(sessionData);
              if (session.exercicesKey) {
                // Utiliser le score calculé dans la session (mis à jour après chaque réponse)
                if (session.score !== undefined) {
                  partialScores[session.exercicesKey] = session.score;
                } else if (session.answers) {
                  // Fallback : calculer le score si pas encore calculé dans la session
                  const totalQuestions = session.questionIds?.length || 0;
                  if (totalQuestions > 0) {
                    const correctAnswers = Object.values(session.answers).filter((ans: any) => ans.correct === true).length;
                    const partialScore = Math.round((correctAnswers / totalQuestions) * 100);
                    partialScores[session.exercicesKey] = partialScore;
                  }
                }
              }
            }
          } catch (e) {
            console.error('Erreur chargement session:', e);
          }
        }
        
        // Vérifier aussi les anciennes sessions dans userStorage
        // Normaliser les clés pour s'assurer qu'elles correspondent (ex: "01" -> "1", "10" -> "10")
        const allChapters = Object.entries(chaptersData).flatMap(([partieKey, partie]) =>
          partie.chapitres.map((ch) => {
            const imageKey = ch.image;
            // Normaliser la clé : "01" -> "1", "1" -> "1", "10" -> "10"
            const normalizedKey = String(parseInt(imageKey, 10));
            return { imageKey, normalizedKey };
          })
        );
        
        // Créer un map pour éviter les doublons
        const uniqueChapters = new Map<string, string>();
        allChapters.forEach(({ imageKey, normalizedKey }) => {
          if (!uniqueChapters.has(normalizedKey)) {
            uniqueChapters.set(normalizedKey, imageKey);
          }
        });
        
        // Vérifier les sessions avec les clés normalisées ET les clés originales
        for (const [normalizedKey, imageKey] of uniqueChapters.entries()) {
          try {
            // Essayer d'abord avec la clé normalisée (format utilisé dans OriginalQuizScreen)
            let sessionKey = `quizSession:${normalizedKey}`;
            let saved = await readUserStorage<{ index: number; score: number; scorePercentage?: number; answers: Array<number|null> }>(user.uid, sessionKey);
            
            // Si pas trouvé, essayer avec la clé originale (format image)
            if (!saved && imageKey !== normalizedKey) {
              sessionKey = `quizSession:${imageKey}`;
              saved = await readUserStorage<{ index: number; score: number; scorePercentage?: number; answers: Array<number|null> }>(user.uid, sessionKey);
            }
            
            if (saved) {
              let scorePercentage: number | undefined = undefined;
              
              // Priorité au scorePercentage s'il existe (nouveau format)
              if (saved.scorePercentage !== undefined) {
                scorePercentage = saved.scorePercentage;
              } else if (saved.score !== undefined) {
                // Fallback : calculer le pourcentage depuis le score brut (ancien format)
                const exercicesData = exercicesFiles[normalizedKey];
                let totalQuestions = 0;
                if (Array.isArray(exercicesData)) {
                  totalQuestions = exercicesData.length;
                } else if (exercicesData && typeof exercicesData === 'object' && 'quiz' in exercicesData) {
                  totalQuestions = Array.isArray((exercicesData as any).quiz) ? (exercicesData as any).quiz.length : 0;
                }
                
                if (totalQuestions > 0) {
                  // Calculer le pourcentage : (bonnes réponses / total questions) * 100
                  scorePercentage = Math.round((saved.score / totalQuestions) * 100);
                }
              }
              
              // Utiliser la clé normalisée pour stocker le score (correspond à exercicesKey)
              if (scorePercentage !== undefined && (!partialScores[normalizedKey] || scorePercentage > partialScores[normalizedKey])) {
                partialScores[normalizedKey] = scorePercentage;
                console.log(`📊 Score partiel chargé pour chapitre ${normalizedKey}: ${scorePercentage}%`);
              }
            }
          } catch (e) {
            console.error(`Erreur chargement session pour chapitre ${normalizedKey}:`, e);
          }
        }
        
        setQuizPartialScores(partialScores);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des scores:', error);
    }
  }, [user?.uid]);

  // TOUS les useEffect et useFocusEffect doivent être AVANT le return null
  // Charger les scores des quiz depuis le stockage local
  useEffect(() => {
    if (!user) return;
    loadQuizScores();
  }, [user?.uid, loadQuizScores]);

  // Recharger les scores + droits quand l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      console.log('🔄 QuizChapterSelectScreen: rechargement des scores...');
      loadQuizScores();
      // Rafraîchir les droits pour éviter un état périmé après paiement
      // Ne pas forcer pour éviter les boucles infinies
      (async () => {
        try {
          await refreshEntitlements(false);
        } catch {}
        try {
          const latest = await checkEntitlements();
          setFreshEntitlements(latest);
        } catch {}
      })();
    }, [user?.uid, refreshEntitlements, checkEntitlements, loadQuizScores])
  );

  // Gestion du bouton retour Android pour aller à l'accueil
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      const onBackPress = () => {
        if (selectedPart) {
          setSelectedPart(null);
          return true;
        }
        navigation.navigate('HomeMain' as never);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, selectedPart, user])
  );

  // Intercepter le retour (swipe ou bouton) pour forcer l'accueil
  useEffect(() => {
    if (!user) return;
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        e.preventDefault();
        if (selectedPart) {
          setSelectedPart(null);
        } else {
        navigation.navigate('HomeMain' as never);
        }
      }
    });
    return unsubscribe;
  }, [navigation, selectedPart, user]);
  
  // Génère la liste plate de tous les chapitres avec association fiable (doit être un useMemo avant return null)
  const allChapters = useMemo(() => {
    return Object.entries(chaptersData).flatMap(([partieKey, partie], partieIndex) =>
      partie.chapitres.map((ch, chapitreIndex) => {
        // On tente d'associer le chapitre à son fichier d'exercices par numéro
        const num = ch.image;
        const numKey = String(parseInt(num, 10)); // '01' -> '1', '10' -> '10'
        const exercices = exercicesFiles[numKey];
        // Gérer les deux formats : tableau direct ou objet avec propriété quiz
        const hasQuiz = Array.isArray(exercices) && exercices.length > 0 || 
                       (exercices && typeof exercices === 'object' && 'quiz' in exercices && 
                        Array.isArray((exercices as any).quiz) && (exercices as any).quiz.length > 0);
        if (hasQuiz) {
          return {
            ...ch,
            id: `${partieIndex}-${chapitreIndex}`,
            partie: partie.titre,
            partieKey: partieKey,
            image: ch.image || '',
            exercicesKey: numKey,
          };
        }
        return null;
      })
    ).filter((chapter): chapter is { id: string; partie: string; partieKey: string; exercicesKey: string; image: string; title: string; desc: string; author: string } => !!chapter);
  }, []);
  
  // Garde: ne pas utiliser entitlements avant user
  // MAINTENANT après tous les hooks
  if (!user) {
    return null;
  }

  // Vérifier si un quiz est accessible (uniquement vérification premium)
  const isQuizAccessible = (partieKey?: string) => {
    // Vérifier l'accès à la partie si c'est une partie payante
    const source = freshEntitlements ?? userEntitlements;
    if (partieKey === 'deuxieme_partie' && !source.part2) {
      return false; // Pas d'accès à la partie 2
    }
    if (partieKey === 'troisieme_partie' && !source.part3) {
      return false; // Pas d'accès à la partie 3
    }
    
    // Tous les quiz sont accessibles (sauf premium non payé)
    return true;
  };

  // Gestionnaire de geste de swipe
  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      if ((translationX > 50 && velocityX > 500) || translationX > 150) {
        if (selectedPart) {
          setSelectedPart(null);
        } else {
        navigation.goBack();
        }
      }
    }
  };

  // Gérer le clic sur une partie
  const handlePartPress = async (partie: string) => {
    // Ne pas forcer pour éviter les boucles infinies
    try { await refreshEntitlements(false); } catch {}
    try {
      const latest = await checkEntitlements();
      setFreshEntitlements(latest);
    } catch {}
    // Vérifier si c'est une partie premium et si l'utilisateur y a accès
    const isPremiumPart = partie === 'deuxieme_partie' || partie === 'troisieme_partie';
    const source = freshEntitlements ?? userEntitlements;
    const hasAccessToPart = partie === 'premiere_partie' || 
      (partie === 'deuxieme_partie' && source.part2) ||
      (partie === 'troisieme_partie' && source.part3);
    
    if (!hasAccessToPart && isPremiumPart) {
      // Afficher un modal pour encourager l'achat
      Alert.alert(
        'Contenu Premium',
        `La Partie ${partie === 'deuxieme_partie' ? '2' : '3'} nécessite un paiement pour être accessible.${'\n\n'}Débloquez l'accès complet à cette partie premium pour accéder aux quiz.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Voir les parties', 
            onPress: () => navigation.navigate('Books' as never)
          }
        ]
      );
      return;
    }
    
    setSelectedPart(partie);
  };

  // Gérer le clic sur un chapitre
  const handleChapterPress = async (chapter: any) => {
    // Ne pas forcer pour éviter les boucles infinies
    try { await refreshEntitlements(false); } catch {}
    try {
      const latest = await checkEntitlements();
      setFreshEntitlements(latest);
    } catch {}
    // Vérifier uniquement l'accès premium
    if (!isQuizAccessible(chapter.partieKey)) {
      // Verrouillage par accès payant
      setLockedChapter(chapter);
      setPreviousScore(undefined);
      setShowLockModal(true);
      return;
    }
    
    // Ouvrir directement le quiz (plus de vérification de score)
    (navigation as any).navigate('OriginalQuiz', { 
      exercicesKey: chapter.exercicesKey, 
      chapterTitle: chapter.title, 
      chapterPart: chapter.partie 
    });
  };

  // Naviguer vers le chapitre précédent pour lecture
  const goToPreviousChapter = () => {
    if (lockedChapter) {
      const allChapterKeys = allChapters.map(ch => ch.exercicesKey).sort((a, b) => parseInt(a) - parseInt(b));
      const currentIndex = allChapterKeys.indexOf(lockedChapter.exercicesKey);
      if (currentIndex > 0) {
        const previousChapter = allChapters.find(ch => ch.exercicesKey === allChapterKeys[currentIndex - 1]);
        if (previousChapter) {
          setShowLockModal(false);
          (navigation as any).navigate('Chapter', { 
            chapter: previousChapter
          });
        }
      }
    }
  };
  
  // Logs détaillés par partie
  console.log("📋 Chapitres détectés avec quiz:", allChapters.map(ch => `${ch.exercicesKey} (${ch.partieKey})`));
  console.log("📊 Répartition par partie:");
  Object.keys(chaptersData).forEach(partieKey => {
    const chapitresPartie = allChapters.filter(ch => ch.partieKey === partieKey);
    console.log(`  - ${partieKey}: ${chapitresPartie.length} chapitres (${chapitresPartie.map(ch => ch.exercicesKey).join(', ')})`);
  });

  // Obtenir les chapitres d'une partie spécifique
  const getChaptersInPartie = (partieKey: string) => {
    return allChapters.filter(ch => ch.partieKey === partieKey);
  };


  const dynamicStyles = createStyles(responsive, responsiveStyle);

  return (
    <GestureHandlerRootView style={dynamicStyles.container}>
      <PanGestureHandler enabled={Platform.OS === 'ios'} onHandlerStateChange={onGestureEvent}>
        <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
          {/* Header avec bouton retour */}
          <View style={dynamicStyles.header}>
            <TouchableOpacity 
              onPress={() => selectedPart ? setSelectedPart(null) : navigation.goBack()}
              style={dynamicStyles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={responsiveStyle.fontSize.lg} color="#174C3C" />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerTitle}>
              Quiz
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Certificate' as never)}
              style={dynamicStyles.certificateButton}
            >
              <MaterialCommunityIcons name="certificate" size={responsiveStyle.fontSize.lg} color="#174C3C" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={dynamicStyles.scrollView} 
            contentContainerStyle={{paddingBottom: 40}}
            showsVerticalScrollIndicator={false}
          >
            {selectedPart ? (
              // Affichage des quiz d'une partie sélectionnée
              <View style={{ paddingHorizontal: responsive.horizontalPadding, paddingTop: responsiveStyle.spacing.base }}>
                {/* Titre de la partie */}
                <Text style={dynamicStyles.partTitle}>{chaptersData[selectedPart as keyof typeof chaptersData].titre}</Text>
                
                {/* Liste des quiz de la partie */}
                <View style={{ marginTop: responsiveStyle.spacing.base }}>
                  {getChaptersInPartie(selectedPart).map((ch, idx) => {
                    const isAccessible = isQuizAccessible(ch.partieKey);
                    // Récupérer le score depuis plusieurs sources : quizScores, bestScores, et scores partiels
                    const scoreFromStorage = quizScores[ch.exercicesKey];
                    const bestScore = quizBestScores[ch.exercicesKey];
                    const partialScore = quizPartialScores[ch.exercicesKey];
                    
                    // Prendre le meilleur score disponible (priorité : scoreFromStorage > bestScore > partialScore)
                    let score: number | undefined = undefined;
                    const scores = [scoreFromStorage, bestScore, partialScore].filter(s => s !== undefined) as number[];
                    if (scores.length > 0) {
                      // Prendre le meilleur score et s'assurer qu'il est entre 0 et 100
                      score = Math.max(0, Math.min(100, Math.max(...scores)));
                    }
          return (
              <TouchableOpacity
                        key={idx} 
                style={[
                          dynamicStyles.quizCard,
                          { 
                            opacity: isAccessible ? 1 : 0.6,
                            shadowColor: isAccessible ? '#D4AF37' : '#000',
                            shadowOpacity: isAccessible ? 0.15 : 0.08,
                          }
                ]}
                        onPress={() => handleChapterPress(ch)}
                        activeOpacity={0.95}
              >
                        {/* Image avec overlay de progression */}
                        <View style={dynamicStyles.quizImageContainer}>
                  <Image
                            source={imageMap[ch.image] || require('../../assets/1.png')} 
                            style={dynamicStyles.quizImage} 
                          />
                          {!isAccessible && (
                            <View
                              style={[
                                dynamicStyles.quizStatusBadge,
                                dynamicStyles.quizStatusPremium
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="crown"
                                size={responsiveStyle.fontSize.xs}
                                color="#D4AF37"
                              />
                              <Text
                                style={[
                                  dynamicStyles.quizStatusText,
                                  dynamicStyles.quizStatusTextPremium
                                ]}
                              >
                                PREMIUM
                              </Text>
                            </View>
                          )}
                          {!isAccessible && (
                            <View style={dynamicStyles.quizLockOverlay}>
                              <MaterialCommunityIcons name="lock" size={responsiveStyle.fontSize.lg} color="#BB9B4E" />
                            </View>
                          )}
                </View>
                        
                        {/* Contenu du quiz */}
                        <View style={dynamicStyles.quizContent}>
                          <View style={dynamicStyles.quizHeader}>
                            <Text style={[
                              dynamicStyles.quizTitle,
                              !isAccessible && dynamicStyles.lockedText
                            ]}>
                              {ch.title && ch.title.trim() !== '' ? `Quiz du ${ch.title.replace('.', '')}:` : `Quiz du chapitre ${ch.exercicesKey}:`}
                            </Text>
                  <Text style={[
                              dynamicStyles.quizDesc,
                    !isAccessible && dynamicStyles.lockedText
                  ]}>
                              {ch.desc}
                  </Text>
                  <Text style={[
                              dynamicStyles.quizAuthor,
                    !isAccessible && dynamicStyles.lockedText
                  ]}>
                              {ch.author}
                  </Text>
                          </View>

                          {/* Barre de progression moderne - toujours affichée */}
                          <View style={dynamicStyles.quizProgressContainer}>
                            <View style={dynamicStyles.quizProgressBg}>
                              <View 
                                style={[
                                  dynamicStyles.quizProgressFill,
                                  { 
                                    width: score !== undefined ? `${score}%` : '0%',
                                    backgroundColor: score !== undefined && score >= 80 ? '#D4AF37' : '#174C3C'
                                  }
                                ]} 
                              />
                            </View>
                          </View>

                          {/* Score - toujours affiché pour les quiz accessibles */}
                          {isAccessible ? (
                            <View style={dynamicStyles.quizScoreContainer}>
                              <Text style={dynamicStyles.quizScoreText}>Score: {score !== undefined ? `${Math.round(score)}%` : '0%'}</Text>
                            </View>
                          ) : (
                            <View style={dynamicStyles.quizLockedContainer}>
                              <Text style={dynamicStyles.quizLockedText}>Contenu Premium</Text>
                            </View>
                          )}
                    </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              // Affichage des parties
              <View style={{ paddingHorizontal: responsive.horizontalPadding }}>
                <Text style={dynamicStyles.title}>Choisissez une partie pour le quiz</Text>
                {Object.keys(chaptersData).map((partie, pidx) => {
                  const partieChapters = getChaptersInPartie(partie);
                  // Tous les quiz sont accessibles (sauf premium)
                  
                  // Vérifier si c'est une partie premium et si l'utilisateur y a accès
                  const isPremiumPart = partie === 'deuxieme_partie' || partie === 'troisieme_partie';
                  const hasAccessToPart = partie === 'premiere_partie' || 
                    (partie === 'deuxieme_partie' && userEntitlements.part2) ||
                    (partie === 'troisieme_partie' && userEntitlements.part3);
                  
                  return (
                    <View key={pidx} style={{ marginBottom: responsiveStyle.spacing.base }}>
                      {/* Carte de partie */}
                      <TouchableOpacity 
                        style={[
                          dynamicStyles.partCard,
                          !hasAccessToPart && isPremiumPart && dynamicStyles.premiumPartCard
                        ]}
                        onPress={() => handlePartPress(partie)}
                        activeOpacity={0.95}
                      >
                        <View style={dynamicStyles.partCardContent}>
                          <View style={dynamicStyles.partCardHeader}>
                            <View style={dynamicStyles.partCardTitleContainer}>
                              <View style={dynamicStyles.partCardIcon}>
                                <MaterialCommunityIcons 
                                  name="target" 
                                  size={responsiveStyle.fontSize.lg} 
                                  color="#BB9B4E" 
                  />
                </View>
                              <Text style={dynamicStyles.partCardTitle}>Partie {pidx + 1}</Text>
                              {!hasAccessToPart && isPremiumPart && (
                                <View style={dynamicStyles.premiumBadge}>
                                  <MaterialCommunityIcons name="crown" size={responsiveStyle.fontSize.base} color="#D4AF37" />
                                  <Text style={dynamicStyles.premiumBadgeText}>Premium</Text>
                                </View>
                              )}
                            </View>
                            <MaterialCommunityIcons 
                              name={!hasAccessToPart && isPremiumPart ? "lock" : "chevron-right"} 
                              size={responsiveStyle.fontSize.lg} 
                              color={!hasAccessToPart && isPremiumPart ? "#BB9B4E" : "#174C3C"} 
                            />
                          </View>
                          <Text style={dynamicStyles.partCardSubtitle}>{chaptersData[partie as keyof typeof chaptersData].titre}</Text>
                          <Text style={[
                            dynamicStyles.partCardChapters,
                            !hasAccessToPart && isPremiumPart && dynamicStyles.premiumPartText
                          ]}>
                            {!hasAccessToPart && isPremiumPart 
                              ? "Débloquez cette partie pour accéder aux quiz"
                              : `${partieChapters.length} quiz disponibles`
                            }
                          </Text>
                        </View>
                      </TouchableOpacity>
            </View>
          );
        })}
      </View>
            )}
          </ScrollView>
        </View>
      </PanGestureHandler>
      
      {/* Modal personnalisé pour les quiz verrouillés */}
      <Modal
        visible={showLockModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLockModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
              <View style={dynamicStyles.modalHeader}>
              <Image
                source={require('../../assets/lock-closed.png')}
                style={dynamicStyles.modalLockIcon}
                resizeMode="contain"
              />
              <Text style={dynamicStyles.modalTitle}>Contenu Premium</Text>
              </View>
              
              <Text style={dynamicStyles.modalMessage}>
                Ce quiz fait partie d'une section premium. Débloquez l'accès à cette partie pour continuer.
              </Text>
              
              <View style={dynamicStyles.modalButtons}>
                <TouchableOpacity 
                  style={dynamicStyles.modalButtonSecondary}
                  onPress={() => setShowLockModal(false)}
                >
                  <Text style={dynamicStyles.modalButtonTextSecondary}>Fermer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={dynamicStyles.modalButtonPrimary}
                  onPress={() => {
                    setShowLockModal(false);
                    const partKey = lockedChapter?.partieKey;
                    (navigation as any).navigate('Books', partKey ? { selectedPart: partKey } : undefined);
                  }}
                >
                  <Text style={dynamicStyles.modalButtonTextPrimary}>Acheter</Text>
                </TouchableOpacity>
              </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

// Fonction pour créer les styles responsives
const createStyles = (responsive: any, responsiveStyle: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsive.horizontalPadding,
    paddingTop: responsiveStyle.spacing.sm,
    paddingBottom: responsiveStyle.spacing.base,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: responsiveStyle.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: responsiveStyle.fontSize.lg,
    fontWeight: 'bold',
    color: '#174C3C',
  },
  headerSpacer: {
    width: responsiveStyle.component.iconSize * 2,
  },
  certificateButton: {
    padding: responsiveStyle.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  title: { 
    fontSize: responsiveStyle.fontSize.xl, 
    fontWeight: 'bold', 
    color: colors.primary, 
    marginTop: responsiveStyle.spacing.xl, 
    marginBottom: responsiveStyle.spacing.lg, 
    textAlign: 'center' 
  },
  list: { paddingHorizontal: responsive.horizontalPadding },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: responsiveStyle.component.borderRadius,
    padding: responsiveStyle.spacing.base,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: responsiveStyle.spacing.xs,
    shadowOffset: { width: 0, height: 2 },
    minHeight: responsiveStyle.component.iconSize * 5,
  },
  chapterImageContainer: {
    width: responsiveStyle.component.iconSize * 3,
    height: responsiveStyle.component.iconSize * 3,
    borderRadius: responsiveStyle.component.borderRadius,
    marginRight: responsiveStyle.spacing.base,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterImage: {
    width: '100%', // ✅ Corrigé : était 140%
    height: '100%', // ✅ Corrigé : était 140%
    resizeMode: 'cover',
  },
  chapterInfo: { flex: 1 },
  chapterTitle: { 
    fontSize: responsiveStyle.fontSize.base, 
    fontWeight: 'bold', 
    color: colors.text, 
    marginBottom: responsiveStyle.spacing.xs 
  },
  chapterPart: { 
    fontSize: responsiveStyle.fontSize.sm, 
    color: colors.primary, 
    fontWeight: '600' 
  },
  // Styles pour les chapitres verrouillés
  lockedCard: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  lockedImage: {
    opacity: 0.5,
  },


  chapterWrapper: {
    position: 'relative',
    marginBottom: responsiveStyle.spacing.base,
  },
  lockContainer: {
    position: 'absolute',
    top: responsiveStyle.spacing.base,
    right: responsiveStyle.spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: responsiveStyle.spacing.base,
    paddingVertical: responsiveStyle.spacing.base,
    borderRadius: responsiveStyle.component.borderRadius,
    marginHorizontal: responsive.horizontalPadding,
    marginBottom: responsiveStyle.spacing.base,
    alignSelf: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: responsiveStyle.fontSize.base,
  },
  // Styles pour le modal personnalisé
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive.horizontalPadding,
  },
  modalContent: {
    width: '100%',
    maxWidth: Math.min(responsive.width * 0.9, 400),
    backgroundColor: colors.white,
    borderRadius: responsiveStyle.component.borderRadius,
    padding: responsiveStyle.spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: responsiveStyle.spacing.xs },
    shadowOpacity: 0.15,
    shadowRadius: responsiveStyle.spacing.sm,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveStyle.spacing.base,
    paddingBottom: responsiveStyle.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalLockIcon: {
    width: responsiveStyle.component.iconSize * 2,
    height: responsiveStyle.component.iconSize * 2,
    marginRight: responsiveStyle.spacing.base,
  },
  modalTitle: {
    fontSize: responsiveStyle.fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalMessage: {
    fontSize: responsiveStyle.fontSize.base,
    color: colors.text,
    marginBottom: responsiveStyle.spacing.base,
    lineHeight: responsiveStyle.fontSize.base * 1.5,
  },
  modalScoreContainer: {
    marginTop: responsiveStyle.spacing.base,
    marginBottom: responsiveStyle.spacing.base,
    paddingHorizontal: responsiveStyle.spacing.base,
    paddingVertical: responsiveStyle.spacing.sm,
    backgroundColor: colors.lightGray + '20',
    borderRadius: responsiveStyle.component.borderRadius,
    alignItems: 'center',
  },
  modalScoreLabel: {
    fontSize: responsiveStyle.fontSize.sm,
    color: colors.darkGray,
    marginBottom: responsiveStyle.spacing.xs,
  },
  modalScoreValue: {
    fontSize: responsiveStyle.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: responsiveStyle.spacing.xs,
  },
  modalScoreRequired: {
    fontSize: responsiveStyle.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveStyle.spacing.base,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#BB9B4E',
    paddingVertical: responsiveStyle.spacing.base,
    paddingHorizontal: responsiveStyle.spacing.base,
    borderRadius: responsiveStyle.component.borderRadius,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    color: 'white',
    fontWeight: '600',
    fontSize: responsiveStyle.fontSize.base,
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: responsiveStyle.spacing.base,
    paddingHorizontal: responsiveStyle.spacing.base,
    borderRadius: responsiveStyle.component.borderRadius,
    alignItems: 'center',
  },
  modalButtonTextPrimary: {
    color: colors.white,
    fontWeight: '600',
    fontSize: responsiveStyle.fontSize.base,
  },

  // New styles for the part card
  partCard: {
    backgroundColor: 'white',
    borderRadius: responsiveStyle.component.borderRadius + 2,
    marginBottom: responsiveStyle.spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: responsiveStyle.spacing.sm,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(23, 76, 60, 0.1)',
  },
  partCardContent: {
    padding: responsiveStyle.spacing.base,
  },
  partCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveStyle.spacing.base,
  },
  partCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partCardIcon: {
    width: responsiveStyle.component.iconSize * 2,
    height: responsiveStyle.component.iconSize * 2,
    borderRadius: responsiveStyle.component.iconSize,
    backgroundColor: 'rgba(187, 155, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveStyle.spacing.base,
  },
  partCardTitle: {
    fontSize: responsiveStyle.fontSize.lg,
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.5,
  },
  partCardSubtitle: {
    fontSize: responsiveStyle.fontSize.base + 2,
    color: '#174C3C',
    marginBottom: responsiveStyle.spacing.base,
    fontWeight: '600',
    lineHeight: (responsiveStyle.fontSize.base + 2) * 1.3,
  },
  partCardChapters: {
    fontSize: responsiveStyle.fontSize.base,
    color: '#BB9B4E',
    fontWeight: '600',
    backgroundColor: 'rgba(187, 155, 78, 0.1)',
    paddingHorizontal: responsiveStyle.spacing.base,
    paddingVertical: responsiveStyle.spacing.xs,
    borderRadius: responsiveStyle.component.borderRadius,
    alignSelf: 'flex-start',
  },
   // Styles pour l'en-tête de partie
   partHeader: {
     backgroundColor: '#174C3C',
     paddingVertical: responsiveStyle.spacing.base,
     paddingHorizontal: responsive.horizontalPadding,
     marginBottom: responsiveStyle.spacing.base,
   },
   partTitle: {
     fontSize: responsiveStyle.fontSize.xl + 2,
     fontWeight: 'bold',
     color: '#19514A',
     textAlign: 'center',
   },
   // Styles pour les images des chapitres
   imageContainer: {
     width: responsiveStyle.component.iconSize * 3,
     height: responsiveStyle.component.iconSize * 3,
     borderRadius: responsiveStyle.component.borderRadius,
     marginRight: responsiveStyle.spacing.base,
     overflow: 'hidden',
     backgroundColor: '#f8f9fa',
     justifyContent: 'center',
     alignItems: 'center',
     position: 'relative',
   },
   lockOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0,0,0,0.3)',
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: responsiveStyle.component.borderRadius,
   },
   lockIcon: {
     width: responsiveStyle.fontSize.lg,
     height: responsiveStyle.fontSize.lg,
   },
   lockedText: {
     opacity: 0.6,
   },
   lockedMessage: {
     fontSize: responsiveStyle.fontSize.xs,
     color: '#666',
     fontStyle: 'italic',
   },
   scoreText: {
     fontSize: responsiveStyle.fontSize.xs,
     color: colors.primary,
     fontWeight: '600',
   },
   // Styles pour les cartes de chapitres
   newChapterCard: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#fff',
     borderRadius: responsiveStyle.component.borderRadius,
     padding: responsiveStyle.spacing.base,
     elevation: 2,
     shadowColor: '#000',
     shadowOpacity: 0.08,
     shadowRadius: responsiveStyle.spacing.xs,
     shadowOffset: { width: 0, height: 2 },
     minHeight: responsiveStyle.component.iconSize * 5,
     marginBottom: responsiveStyle.spacing.base,
   },
   newChapterImage: {
     width: '100%',
     height: '100%',
     resizeMode: 'cover',
   },
   newChapterContent: {
     flex: 1,
   },
   newChapterHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 4,
   },
   newChapterTitle: {
     fontSize: responsiveStyle.fontSize.base,
     fontWeight: 'bold',
     color: colors.text,
   },
   newChapterAuthor: {
     fontSize: responsiveStyle.fontSize.sm,
     color: colors.primary,
     fontWeight: '600',
   },
   progressBarContainer: {
     height: responsiveStyle.spacing.xs,
     backgroundColor: '#E0E0E0',
     borderRadius: responsiveStyle.spacing.xs / 2,
     marginTop: responsiveStyle.spacing.xs,
     marginBottom: responsiveStyle.spacing.xs,
   },
   progressBarBg: {
     height: '100%',
     borderRadius: responsiveStyle.spacing.xs / 2,
     backgroundColor: '#E0E0E0',
   },
   progressBarFill: {
     height: '100%',
     borderRadius: responsiveStyle.spacing.xs / 2,
     backgroundColor: '#174C3C',
   },
   // Nouveaux styles pour les cartes de quiz
   quizCard: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'white',
     borderRadius: responsiveStyle.component.borderRadius + 2,
     padding: responsiveStyle.spacing.base,
     marginBottom: responsiveStyle.spacing.base,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 0.12,
     shadowRadius: responsiveStyle.spacing.sm,
     elevation: 6,
     borderWidth: 1,
     borderColor: 'rgba(23, 76, 60, 0.1)',
   },
   quizImageContainer: {
     width: responsiveStyle.component.iconSize * 5, // ✅ Responsive : était 100
     height: responsiveStyle.component.iconSize * 5, // ✅ Responsive : était 100
     borderRadius: responsiveStyle.component.borderRadius,
     marginRight: responsiveStyle.spacing.base,
     overflow: 'hidden',
     backgroundColor: '#f8f9fa',
     justifyContent: 'center',
     alignItems: 'center',
     position: 'relative',
   },
   quizImage: {
     width: '100%',
     height: '100%',
     resizeMode: 'cover',
   },
  quizStatusBadge: {
    position: 'absolute',
    top: responsiveStyle.spacing.xs,
    right: responsiveStyle.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveStyle.spacing.sm,
    paddingVertical: responsiveStyle.spacing.xs,
    borderRadius: responsiveStyle.component.borderRadius,
    backgroundColor: 'rgba(255,255,255,0.9)',
    gap: responsiveStyle.spacing.xs,
  },
  quizStatusUnlocked: {
    borderWidth: 1,
    borderColor: '#174C3C',
  },
  quizStatusPremium: {
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  quizStatusText: {
    fontSize: responsiveStyle.fontSize.xs,
    fontWeight: '700',
  },
  quizStatusTextUnlocked: {
    color: '#174C3C',
  },
  quizStatusTextPremium: {
    color: '#D4AF37',
   },
   quizLockOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0,0,0,0.3)',
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: responsiveStyle.component.borderRadius,
   },
   quizContent: {
     flex: 1,
   },
   quizHeader: {
     marginBottom: responsiveStyle.spacing.sm,
   },
   quizTitle: {
     fontSize: responsiveStyle.fontSize.base + 2,
     fontWeight: 'bold',
     color: '#174C3C',
     marginBottom: responsiveStyle.spacing.xs,
   },
   quizDesc: {
     fontSize: responsiveStyle.fontSize.base,
     color: '#666',
     marginBottom: responsiveStyle.spacing.sm,
     lineHeight: responsiveStyle.fontSize.base * 1.4,
   },
   quizAuthor: {
     fontSize: responsiveStyle.fontSize.base,
     color: '#BB9B4E',
     fontWeight: '600',
   },
   quizProgressContainer: {
     height: responsiveStyle.spacing.xs,
     backgroundColor: '#E0E0E0',
     borderRadius: responsiveStyle.spacing.xs / 2,
     marginBottom: responsiveStyle.spacing.sm,
   },
   quizProgressBg: {
     width: '100%',
     height: '100%',
     borderRadius: 4,
     backgroundColor: '#E0E0E0',
     overflow: 'hidden',
   },
   quizProgressFill: {
     height: '100%',
     borderRadius: 4,
     backgroundColor: '#174C3C',
   },
   quizScoreContainer: {
     backgroundColor: 'rgba(187, 155, 78, 0.1)',
     paddingHorizontal: responsiveStyle.spacing.sm,
     paddingVertical: responsiveStyle.spacing.xs,
     borderRadius: responsiveStyle.component.borderRadius,
     alignSelf: 'flex-start',
   },
   quizScoreText: {
     fontSize: responsiveStyle.fontSize.xs,
     color: '#BB9B4E',
     fontWeight: '600',
   },
   quizLockedContainer: {
     backgroundColor: 'rgba(102, 102, 102, 0.1)',
     paddingHorizontal: responsiveStyle.spacing.sm,
     paddingVertical: responsiveStyle.spacing.xs,
     borderRadius: responsiveStyle.component.borderRadius,
     alignSelf: 'flex-start',
   },
   quizLockedText: {
     fontSize: responsiveStyle.fontSize.xs,
     color: '#666',
     fontStyle: 'italic',
  },
  
  // Styles pour les parties premium
  premiumPartCard: {
    backgroundColor: '#FFF9E6',
    borderColor: '#D4AF37',
    borderWidth: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: responsiveStyle.spacing.sm,
    paddingVertical: responsiveStyle.spacing.xs,
    borderRadius: responsiveStyle.component.borderRadius,
    marginLeft: responsiveStyle.spacing.sm,
  },
  premiumBadgeText: {
    fontSize: responsiveStyle.fontSize.xs,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: responsiveStyle.spacing.xs,
  },
  premiumPartText: {
    color: '#D4AF37',
    fontWeight: '600',
  },
});

// Fonction pour créer les styles responsives du composant SplashFamille
const createSplashStyles = (responsive: any, responsiveStyle: any) => StyleSheet.create({
  splashFamilleBg: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: responsiveStyle.spacing.base,
  },
  topContentBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveStyle.spacing.xl,
    width: '100%',
  },
  splashFamilleLogo: {
    width: Math.min(responsive.width * 0.5, 200), // ✅ Responsive : 50% de largeur, max 200px
    height: Math.min(responsive.width * 0.5, 200), // ✅ Responsive : carré
    resizeMode: 'contain',
    marginBottom: 0,
    marginTop: responsiveStyle.spacing.xl,
    alignSelf: 'center',
  },
  splashFamilleTextContainer: {
    alignItems: 'center',
    paddingHorizontal: responsive.horizontalPadding,
    marginTop: -responsiveStyle.spacing.xl,
    marginBottom: responsiveStyle.spacing.sm,
  },
  splashMainTitle: {
    fontSize: responsiveStyle.fontSize.xxl, // ✅ Responsive : était 32
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: responsiveStyle.spacing.sm,
    textAlign: 'center',
  },
  splashSubtitleGreen: {
    fontSize: responsiveStyle.fontSize.lg, // ✅ Responsive : était 20
    fontWeight: '600',
    color: '#174C3C',
    marginBottom: responsiveStyle.spacing.base,
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: responsiveStyle.fontSize.base, // ✅ Responsive : était 17
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: responsiveStyle.fontSize.base * 1.3,
  },
  splashFamilleImageXL: {
    width: '100%', // ✅ Corrigé : était 110%
    height: responsive.height * 0.4, // ✅ Responsive : 40% de hauteur (était 55%)
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,
    left: 0, // ✅ Corrigé : était -10%
    marginBottom: 0,
    marginTop: 0,
    alignSelf: 'center',
  },
}); 