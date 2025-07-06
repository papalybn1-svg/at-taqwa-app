import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { collection, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Platform, Vibration } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from "../theme/colors";

const ZIKR_PROGRESS_KEY = '@zikr_progress';
const SOUND_ENABLED_KEY = '@sound_enabled';
const { width: screenWidth } = Dimensions.get('window');

export type Zikr = {
  id: string;
  category: string;
  text: string;
  description: string;
  max: number;
};

type ActiveZikr = Zikr & { count: number };

export default function TasbihScreen() {
  const [zikrs, setZikrs] = useState<Zikr[]>([]);
  const [zikrProgress, setZikrProgress] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [activeZikr, setActiveZikr] = useState<ActiveZikr | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const db = getFirestore();
  const navigation = useNavigation();

  // Charger les préférences de son
  const loadSoundPreference = useCallback(async () => {
    try {
      const savedSoundEnabled = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
      if (savedSoundEnabled !== null) {
        setSoundEnabled(JSON.parse(savedSoundEnabled));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences sonores:', error);
    }
  }, []);

  // Sauvegarder les préférences de son
  const saveSoundPreference = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(enabled));
      setSoundEnabled(enabled);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences sonores:', error);
    }
  }, []);

  // Toggle du son
  const toggleSound = useCallback(() => {
    const newSoundEnabled = !soundEnabled;
    saveSoundPreference(newSoundEnabled);
    // Feedback immédiat
    if (newSoundEnabled) {
      Vibration.vibrate(50);
    }
  }, [soundEnabled, saveSoundPreference]);

  // Jouer le son/vibration
  const playClickSound = useCallback(async () => {
    if (soundEnabled) {
      try {
        // Utiliser le son de notification système
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        // Créer un son simple avec expo-av
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmshBjqU2+/ESCgELHfH7+2PQAoXZ7zx65RSFgxMo+L2uWshB' },
          { shouldPlay: true, volume: 0.8 }
        );
        
        // Nettoyer le son après lecture
        setTimeout(() => {
          sound.unloadAsync();
        }, 200);
        
        // Vibration en plus du son
        Vibration.vibrate(30);
      } catch (error) {
        console.log('Son non disponible, utilisation vibration uniquement');
        // Fallback sur vibration si le son ne marche pas
        Vibration.vibrate(30);
      }
    }
  }, [soundEnabled]);

  const loadZikrData = useCallback(async () => {
    setLoading(true);
    try {
      // Load progress first
      const savedProgress = await AsyncStorage.getItem(ZIKR_PROGRESS_KEY);
      const progress = savedProgress ? JSON.parse(savedProgress) : {};
      
      // Fetch zikrs from Firestore
      const zikrsRef = collection(db, 'zikrs');
      const q = query(zikrsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedZikrs: Zikr[] = [];
      
      console.log('Nombre de zikrs trouvés:', querySnapshot.size);
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Zikr data:', { 
          id: doc.id, 
          category: data.category, 
          text: data.text, 
          description: data.description,
          count: data.count 
        });
        fetchedZikrs.push({ 
          id: doc.id, 
          category: data.category || 'Général',
          text: data.text || 'Zikr',
          description: data.description || 'Louange à Allah',
          max: data.count || 33 
        });
      });
      
      setZikrs(fetchedZikrs);

      // Set progress for fetched zikrs
      const initialProgress = { ...progress };
      fetchedZikrs.forEach(zikr => {
        if (initialProgress[zikr.id] === undefined) {
          initialProgress[zikr.id] = 0;
        }
      });
      setZikrProgress(initialProgress);

    } catch (error) {
      console.error("Erreur de chargement des Zikrs:", error);
      // Fallback to default zikrs if no data
      const defaultZikrs = [
        { 
          id: 'default1', 
          category: 'Dhikr du matin',
          text: 'سُبْحَانَ اللَّهِ',
          description: 'Subhan Allah (Gloire à Allah)',
          max: 33 
        },
        { 
          id: 'default2', 
          category: 'Dhikr du soir',
          text: 'الْحَمْدُ لِلَّهِ',
          description: 'Alhamdulillah (Louange à Allah)',
        max: 33 
        },
        { 
          id: 'default3', 
          category: 'Dhikr après prière',
          text: 'اللَّهُ أَكْبَرُ',
          description: 'Allahu Akbar (Allah est le plus grand)',
          max: 34 
        }
      ];
      setZikrs(defaultZikrs);
      const defaultProgress: { [key: string]: number } = {};
      defaultZikrs.forEach(zikr => {
        defaultProgress[zikr.id] = 0;
      });
      setZikrProgress(defaultProgress);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadZikrData();
    loadSoundPreference();
  }, [loadZikrData, loadSoundPreference]);

  useEffect(() => {
    AsyncStorage.setItem(ZIKR_PROGRESS_KEY, JSON.stringify(zikrProgress));
  }, [zikrProgress]);

  const increment = (id: string) => {
    const zikr = zikrs.find(z => z.id === id);
    if (!zikr) return;
    
    const currentCount = zikrProgress[id] || 0;
    if (currentCount < zikr.max) {
      // Jouer le son/vibration
      playClickSound();
      
      const newProgress = { ...zikrProgress, [id]: currentCount + 1 };
      setZikrProgress(newProgress);
      if(activeZikr && activeZikr.id === id) {
        setActiveZikr({...activeZikr, count: newProgress[id] })
      }
    }
  };
  
  const reset = (id: string) => {
    setZikrProgress({ ...zikrProgress, [id]: 0 });
    if(activeZikr && activeZikr.id === id) {
      setActiveZikr({...activeZikr, count: 0 })
    }
  };

  const handleOpenTasbih = (zikr: Zikr) => {
    setActiveZikr({
      ...zikr,
      count: zikrProgress[zikr.id] || 0,
    });
  };

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Chargement des zikrs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      {/* Header moderne cohérent */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasbih</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Section principale des zikrs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Zikrs</Text>
            <View style={styles.sectionLine} />
          </View>

          {zikrs.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={64} color={colors.gray} />
              <Text style={styles.emptyStateTitle}>Aucun zikr disponible</Text>
              <Text style={styles.emptyStateText}>
                Ajoutez des zikrs depuis le panneau administrateur pour commencer à pratiquer le dhikr.
              </Text>
            </View>
          ) : (
            <View style={styles.zikrsList}>
              {zikrs.map((item, index) => {
            const count = zikrProgress[item.id] || 0;
                const progressPercentage = (count / item.max) * 100;
                const isCompleted = count >= item.max;
                
            return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.zikrCard,
                      isCompleted && styles.zikrCardCompleted
                    ]}
                    onPress={() => handleOpenTasbih(item)}
                    activeOpacity={0.7}
                  >
                    {/* Header de la carte */}
                    <View style={styles.zikrCardHeader}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                        </View>
                      )}
                    </View>

                    {/* Contenu principal */}
                    <View style={styles.zikrCardContent}>
                      <Text style={styles.zikrTextArabic}>{item.text}</Text>
                    <Text style={styles.zikrDescription}>{item.description}</Text>
                    </View>

                    {/* Progress et actions */}
                    <View style={styles.zikrCardFooter}>
                      <View style={styles.progressInfo}>
                        <Text style={styles.progressCount}>
                          {count} / {item.max}
                        </Text>
                        <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg}>
                            <View 
                              style={[
                                styles.progressBarFill,
                                { 
                                  width: `${progressPercentage}%`,
                                  backgroundColor: colors.secondary
                                }
                              ]} 
                            />
                          </View>
                    </View>
                  </View>

                      <View style={styles.cardActions}>
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation();
                            increment(item.id);
                          }} 
                          style={[styles.actionButton, styles.incrementButton]}
                        >
                          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                    </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation();
                            reset(item.id);
                          }} 
                          style={[styles.actionButton, styles.resetButton]}
                        >
                          <MaterialCommunityIcons name="refresh" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
              })}
            </View>
          )}
        </View>

        {/* Section statistiques */}
        {zikrs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Statistiques</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="counter" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>
                  {Object.values(zikrProgress).reduce((sum, count) => sum + count, 0)}
              </Text>
                <Text style={styles.statLabel}>Total récité</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.secondary} />
                <Text style={styles.statNumber}>
                  {zikrs.filter(zikr => (zikrProgress[zikr.id] || 0) >= zikr.max).length}
              </Text>
                <Text style={styles.statLabel}>Complétés</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="progress-clock" size={24} color="#FF6B6B" />
                <Text style={styles.statNumber}>
                  {zikrs.filter(zikr => (zikrProgress[zikr.id] || 0) > 0 && (zikrProgress[zikr.id] || 0) < zikr.max).length}
              </Text>
                <Text style={styles.statLabel}>En cours</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal tasbih modernisé */}
      <Modal visible={!!activeZikr} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header du modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalCategoryBadge}>
                <Text style={styles.modalCategoryText}>{activeZikr?.category}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setActiveZikr(null)} 
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Contenu du modal */}
            <View style={styles.modalContent}>
              <Text style={styles.modalZikrText}>{activeZikr?.text}</Text>
              <Text style={styles.modalDescription}>{activeZikr?.description}</Text>

              {/* Tasbih électronique */}
              <View style={styles.tasbihContainer}>
                <TouchableOpacity 
                  style={styles.tasbihImageContainer}
                  onPress={() => activeZikr && increment(activeZikr.id)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={require('../../assets/Chapelet éléctronique.png')} 
                    style={styles.tasbihImage}
                    resizeMode="contain"
                  />
                  {/* Écran du compteur superposé sur l'image */}
                  <View style={styles.counterScreen}>
                    <Text style={styles.digitalCounter}>
                      {String(zikrProgress[activeZikr?.id || ''] || 0).padStart(4, '0')}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {/* Indicateur de progression */}
                <View style={styles.progressIndicator}>
                  <Text style={styles.progressText}>
                    {zikrProgress[activeZikr?.id || ''] || 0} / {activeZikr?.max}
                  </Text>
                  <View style={styles.modalProgressBarContainer}>
                    <View style={styles.modalProgressBarBg}>
                      <View 
                        style={[
                          styles.modalProgressBarFill,
                          { 
                            width: `${((zikrProgress[activeZikr?.id || ''] || 0) / (activeZikr?.max || 1)) * 100}%`
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Boutons d'action */}
              <View style={styles.modalActions}>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.resetModalButton]} 
                    onPress={() => activeZikr && reset(activeZikr.id)}
                  >
                    <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
                    <Text style={[styles.modalButtonText, { color: colors.primary }]}>
                      Réinitialiser
                    </Text>
              </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.soundModalButton]} 
                    onPress={toggleSound}
                  >
                    <MaterialCommunityIcons 
                      name={soundEnabled ? "volume-high" : "volume-off"} 
                      size={20} 
                      color={soundEnabled ? colors.secondary : colors.gray} 
                    />
                    <Text style={[styles.modalButtonText, { color: soundEnabled ? colors.secondary : colors.gray }]}>
                      {soundEnabled ? "Son activé" : "Son désactivé"}
                    </Text>
              </TouchableOpacity>
                </View>
              </View>
            </View>
            </View>
          </View>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F8FAF9' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
     flex: 1,
     fontSize: 20,
    fontWeight: 'bold',
     color: colors.text,
     textAlign: 'center',
     marginHorizontal: 16
  },
  placeholder: {
     width: 40, // Même largeur que le bouton back pour équilibrer
   },
  container: { 
    flex: 1 
  },
  contentContainer: {
    paddingBottom: 32
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
     loadingText: {
     marginTop: 16,
     fontSize: 16,
    color: colors.gray,
   },

      // Sections
   section: {
     marginBottom: 24,
     paddingTop: 16,
   },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionLine: {
    height: 3,
    backgroundColor: colors.primary,
    width: 40,
    borderRadius: 2,
  },

  // Liste des zikrs
  zikrsList: {
    paddingHorizontal: 20,
  },
  zikrCard: {
    backgroundColor: colors.white, 
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F3F4',
  },
  zikrCardCompleted: {
    borderColor: '#D4AF37',
    borderWidth: 2,
  },
  zikrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12, 
    fontWeight: '600', 
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 4,
  },
  zikrCardContent: {
    marginBottom: 16,
  },
  zikrTextArabic: {
    fontSize: 22,
    fontWeight: 'bold', 
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  zikrDescription: { 
    fontSize: 14,
    color: colors.gray, 
    textAlign: 'center',
    fontStyle: 'italic',
  },
  zikrCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
    marginRight: 16,
  },
  progressCount: {
    fontSize: 14, 
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBg: { 
    backgroundColor: '#E5E7EB',
    height: 6, 
    borderRadius: 3, 
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6, 
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  cardActions: {
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  actionButton: {
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
  },
  incrementButton: {
    backgroundColor: colors.primary,
  },
  resetButton: {
    backgroundColor: '#E8F4F8',
    borderWidth: 1,
    borderColor: colors.primary,
  },

  // État vide
  emptyStateContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16, 
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Statistiques
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold', 
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  modalCategoryBadge: {
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalZikrText: {
    fontSize: 28,
    fontWeight: 'bold', 
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  modalDescription: { 
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  tasbihContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tasbihImageContainer: {
    position: 'relative',
  },
  tasbihImage: {
    width: 350,
    height: 350,
  },
  counterScreen: {
    position: 'absolute',
    top: '15%',
    left: '25%',
    right: '25%',
    bottom: '55%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  digitalCounter: {
    fontSize: 40,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    textShadowColor: '#333333',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
    letterSpacing: 6,
    textAlign: 'center', 
  },
  progressIndicator: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressText: {
    fontSize: 20,
    color: colors.gray, 
    marginBottom: 8,
  },
  modalProgressBarContainer: {
    width: 200,
  },
  modalProgressBarBg: {
    backgroundColor: '#E5E7EB',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  modalProgressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  modalActions: {
    width: '100%',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  resetModalButton: {
    backgroundColor: '#E8F4F8',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  soundModalButton: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 6,
  },
}); 