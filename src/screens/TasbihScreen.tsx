import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { collection, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Vibration, View } from "react-native";
import { useAuthContext } from '../contexts/AuthContext';
import colors from "../theme/colors";
import { read as readUserStorage, write as writeUserStorage } from '../utils/userStorage';

const SOUND_ENABLED_KEY = '@sound_enabled';
const CUSTOM_ZIKRS_KEY = '@custom_zikrs';
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
  const { user } = useAuthContext();
  const [systemZikrs, setSystemZikrs] = useState<Zikr[]>([]);
  const [customZikrs, setCustomZikrs] = useState<Zikr[]>([]);
  const [zikrProgress, setZikrProgress] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [activeZikr, setActiveZikr] = useState<ActiveZikr | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'system'>('system');
  const [newZikr, setNewZikr] = useState({
    text: '',
    description: '',
    max: 0
  });
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

  // Charger les zikrs personnalisés
  const loadCustomZikrs = useCallback(async () => {
    try {
      const savedCustomZikrs = await AsyncStorage.getItem(CUSTOM_ZIKRS_KEY);
      if (savedCustomZikrs) {
        const parsedCustomZikrs = JSON.parse(savedCustomZikrs);
        setCustomZikrs(parsedCustomZikrs);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des zikrs personnalisés:', error);
    }
  }, []);

  // Sauvegarder les zikrs personnalisés
  const saveCustomZikrs = useCallback(async (zikrs: Zikr[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_ZIKRS_KEY, JSON.stringify(zikrs));
      setCustomZikrs(zikrs);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des zikrs personnalisés:', error);
    }
  }, []);

  // Créer un nouveau zikr
  const createCustomZikr = useCallback(async () => {
    if (!newZikr.text.trim() || !newZikr.description.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const customZikr: Zikr = {
      id: `custom_${Date.now()}`,
      category: 'Mes Zikrs',
      text: newZikr.text.trim(),
      description: newZikr.description.trim(),
      max: newZikr.max
    };

    const updatedCustomZikrs = [...customZikrs, customZikr];
    await saveCustomZikrs(updatedCustomZikrs);
    
    // Initialiser le progrès pour le nouveau zikr
    setZikrProgress(prev => ({ ...prev, [customZikr.id]: 0 }));
    
    // Réinitialiser le formulaire
    setNewZikr({ text: '', description: '', max: 33 });
    setShowCreateModal(false);
    
    Alert.alert('Succès', 'Zikr créé avec succès !');
  }, [customZikrs, newZikr, saveCustomZikrs]);

  // Supprimer un zikr personnalisé
  const deleteCustomZikr = useCallback(async (id: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce zikr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedCustomZikrs = customZikrs.filter(zikr => zikr.id !== id);
            await saveCustomZikrs(updatedCustomZikrs);
            
            // Supprimer le progrès associé
            const updatedProgress = { ...zikrProgress };
            delete updatedProgress[id];
            setZikrProgress(updatedProgress);
          }
        }
      ]
    );
  }, [customZikrs, zikrProgress, saveCustomZikrs]);

  const loadZikrData = useCallback(async () => {
    setLoading(true);
    try {
      // Load progress first (scopé par utilisateur)
      const savedProgress = await readUserStorage<{ [key: string]: number }>(user?.uid, 'zikrProgress');
      const progress = savedProgress || {};
      
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
          max: data.count || 0 
        });
      });
      
      setSystemZikrs(fetchedZikrs);

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
          max: 0 
        },
        { 
          id: 'default2', 
          category: 'Dhikr du soir',
          text: 'الْحَمْدُ لِلَّهِ',
          description: 'Alhamdulillah (Louange à Allah)',
                  max: 0 
        },
        { 
          id: 'default3', 
          category: 'Dhikr après prière',
          text: 'اللَّهُ أَكْبَرُ',
          description: 'Allahu Akbar (Allah est le plus grand)',
          max: 34 
        }
      ];
      setSystemZikrs(defaultZikrs);
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
    loadCustomZikrs();
    loadSoundPreference();
  }, [loadZikrData, loadCustomZikrs, loadSoundPreference, user?.uid]);

  useEffect(() => {
    if (user?.uid && Object.keys(zikrProgress).length > 0) {
      writeUserStorage(user.uid, 'zikrProgress', zikrProgress);
    }
  }, [zikrProgress, user?.uid]);

  const increment = (id: string) => {
    const allZikrs = [...systemZikrs, ...customZikrs];
    const zikr = allZikrs.find(z => z.id === id);
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

      {/* Onglets horizontaux */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'system' && styles.activeTab]}
          onPress={() => setActiveTab('system')}
        >
          <Text style={[styles.tabText, activeTab === 'system' && styles.activeTabText]}>
            Autres Zikrs
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'custom' && styles.activeTab]}
          onPress={() => setActiveTab('custom')}
        >
          <Text style={[styles.tabText, activeTab === 'custom' && styles.activeTabText]}>
            Mes Zikrs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bouton d'ajout pour les zikrs personnalisés */}
      {activeTab === 'custom' && (
        <TouchableOpacity 
          style={styles.floatingAddButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Contenu de l'onglet actif */}
        {activeTab === 'custom' ? (
        <View style={styles.section}>
            {customZikrs.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="heart-outline" size={64} color={colors.gray} />
                <Text style={styles.emptyStateTitle}>Aucun zikr personnalisé</Text>
                <Text style={styles.emptyStateText}>
                  Créez vos propres zikrs en appuyant sur le bouton + ci-dessus.
                </Text>
          </View>
            ) : (
              <View style={styles.zikrsList}>
                {customZikrs.map((item, index) => {
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
                        <View style={styles.cardHeaderActions}>
                          {isCompleted && (
                            <View style={styles.completedBadge}>
                              <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                            </View>
                          )}
                          <TouchableOpacity 
                            onPress={(e) => {
                              e.stopPropagation();
                              deleteCustomZikr(item.id);
                            }}
                            style={styles.deleteButton}
                          >
                            <MaterialCommunityIcons name="delete" size={16} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
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
        ) : (
          <View style={styles.section}>
            {systemZikrs.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={64} color={colors.gray} />
              <Text style={styles.emptyStateTitle}>Aucun zikr disponible</Text>
              <Text style={styles.emptyStateText}>
                Ajoutez des zikrs depuis le panneau administrateur pour commencer à pratiquer le dhikr.
              </Text>
            </View>
          ) : (
            <View style={styles.zikrsList}>
                {systemZikrs.map((item, index) => {
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
        )}

        {/* Section statistiques */}
        {(systemZikrs.length > 0 || customZikrs.length > 0) && (
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
                  {[...systemZikrs, ...customZikrs].filter(zikr => (zikrProgress[zikr.id] || 0) >= zikr.max).length}
              </Text>
                <Text style={styles.statLabel}>Complétés</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="progress-clock" size={24} color="#FF6B6B" />
                <Text style={styles.statNumber}>
                  {[...systemZikrs, ...customZikrs].filter(zikr => (zikrProgress[zikr.id] || 0) > 0 && (zikrProgress[zikr.id] || 0) < zikr.max).length}
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
                      source={require('../../assets/Chapelet_electronique_optimized.png')} 
                      style={styles.tasbihImage}
                      resizeMode="contain"
                      fadeDuration={0}
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

        {/* Modal de création de zikr - Style Admin Amélioré */}
        <Modal visible={showCreateModal} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.adminModalContainer}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.adminModalContent}>
              <Text style={styles.adminModalTitle}>Nouveau Zikr</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Texte du zikr</Text>
                <TextInput
                  style={styles.adminInput}
                  placeholder="Entrez le texte de votre zikr"
                  value={newZikr.text}
                  onChangeText={(text) => setNewZikr(prev => ({ ...prev, text }))}
                  multiline
                  placeholderTextColor={colors.gray}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.adminInput}
                  placeholder="Description de votre zikr"
                  value={newZikr.description}
                  onChangeText={(description) => setNewZikr(prev => ({ ...prev, description }))}
                  multiline
                  placeholderTextColor={colors.gray}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre maximum</Text>
                <TextInput
                  style={styles.adminInput}
                  placeholder="Entrez le nombre maximum"
                  value={String(newZikr.max)}
                  onChangeText={(text) => {
                    const max = parseInt(text) || 0;
                    setNewZikr(prev => ({ ...prev, max: max }));
                  }}
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray}
                />
              </View>
              
              <View style={styles.adminModalActions}>
                <TouchableOpacity 
                  style={[styles.adminModalButton, styles.cancelAdminButton]}
                  onPress={() => {
                    setNewZikr({ text: '', description: '', max: 0 });
                    setShowCreateModal(false);
                  }}
                >
                  <Text style={styles.cancelAdminButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                                <TouchableOpacity 
                  style={[
                    styles.adminModalButton, 
                    { backgroundColor: colors.primary },
                    (!newZikr.text.trim() || !newZikr.description.trim()) && { opacity: 0.6 }
                  ]}
                  onPress={createCustomZikr}
                  disabled={!newZikr.text.trim() || !newZikr.description.trim()}
                >
                  <Text style={styles.createAdminButtonText}>Créer</Text>
                </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    marginLeft: -10,
  },
  counterScreen: {
    position: 'absolute',
    top: '17%',
    left: '25%',
    right: '25%',
    bottom: '53%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  digitalCounter: {
    fontSize: 48,
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

  // Styles pour les nouvelles fonctionnalités
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Styles pour les onglets horizontaux
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },

  // Styles pour le nouveau modal de création
  createModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  createModalCloseButton: {
    padding: 4,
  },
  createModalContent: {
    padding: 20,
  },
  createInputContainer: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  createInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  createTextInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  inputCounter: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  createNumberInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    backgroundColor: colors.white,
    width: 80,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  previewContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  previewCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray,
  },
  createModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  createModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  cancelCreateButton: {
    backgroundColor: 'colors.secondary',
    borderWidth: 1,
    borderColor: 'colors.secondary',
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.gray,
    opacity: 0.4,
  },
  createModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Styles pour le modal admin
  adminModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  adminModalContent: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    elevation: 5
  },
  adminModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.primary
  },
  adminInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 16
  },
  adminModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  adminModalButton: {
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  adminButtonText: {
    color: colors.white,
    fontWeight: 'bold'
  },

  // Styles améliorés pour le modal admin
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  cancelAdminButton: {
    backgroundColor: 'colors.secondary',
  },
  cancelAdminButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  createAdminButton: {
    backgroundColor: colors.primary,
  },
  createAdminButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledAdminButton: {
    backgroundColor: colors.gray,
    opacity: 0.6,
  },
}); 