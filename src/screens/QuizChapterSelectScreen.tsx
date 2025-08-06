import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import colors from '../theme/colors';

// Liste centralisée des fichiers d'exercices (clé = numéro de chapitre sous forme de string)
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
  const [quizScores, setQuizScores] = useState<{ [key: string]: number }>({});
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockedChapter, setLockedChapter] = useState<any>(null);
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined);

  // Charger les scores des quiz depuis le stockage local
  useEffect(() => {
    loadQuizScores();
  }, []);

  // Recharger les scores quand l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      loadQuizScores();
    }, [])
  );

  const loadQuizScores = async () => {
    try {
      const scores = await AsyncStorage.getItem('quizScores');
      if (scores) {
        setQuizScores(JSON.parse(scores));
      }
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
        navigation.goBack();
      }
    }
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
  const allChapters = Object.entries(chaptersData).flatMap(([partieKey, partie], partieIndex) =>
    partie.chapitres.map((ch, chapitreIndex) => {
      // On tente d'associer le chapitre à son fichier d'exercices par numéro
      const num = (ch as any).numero || ch.image || `${chapitreIndex + 1}`;
      const numKey = String(parseInt(num, 10)); // '01' -> '1', '10' -> '10'
      const exercices = exercicesFiles[numKey];
      if (Array.isArray(exercices) && exercices.length > 0 && !seen[numKey]) {
        seen[numKey] = true;
        return {
          ...ch,
          id: `${partieIndex}-${chapitreIndex}`,
          partie: partie.titre,
          image: ch.image || '',
          exercicesKey: numKey,
        };
      }
      return null;
    })
  ).filter((chapter): chapter is { id: string; partie: string; exercicesKey: string; image: string; title: string; desc: string; author: string } => !!chapter);

  // Gestion du bouton retour Android pour aller à l'accueil
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('HomeMain' as never);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  // Intercepter le retour (swipe ou bouton) pour forcer l'accueil
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        e.preventDefault();
        navigation.navigate('HomeMain' as never);
      }
    });
    return unsubscribe;
  }, [navigation]);



  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onHandlerStateChange={onGestureEvent}>
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      <Text style={styles.title}>Choisissez un chapitre pour le quiz</Text>
      <View style={styles.list}>
                {allChapters.map((chapter, idx) => {
          const isUnlocked = isQuizUnlocked(chapter.exercicesKey);
          const score = quizScores[chapter.exercicesKey];
          
          return (
            <View key={chapter.id} style={styles.chapterWrapper}>
              <TouchableOpacity
                style={[
                  styles.chapterCard,
                  !isUnlocked && styles.lockedCard
                ]}
                onPress={() => handleChapterPress(chapter)}
                activeOpacity={isUnlocked ? 0.85 : 1}
              >
                <View style={styles.chapterImageContainer}>
                  <Image
                    source={imageMap[chapter.image] || imageMap['1']}
                    style={[
                      styles.chapterImage,
                      !isUnlocked && styles.lockedImage
                    ]}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.chapterInfo}>
                  <Text style={[
                    styles.chapterTitle,
                    !isUnlocked && styles.lockedText
                  ]}>
                    {chapter.title && chapter.title.trim() !== '' ? `Quiz du ${chapter.title}` : `Quiz du chapitre ${chapter.exercicesKey}`}
                  </Text>
                  <Text style={[
                    styles.chapterPart,
                    !isUnlocked && styles.lockedText
                  ]}>
                    {chapter.partie || 'Partie inconnue'}
                  </Text>
                  {isUnlocked && score !== undefined && (
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>Score: {score}%</Text>
                    </View>
                  )}
                  {!isUnlocked && (
                    <Text style={styles.lockedMessage}>Quiz verrouillé</Text>
                  )}
                </View>
              </TouchableOpacity>
              {!isUnlocked && (
                <View style={styles.lockContainer}>
                  <Image
                    source={require('../../assets/lock-closed.png')}
                    style={styles.lockIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
      
      {/* Modal personnalisé pour les quiz verrouillés */}
      <Modal
        visible={showLockModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Quiz Verrouillé</Text>
                <TouchableOpacity 
                  style={styles.closeModalButton}
                  onPress={() => setShowLockModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalMessage}>
                  {previousScore !== undefined 
                    ? `Vous avez obtenu ${previousScore}% au quiz précédent.`
                    : 'Vous n\'avez pas encore fait le quiz précédent.'
                  }
                </Text>
                
                <Text style={styles.modalRequirement}>
                  Pour débloquer ce quiz, vous devez obtenir au moins 80%.
                </Text>
                
                <Text style={styles.modalAdvice}>
                  Conseil : Relisez le chapitre pour mieux comprendre, puis refaites le quiz !
                </Text>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowLockModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={goToPreviousChapter}
                >
                  <Text style={styles.actionButtonText}>Lire le chapitre précédent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
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
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  lockIcon: {
    width: 45,
    height: 45,
    tintColor: '#BB9B4E',
  },
  lockedText: {
    color: '#999',
  },
  lockedMessage: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  scoreContainer: {
    marginTop: 4,
    backgroundColor: colors.primary + '15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
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
  modalCardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.darkGray,
    fontWeight: 'bold',
  },
  modalContent: {
    marginBottom: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 24,
  },
  modalRequirement: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 22,
  },
  modalAdvice: {
    fontSize: 14,
    color: colors.darkGray,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#BB9B4E',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
}); 