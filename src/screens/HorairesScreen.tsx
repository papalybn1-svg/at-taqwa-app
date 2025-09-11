  import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import {
    initializePrayerNotifications
} from '../services/prayerNotificationsService';
import {
    fetchPrayerTimes,
    formatPrayerTime,
    getCurrentDate,
    getHijriDate,
    getNextPrayerInfo
} from '../services/prayerTimesService';
import colors from '../theme/colors';

// Récupération des dimensions de l'écran
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

const PRAYER_LABELS = [
  { key: 'Fajr', label: 'Subh', icon: 'weather-sunset-up', color: '#FFA726' },
  { key: 'Dhuhr', label: 'Dhuhr', icon: 'weather-sunny', color: '#FF8A65' },
  { key: 'Asr', label: 'Asr', icon: 'weather-partly-cloudy', color: '#FF7043' },
  { key: 'Maghrib', label: 'Maghrib', icon: 'weather-sunset-down', color: '#FF7043' },
  { key: 'Isha', label: 'Isha', icon: 'weather-night', color: '#7E57C2' },
];

export default function HorairesScreen() {
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string> | null>(null);
  const [date, setDate] = useState('');
  const [hijri, setHijri] = useState('');
  const [city, setCity] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [enabledNotifications, setEnabledNotifications] = useState<{ [key: string]: boolean }>({});
  const [dimensions, setDimensions] = useState({ width: screenWidth, height: screenHeight });
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [nextPrayerInfo, setNextPrayerInfo] = useState<any>(null);

  // Ajout navigation pour bouton retour
  const navigation = require('@react-navigation/native').useNavigation();

  // Gestion des changements de dimensions d'écran
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Charger les données une seule fois au montage
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setOfflineMode(false);
        
        // Par défaut, charger Dakar si pas de localisation GPS
        const result = await fetchPrayerTimes('Dakar');
        
        if (!isMounted) return;
        
        setPrayerTimes(result.timings);
        setCity(result.city);
        setLastUpdate(result.lastUpdate);
        
        // Calculer la prochaine prière
        const nextPrayer = getNextPrayerInfo(result.timings);
        setNextPrayerInfo(nextPrayer);
        
        // Formatage de la date
        if (result.date) {
          const gregorian = result.date.gregorian;
          const hijri = result.date.hijri;
          
          setDate(`${gregorian.day} ${gregorian.month.fr || gregorian.month.en} ${gregorian.year}`);
          setHijri(`${hijri.day} ${hijri.month.fr || hijri.month.en} ${hijri.year}`);
        } else {
          setDate(getCurrentDate());
          setHijri(getHijriDate());
        }
        
        // Initialiser les notifications une seule fois
        await initializePrayerNotifications(result.timings);
        
      } catch (error) {
        if (!isMounted) return;
        console.log('❌ Erreur lors du chargement initial:', error);
        setOfflineMode(true);
        setDate(getCurrentDate());
        setHijri(getHijriDate());
        setCity('Dakar (offline)');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Dépendances vides pour ne charger qu'une fois

  // Fonction pour changer de ville
  const handleCityChange = async () => {
    if (!cityInput.trim()) return;
    
    try {
      setLoading(true);
      setOfflineMode(false);
      
      const result = await fetchPrayerTimes(cityInput.trim());
      setPrayerTimes(result.timings);
      setCity(result.city);
      setLastUpdate(result.lastUpdate);
      
      // Calculer la prochaine prière
      const nextPrayer = getNextPrayerInfo(result.timings);
      setNextPrayerInfo(nextPrayer);
      
      // Formatage de la date
      if (result.date) {
        const gregorian = result.date.gregorian;
        const hijri = result.date.hijri;
        
        setDate(`${gregorian.day} ${gregorian.month.fr || gregorian.month.en} ${gregorian.year}`);
        setHijri(`${hijri.day} ${hijri.month.fr || hijri.month.en} ${hijri.year}`);
      }
      
      // Initialiser les notifications pour la nouvelle ville
      await initializePrayerNotifications(result.timings);
      
      setModalVisible(false);
      setCityInput('');
      
    } catch (error) {
      console.log('❌ Erreur lors du changement de ville:', error);
      setOfflineMode(true);
    } finally {
      setLoading(false);
    }
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

  // Formater l'heure de dernière mise à jour
  const formatLastUpdate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--/-- --:--';
    }
  };

  if (loading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des horaires...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler enabled={Platform.OS === 'ios'} onGestureEvent={onGestureEvent}>
        <View style={styles.container}>
          {/* Header moderne cohérent avec les autres pages */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Heures de prière</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Image d'en-tête */}
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/heurepriere.jpg')}
              style={styles.headerImage}
              resizeMode="cover"
            />
          </View>

          {/* Carte dorée avec date */}
          <View style={styles.dateCard}>
            <View style={styles.dateIconContainer}>
              <MaterialCommunityIcons name="calendar" size={24} color="#2C3E50" />
            </View>
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateText}>{date || '23 Janvier 2025'}</Text>
              <Text style={styles.hijriText}>{hijri || '24 Rajab 1446'}</Text>
            </View>
          </View>

          {/* Section ville */}
          <View style={styles.citySection}>
            <View style={styles.cityInfo}>
              <MaterialCommunityIcons name="map-marker" size={isTablet ? 20 : (isSmallScreen ? 14 : 16)} color={colors.primary} />
              <Text style={styles.cityText}>{city || 'Dakar'}</Text>
            </View>
            <TouchableOpacity style={styles.changeCityButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.changeCityText}>Changer</Text>
              <MaterialCommunityIcons name="chevron-right" size={isTablet ? 18 : (isSmallScreen ? 12 : 14)} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Indicateur mode hors ligne */}
          {offlineMode && (
            <View style={styles.offlineBanner}>
              <MaterialCommunityIcons name="wifi-off" size={16} color="#FF6B6B" />
              <Text style={styles.offlineText}>Mode hors ligne - Dernières données disponibles</Text>
            </View>
          )}

          {/* Liste des prières */}
          <View style={styles.prayerListContainer}>
            <ScrollView 
              style={styles.prayerListContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.prayerListContentContainer}
            >
              {PRAYER_LABELS.map((item, index) => {
                const isNextPrayer = nextPrayerInfo?.key === item.key;
                
                return (
                  <View key={item.key}>
                    <View style={[
                      styles.prayerRow,
                      isNextPrayer && styles.nextPrayerRow
                    ]}>
                      <View style={styles.prayerLeftSection}>
                        <View style={[
                          styles.prayerIconContainer,
                          isNextPrayer && styles.nextPrayerIconContainer
                        ]}>
                          <MaterialCommunityIcons 
                            name={item.icon as any} 
                            size={isTablet ? 20 : (isSmallScreen ? 14 : 16)} 
                            color={isNextPrayer ? '#FFFFFF' : item.color} 
                          />
                        </View>
                        <View style={styles.prayerLabelContainer}>
                          <Text style={[
                            styles.prayerLabel,
                            isNextPrayer && styles.nextPrayerLabel
                          ]}>
                            {item.label}
                          </Text>
                          {isNextPrayer && (
                            <View style={styles.nextPrayerIndicator}>
                              <Text style={styles.nextPrayerIndicatorText}>Prochaine</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.prayerRightSection}>
                        <Text style={[
                          styles.prayerTime,
                          isNextPrayer && styles.nextPrayerTime
                        ]}>
                          {prayerTimes ? formatPrayerTime(prayerTimes[item.key]) : '6H01'}
                        </Text>
                        {isNextPrayer && nextPrayerInfo && (
                          <View style={styles.countdownContainer}>
                            <Text style={styles.countdownText}>
                              Dans {nextPrayerInfo.minutesUntil} min
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {index < PRAYER_LABELS.length - 1 && <View style={styles.prayerSeparator} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </PanGestureHandler>

      {/* Modal choix ville */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choisir une ville</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Entrer une ville (ex: Dakar)"
              value={cityInput}
              onChangeText={setCityInput}
              placeholderTextColor="#999"
            />
            
            {/* Liste des villes disponibles */}
            <View style={styles.availableCitiesContainer}>
              <Text style={styles.availableCitiesTitle}>Villes principales du Sénégal :</Text>
              <View style={styles.availableCitiesList}>
                {[
                  'Dakar', 'Saint-Louis', 'Thiès', 'Kaolack', 'Ziguinchor',
                  'Touba', 'Mbour', 'Rufisque', 'Diourbel', 'Louga',
                  'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Sédhiou'
                ].map((cityName) => (
                  <TouchableOpacity
                    key={cityName}
                    style={styles.cityOption}
                    onPress={() => {
                      setCityInput(cityName);
                    }}
                  >
                    <Text style={styles.cityOptionText}>{cityName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleCityChange}>
                <Text style={styles.modalConfirmText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  backButton: { 
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 44,
  },
  headerContainer: { 
    height: isTablet ? 160 : (isSmallScreen ? 120 : 140), 
    borderRadius: isTablet ? 22 : 18, 
    marginHorizontal: isTablet ? 32 : 20, 
    marginTop: 12, 
    overflow: 'hidden', 
    position: 'relative',
    backgroundColor: colors.primary,
  },
  headerImage: { 
    width: '100%', 
    height: '100%', 
  },
  dateCard: {
    backgroundColor: '#D4AF37',
    borderRadius: isTablet ? 26 : 22,
    marginHorizontal: isTablet ? 32 : 20,
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: isTablet ? 14 : 10,
    paddingHorizontal: isTablet ? 20 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    zIndex: 2,
  },
  dateIconContainer: {
    width: isTablet ? 32 : 28,
    height: isTablet ? 32 : 28,
    borderRadius: isTablet ? 16 : 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isTablet ? 14 : 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 15),
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  hijriText: {
    fontSize: isTablet ? 14 : (isSmallScreen ? 11 : 12),
    color: '#2C3E50',
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'center',
  },
  citySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: isTablet ? 32 : 20,
    marginBottom: 12,
    paddingVertical: isTablet ? 8 : 6,
    paddingHorizontal: isTablet ? 16 : 12,
    borderRadius: isTablet ? 16 : 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
  },
  cityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityText: {
    fontSize: isTablet ? 16 : (isSmallScreen ? 12 : 13),
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: isTablet ? 8 : 6,
  },
  changeCityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: isTablet ? 6 : 4,
    paddingHorizontal: isTablet ? 12 : 8,
    borderRadius: isTablet ? 14 : 10,
  },
  changeCityText: {
    fontSize: isTablet ? 14 : (isSmallScreen ? 11 : 12),
    fontWeight: '600',
    color: colors.primary,
    marginRight: isTablet ? 4 : 3,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  offlineText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 8,
    fontWeight: '500',
  },
  prayerListContainer: {
    backgroundColor: colors.primary,
    marginHorizontal: isTablet ? 32 : 20,
    marginTop: 0,
    marginBottom: 0,
    borderTopLeftRadius: isTablet ? 20 : 16,
    borderTopRightRadius: isTablet ? 20 : 16,
    borderBottomLeftRadius: isTablet ? 20 : 16,
    borderBottomRightRadius: isTablet ? 20 : 16,
    paddingTop: 2,
    paddingBottom: isTablet ? 40 : 32,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  prayerListContent: {
    flex: 1,
  },
  prayerListContentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 24 : 18,
    paddingVertical: isTablet ? 12 : 8,
  },
  prayerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerIconContainer: {
    width: isTablet ? 38 : 32,
    height: isTablet ? 38 : 32,
    borderRadius: isTablet ? 19 : 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isTablet ? 14 : 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  prayerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginHorizontal: isTablet ? 28 : 20,
    marginVertical: 1,
  },
  prayerLabel: {
    fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 15),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  prayerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerTime: {
    fontSize: isTablet ? 16 : (isSmallScreen ? 13 : 14),
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: isTablet ? 14 : 10,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: isTablet ? 24 : 20,
    padding: isTablet ? 32 : 24,
    width: isTablet ? '70%' : '85%',
    maxWidth: isTablet ? 500 : 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: isTablet ? 22 : (isSmallScreen ? 16 : 18),
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: isTablet ? 24 : 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: isTablet ? 16 : 12,
    padding: isTablet ? 16 : 12,
    fontSize: isTablet ? 18 : (isSmallScreen ? 15 : 16),
    marginBottom: isTablet ? 24 : 20,
    backgroundColor: '#F8F9FA',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    padding: isTablet ? 16 : 12,
    borderRadius: isTablet ? 16 : 12,
    backgroundColor: '#E0E0E0',
    marginRight: isTablet ? 12 : 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: isTablet ? 16 : (isSmallScreen ? 13 : 14),
  },
  modalConfirmButton: {
    flex: 1,
    padding: isTablet ? 16 : 12,
    borderRadius: isTablet ? 16 : 12,
    backgroundColor: colors.primary,
    marginLeft: isTablet ? 12 : 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: isTablet ? 16 : (isSmallScreen ? 13 : 14),
  },
  availableCitiesContainer: {
    marginTop: isTablet ? 20 : 15,
    marginBottom: isTablet ? 20 : 15,
  },
  availableCitiesTitle: {
    fontSize: isTablet ? 16 : (isSmallScreen ? 13 : 14),
    fontWeight: 'bold',
    color: '#555',
    marginBottom: isTablet ? 12 : 8,
  },
  availableCitiesList: {
    backgroundColor: '#F0F0F0',
    borderRadius: isTablet ? 14 : 10,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 14 : 10,
  },
  cityOption: {
    paddingVertical: isTablet ? 10 : 8,
    paddingHorizontal: isTablet ? 14 : 10,
    borderRadius: isTablet ? 10 : 8,
    marginVertical: isTablet ? 3 : 2,
  },
  cityOptionText: {
    fontSize: isTablet ? 15 : (isSmallScreen ? 12 : 13),
    color: '#333',
  },
  // Styles pour la prochaine prière
  nextPrayerRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: isTablet ? 16 : 12,
    marginHorizontal: isTablet ? 8 : 4,
    marginVertical: isTablet ? 4 : 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nextPrayerIconContainer: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  prayerLabelContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  nextPrayerLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  nextPrayerIndicator: {
    backgroundColor: '#FFD700',
    paddingHorizontal: isTablet ? 8 : 6,
    paddingVertical: isTablet ? 2 : 1,
    borderRadius: isTablet ? 10 : 8,
    alignSelf: 'flex-start',
    marginTop: isTablet ? 4 : 2,
  },
  nextPrayerIndicatorText: {
    fontSize: isTablet ? 12 : (isSmallScreen ? 9 : 10),
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  nextPrayerTime: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: isTablet ? 18 : (isSmallScreen ? 15 : 16),
  },
  countdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: isTablet ? 8 : 6,
    paddingVertical: isTablet ? 4 : 2,
    borderRadius: isTablet ? 10 : 8,
    marginTop: isTablet ? 4 : 2,
  },
  countdownText: {
    fontSize: isTablet ? 12 : (isSmallScreen ? 9 : 10),
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
}); 