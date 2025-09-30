import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import { useAuth } from '../hooks/useAuth';
import colors from '../theme/colors';
import { migrateUnscopedKeyToUser, read as readUserStorage } from '../utils/userStorage';

// Liste centralisée des fichiers d'exercices (clé = numéro de chapitre sous forme de string)
const exercicesFiles: { [key: string]: any[] } = {
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

// SplashFamille copié depuis App.tsx
function SplashFamille() {
  return (
    <View style={styles.splashFamilleBg}>
      {/* Bloc image + texte en haut */}
      <View style={styles.topContentBlock}>
        {/* Logo en haut */}
        <Image 
          source={require('../../assets/Page_acceuil_dome_mosquee.png')} 
          style={styles.splashFamilleLogo}
        />
        {/* Texte principal */}
        <View style={styles.splashFamilleTextContainer}>
          <Text style={styles.splashMainTitle}>Assalamu Alaikum,</Text>
          <Text style={styles.splashSubtitleGreen}>Bienvenue sur AT-Taqwa</Text>
          <Text style={styles.splashDescription}>Votre guide pour la réparation de la Prière</Text>
        </View>
      </View>
      {/* Image de la famille en bas */}
      <Image 
        source={require('../../assets/femme_et_enfant_2.png')} 
        style={styles.splashFamilleImageXL}
      />
    </View>
  );
}

export default function QuizChapterSelectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [quizScores, setQuizScores] = useState<{ [key: string]: number }>({});
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockedChapter, setLockedChapter] = useState<any>(null);
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  // Charger les scores des quiz depuis le stockage local
  useEffect(() => {
    loadQuizScores();
  }, [user?.uid]);

  // Recharger les scores quand l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      loadQuizScores();
    }, [user?.uid])
  );

  const loadQuizScores = async () => {
    try {
      await migrateUnscopedKeyToUser(user?.uid, 'quizScores');
      const scores = await readUserStorage<Record<string, number>>(user?.uid, 'quizScores');
      if (scores) setQuizScores(scores);
    } catch (error) {
      console.error('Erreur lors du chargement des scores:', error);
    }
  };

  // Vérifier si un quiz est débloqué (le premier quiz est toujours débloqué)
  const isQuizUnlocked = (chapterKey: string) => {
    if (chapterKey === '1') return true; // Premier quiz toujours débloqué
    
    // Pour les autres quiz, vérifier si le quiz précédent a été complété avec 80%
    // Mais d'abord, vérifier si le chapitre précédent existe dans notre liste
    const allChapterKeys = allChapters.map(ch => ch.exercicesKey).sort((a, b) => parseInt(a) - parseInt(b));
    const currentIndex = allChapterKeys.indexOf(chapterKey);
    
    if (currentIndex <= 0) return true; // Premier chapitre ou chapitre non trouvé
    
    // Vérifier si le chapitre précédent dans la liste a été complété avec 80%
    const previousChapterKey = allChapterKeys[currentIndex - 1];
    const previousScore = quizScores[previousChapterKey];
    return previousScore !== undefined && previousScore >= 80;
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
  const handlePartPress = (partie: string) => {
    setSelectedPart(partie);
  };

  // Gérer le clic sur un chapitre
  const handleChapterPress = (chapter: any) => {
    if (!isQuizUnlocked(chapter.exercicesKey)) {
      // Trouver le quiz précédent pour afficher son score actuel
      const allChapterKeys = allChapters.map(ch => ch.exercicesKey).sort((a, b) => parseInt(a) - parseInt(b));
      const currentIndex = allChapterKeys.indexOf(chapter.exercicesKey);
      const previousChapterKey = allChapterKeys[currentIndex - 1];
      const score = quizScores[previousChapterKey];
      
      setLockedChapter(chapter);
      setPreviousScore(score);
      setShowLockModal(true);
      return;
    }
    
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

  // Génère la liste plate de tous les chapitres, sans doublon, avec association fiable
  const seen: { [key: string]: boolean } = {};
  console.log("📚 exercicesFiles disponibles:", Object.keys(exercicesFiles));
  const allChapters = Object.entries(chaptersData).flatMap(([partieKey, partie], partieIndex) =>
    partie.chapitres.map((ch, chapitreIndex) => {
      // On tente d'associer le chapitre à son fichier d'exercices par numéro
      const num = (ch as any).numero || ch.image || `${chapitreIndex + 1}`;
      console.log("🔍 Chapitre détecté:", ch.image, "numKey:", numKey, "exercices:", exercices ? "✅" : "❌");
      const numKey = String(parseInt(num, 10)); // '01' -> '1', '10' -> '10'
      const exercices = exercicesFiles[numKey];
      if (Array.isArray(exercices) && exercices.length > 0 && !seen[numKey]) {
        seen[numKey] = true;
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

  // Obtenir les chapitres d'une partie spécifique
  const getChaptersInPartie = (partieKey: string) => {
    return allChapters.filter(ch => ch.partieKey === partieKey);
  };

  // Gestion du bouton retour Android pour aller à l'accueil
  useFocusEffect(
    useCallback(() => {
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
    }, [navigation, selectedPart])
  );

  // Intercepter le retour (swipe ou bouton) pour forcer l'accueil
  useEffect(() => {
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
  }, [navigation, selectedPart]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler enabled={Platform.OS === 'ios'} onHandlerStateChange={onGestureEvent}>
        <View style={styles.container}>
          {/* Header avec bouton retour */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => selectedPart ? setSelectedPart(null) : navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#174C3C" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Quiz
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={{paddingBottom: 40}}
            showsVerticalScrollIndicator={false}
          >
            {selectedPart ? (
              // Affichage des quiz d'une partie sélectionnée
              <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                {/* Titre de la partie */}
                <Text style={styles.partTitle}>{chaptersData[selectedPart as keyof typeof chaptersData].titre}</Text>
                
                {/* Liste des quiz de la partie */}
                <View style={{ marginTop: 20 }}>
                  {getChaptersInPartie(selectedPart).map((ch, idx) => {
                    const isUnlocked = isQuizUnlocked(ch.exercicesKey);
                    const score = quizScores[ch.exercicesKey];
          return (
              <TouchableOpacity
                        key={idx} 
                style={[
                          styles.quizCard,
                          { 
                            opacity: isUnlocked ? 1 : 0.6,
                            shadowColor: isUnlocked ? '#D4AF37' : '#000',
                            shadowOpacity: isUnlocked ? 0.15 : 0.08,
                          }
                ]}
                        onPress={() => handleChapterPress(ch)}
                        activeOpacity={0.95}
              >
                        {/* Image avec overlay de progression */}
                        <View style={styles.quizImageContainer}>
                  <Image
                            source={imageMap[ch.image] || require('../../assets/1.png')} 
                            style={styles.quizImage} 
                          />
                          {!isUnlocked && (
                            <View style={styles.quizLockOverlay}>
                              <MaterialCommunityIcons name="lock" size={24} color="#BB9B4E" />
                            </View>
                          )}
                </View>
                        
                        {/* Contenu du quiz */}
                        <View style={styles.quizContent}>
                          <View style={styles.quizHeader}>
                            <Text style={[
                              styles.quizTitle,
                              !isUnlocked && styles.lockedText
                            ]}>
                              {ch.title && ch.title.trim() !== '' ? `Quiz du ${ch.title.replace('.', '')}:` : `Quiz du chapitre ${ch.exercicesKey}:`}
                            </Text>
                  <Text style={[
                              styles.quizDesc,
                    !isUnlocked && styles.lockedText
                  ]}>
                              {ch.desc}
                  </Text>
                  <Text style={[
                              styles.quizAuthor,
                    !isUnlocked && styles.lockedText
                  ]}>
                              {ch.author}
                  </Text>
                          </View>

                          {/* Barre de progression moderne */}
                          <View style={styles.quizProgressContainer}>
                            <View style={styles.quizProgressBg}>
                              <View 
                                style={[
                                  styles.quizProgressFill,
                                  { 
                                    width: `${isUnlocked && score !== undefined ? score : 0}%`,
                                    backgroundColor: isUnlocked && score !== undefined && score >= 80 ? '#D4AF37' : '#174C3C'
                                  }
                                ]} 
                              />
                            </View>
                          </View>

                          {/* Score ou message verrouillé */}
                          {isUnlocked && score !== undefined ? (
                            <View style={styles.quizScoreContainer}>
                              <Text style={styles.quizScoreText}>Score: {score}%</Text>
                            </View>
                          ) : !isUnlocked ? (
                            <View style={styles.quizLockedContainer}>
                              <Text style={styles.quizLockedText}>Quiz verrouillé</Text>
                            </View>
                          ) : null}
                    </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              // Affichage des parties
              <View style={{ paddingHorizontal: 20 }}>
                <Text style={styles.title}>Choisissez une partie pour le quiz</Text>
                {Object.keys(chaptersData).map((partie, pidx) => {
                  const partieChapters = getChaptersInPartie(partie);
                  const unlockedChapters = partieChapters.filter(ch => isQuizUnlocked(ch.exercicesKey));
                  
                  return (
                    <View key={pidx} style={{ marginBottom: 16 }}>
                      {/* Carte de partie */}
                      <TouchableOpacity 
                        style={styles.partCard}
                        onPress={() => handlePartPress(partie)}
                        activeOpacity={0.95}
                      >
                        <View style={styles.partCardContent}>
                          <View style={styles.partCardHeader}>
                            <View style={styles.partCardTitleContainer}>
                              <View style={styles.partCardIcon}>
                                <MaterialCommunityIcons 
                                  name="target" 
                                  size={24} 
                                  color="#BB9B4E" 
                  />
                </View>
                              <Text style={styles.partCardTitle}>Partie {pidx + 1}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#174C3C" />
                          </View>
                          <Text style={styles.partCardSubtitle}>{chaptersData[partie as keyof typeof chaptersData].titre}</Text>
                          <Text style={styles.partCardChapters}>
                            {unlockedChapters.length}/{partieChapters.length} quiz disponibles
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
              <Image
                source={require('../../assets/lock-closed.png')}
                style={styles.modalLockIcon}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>Quiz verrouillé</Text>
              </View>
              
                <Text style={styles.modalMessage}>
              Pour débloquer ce quiz, vous devez obtenir au moins 80% au quiz précédent.
                </Text>
                
            {previousScore !== undefined && (
              <View style={styles.modalScoreContainer}>
                <Text style={styles.modalScoreLabel}>Votre score actuel :</Text>
                <Text style={styles.modalScoreValue}>{previousScore}%</Text>
                <Text style={styles.modalScoreRequired}>
                  Score requis : 80%
                </Text>
              </View>
            )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                style={styles.modalButtonSecondary}
                  onPress={() => setShowLockModal(false)}
                >
                <Text style={styles.modalButtonTextSecondary}>Fermer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                style={styles.modalButtonPrimary}
                  onPress={goToPreviousChapter}
                >
                <Text style={styles.modalButtonTextPrimary}>Revoir le chapitre</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174C3C',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginTop: 30, marginBottom: 18, textAlign: 'center' },
  list: { paddingHorizontal: 18 },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    minHeight: 80,
  },
  chapterImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterImage: {
    width: '140%',
    height: '140%',
    resizeMode: 'cover',
    minWidth: '140%',
    minHeight: '140%',
    transform: [{ scale: 1.4 }],
  },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  chapterPart: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  // Styles pour SplashFamille
  splashFamilleBg: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  topContentBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',
  },
  splashFamilleLogo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 0,
    marginTop: 40,
    alignSelf: 'center',
  },
  splashFamilleTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 8,
  },
  splashMainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 8,
    textAlign: 'center',
  },
  splashSubtitleGreen: {
    fontSize: 20,
    fontWeight: '600',
    color: '#174C3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: 17,
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 22,
  },
  splashFamilleImageXL: {
    width: '110%',
    height: '55%',
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,
    left: '-10%',
    marginBottom: 0,
    marginTop: 0,
    alignSelf: 'center',
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
    marginBottom: 16,
  },
  lockContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 18,
    marginBottom: 10,
    alignSelf: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Styles pour le modal personnalisé
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalLockIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 24,
  },
  modalScoreContainer: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.lightGray + '20',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalScoreLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 4,
  },
  modalScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  modalScoreRequired: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#BB9B4E',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonTextPrimary: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },

  // New styles for the part card
  partCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(23, 76, 60, 0.1)',
  },
  partCardContent: {
    padding: 20,
  },
  partCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(187, 155, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.5,
  },
  partCardSubtitle: {
    fontSize: 18,
    color: '#174C3C',
    marginBottom: 12,
    fontWeight: '600',
    lineHeight: 24,
  },
  partCardChapters: {
    fontSize: 15,
    color: '#BB9B4E',
    fontWeight: '600',
    backgroundColor: 'rgba(187, 155, 78, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
   // Styles pour l'en-tête de partie
   partHeader: {
     backgroundColor: '#174C3C',
     paddingVertical: 20,
     paddingHorizontal: 20,
     marginBottom: 20,
   },
   partTitle: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#19514A',
     textAlign: 'center',
   },
   // Styles pour les images des chapitres
   imageContainer: {
     width: 60,
     height: 60,
     borderRadius: 12,
     marginRight: 16,
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
     borderRadius: 12,
   },
   lockIcon: {
     width: 24,
     height: 24,
   },
   lockedText: {
     opacity: 0.6,
   },
   lockedMessage: {
     fontSize: 12,
     color: '#666',
     fontStyle: 'italic',
   },
   scoreText: {
     fontSize: 12,
     color: colors.primary,
     fontWeight: '600',
   },
   // Styles pour les cartes de chapitres
   newChapterCard: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#fff',
     borderRadius: 16,
     padding: 12,
     elevation: 2,
     shadowColor: '#000',
     shadowOpacity: 0.08,
     shadowRadius: 4,
     shadowOffset: { width: 0, height: 2 },
     minHeight: 80,
     marginBottom: 16,
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
     fontSize: 16,
     fontWeight: 'bold',
     color: colors.text,
   },
   newChapterAuthor: {
     fontSize: 13,
     color: colors.primary,
     fontWeight: '600',
   },
   progressBarContainer: {
     height: 8,
     backgroundColor: '#E0E0E0',
     borderRadius: 4,
     marginTop: 4,
     marginBottom: 4,
   },
   progressBarBg: {
     height: '100%',
     borderRadius: 4,
     backgroundColor: '#E0E0E0',
   },
   progressBarFill: {
     height: '100%',
     borderRadius: 4,
     backgroundColor: '#174C3C',
   },
   // Nouveaux styles pour les cartes de quiz
   quizCard: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'white',
     borderRadius: 18,
     padding: 16,
     marginBottom: 16,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 0.12,
     shadowRadius: 8,
     elevation: 6,
     borderWidth: 1,
     borderColor: 'rgba(23, 76, 60, 0.1)',
   },
   quizImageContainer: {
     width: 100,
     height: 100,
     borderRadius: 16,
     marginRight: 16,
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
   quizLockOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0,0,0,0.3)',
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 16,
   },
   quizContent: {
     flex: 1,
   },
   quizHeader: {
     marginBottom: 8,
   },
   quizTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#174C3C',
     marginBottom: 4,
   },
   quizDesc: {
     fontSize: 14,
     color: '#666',
     marginBottom: 8,
     lineHeight: 20,
   },
   quizAuthor: {
     fontSize: 14,
     color: '#BB9B4E',
     fontWeight: '600',
   },
   quizProgressContainer: {
     height: 8,
     backgroundColor: '#E0E0E0',
     borderRadius: 4,
     marginBottom: 8,
   },
   quizProgressBg: {
     height: '100%',
     borderRadius: 4,
     backgroundColor: '#E0E0E0',
   },
   quizProgressFill: {
     height: '100%',
     borderRadius: 4,
     backgroundColor: '#174C3C',
   },
   quizScoreContainer: {
     backgroundColor: 'rgba(187, 155, 78, 0.1)',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 8,
     alignSelf: 'flex-start',
   },
   quizScoreText: {
     fontSize: 12,
     color: '#BB9B4E',
     fontWeight: '600',
   },
   quizLockedContainer: {
     backgroundColor: 'rgba(102, 102, 102, 0.1)',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 8,
     alignSelf: 'flex-start',
   },
   quizLockedText: {
     fontSize: 12,
     color: '#666',
     fontStyle: 'italic',
  },
}); 