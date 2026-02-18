import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import { Alert, Animated, Dimensions, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getResponsiveStyle, useResponsive } from '../hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import { useEntitlements } from '../contexts/EntitlementsContext';
import { useAuthContext } from '../contexts/AuthContext';
import { usePaymentService } from '../lib/paymentService';
import colors from '../theme/colors';
import { Chapter, ChaptersData } from '../types/chapters';
import { ChapterState, read as readKV, read as readUserStorage, write as writeUserStorage } from '../utils/userStorage';

const { width: screenWidth } = Dimensions.get('window');

// Regrouper les blocs en pages (max 15 pages)
function paginateBlocks(blocks: { type: string; contenu: string }[], maxPages = 15) {
  const total = blocks.length;
  if (total <= maxPages) return blocks.map(b => [b]);
  const pageSize = Math.ceil(total / maxPages);
  const pages = [];
  for (let i = 0; i < total; i += pageSize) {
    pages.push(blocks.slice(i, i + pageSize));
  }
  return pages;
}

export default function BooksScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute<any>();
  const data = chaptersData as ChaptersData;
  const { user } = useAuthContext();
  
  // TOUS les hooks doivent être appelés AVANT tout return conditionnel
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const insets = useSafeAreaInsets();
  const styles = createStyles(responsive, responsiveStyle);
  
  // Calculer dynamiquement la hauteur de la TabBar
  // TabBar base : 80px
  // paddingTop : 12px
  // paddingBottom : Math.max(insets.bottom, 20) (comme dans TabNavigator)
  // Marge de sécurité : 20px
  const tabBarHeight = React.useMemo(() => {
    const tabBarBaseHeight = 80;
    const tabBarPaddingTop = 12;
    const tabBarPaddingBottom = Platform.OS === 'android' 
      ? Math.max(insets.bottom, 20) 
      : 20;
    const safetyMargin = 20; // Marge de sécurité pour éviter que le contenu soit coupé
    return tabBarBaseHeight + tabBarPaddingTop + tabBarPaddingBottom + safetyMargin;
  }, [insets.bottom]);
  const [progress, setProgress] = React.useState<{[key:string]:number}>({});
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const [selectedChapter, setSelectedChapter] = React.useState<Chapter|null>(null);
  const [selectedPart, setSelectedPart] = React.useState<string|null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = React.useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Service de paiement
  const { createPayment, openPayDunyaCheckout, checkPaymentStatus, checkEntitlements: fetchEntitlements } = usePaymentService();
  
  // Entitlements globaux
  const { entitlements: userEntitlements, refreshEntitlements } = useEntitlements();
  const [freshEntitlements, setFreshEntitlements] = React.useState<{ part2: boolean; part3: boolean } | null>(null);
  
  // Paywall état/UI (doit être avant le return null)
  const [paywallOpen, setPaywallOpen] = React.useState<{ open: boolean; partKey?: string }>(
    { open: false, partKey: undefined }
  );
  
  // Charger la progression utilisateur (doit être défini avant les useEffect qui l'utilisent)
  const loadProgress = React.useCallback(async () => {
    if (!user?.uid) return;
    try {
      const saved = await readUserStorage<ChapterState>(user.uid, 'chapterProgress');
      if (saved) {
        // Convertir en map pour l'affichage (clé -> percent)
        const display: {[key:string]:number} = {};
        Object.entries(saved).forEach(([k, v]) => {
          display[k] = v.percent;
        });
        setProgress(display);
      } else {
        setProgress({});
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error);
    }
  }, [user?.uid]);

  // Charger la progression au montage et quand l'utilisateur change
  React.useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Prendre en charge une pré-sélection de partie via navigation (ex: depuis Quiz "Acheter")
  React.useEffect(() => {
    const preselected = (route.params as any)?.selectedPart as string | undefined;
    if (preselected) {
      setSelectedPart(preselected);
    }
  }, [route.params]);

  // Recharger la progression quand l'écran redevient actif
  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
      // Rafraîchir les droits à chaque retour (respecte le cooldown côté contexte)
      // Ne pas forcer pour éviter les boucles infinies
      refreshEntitlements(false).catch(()=>{});
      // Lire un snapshot frais côté backend pour l'affichage des badges (avec gestion d'erreur)
      (async () => {
        try {
          const latest = await fetchEntitlements();
          setFreshEntitlements(latest);
        } catch (error: any) {
          // Ne pas logger en boucle si erreur réseau
          if (!error?.message?.includes('Network request failed') && !error?.message?.includes('Failed to fetch')) {
            console.error('Erreur fetchEntitlements:', error);
          }
          // garder l'état actuel en cas d'erreur réseau
        }
      })();
    }, [loadProgress]) // Retirer refreshEntitlements et fetchEntitlements des dépendances pour éviter les boucles
  );

  // Garde simple: éviter d'utiliser les entitlements avant que l'utilisateur ne soit chargé
  // MAINTENANT après tous les hooks
  if (!user) {
    return null;
  }

  // Sauvegarder la progression
  const saveProgress = async (newProgress: {[key:string]:number}) => {
    setProgress(newProgress);
    // Ecrire dans ChapterState
    const existing = (await readUserStorage<ChapterState>(user?.uid, 'chapterProgress')) || {};
    const updated: ChapterState = { ...existing };
    Object.entries(newProgress).forEach(([k, percent]) => {
      const prev = existing[k]?.percent ?? 0;
      const lastSection = existing[k]?.lastSection ?? 0;
      updated[k] = { percent: Math.max(prev, percent), lastSection, updatedAt: Date.now() };
    });
    await writeUserStorage(user?.uid, 'chapterProgress', updated);
  };

  // Ouvrir le drawer latéral
  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  // Marquer un chapitre comme lu à 100%
  const completeChapter = async (idx: number) => {
    if (!selectedPart) return;
    const key = `chapter${selectedPart}_${idx+1}`;
    const newProgress = { ...progress, [key]: 100 };
    await saveProgress(newProgress);
  };

  const handleChapterPress = async (chapter: Chapter) => {
    console.log('📖 handleChapterPress appelé pour:', chapter.title);
    try {
      // Trouver partie et index du chapitre
      let partieKey: string | null = null;
      let chapitreIndex = 0;
      Object.keys(data).forEach((pk) => {
        if (partieKey) return;
        const idx = (data as any)[pk].chapitres.findIndex((ch: any) => ch.title === (chapter as any).title && ch.image === (chapter as any).image);
        if (idx >= 0) { partieKey = pk; chapitreIndex = idx; }
      });
      
      console.log('🔍 Partie trouvée:', partieKey, 'Index:', chapitreIndex);
      
      // Vérifier si la partie nécessite un paiement (Partie 2 et 3 seulement)
      if (partieKey === 'deuxieme_partie' || partieKey === 'troisieme_partie') {
        console.log('🔐 Vérification accès premium pour:', partieKey);
        // Utiliser les entitlements déjà chargés (éviter les appels réseau supplémentaires)
        const source = freshEntitlements ?? userEntitlements;
        const hasAccess = partieKey === 'deuxieme_partie' ? source.part2 : source.part3;
        console.log('🔑 Accès:', hasAccess, 'Entitlements:', source);
        if (!hasAccess) {
          console.log('🔒 Accès refusé, affichage paywall');
          showPaywallModal(partieKey);
          return;
        }
      }
      
      let initialSection = 0;
      if (partieKey && user?.uid) {
        const progressKey = `chapter${partieKey}_${chapitreIndex + 1}`;
        try {
          const saved = await readUserStorage<ChapterState>(user.uid, 'chapterProgress');
          const last = saved && saved[progressKey]?.lastSection;
          if (typeof last === 'number') initialSection = last;
        } catch (e) {
          console.warn('Erreur lecture progression:', e);
        }
      }
      
      console.log('✅ Navigation vers Chapter avec section:', initialSection);
      (navigation as any).navigate('Chapter', { chapter, initialSection });
    } catch (error) {
      console.error('❌ Erreur dans handleChapterPress:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le chapitre. Veuillez réessayer.');
    }
  };

  // Fonctions pour le paywall (déclarées après le return null car ce ne sont pas des hooks)
  const showPaywallModal = (partieKey: string) => setPaywallOpen({ open: true, partKey: partieKey });
  const closePaywall = () => setPaywallOpen({ open: false, partKey: undefined });

  // Gérer le paiement
  const handlePayment = async (planId: 'BOOK_PART_2' | 'BOOK_PART_3', partieTitre: string) => {
    if (!user?.uid) {
      Alert.alert('Erreur', 'Vous devez être connecté pour effectuer un paiement');
      return;
    }

    setIsLoadingPayment(true);
    try {
      console.log('🔄 Démarrage du processus de paiement pour:', planId);
      
      const result = await createPayment(planId);
      
      if (result.success && result.checkoutUrl) {
        console.log('✅ Paiement créé, ouverture PayDunya...');
        await openPayDunyaCheckout(result.checkoutUrl);
        
        // Info silencieuse: suppression des alertes de succès/information
        closePaywall();

        // Démarrer un polling léger du statut à la reprise de l'app
        // Utilise le payment_token stocké par createPayment
        let attempts = 0;
        const maxAttempts = 12;       // ~20s si baseDelay=1700
        const baseDelayMs = 1700;
        const pollOnce = async () => {
          attempts++;
          try {
            const token = await readKV(user.uid, 'payment_token');
            if (!token || typeof token !== 'string') {
              if (attempts < maxAttempts) setTimeout(pollOnce, baseDelayMs);
              return;
            }
            const res = await checkPaymentStatus(token);
            const s = (res.status || '').toString().toUpperCase();
            if (s === 'COMPLETED') {
              console.log('✅ Paiement complété, actualisation des entitlements...');
              // FORCER le refresh après un paiement complété pour débloquer immédiatement
              // Le cooldown de 2s pour force=true empêche les boucles tout en permettant la mise à jour
              try { await refreshEntitlements(true); } catch (e) { console.warn('Erreur refreshEntitlements:', e); }
              // Forcer rechargement soft: on rappelle refreshEntitlements via Navigation event
              // ou simplement re-monter l'écran:
              setTimeout(()=> {
                // Best effort: on redessine la page, EntitlementsProvider rechargera selon cooldown
                setSelectedPart(null);
              }, 300);
              return;
            }
            if (s === 'FAILED' || s === 'CANCELLED') {
              Alert.alert('Paiement échoué', 'Le paiement a été annulé/échoué.');
              return;
            }
            if (attempts < maxAttempts) {
              setTimeout(pollOnce, baseDelayMs);
            } else {
              Alert.alert('Traitement en cours', 'Le paiement est en cours de confirmation. Réessayez dans quelques instants.');
            }
          } catch (e: any) {
            // Ne pas logger en boucle si erreur réseau
            if (!e?.message?.includes('Network request failed') && !e?.message?.includes('Failed to fetch')) {
              console.warn('Polling status erreur:', e);
            }
            if (attempts < maxAttempts) {
              setTimeout(pollOnce, baseDelayMs);
            }
          }
        };
        setTimeout(pollOnce, baseDelayMs);
      } else {
        console.error('❌ Erreur création paiement:', result.error);
        Alert.alert(
          'Erreur de paiement',
          result.error || 'Impossible de créer le paiement. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Erreur paiement:', error);
      Alert.alert(
        'Erreur réseau',
        'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handlePartPress = (partKey: string) => {
    setSelectedPart(partKey);
  };

  const handlePartCardPress = async (partie: string) => {
    console.log('🔵 handlePartCardPress appelé pour:', partie);
    try {
      const isPremium = partie === 'deuxieme_partie' || partie === 'troisieme_partie';
      if (!isPremium) {
        console.log('✅ Partie gratuite, ouverture directe');
        handlePartPress(partie);
        return;
      }
      
      // ✅ OPTIMISATION : Utiliser directement les entitlements du contexte (déjà chargés depuis le cache)
      console.log('🔄 Vérification des droits premium...');
      const isUnlocked = (partie === 'deuxieme_partie' && userEntitlements.part2) || 
                          (partie === 'troisieme_partie' && userEntitlements.part3);
      
      console.log('🔐 Accès premium:', { partie, isUnlocked, entitlements: userEntitlements });
      
      if (isUnlocked) {
        console.log('✅ Accès débloqué, ouverture de la partie');
        handlePartPress(partie);
      } else {
        // ✅ OPTIMISATION : Seulement si vraiment verrouillé, forcer un refresh (sans timeout)
        console.log('🔒 Accès verrouillé, vérification serveur...');
        try {
          await refreshEntitlements(true); // force=true pour bypasser le cooldown
          // Vérifier à nouveau avec les nouveaux entitlements
          const fresh = entitlements;
          const stillLocked = (partie === 'deuxieme_partie' && !fresh.part2) || 
                              (partie === 'troisieme_partie' && !fresh.part3);
          if (stillLocked) {
            console.log('🔒 Accès toujours verrouillé, affichage du paywall');
            showPaywallModal(partie);
          } else {
            console.log('✅ Accès débloqué après refresh, ouverture de la partie');
            handlePartPress(partie);
          }
        } catch (e: any) {
          // En cas d'erreur réseau, afficher le paywall (mieux que bloquer)
          if (!e?.message?.includes('Network request failed') && !e?.message?.includes('Failed to fetch')) {
            console.error('Erreur refreshEntitlements:', e);
          }
          showPaywallModal(partie);
        }
      }
    } catch (error) {
      console.error('❌ Erreur dans handlePartCardPress:', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  // Gestion du swipe gesture
  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX > 50) { // Swipe de droite à gauche
        if (selectedPart) {
          setSelectedPart(null);
        } else {
          navigation.goBack();
        }
      }
    }
  };

  // Animation du header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [120, 80],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F8FAF9' }}>
      <PanGestureHandler enabled={Platform.OS === 'ios'} onHandlerStateChange={onGestureEvent}>
        <View style={{ flex: 1, paddingTop: insets.top }}>
          {/* Header simple avec boutons */}
          <View style={styles.simpleHeader}>
            <TouchableOpacity 
              onPress={selectedPart ? () => setSelectedPart(null) : () => navigation.goBack()} 
              style={styles.simpleBackButton}
            >
              <MaterialCommunityIcons 
                name="arrow-left" 
                size={responsive.breakpoint === 'xxl' && responsive.width >= 1024
                  ? responsiveStyle.component.iconSize * 1.5
                  : responsiveStyle.component.iconSize * 1.2} 
                color="#174C3C" 
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={openDrawer} style={styles.simpleMenuButton}>
              <MaterialCommunityIcons 
                name="menu" 
                size={responsive.breakpoint === 'xxl' && responsive.width >= 1024
                  ? responsiveStyle.component.iconSize * 1.5
                  : responsiveStyle.component.iconSize * 1.2} 
                color="#174C3C" 
              />
            </TouchableOpacity>
          </View>

          {/* Contenu scrollable */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: tabBarHeight }} // Calcul dynamique basé sur la hauteur réelle de la TabBar
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {selectedPart ? (
              // Affichage des chapitres d'une partie sélectionnée
              <View>
                {/* Header de la partie */}
                <View style={styles.partHeader}>
                  <Text style={styles.partTitle}>{data[selectedPart as keyof ChaptersData].titre}</Text>
                </View>
                
                {/* Liste des chapitres de la partie */}
                <View style={{ 
                  paddingHorizontal: responsive.breakpoint === 'xs'
                    ? Math.max(12, responsiveStyle.spacing.base)
                    : responsive.breakpoint === 'sm'
                      ? responsiveStyle.spacing.lg
                      : responsiveStyle.horizontalPadding || responsiveStyle.spacing.lg 
                }}>
                  {data[selectedPart as keyof ChaptersData].chapitres.map((ch, idx) => {
                    const chapterProgress = progress[`chapter${selectedPart}_${idx+1}`] || 0;
                    return (
                      <TouchableOpacity 
                        key={idx} 
                        style={[
                          styles.newChapterCard,
                          { 
                            transform: [{ scale: 1 }],
                            shadowColor: chapterProgress > 0 ? '#D4AF37' : '#000',
                            shadowOpacity: chapterProgress > 0 ? 0.15 : 0.08,
                          }
                        ]}
                        onPress={() => handleChapterPress(ch)}
                        activeOpacity={0.95}
                      >
                        {/* Image avec overlay de progression */}
                        <View style={styles.imageContainer}>
                          <Image 
                            source={imageMap[ch.image] || require('../../assets/1.png')} 
                            style={styles.newChapterImage} 
                            resizeMode="cover"
                            fadeDuration={0}
                          />
                        </View>
                        
                        {/* Contenu du chapitre */}
                        <View style={styles.newChapterContent}>
                          <View style={styles.chapterHeader}>
                            <View style={styles.chapterTitleContainer}>
                              <Text style={[styles.newChapterTitle, { color: '#19514A' }]} numberOfLines={1}>
                                {ch.title ? ch.title.replace(/\.\s*$/, ':') : 'Chapitre'}
                              </Text>
                            </View>
                            <View style={[
                              styles.progressBadge, 
                              { backgroundColor: chapterProgress === 100 ? '#D4AF37' : chapterProgress > 0 ? '#FFF3CD' : '#F1F3F4' }
                            ]}>
                              <Text style={[
                                styles.progressText,
                                { color: chapterProgress === 100 ? 'white' : chapterProgress > 0 ? '#B8860B' : '#666' }
                              ]}>
                                {Math.round(chapterProgress)}%
                              </Text>
                            </View>
                          </View>
                          
                          <Text style={[styles.newChapterDesc, { color: '#19514A', fontWeight: 'bold' }]}>{ch.desc}</Text>
                          
                          {/* Nom de la partie */}
                          <Text style={[styles.chapterPartieText, { color: '#666' }]}>
                            {data[selectedPart as keyof ChaptersData].titre}
                          </Text>
                          
                          <View style={styles.chapterFooter}>
                            <View style={styles.authorContainer}>
                              <MaterialCommunityIcons 
                                name="account-edit" 
                                size={responsive.breakpoint === 'xxl' && responsive.width >= 1024
                                  ? responsiveStyle.component.iconSize * 0.7
                                  : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
                                    ? responsiveStyle.component.iconSize * 0.6
                                    : responsiveStyle.component.iconSize * 0.65} 
                                color={colors.secondary} 
                              />
                              <Text style={styles.newChapterAuthor}>{ch.author}</Text>
                            </View>

                            {/* Barre de progression moderne */}
                            <View style={styles.progressBarContainer}>
                              <View style={styles.progressBarBg}>
                                <Animated.View 
                                  style={[
                                    styles.progressBarFill,
                                    { 
                                      width: `${chapterProgress}%`,
                                      backgroundColor: chapterProgress === 100 ? '#D4AF37' : '#174C3C'
                                    }
                                  ]} 
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              // Affichage des deux parties
              <View>
                {Object.keys(data).map((partie, pidx) => {
                  const isPremium = partie === 'deuxieme_partie' || partie === 'troisieme_partie';
                  const source = freshEntitlements ?? userEntitlements;
                  const isUnlocked = (partie === 'deuxieme_partie' && source.part2) || 
                                    (partie === 'troisieme_partie' && source.part3);
                  return (
                    <View key={pidx} style={{ marginBottom: responsiveStyle.spacing.lg }}>
                      {/* Carte de partie */}
                      <TouchableOpacity 
                        style={[styles.partCard, isPremium && styles.premiumCard]}
                        onPress={() => {
                          console.log('👆 Clic sur la carte partie:', partie);
                          handlePartCardPress(partie);
                        }}
                        activeOpacity={0.95}
                        disabled={false}
                      >
                        <View style={styles.partCardContent}>
                          <View style={styles.partCardHeader}>
                            <View style={styles.partCardTitleContainer}>
                              <View style={styles.partCardIcon}>
                                <MaterialCommunityIcons 
                                  name={isPremium ? "crown" : (pidx === 0 ? "book-open-variant" : "book-multiple")} 
                                  size={responsive.breakpoint === 'xxl' && responsive.width >= 1024
                                    ? responsiveStyle.component.iconSize * 1.5
                                    : responsiveStyle.component.iconSize * 1.2} 
                                  color={isPremium ? "#D4AF37" : colors.secondary} 
                                />
                              </View>
                              <Text style={[
                                styles.partCardTitle,
                                isUnlocked ? { color: colors.primary, fontWeight: 'bold' } : {}
                              ]}>
                                Partie {pidx + 1}
                                {isUnlocked ? ' ✓' : ''}
                              </Text>
                              {isPremium && (
                                <View style={[
                                  styles.premiumBadge,
                                  isUnlocked ? { backgroundColor: colors.primary } : {}
                                ]}>
                                  <Text style={[
                                    styles.premiumBadgeText,
                                    isUnlocked ? { color: 'white' } : {}
                                  ]}>
                                    {isUnlocked ? 'DÉBLOQUÉ' : 'PREMIUM'}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <MaterialCommunityIcons 
                              name="chevron-right" 
                              size={responsive.breakpoint === 'xxl' && responsive.width >= 1024
                                ? responsiveStyle.component.iconSize * 1.5
                                : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
                                  ? responsiveStyle.component.iconSize * 1.0
                                  : responsiveStyle.component.iconSize * 1.2} 
                              color="#174C3C" 
                            />
                          </View>
                          <Text style={styles.partCardSubtitle}>{data[partie as keyof ChaptersData].titre}</Text>
                          <Text style={styles.partCardChapters}>
                            {data[partie as keyof ChaptersData].chapitres.length} chapitres
                            {isPremium && " • Contenu premium"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Modal Paywall harmonisé */}
          <Modal visible={paywallOpen.open} transparent animationType="fade" onRequestClose={closePaywall}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View style={{ width: '100%', maxWidth: 420, backgroundColor: colors.white, borderRadius: 20, borderWidth: 2, borderColor: '#BB9B4E', padding: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="crown" size={24} color="#BB9B4E" />
                    <Text style={{ color: colors.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 8 }}>
                      Contenu Premium
                    </Text>
                  </View>
                  <TouchableOpacity onPress={closePaywall} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <Text style={{ color: colors.text, fontSize: 16, marginBottom: 20, lineHeight: 22 }}>
                  Accès complet et illimité à cette partie premium.
                </Text>
                
                <View style={{ backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <Text style={{ color: colors.primary, fontWeight: '600', marginBottom: 6, fontSize: 14 }}>
                    Partie concernée
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
                    {paywallOpen.partKey ? data[paywallOpen.partKey as keyof ChaptersData].titre : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <MaterialCommunityIcons name="cash" size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold', marginLeft: 6 }}>
                      3000 F CFA
                    </Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={closePaywall}
                    style={{ flex: 1, paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const planId = paywallOpen.partKey === 'deuxieme_partie' ? 'BOOK_PART_2' : 'BOOK_PART_3';
                      const titre = paywallOpen.partKey ? data[paywallOpen.partKey as keyof ChaptersData].titre : '';
                      handlePayment(planId as any, titre);
                    }}
                    disabled={isLoadingPayment}
                    style={{ flex: 1, paddingVertical: 14, backgroundColor: colors.primary, opacity: isLoadingPayment ? 0.6 : 1, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.primary }}
                  >
                    <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>
                      {isLoadingPayment ? 'Traitement…' : 'Débloquer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Drawer latéral redesigné */}
          <Modal visible={drawerVisible} transparent animationType="slide">
            <View style={styles.drawerOverlay}>
              <Animated.View style={styles.drawerContainer}>
                <LinearGradient
                  colors={['#174C3C', '#1F5F4F']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.drawerHeader}>
                    <MaterialCommunityIcons name="book-multiple" size={28} color="white" />
                    <Text style={styles.drawerTitle}>Table des matières</Text>
                    <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
                      <MaterialCommunityIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.drawerContent}>
                    {Object.keys(data).map((partie, pidx) => (
                      <View key={pidx} style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>{data[partie as keyof ChaptersData].titre}</Text>
                        {data[partie as keyof ChaptersData].chapitres.map((ch, idx) => {
                          const chapterProgress = progress[`chapter${Object.keys(data)[pidx]}_${idx+1}`] || 0;
                          return (
                            <TouchableOpacity 
                              key={idx} 
                              style={styles.drawerChapterItem}
                              onPress={() => {
                                handleChapterPress(ch);
                                closeDrawer();
                              }}
                            >
                              <View style={styles.drawerChapterIcon}>
                                <MaterialCommunityIcons 
                                  name={chapterProgress === 100 ? "check-circle" : chapterProgress > 0 ? "circle-half-full" : "circle-outline"} 
                                  size={16} 
                                  color={chapterProgress === 100 ? "#D4AF37" : chapterProgress > 0 ? "#FFF3CD" : "#ffffff80"}
                                />
                              </View>
                              <View style={styles.drawerChapterTitleContainer}>
                                <Text style={styles.drawerChapterText} numberOfLines={1}>
                                  {ch.title ? ch.title.replace(/\.\s*$/, ':') : 'Chapitre'}
                                </Text>
                                <Text style={styles.drawerChapterText} numberOfLines={4}>
                                  {ch.desc || 'Titre du chapitre'}
                                </Text>
                              </View>
                              <Text style={styles.drawerChapterProgress}>{Math.round(chapterProgress)}%</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </Animated.View>
              <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
            </View>
          </Modal>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const createStyles = (responsive: any, responsiveStyle: any) => StyleSheet.create({
  // Header simple
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveStyle.spacing.xl,
    paddingVertical: responsiveStyle.spacing.lg,
    backgroundColor: '#F8FAF9',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  simpleBackButton: {
    width: responsiveStyle.component.buttonHeight,
    height: responsiveStyle.component.buttonHeight,
    borderRadius: responsiveStyle.component.buttonHeight / 2,
    backgroundColor: 'rgba(23, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleHeaderTitle: {
    fontSize: responsiveStyle.fontSize['2xl'],
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.3,
  },
  simpleMenuButton: {
    width: responsiveStyle.component.buttonHeight,
    height: responsiveStyle.component.buttonHeight,
    borderRadius: responsiveStyle.component.buttonHeight / 2,
    backgroundColor: 'rgba(23, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Styles pour les parties
  partHeader: {
    paddingHorizontal: responsiveStyle.horizontalPadding || responsiveStyle.spacing.lg,
    paddingVertical: responsiveStyle.spacing.lg,
    backgroundColor: '#F8FAF9',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },

  partTitle: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize['3xl']  // Plus grand pour très grands écrans
      : responsiveStyle.fontSize['2xl'],
    fontWeight: 'bold',
    color: '#174C3C',
  },
  partCard: {
    backgroundColor: 'white',
    borderRadius: responsiveStyle.component.borderRadius * 2.5,
    marginHorizontal: responsiveStyle.horizontalPadding || responsiveStyle.spacing.lg,
    marginBottom: responsiveStyle.spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: responsiveStyle.spacing.base,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(23, 76, 60, 0.1)',
  },
  partCardContent: {
    padding: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing['2xl']  // Plus grand pour très grands écrans
      : responsiveStyle.spacing.lg,
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
    width: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.iconSize * 2.5  // Plus grand pour très grands écrans
      : responsiveStyle.component.iconSize * 2,
    height: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.iconSize * 2.5
      : responsiveStyle.component.iconSize * 2,
    borderRadius: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.iconSize * 1.25
      : responsiveStyle.component.iconSize,
    backgroundColor: 'rgba(187, 155, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveStyle.spacing.base,
  },
  partCardTitle: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.xl  // Plus grand pour très grands écrans
      : responsiveStyle.fontSize.lg,
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.5,
  },
  partCardSubtitle: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.lg  // Plus grand pour très grands écrans
      : responsiveStyle.fontSize.base,
    color: '#174C3C',
    marginBottom: responsiveStyle.spacing.base,
    fontWeight: '600',
    lineHeight: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.lg * 1.4
      : responsiveStyle.fontSize.base * 1.3,
  },
  partCardChapters: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.base  // Plus grand pour très grands écrans
      : responsiveStyle.fontSize.sm,
    color: colors.secondary,
    fontWeight: '600',
    backgroundColor: 'rgba(187, 155, 78, 0.1)',
    paddingHorizontal: responsiveStyle.spacing.base,
    paddingVertical: responsiveStyle.spacing.xs,
    borderRadius: responsiveStyle.component.borderRadius * 1.5,
    alignSelf: 'flex-start',
  },
  
  // Styles pour le titre de page
  pageTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Ancien header (gardé pour compatibilité)
  newHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  newBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newHeaderTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  newHeaderSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section headers
  sectionHeader: {
    marginHorizontal: responsiveStyle.horizontalPadding || responsiveStyle.spacing.lg,
    marginBottom: responsiveStyle.spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newSectionTitle: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.xl
      : responsiveStyle.fontSize.lg,
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.2,
    marginRight: responsiveStyle.spacing.lg,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8F5E8',
    borderRadius: 1,
  },

  // Nouvelles cartes de chapitre
  newChapterCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: responsiveStyle.component.borderRadius * 2.5,
    marginBottom: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing['2xl']
      : responsive.breakpoint === 'xs'
        ? Math.max(8, responsiveStyle.spacing.base * 0.8)
        : responsive.breakpoint === 'sm'
          ? responsiveStyle.spacing.base
          : responsiveStyle.spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: responsiveStyle.spacing.base,
    padding: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing['2xl']
      : responsive.breakpoint === 'xs'
        ? Math.max(10, responsiveStyle.spacing.base * 0.9)
        : responsive.breakpoint === 'sm'
          ? responsiveStyle.spacing.base
          : responsiveStyle.spacing.lg,
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    marginRight: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing.xl
      : responsive.breakpoint === 'xs'
        ? Math.max(8, responsiveStyle.spacing.base * 0.8)
        : responsive.breakpoint === 'sm'
          ? responsiveStyle.spacing.base
          : responsiveStyle.spacing.lg,
    width: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.iconSize * 6
      : responsive.breakpoint === 'xs'
        ? Math.max(60, responsiveStyle.component.iconSize * 3.5)
        : responsive.breakpoint === 'sm'
          ? Math.max(70, responsiveStyle.component.iconSize * 4)
          : responsiveStyle.component.iconSize * 5,
    height: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.iconSize * 6
      : responsive.breakpoint === 'xs'
        ? Math.max(60, responsiveStyle.component.iconSize * 3.5)
        : responsive.breakpoint === 'sm'
          ? Math.max(70, responsiveStyle.component.iconSize * 4)
          : responsiveStyle.component.iconSize * 5,
    borderRadius: responsiveStyle.component.borderRadius * 2,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: responsiveStyle.spacing.xs,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChapterImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  progressOverlay: {
    position: 'absolute',
    top: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? -8
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? -4
        : -6,
    right: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? -8
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? -4
        : -6,
    width: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.iconSize * 1.4
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? responsiveStyle.component.iconSize * 1.0
        : responsiveStyle.component.iconSize * 1.2,
    height: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.iconSize * 1.4
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? responsiveStyle.component.iconSize * 1.0
        : responsiveStyle.component.iconSize * 1.2,
    borderRadius: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.iconSize * 0.7
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? responsiveStyle.component.iconSize * 0.5
        : responsiveStyle.component.iconSize * 0.6,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: responsiveStyle.spacing.xs,
  },
  newChapterContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: responsive.breakpoint === 'xs'
      ? Math.max(6, responsiveStyle.spacing.xs)
      : responsiveStyle.spacing.sm,
  },
  chapterTitleContainer: {
    flex: 1,
    marginRight: responsive.breakpoint === 'xs'
      ? Math.max(6, responsiveStyle.spacing.xs)
      : responsive.breakpoint === 'sm'
        ? responsiveStyle.spacing.sm
        : responsiveStyle.spacing.base,
  },
  newChapterTitle: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.lg
      : responsive.breakpoint === 'xs'
        ? Math.max(11, responsiveStyle.fontSize.xs)
        : responsive.breakpoint === 'sm'
          ? Math.max(12, responsiveStyle.fontSize.sm * 0.9)
          : responsiveStyle.fontSize.sm,
    fontWeight: 'bold',
    color: '#174C3C',
    lineHeight: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.lg * 1.3
      : responsive.breakpoint === 'xs'
        ? Math.max(14, responsiveStyle.fontSize.xs * 1.3)
        : responsive.breakpoint === 'sm'
          ? Math.max(15, responsiveStyle.fontSize.sm * 1.2)
          : responsiveStyle.fontSize.sm * 1.3,
  },
  progressBadge: {
    paddingHorizontal: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing.sm
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? responsiveStyle.spacing.xs / 2
        : responsiveStyle.spacing.xs,
    paddingVertical: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing.xs
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? responsiveStyle.spacing.xs / 3
        : responsiveStyle.spacing.xs / 2,
    borderRadius: responsiveStyle.component.borderRadius,
    minWidth: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? 45
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? 30
        : 35,
    alignItems: 'center',
  },
  progressText: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.sm
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? Math.max(8, responsiveStyle.fontSize.xs * 0.85)
        : responsiveStyle.fontSize.xs,
    fontWeight: 'bold',
  },
  progressTextSmall: {
    fontSize: responsiveStyle.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: responsiveStyle.spacing.xs,
  },
  newChapterDesc: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.base
      : responsive.breakpoint === 'xs'
        ? Math.max(10, responsiveStyle.fontSize.xs * 0.9)
        : responsive.breakpoint === 'sm'
          ? Math.max(11, responsiveStyle.fontSize.sm * 0.85)
          : responsiveStyle.fontSize.sm,
    color: colors.secondary,
    lineHeight: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.base * 1.4
      : responsive.breakpoint === 'xs'
        ? Math.max(14, responsiveStyle.fontSize.xs * 1.4)
        : responsive.breakpoint === 'sm'
          ? Math.max(15, responsiveStyle.fontSize.sm * 1.3)
          : responsiveStyle.fontSize.sm * 1.4,
    marginBottom: responsiveStyle.spacing.sm,
  },
  chapterPartieText: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.sm
      : responsive.breakpoint === 'xs'
        ? Math.max(10, responsiveStyle.fontSize.xs)
        : responsive.breakpoint === 'sm'
          ? Math.max(11, responsiveStyle.fontSize.xs * 1.1)
          : responsiveStyle.fontSize.xs,
    color: '#174C3C',
    fontWeight: '600',
    marginBottom: responsiveStyle.spacing.base,
    fontStyle: 'italic',
  },
  chapterFooter: {
    flexDirection: 'column',
    gap: responsiveStyle.spacing.sm,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChapterAuthor: {
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.sm
      : responsive.breakpoint === 'xs'
        ? Math.max(10, responsiveStyle.fontSize.xs)
        : responsive.breakpoint === 'sm'
          ? Math.max(11, responsiveStyle.fontSize.xs * 1.1)
          : responsiveStyle.fontSize.xs,
    color: colors.secondary,
    fontStyle: 'italic',
    marginLeft: responsiveStyle.spacing.xs,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? 8
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? 5
        : 6,
    backgroundColor: '#E8F5E8',
    borderRadius: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? 4
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? 2.5
        : 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  navArrow: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -10,
  },

  // Styles pour les parties premium
  premiumCard: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    backgroundColor: '#FFFBF0',
  },
  premiumBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing.base
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? responsiveStyle.spacing.xs
        : responsiveStyle.spacing.sm,
    paddingVertical: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing.xs
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? responsiveStyle.spacing.xs / 3
        : responsiveStyle.spacing.xs / 2,
    borderRadius: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.component.borderRadius * 2
      : responsiveStyle.component.borderRadius * 1.5,
    marginLeft: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing.base
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? responsiveStyle.spacing.xs
        : responsiveStyle.spacing.sm,
  },
  premiumBadgeText: {
    color: '#174C3C',
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.sm
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? Math.max(8, responsiveStyle.fontSize.xs * 0.85)
        : responsiveStyle.fontSize.xs,
    fontWeight: 'bold',
    letterSpacing: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? 0.8
      : responsive.breakpoint === 'xs' || responsive.breakpoint === 'sm'
        ? 0.3
        : 0.5,
  },

  // Drawer redesigné
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? Math.min(400, responsive.width * 0.35)
      : Math.min(320, responsive.width * 0.8),
    backgroundColor: '#174C3C',
    borderTopRightRadius: responsiveStyle.component.borderRadius * 3,
    borderBottomRightRadius: responsiveStyle.component.borderRadius * 3,
    marginTop: responsiveStyle.spacing['2xl'],
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveStyle.spacing.lg,
    paddingTop: responsiveStyle.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerTitle: {
    color: 'white',
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.xl
      : responsiveStyle.fontSize.lg,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: responsiveStyle.spacing.base,
  },
  closeButton: {
    width: responsiveStyle.component.buttonHeight * 0.8,
    height: responsiveStyle.component.buttonHeight * 0.8,
    borderRadius: responsiveStyle.component.buttonHeight * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerContent: {
    flex: 1,
    padding: responsiveStyle.spacing.lg,
    paddingTop: responsiveStyle.spacing.sm,
  },
  drawerSection: {
    marginBottom: responsiveStyle.spacing['2xl'],
  },
  drawerSectionTitle: {
    color: '#D4AF37',
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.lg
      : responsiveStyle.fontSize.base,
    fontWeight: 'bold',
    marginBottom: responsiveStyle.spacing.lg,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  drawerChapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.spacing.lg
      : responsiveStyle.spacing.base,
    paddingHorizontal: responsiveStyle.spacing.lg,
    borderRadius: responsiveStyle.component.borderRadius * 1.5,
    marginBottom: responsiveStyle.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  drawerChapterIcon: {
    marginRight: responsiveStyle.spacing.base,
  },
  drawerChapterTitleContainer: {
    flex: 1,
  },
  drawerChapterText: {
    color: 'white',
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.sm
      : responsiveStyle.fontSize.xs,
    lineHeight: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.sm * 1.3
      : responsiveStyle.fontSize.xs * 1.3,
  },
  drawerChapterProgress: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: responsive.breakpoint === 'xxl' && responsive.width >= 1024
      ? responsiveStyle.fontSize.sm
      : responsiveStyle.fontSize.xs,
    fontWeight: 'bold',
  },
}); 