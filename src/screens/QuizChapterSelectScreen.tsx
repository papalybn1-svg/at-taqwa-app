import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import colors from '../theme/colors';
import {
    getResponsiveBorderRadius,
    getResponsiveFontSize,
    getResponsivePadding,
    getResponsiveSpacing,
    screenDimensions
} from '../utils/responsive';

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
            {/* Carte arrière (la plus profonde) - Vert foncé */}
            <View style={styles.modalBackCard} />
            
            {/* Carte du milieu - Dorée */}
            <View style={styles.modalMiddleCard} />
            
            {/* Carte blanche principale */}
            <View style={styles.modalWhiteCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔒 Quiz Verrouillé</Text>
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
                  📚 Pour débloquer ce quiz, vous devez obtenir au moins 80%.
                </Text>
                
                <Text style={styles.modalAdvice}>
                  💡 Conseil : Relisez le chapitre pour mieux comprendre, puis refaites le quiz !
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
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F7F6' 
  },
  title: { 
    fontSize: getResponsiveFontSize(22), 
    fontWeight: 'bold', 
    color: colors.primary, 
    marginTop: getResponsiveSpacing(30), 
    marginBottom: getResponsiveSpacing(18), 
    textAlign: 'center',
    paddingHorizontal: getResponsivePadding(),
  },
  list: { 
    paddingHorizontal: getResponsivePadding(),
    paddingBottom: getResponsiveSpacing(20),
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: getResponsiveBorderRadius(16),
    padding: getResponsiveSpacing(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    minHeight: screenDimensions.isSmallDevice ? 70 : 80,
    marginBottom: getResponsiveSpacing(12),
  },
  chapterImageContainer: {
    width: screenDimensions.isSmallDevice ? 50 : 60,
    height: screenDimensions.isSmallDevice ? 50 : 60,
    borderRadius: getResponsiveBorderRadius(12),
    marginRight: getResponsiveSpacing(16),
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterImage: {
    width: screenDimensions.isSmallDevice ? '130%' : '140%',
    height: screenDimensions.isSmallDevice ? '130%' : '140%',
    resizeMode: 'cover',
    minWidth: screenDimensions.isSmallDevice ? '130%' : '140%',
    minHeight: screenDimensions.isSmallDevice ? '130%' : '140%',
    transform: [{ scale: screenDimensions.isSmallDevice ? 1.3 : 1.4 }],
  },
  chapterInfo: { 
    flex: 1,
    paddingRight: getResponsiveSpacing(8),
  },
  chapterTitle: { 
    fontSize: getResponsiveFontSize(16), 
    fontWeight: 'bold', 
    color: colors.text, 
    marginBottom: 2,
    lineHeight: getResponsiveFontSize(16) * 1.3,
  },
  chapterPart: { 
    fontSize: getResponsiveFontSize(13), 
    color: colors.primary, 
    fontWeight: '600' 
  },
  // Styles pour SplashFamille
  splashFamilleBg: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: getResponsiveSpacing(20),
  },
  topContentBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSpacing(40),
    width: '100%',
  },
  splashFamilleLogo: {
    width: screenDimensions.isSmallDevice ? 160 : 200,
    height: screenDimensions.isSmallDevice ? 160 : 200,
    resizeMode: 'contain',
    marginBottom: 0,
    marginTop: getResponsiveSpacing(40),
    alignSelf: 'center',
  },
  splashFamilleTextContainer: {
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
    marginTop: screenDimensions.isSmallDevice ? -30 : -40,
    marginBottom: getResponsiveSpacing(8),
  },
  splashMainTitle: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: getResponsiveSpacing(8),
    textAlign: 'center',
  },
  splashSubtitleGreen: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: '600',
    color: '#174C3C',
    marginBottom: getResponsiveSpacing(10),
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: getResponsiveFontSize(17),
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: getResponsiveFontSize(17) * 1.3,
  },
  splashFamilleImageXL: {
    width: screenDimensions.isSmallDevice ? '100%' : '110%',
    height: screenDimensions.isSmallDevice ? '50%' : '55%',
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,
    left: screenDimensions.isSmallDevice ? '0%' : '-10%',
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
    borderRadius: getResponsiveBorderRadius(12),
  },
  lockIcon: {
    width: screenDimensions.isSmallDevice ? 35 : 45,
    height: screenDimensions.isSmallDevice ? 35 : 45,
    tintColor: '#BB9B4E',
  },
  lockedText: {
    color: '#999',
  },
  lockedMessage: {
    fontSize: getResponsiveFontSize(11),
    color: '#999',
    marginTop: getResponsiveSpacing(4),
    fontStyle: 'italic',
  },
  scoreContainer: {
    marginTop: getResponsiveSpacing(4),
    backgroundColor: colors.primary + '15',
    borderRadius: getResponsiveBorderRadius(6),
    paddingHorizontal: getResponsiveSpacing(8),
    paddingVertical: getResponsiveSpacing(3),
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: getResponsiveFontSize(11),
    fontWeight: '600',
    color: colors.primary,
  },
  chapterWrapper: {
    position: 'relative',
    marginBottom: getResponsiveSpacing(16),
  },
  lockContainer: {
    position: 'absolute',
    top: getResponsiveSpacing(10),
    right: getResponsiveSpacing(10),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(10),
    borderRadius: getResponsiveBorderRadius(8),
    marginHorizontal: getResponsivePadding(),
    marginBottom: getResponsiveSpacing(10),
    alignSelf: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: getResponsiveFontSize(14),
  },
  // Styles pour le modal personnalisé
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCardContainer: {
    width: '90%',
    maxWidth: screenDimensions.isTablet ? 500 : 400,
    position: 'relative',
  },
  modalBackCard: {
    backgroundColor: '#0F3A2E',
    borderRadius: getResponsiveBorderRadius(20),
    height: screenDimensions.isSmallDevice ? 240 : 280,
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    borderWidth: 2,
    borderColor: '#0A2D23',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalMiddleCard: {
    backgroundColor: '#BB9B4E',
    borderRadius: getResponsiveBorderRadius(20),
    height: screenDimensions.isSmallDevice ? 248 : 288,
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    borderWidth: 2,
    borderColor: '#A08642',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 7,
  },
  modalWhiteCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveBorderRadius(20),
    padding: getResponsiveSpacing(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(20),
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: getResponsiveSpacing(16),
    textAlign: 'center',
  },
  closeModalButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    marginBottom: getResponsiveSpacing(20),
  },
  modalMessage: {
    fontSize: getResponsiveFontSize(16),
    color: '#333',
    marginBottom: getResponsiveSpacing(16),
    lineHeight: getResponsiveFontSize(16) * 1.4,
  },
  modalRequirement: {
    fontSize: getResponsiveFontSize(15),
    color: colors.primary,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing(12),
    lineHeight: getResponsiveFontSize(15) * 1.3,
  },
  modalAdvice: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    fontStyle: 'italic',
    lineHeight: getResponsiveFontSize(14) * 1.3,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSpacing(12),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#BB9B4E',
    paddingVertical: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(16),
    borderRadius: getResponsiveBorderRadius(8),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: getResponsiveFontSize(14),
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(16),
    borderRadius: getResponsiveBorderRadius(8),
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: getResponsiveFontSize(14),
  },
}); 