import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import { Alert, Animated, Dimensions, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getResponsiveStyle, useResponsive } from '../hooks/useResponsive';

import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import { useAuth } from '../hooks/useAuth';
import { usePaymentService } from '../lib/paymentService';
import { Chapter, ChaptersData } from '../types/chapters';
import { ChapterState, read as readUserStorage, write as writeUserStorage } from '../utils/userStorage';

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
  const data = chaptersData as ChaptersData;
  const { user } = useAuth();
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const [progress, setProgress] = React.useState<{[key:string]:number}>({});
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const [selectedChapter, setSelectedChapter] = React.useState<Chapter|null>(null);
  const [selectedPart, setSelectedPart] = React.useState<string|null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = React.useState(false);
  const [userEntitlements, setUserEntitlements] = React.useState<{part2: boolean; part3: boolean}>({part2: false, part3: false});
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Service de paiement
  const { checkEntitlements, createPayment, openPayDunyaCheckout } = usePaymentService();

  // Charger les entitlements utilisateur
  const loadEntitlements = async () => {
    if (!user?.uid) return;
    
    try {
      const entitlements = await checkEntitlements();
      setUserEntitlements(entitlements);
    } catch (error) {
      console.error('Erreur chargement entitlements:', error);
    }
  };

  // Charger la progression utilisateur
  const loadProgress = async () => {
    try {
      const saved = await readUserStorage<ChapterState>(user?.uid, 'chapterProgress');
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
  };

  // Charger la progression au montage et quand l'utilisateur change
  React.useEffect(() => {
    loadProgress();
    loadEntitlements();
  }, [user?.uid]);

  // Recharger la progression quand l'écran redevient actif
  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
      loadEntitlements();
    }, [user?.uid])
  );

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
    // Trouver partie et index du chapitre
    let partieKey: string | null = null;
    let chapitreIndex = 0;
    Object.keys(data).forEach((pk) => {
      if (partieKey) return;
      const idx = (data as any)[pk].chapitres.findIndex((ch: any) => ch.title === (chapter as any).title && ch.image === (chapter as any).image);
      if (idx >= 0) { partieKey = pk; chapitreIndex = idx; }
    });
    
    // Vérifier si la partie nécessite un paiement (Partie 2 et 3 seulement)
    if (partieKey === 'deuxieme_partie' || partieKey === 'troisieme_partie') {
      const hasAccess = partieKey === 'deuxieme_partie' ? userEntitlements.part2 : userEntitlements.part3;
      if (!hasAccess) {
        showPaywallModal(partieKey);
        return;
      }
    }
    
    let initialSection = 0;
    if (partieKey) {
      const progressKey = `chapter${partieKey}_${chapitreIndex + 1}`;
      const saved = await readUserStorage<ChapterState>(user?.uid, 'chapterProgress');
      const last = saved && saved[progressKey]?.lastSection;
      if (typeof last === 'number') initialSection = last;
    }
    (navigation as any).navigate('Chapter', { chapter, initialSection });
  };

  // Afficher le modal de paywall
  const showPaywallModal = (partieKey: string) => {
    const partieTitre = data[partieKey as keyof ChaptersData].titre;
    const partieNumero = partieKey === 'deuxieme_partie' ? '2' : '3';
    const planId = partieKey === 'deuxieme_partie' ? 'BOOK_PART_2' : 'BOOK_PART_3';
    
    Alert.alert(
      'Contenu Premium',
      `La Partie ${partieNumero} "${partieTitre}" nécessite un paiement pour être accessible.${'\n\n'}Débloquez l'accès complet à cette partie premium.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Débloquer maintenant', 
          onPress: () => handlePayment(planId, partieTitre)
        }
      ]
    );
  };

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
        
        Alert.alert(
          'Paiement en cours',
          `Vous allez être redirigé vers PayDunya pour finaliser votre paiement.${'\n\n'}Une fois le paiement effectué, vous serez automatiquement redirigé vers l'application.`,
          [{ text: 'Compris' }]
        );
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
        <View style={{ flex: 1 }}>
          {/* Header simple avec boutons */}
          <View style={styles.simpleHeader}>
            <TouchableOpacity 
              onPress={selectedPart ? () => setSelectedPart(null) : () => navigation.goBack()} 
              style={styles.simpleBackButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#174C3C" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={openDrawer} style={styles.simpleMenuButton}>
              <MaterialCommunityIcons name="menu" size={24} color="#174C3C" />
            </TouchableOpacity>
          </View>

          {/* Contenu scrollable */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
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
                <View style={{ paddingHorizontal: 20 }}>
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
                              <MaterialCommunityIcons name="account-edit" size={14} color="#666" />
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
                  const isUnlocked = (partie === 'deuxieme_partie' && userEntitlements.part2) || 
                                    (partie === 'troisieme_partie' && userEntitlements.part3);
                  return (
                    <View key={pidx} style={{ marginBottom: 16 }}>
                      {/* Carte de partie */}
                      <TouchableOpacity 
                        style={[styles.partCard, isPremium && styles.premiumCard]}
                        onPress={() => handlePartPress(partie)}
                        activeOpacity={0.95}
                      >
                        <View style={styles.partCardContent}>
                          <View style={styles.partCardHeader}>
                            <View style={styles.partCardTitleContainer}>
                              <View style={styles.partCardIcon}>
                                <MaterialCommunityIcons 
                                  name={isPremium ? "crown" : (pidx === 0 ? "book-open-variant" : "book-multiple")} 
                                  size={24} 
                                  color={isPremium ? "#D4AF37" : "colors.secondary"} 
                                />
                              </View>
                              <Text style={[
                                styles.partCardTitle,
                                isUnlocked ? { color: '#4CAF50', fontWeight: 'bold' } : {}
                              ]}>
                                Partie {pidx + 1}
                                {isUnlocked ? ' ✓' : ''}
                              </Text>
                              {isPremium && (
                                <View style={[
                                  styles.premiumBadge,
                                  isUnlocked ? { backgroundColor: '#4CAF50' } : {}
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
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#174C3C" />
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

const styles = StyleSheet.create({
  // Header simple
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAF9',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  simpleBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.3,
  },
  simpleMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Styles pour les parties
  partHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAF9',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },

  partTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#174C3C',
  },
  partCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(23, 76, 60, 0.1)',
  },
  partCardContent: {
    padding: 24,
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
    color: 'colors.secondary',
    fontWeight: '600',
    backgroundColor: 'rgba(187, 155, 78, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
    color: '#666',
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
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.2,
    marginRight: 16,
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
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    padding: 18,
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  newChapterContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chapterTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  newChapterTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#174C3C',
    lineHeight: 20,
  },
  progressBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 35,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  newChapterDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  chapterPartieText: {
    fontSize: 12,
    color: '#174C3C',
    fontWeight: '600',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  chapterFooter: {
    flexDirection: 'column',
    gap: 8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChapterAuthor: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 6,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E8F5E8',
    borderRadius: 3,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  premiumBadgeText: {
    color: '#174C3C',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Drawer redesigné
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: 320,
    backgroundColor: '#174C3C',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: 45,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerContent: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  drawerSection: {
    marginBottom: 32,
  },
  drawerSectionTitle: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  drawerChapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  drawerChapterIcon: {
    marginRight: 12,
  },
  drawerChapterTitleContainer: {
    flex: 1,
  },
  drawerChapterText: {
    color: 'white',
    fontSize: 13,
    lineHeight: 17,
  },
  drawerChapterProgress: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 