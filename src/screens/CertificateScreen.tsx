import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import chaptersData from '../../data/chapitres.json';
import { useAuthContext } from '../contexts/AuthContext';
import colors from '../theme/colors';
import { getQuizProfile } from '../utils/quizSession';
import { read as readUserStorage } from '../utils/userStorage';


// Dimensions A4 portrait (210mm x 297mm)
// Ratio : 297/210 = 1.414 (hauteur/largeur)
// Pour une qualité maximale d'impression (500 DPI), on utilise 4134px de largeur
// 210mm à 500 DPI = 4134px, 297mm à 500 DPI = 5846px
// Qualité exceptionnelle pour une netteté parfaite, optimisée pour éviter les problèmes de mémoire
const A4_PORTRAIT_WIDTH = 4134;
const A4_PORTRAIT_HEIGHT = 5846; // 4134 * 1.414

// Composant réutilisable pour le contenu de l'attestation
const CertificateContent = ({ 
  userName, 
  averageScore, 
  dateStr, 
  isForCapture = false,
  fontScale = 1,
  screenWidth = 375
}: { 
  userName: string; 
  averageScore: number; 
  dateStr: string; 
  isForCapture?: boolean;
  fontScale?: number;
  screenWidth?: number;
}) => {
  const contentStyles = isForCapture ? styles.certificateContentForCapture : styles.certificateContentDisplay;
  const watermarkSize = isForCapture ? 400 : 300;
  
  // Tailles de base pour l'affichage
  // Pour la capture très haute résolution (4134px), multiplier par 4.13
  // Pour l'affichage normal, utiliser les tailles de base ajustées par fontScale
  const baseTitleSize = isForCapture ? 83 : 16;
  const baseTextSize = isForCapture ? 66 : 13;
  const baseUserNameSize = isForCapture ? 91 : 18;
  const baseBookTitleSize = isForCapture ? 78 : 15;
  const baseScoreSize = isForCapture ? 132 : 26;
  const baseDateSize = isForCapture ? 58 : 12;
  const baseLogoSize = isForCapture ? 290 : 55;
  const baseTrophySize = isForCapture ? 165 : 32;
  
  // Appliquer le scale uniquement pour l'affichage (pas pour la capture)
  // Pour le titre, utiliser un minimum plus bas pour les petits écrans
  const titleSize = isForCapture ? baseTitleSize : Math.max(12, baseTitleSize * fontScale);
  const textSize = isForCapture ? baseTextSize : Math.max(11, baseTextSize * fontScale);
  const userNameSize = isForCapture ? baseUserNameSize : Math.max(16, baseUserNameSize * fontScale);
  const bookTitleSize = isForCapture ? baseBookTitleSize : Math.max(13, baseBookTitleSize * fontScale);
  const scoreSize = isForCapture ? baseScoreSize : Math.max(22, baseScoreSize * fontScale);
  const dateSize = isForCapture ? baseDateSize : Math.max(10, baseDateSize * fontScale);
  const logoSize = isForCapture ? baseLogoSize : Math.max(45, baseLogoSize * fontScale);
  const trophySize = isForCapture ? baseTrophySize : Math.max(26, baseTrophySize * fontScale);
  
  // Espacements uniformes - tous les espacements entre éléments sont similaires
  // Base d'espacement : 6px pour petits écrans, 8px pour écrans normaux
  const baseSpacing = isForCapture ? 10 : Math.max(5, 6 * fontScale);
  const mediumSpacing = isForCapture ? 12 : Math.max(6, 8 * fontScale);
  
  const headerPaddingTop = isForCapture ? 15 : Math.max(6, 10 * fontScale);
  const logoMarginBottom = baseSpacing;
  const titleMarginBottom = baseSpacing;
  const decorativeLineWidth = isForCapture ? 180 : Math.max(100, 130 * fontScale);
  const decorativeLineHeight = isForCapture ? 2.5 : Math.max(1.5, 2 * fontScale);
  const bodyPaddingVertical = isForCapture ? 15 : Math.max(4, 6 * fontScale);
  // Pour les écrans moyens (360-400px), augmenter encore plus l'espacement du trophée
  const trophyMarginTop = isForCapture ? 8 : (
    screenWidth >= 360 && screenWidth < 400 
      ? Math.max(12, 14 * fontScale) // Encore plus d'espace pour écrans moyens
      : mediumSpacing
  );
  const trophyMarginBottom = baseSpacing;
  const textMarginBottom = baseSpacing;
  // Espacement très réduit pour le texte final "démontrant..." pour le faire remonter
  const finalTextMarginTop = isForCapture ? 8 : -Math.max(2, 3 * fontScale); // MarginTop négatif pour remonter le texte
  const textLineHeight = isForCapture ? 24 : Math.max(16, 20 * fontScale);
  const userNameMarginVertical = baseSpacing;
  const bookTitleMarginVertical = baseSpacing;
  const scoreMarginVertical = baseSpacing;
  const footerPaddingTop = mediumSpacing;
  const footerPaddingBottom = isForCapture ? 20 : Math.max(10, 16 * fontScale);
  const footerPaddingHorizontal = isForCapture ? 20 : Math.max(12, 15 * fontScale);
  const borderHeight = isForCapture ? 4 : Math.max(2, 3 * fontScale);
  
  return (
    <View style={contentStyles}>
      {/* Filigrane avec le logo en arrière-plan */}
      <View style={styles.watermarkContainer} pointerEvents="none">
        <Image 
          source={require('../../assets/logo_fond_transparent.png')} 
          style={[styles.watermark, { width: isForCapture ? 1650 : 300, height: isForCapture ? 1650 : 300 }]}
          resizeMode="contain"
        />
      </View>

      {/* Bordure décorative en haut (derrière le contenu) */}
      <View style={[styles.decorativeBorderTop, { height: borderHeight }]} />

      {/* En-tête avec logo et titre */}
      <View style={[styles.certificateHeader, { paddingTop: headerPaddingTop }]}>
        <View style={[styles.logoContainer, { width: logoSize, height: logoSize, marginBottom: logoMarginBottom }]}>
          <Image 
            source={require('../../assets/LOGO_AT_TAQWA.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text 
          allowFontScaling={false} 
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
          style={[styles.certificateTitle, { fontSize: titleSize, marginBottom: titleMarginBottom }]}
        >
          ATTESTATION DE RÉUSSITE
        </Text>
        <View style={[styles.decorativeLine, { width: decorativeLineWidth, height: decorativeLineHeight }]} />
      </View>

      {/* Corps principal de l'attestation */}
      <View style={[styles.certificateBody, { paddingVertical: bodyPaddingVertical }]}>
        {/* Trophée avant "Nous certifions que" */}
        <View style={[styles.trophyContainer, { 
          marginTop: trophyMarginTop,
          marginBottom: trophyMarginBottom 
        }]}>
          <MaterialCommunityIcons name="trophy" size={trophySize} color={colors.secondary} />
        </View>
        
        <Text 
          allowFontScaling={false} 
          numberOfLines={1}
          adjustsFontSizeToFit={false}
          style={[styles.certificateText, { fontSize: textSize, marginBottom: textMarginBottom, lineHeight: textLineHeight }]}
        >
          Nous certifions que
        </Text>
        
        <Text 
          allowFontScaling={false} 
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
          style={[styles.userName, { fontSize: userNameSize, marginVertical: userNameMarginVertical }]}
        >
          {userName}
        </Text>
        
        <Text 
          allowFontScaling={false} 
          numberOfLines={2}
          adjustsFontSizeToFit={false}
          style={[styles.certificateText, { fontSize: textSize, marginBottom: textMarginBottom, lineHeight: textLineHeight }]}
        >
          a complété avec succès tous les exercices du livre
        </Text>
        
        <Text 
          allowFontScaling={false} 
          numberOfLines={2}
          adjustsFontSizeToFit={false}
          style={[styles.bookTitle, { fontSize: bookTitleSize, marginVertical: bookTitleMarginVertical }]}
        >
          "Les réparations de la prière en islam"
        </Text>
        
        <Text 
          allowFontScaling={false} 
          numberOfLines={1}
          adjustsFontSizeToFit={false}
          style={[styles.certificateText, { fontSize: textSize, marginBottom: textMarginBottom, lineHeight: textLineHeight }]}
        >
          avec une moyenne de
        </Text>
        
        <Text 
          allowFontScaling={false} 
          numberOfLines={1}
          adjustsFontSizeToFit={false}
          style={[styles.score, { fontSize: scoreSize, marginVertical: scoreMarginVertical }]}
        >
          {averageScore}%
        </Text>
        
        <Text 
          allowFontScaling={false} 
          numberOfLines={2}
          adjustsFontSizeToFit={false}
          style={[styles.certificateText, { fontSize: textSize, marginTop: finalTextMarginTop, lineHeight: textLineHeight }]}
        >
          démontrant une compréhension approfondie des concepts enseignés.
        </Text>
      </View>

      {/* Footer avec date et signature */}
      <View style={[styles.certificateFooter, { paddingTop: footerPaddingTop, paddingBottom: footerPaddingBottom }]}>
        {/* Date et signature en bas */}
        <View style={[styles.footerBottom, { paddingHorizontal: footerPaddingHorizontal }]}>
          <Text 
            allowFontScaling={false} 
            numberOfLines={1}
            adjustsFontSizeToFit={false}
            style={[styles.dateValue, { fontSize: dateSize }]}
          >
            {dateStr}
          </Text>
          <View style={styles.signatureContainer}>
            <Text 
              allowFontScaling={false} 
              numberOfLines={1}
              adjustsFontSizeToFit={false}
              style={[styles.signatureLabel, { fontSize: dateSize }]}
            >
              Aly Anta Sow
            </Text>
          </View>
        </View>
      </View>

      {/* Bordure décorative en bas */}
      <View style={[styles.decorativeBorderBottom, { height: borderHeight }]} />
    </View>
  );
};

// Liste des fichiers d'exercices pour vérifier le nombre total de quiz
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

export default function CertificateScreen() {
  const navigation = useNavigation();
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();
  const [isEligible, setIsEligible] = useState(false);
  const [completionDate, setCompletionDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const certificateRef = useRef<ViewShot>(null);
  
  // Obtenir les dimensions réelles de l'écran
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculer la largeur du certificat en fonction de l'écran
  // Pour les très petits écrans (<= 320px): utiliser largeur - 20px avec padding très réduit
  // Pour les petits écrans (320-360px): utiliser largeur - 30px avec padding réduit
  // Pour les écrans moyens (360-400px): utiliser largeur - 50px pour plus d'espace
  // Pour les grands écrans (> 400px): utiliser max 400px
  let certificateWidth: number;
  let certificatePadding: number;
  
  if (screenWidth <= 320) {
    // Très petit écran (iPhone SE) - utiliser presque toute la largeur
    certificateWidth = screenWidth - 20; // Seulement 10px de marge de chaque côté
    certificatePadding = 12; // Padding très réduit
  } else if (screenWidth < 360) {
    // Petit écran
    certificateWidth = screenWidth - 30;
    certificatePadding = 16;
  } else if (screenWidth < 400) {
    // Écran moyen - réduire un peu plus pour que ça tienne mieux
    certificateWidth = screenWidth - 50; // Plus de marge pour les écrans moyens
    certificatePadding = 20; // Padding réduit pour écrans moyens
  } else {
    // Grand écran
    certificateWidth = Math.min(screenWidth - 40, 400);
    certificatePadding = 34;
  }
  
  // Scale pour ajuster les tailles de police (basé sur largeur 375px comme référence)
  // Pour les très petits écrans, utiliser un scale plus agressif pour que tout tienne
  let fontScale: number;
  if (screenWidth <= 320) {
    fontScale = 0.80; // Scale plus agressif pour les très petits écrans
  } else if (screenWidth < 360) {
    fontScale = 0.90; // Scale modéré pour petits écrans
  } else if (screenWidth < 375) {
    fontScale = 0.95; // Scale légèrement réduit pour écrans moyens proches de 375px
  } else if (screenWidth < 400) {
    fontScale = 0.98; // Scale presque à 1 pour écrans moyens
  } else {
    fontScale = 1;
  }

  useEffect(() => {
    checkEligibility();
  }, [user?.uid]);

  // Recharger l'éligibilité quand l'écran devient actif (après avoir complété un quiz)
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        console.log('🔄 CertificateScreen: rechargement de l\'éligibilité...');
        checkEligibility();
      }
    }, [user?.uid])
  );

  const checkEligibility = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer tous les scores des quiz
      const scores = (await readUserStorage<Record<string, number>>(user.uid, 'quizScores')) || {};
      const profile = await getQuizProfile(user.uid);
      const bestScores = profile.bestScores || {};

      // Obtenir tous les chapitres avec quiz
      const allChapters = Object.entries(chaptersData).flatMap(([partieKey, partie]) =>
        partie.chapitres.map((ch) => {
          const num = ch.image;
          const numKey = String(parseInt(num, 10));
          const exercices = exercicesFiles[numKey];
          const hasQuiz = Array.isArray(exercices) && exercices.length > 0 || 
                         (exercices && typeof exercices === 'object' && 'quiz' in exercices && 
                          Array.isArray((exercices as any).quiz) && (exercices as any).quiz.length > 0);
          return hasQuiz ? numKey : null;
        })
      ).filter((key): key is string => key !== null);

      // Vérifier que la moyenne de tous les quiz est >= 80%
      let completedCount = 0;
      let totalScore = 0;
      let latestCompletionDate: Date | null = null;

      console.log('📊 Vérification éligibilité attestation:');
      console.log('  - Nombre total de quiz:', allChapters.length);
      console.log('  - Scores depuis quizScores:', scores);
      console.log('  - Meilleurs scores depuis profil:', bestScores);

      for (const chapterKey of allChapters) {
        const score =
          (scores as Record<string, number>)[chapterKey] ??
          (bestScores as Record<string, number>)[chapterKey];
        if (score !== undefined) {
          completedCount++;
          totalScore += score;
          console.log(`  - Quiz ${chapterKey}: ${score}%`);
          // Pour la date de complétion, on utilise la date actuelle
          if (!latestCompletionDate) {
            latestCompletionDate = new Date();
          }
        } else {
          console.log(`  - Quiz ${chapterKey}: non complété`);
        }
      }

      // Calculer la moyenne
      const averageScoreValue = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
      console.log(`  - Quiz complétés: ${completedCount}/${allChapters.length}`);
      console.log(`  - Moyenne calculée: ${averageScoreValue}%`);
      
      // Éligible si la moyenne est >= 80% ET tous les quiz sont complétés
      const isEligible = averageScoreValue >= 80 && completedCount === allChapters.length;
      console.log(`  - Éligible: ${isEligible} (moyenne >= 80%: ${averageScoreValue >= 80}, tous complétés: ${completedCount === allChapters.length})`);
      
      if (isEligible) {
        setIsEligible(true);
        setCompletionDate(latestCompletionDate || new Date());
        setAverageScore(averageScoreValue);
      } else {
        setIsEligible(false);
      }
    } catch (error) {
      console.error('Erreur vérification éligibilité:', error);
      setIsEligible(false);
    } finally {
      setLoading(false);
    }
  };

  const captureAndShare = async () => {
    if (!certificateRef.current) {
      Alert.alert('Erreur', 'Impossible de capturer l\'attestation.');
      return;
    }

    try {
      setIsCapturing(true);
      
      // Attendre suffisamment pour s'assurer que la vue est complètement rendue
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📸 Début de la capture...');
      
      // Capturer la vue visible exactement comme elle apparaît
      let uri: string;
      try {
        uri = await captureRef(certificateRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        } as any);
      } catch (captureError) {
        console.error('❌ Erreur lors de la capture:', captureError);
        throw new Error(`Erreur de capture: ${captureError instanceof Error ? captureError.message : 'Erreur inconnue'}`);
      }
      
      console.log('✅ Image capturée:', uri);

      if (!uri) {
        throw new Error('La capture a retourné une URI vide');
      }

      // Préparer l'URI selon la plateforme
      let fileUri = uri;
      if (Platform.OS === 'android') {
        // Android nécessite le préfixe file://
        if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
          fileUri = `file://${uri}`;
        }
      }
      
      console.log('📤 Partage de l\'image:', fileUri);

      // Partager l'image avec les options appropriées
      const shareOptions: any = {
        url: fileUri,
        type: 'image/png',
      };

      // Ajouter le titre seulement si supporté
      if (Platform.OS === 'android') {
        shareOptions.title = 'Mon Attestation At-Taqwa';
      }

      const result = await Share.share(shareOptions);
      
      console.log('✅ Partage réussi:', result);
    } catch (error) {
      console.error('❌ Erreur capture/partage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Détails de l\'erreur:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      Alert.alert(
        'Erreur', 
        `Impossible de capturer ou partager l'attestation.\n\n${errorMessage}\n\nVeuillez réessayer.`
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    await captureAndShare();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Vérification en cours...</Text>
        </View>
      </View>
    );
  }

  if (!isEligible) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerNotEligible}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attestation</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.notEligibleContainer}>
            <MaterialCommunityIcons name="certificate" size={80} color={colors.disabled} />
            <Text style={styles.notEligibleTitle}>Attestation non disponible</Text>
            <Text style={styles.notEligibleText}>
              Pour obtenir votre attestation, vous devez compléter tous les quiz avec une moyenne d'au moins 80%.
            </Text>
            <Text style={styles.notEligibleSubtext}>
              Continuez vos efforts pour débloquer cette récompense !
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Utilisateur';
  const dateStr = completionDate?.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }) || new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Attestation</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <MaterialCommunityIcons name="share-variant" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vue visible pour l'affichage et la capture */}
        <ViewShot
          ref={certificateRef}
          options={{
            format: 'png',
            quality: 1.0,
            result: 'tmpfile',
          }}
          style={[styles.certificateContainer, { 
            width: certificateWidth, 
            padding: certificatePadding 
          }]}
        >
          <CertificateContent 
            userName={userName}
            averageScore={averageScore}
            dateStr={dateStr}
            isForCapture={false}
            fontScale={fontScale}
            screenWidth={screenWidth}
          />
        </ViewShot>

        {/* Bouton de partage */}
        <TouchableOpacity 
          style={[styles.shareButtonLarge, isCapturing && styles.shareButtonDisabled]} 
          onPress={handleShare}
          disabled={isCapturing}
        >
          <MaterialCommunityIcons 
            name={isCapturing ? "loading" : "share-variant"} 
            size={24} 
            color={colors.white} 
          />
          <Text style={styles.shareButtonText}>
            {isCapturing ? 'Génération...' : 'Partager l\'attestation'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerNotEligible: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 10,      // Exactement comme HorairesScreen
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',  // Exactement comme HorairesScreen
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerSpacer: {
    width: 40,
  },
  shareButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  certificateWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  notEligibleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  notEligibleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  notEligibleText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  notEligibleSubtext: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: 8,
  },
  certificateContentForCapture: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    position: 'relative',
  },
  certificateShotContainer: {
    width: A4_PORTRAIT_WIDTH,
    height: A4_PORTRAIT_HEIGHT,
    backgroundColor: '#FAF8F5',
    position: 'absolute',
    left: -A4_PORTRAIT_WIDTH - 100,
    top: 0,
    opacity: 1,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  certificateContainerForCapture: {
    width: A4_PORTRAIT_WIDTH,
    height: A4_PORTRAIT_HEIGHT,
    backgroundColor: '#FAF8F5',
    padding: 132, // Padding proportionnel pour très haute résolution (4.13x)
    justifyContent: 'space-between',
  },
  certificateContainer: {
    // width et padding seront définis dynamiquement dans le composant
    aspectRatio: 0.707, // Ratio A4 portrait (210/297)
    backgroundColor: '#FAF8F5', // Fond ivoire/beige clair pour un aspect authentique
    justifyContent: 'space-between',
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    overflow: 'hidden', // Important pour la capture
    alignSelf: 'center', // Centrer le conteneur
  },
  certificateContentDisplay: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    position: 'relative',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  watermark: {
    opacity: 0.03, // Très léger pour un effet filigrane
  },
  decorativeBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.secondary,
    opacity: 0.22,
    zIndex: 0,
  },
  decorativeBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.secondary,
    opacity: 0.22,
    zIndex: 0,
  },
  certificateHeader: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  trophyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  certificateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 15,
    textAlign: 'center',
    includeFontPadding: false,
  },
  decorativeLine: {
    width: 100,
    height: 3,
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  certificateBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
    paddingBottom: 8,
  },
  certificateText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
    includeFontPadding: false,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginVertical: 15,
    textAlign: 'center',
    includeFontPadding: false,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    fontStyle: 'italic',
    marginVertical: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    marginVertical: 15,
    textAlign: 'center',
    includeFontPadding: false,
  },
  certificateFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  dateValue: {
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  signatureContainer: {
    alignItems: 'flex-end',
  },
  signatureLine: {
    height: 1,
    backgroundColor: colors.text,
    marginBottom: 5,
  },
  signatureLabel: {
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeText: {
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 10,
  },
  shareButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 10,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

