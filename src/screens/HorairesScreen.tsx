import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../theme/colors';

const PRAYER_LABELS = [
  { key: 'Fajr', label: 'Fajr', icon: 'weather-sunset-up', color: '#FFA726' },
  { key: 'Sunrise', label: 'Lever du soleil', icon: 'white-balance-sunny', color: '#FFD54F' },
  { key: 'Dhuhr', label: 'Dhuhr', icon: 'weather-sunny', color: '#FF8A65' },
  { key: 'Asr', label: 'Asr', icon: 'weather-partly-cloudy', color: '#FF7043' },
  { key: 'Maghrib', label: 'Maghrib', icon: 'weather-sunset-down', color: '#FF7043' },
  { key: 'Isha', label: 'Isha', icon: 'weather-night', color: '#7E57C2' },
];

// Fonction pour obtenir la date actuelle en français
function getCurrentDate() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  return now.toLocaleDateString('fr-FR', options);
}

// Fonction pour obtenir la date Hijri approximative
function getHijriDate() {
  const now = new Date();
  // Conversion approximative (peut être améliorée avec une vraie API Hijri)
  const gregorianYear = now.getFullYear();
  const hijriYear = gregorianYear - 579; // Approximation
  const hijriMonth = now.getMonth() + 1;
  const hijriDay = now.getDate();
  
  const hijriMonths = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaaban',
    'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'
  ];
  
  return `${hijriDay} ${hijriMonths[hijriMonth - 1]} ${hijriYear}`;
}

// Fonction utilitaire pour formater l'heure
function formatPrayerTime(time: string) {
  if (!time) return '6H01';
  // Si c'est déjà HH:MM, on formate
  if (/^\d{2}:\d{2}$/.test(time)) {
    const [h, m] = time.split(':');
    return `${h}H${m}`;
  }
  // Si c'est une date ISO, on extrait l'heure
  const match = time.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}H${match[2]}`;
  }
  // Sinon, retourne brut
  return time;
}

export default function HorairesScreen() {
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [date, setDate] = useState('');
  const [hijri, setHijri] = useState('');
  const [city, setCity] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [enabledNotifications, setEnabledNotifications] = useState<{ [key: string]: string | null }>({});

  // Ajout navigation pour bouton retour
  const navigation = require('@react-navigation/native').useNavigation();

  useEffect(() => {
    // Fonction sécurisée pour charger les données
    const loadData = async () => {
      try {
        await fetchPrayerTimes();
      } catch (error) {
        console.log('❌ Erreur lors du chargement initial:', error);
        // L'erreur est déjà gérée dans fetchPrayerTimes
      }
    };
    
    // Gestion sécurisée des permissions de notifications
    const requestNotificationPermissions = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('🔔 Status permissions notifications:', status);
      } catch (error) {
        console.log('❌ Erreur permissions notifications:', error);
        // Continue sans notifications si erreur
      }
    };
    
    // Exécuter les fonctions de manière sécurisée
    loadData();
    requestNotificationPermissions();
  }, []);

  const fetchPrayerTimes = async (manualCity?: string) => {
    setLoading(true);
    try {
      let url = '';
      let targetCity = 'Dakar'; // Ville par défaut
      
      if (manualCity) {
        targetCity = manualCity;
        // API pour une ville spécifique du Sénégal
        url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(targetCity)}&country=Senegal&method=4&school=1`;
      } else {
        try {
          // Demander la permission de localisation
          let { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status === 'granted') {
            // Si permission accordée, utiliser la localisation GPS
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 10
            });
            
            console.log('📍 Localisation GPS obtenue:', location.coords.latitude, location.coords.longitude);
            
            // API avec coordonnées GPS précises
            url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now()/1000)}?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&method=4&school=1`;
          } else {
            console.log('🚫 Permission localisation refusée, utilisation Dakar par défaut');
            url = `https://api.aladhan.com/v1/timingsByCity?city=Dakar&country=Senegal&method=4&school=1`;
          }
        } catch (locationError) {
          console.log('❌ Erreur localisation, utilisation Dakar par défaut:', locationError);
          url = `https://api.aladhan.com/v1/timingsByCity?city=Dakar&country=Senegal&method=4&school=1`;
        }
      }
      
      console.log('🌐 Appel API heures de prière:', url);
      
      // Timeout pour éviter les appels trop longs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes max
      
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'At-Taqwa-App/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ Réponse API reçue:', data.status);
      
      if (data.code === 200 && data.data && data.data.timings) {
        setPrayerTimes(data.data.timings);
        
        // Formatage de la date
        if (data.data.date) {
          const gregorian = data.data.date.gregorian;
          const hijri = data.data.date.hijri;
          
          setDate(`${gregorian.day} ${gregorian.month.fr || gregorian.month.en} ${gregorian.year}`);
          setHijri(`${hijri.day} ${hijri.month.fr || hijri.month.en} ${hijri.year}`);
        }
        
        // Mise à jour de la ville
        if (manualCity) {
          setCity(manualCity);
        } else if (data.data.meta && data.data.meta.timezone) {
          setCity(targetCity);
        }
        
        console.log('✅ Heures de prière mises à jour avec succès');
      } else {
        throw new Error('Format de réponse API invalide');
      }
      
    } catch (error) {
      console.log('❌ Erreur lors de la récupération des heures de prière:', error);
      
      // En cas d'erreur API, utiliser des données de fallback mais avec la date actuelle
      const fallbackTimes = {
        Fajr: '05:45',
        Sunrise: '07:00',
        Dhuhr: '13:15',
        Asr: '16:30',
        Maghrib: '19:30',
        Isha: '20:45'
      };
      
      setPrayerTimes(fallbackTimes);
      setDate(getCurrentDate());
      setHijri(getHijriDate());
      setCity(manualCity || 'Dakar');
      
      console.log('⚠️ Utilisation des données de fallback en raison d\'une erreur API');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = () => {
    try {
      setModalVisible(false);
      if (cityInput.trim()) {
        const selectedCity = cityInput.trim();
        
        // Liste des villes principales du Sénégal
        const senegalCities = [
          'Dakar', 'Saint-Louis', 'Thiès', 'Kaolack', 'Ziguinchor',
          'Touba', 'Mbour', 'Rufisque', 'Diourbel', 'Louga',
          'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Sédhiou',
          'Matam', 'Kédougou', 'Podor', 'Bakel', 'Kédougou'
        ];
        
        // Recherche de la ville (insensible à la casse)
        const foundCity = senegalCities.find(city => 
          city.toLowerCase().includes(selectedCity.toLowerCase()) ||
          selectedCity.toLowerCase().includes(city.toLowerCase())
        );
        
        if (foundCity) {
          setCity(foundCity);
          fetchPrayerTimes(foundCity);
          console.log('✅ Ville sélectionnée:', foundCity);
        } else {
          console.log('⚠️ Ville non trouvée, utilisation Dakar par défaut');
          setCity('Dakar');
          fetchPrayerTimes('Dakar');
        }
      } else {
        console.log('⚠️ Nom de ville vide, utilisation Dakar par défaut');
        setCity('Dakar');
        fetchPrayerTimes('Dakar');
      }
    } catch (error) {
      console.log('❌ Erreur lors du changement de ville:', error);
      setModalVisible(false);
      setCity('Dakar');
      fetchPrayerTimes('Dakar');
    }
  };

  // Détection de la prochaine prière
  function getNextPrayer() {
    if (!prayerTimes) return null;
    const now = new Date();
    let nextKey = null;
    let minDiff = Infinity;
    for (const item of PRAYER_LABELS) {
      const t = prayerTimes[item.key];
      if (!t) continue;
      let h, m;
      if (/^\d{2}:\d{2}$/.test(t)) {
        [h, m] = t.split(':');
      } else {
        const match = t.match(/T(\d{2}):(\d{2})/);
        if (match) {
          h = match[1]; m = match[2];
        } else continue;
      }
      const prayerDate = new Date(now);
      prayerDate.setHours(Number(h), Number(m), 0, 0);
      const diff = prayerDate.getTime() - now.getTime();
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextKey = item.key;
      }
    }
    return nextKey;
  }
  const nextPrayerKey = getNextPrayer();

  // Fonction pour planifier une notification locale
  async function schedulePrayerNotification(prayerKey: string, time: string, label: string) {
    try {
      // Vérifier d'abord les permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('🔔 Permissions notifications non accordées');
        return;
      }
      
      // Formate l'heure
      let h, m;
      if (/^\d{2}:\d{2}$/.test(time)) {
        [h, m] = time.split(':');
      } else {
        const match = time.match(/T(\d{2}):(\d{2})/);
        if (match) {
          h = match[1]; m = match[2];
        } else {
          console.log('❌ Format d\'heure invalide pour notification:', time);
          return;
        }
      }
      
      const hour = Number(h);
      const minute = Number(m);
      
      if (isNaN(hour) || isNaN(minute)) {
        console.log('❌ Heures invalides pour notification:', h, m);
        return;
      }
      
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Heure de ${label}`,
          body: `C'est l'heure de la prière ${label}`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        },
      });
      
      setEnabledNotifications((prev) => ({ ...prev, [prayerKey]: id }));
      console.log('✅ Notification programmée pour', label, 'à', `${h}:${m}`);
    } catch (error) {
      console.log('❌ Erreur lors de la programmation de notification:', error);
    }
  }

  // Fonction pour annuler une notification
  async function cancelPrayerNotification(prayerKey: string) {
    try {
      const id = enabledNotifications[prayerKey];
      if (id) {
        await Notifications.cancelScheduledNotificationAsync(id);
        setEnabledNotifications((prev) => ({ ...prev, [prayerKey]: null }));
        console.log('✅ Notification annulée pour', prayerKey);
      }
    } catch (error) {
      console.log('❌ Erreur lors de l\'annulation de notification:', error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header allégé avec bouton retour */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Heures de prière</Text>
        <View style={{width:32}} />
      </View>
      {/* Image plus discrète */}
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
          <Image 
            source={require('../../assets/priere.png')} 
            style={styles.dateIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.dateTextContainer}>
          <Text style={styles.dateText}>{date || '23 Janvier 2025'}</Text>
          <Text style={styles.hijriText}>{hijri || '24 Rajab 1446'}</Text>
        </View>
      </View>

      {/* Section ville */}
      <View style={styles.citySection}>
        <View style={styles.cityInfo}>
          <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
          <Text style={styles.cityText}>{city || 'Dakar'}</Text>
        </View>
        <TouchableOpacity style={styles.changeCityButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.changeCityText}>Changer</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Liste des prières */}
      <View style={styles.prayerListContainer}>
        {loading ? (
          <ActivityIndicator color={colors.white} size="large" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.prayerListContent}>
            {PRAYER_LABELS.map((item, index) => (
              <View key={item.key}>
                <View style={styles.prayerRow}>
                  <View style={styles.prayerLeftSection}>
                    <View style={styles.prayerIconContainer}>
                      <MaterialCommunityIcons 
                        name={item.icon as any} 
                        size={16} 
                        color={item.color} 
                      />
                    </View>
                    <Text style={styles.prayerLabel}>
                      {item.label}
                    </Text>
                </View>
                  <View style={styles.prayerRightSection}>
                    <Text style={styles.prayerTime}>
                      {prayerTimes ? formatPrayerTime(prayerTimes[item.key]) : '6H01'}
                    </Text>
                  <TouchableOpacity
                      style={styles.notificationButton}
                    onPress={async () => {
                      try {
                        if (enabledNotifications[item.key]) {
                          await cancelPrayerNotification(item.key);
                        } else if (prayerTimes && prayerTimes[item.key]) {
                          await schedulePrayerNotification(item.key, prayerTimes[item.key], item.label);
                        }
                      } catch (error) {
                        console.log('❌ Erreur lors de la gestion de notification:', error);
                      }
                    }}
                  >
                      <MaterialCommunityIcons 
                        name={enabledNotifications[item.key] ? "bell" : "bell-outline"} 
                        size={16} 
                        color={enabledNotifications[item.key] ? "#FFD700" : "rgba(255, 255, 255, 0.8)"} 
                    />
                  </TouchableOpacity>
                  </View>
                </View>
                {index < PRAYER_LABELS.length - 1 && <View style={styles.prayerSeparator} />}
              </View>
            ))}
          </View>
        )}
      </View>

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
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleCitySelect}>
                <Text style={styles.modalConfirmText}>Valider</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#eee', zIndex: 10 },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: '#f8f9fa', marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  headerContainer: { height: 180, borderRadius: 18, marginHorizontal: 20, marginTop: 12, overflow: 'hidden', position: 'relative' },
  headerImage: { width: '100%', height: '100%', opacity: 0.7 },
  dateCard: {
    backgroundColor: '#D4AF37',
    borderRadius: 22,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  dateIcon: {
    width: 38,
    height: 38,
    backgroundColor: 'transparent',
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  hijriText: {
    fontSize: 12,
    color: '#2C3E50',
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'center',
  },
  prayerListContainer: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 2,
    paddingBottom: 24,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  prayerListContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  prayerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  prayerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginHorizontal: 20,
    marginVertical: 1,
  },
  prayerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  prayerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 10,
    letterSpacing: 0.3,
  },
  notificationButton: {
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  citySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 6,
  },
  changeCityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  changeCityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 3,
  },
  availableCitiesContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  availableCitiesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  availableCitiesList: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cityOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 2,
  },
  cityOptionText: {
    fontSize: 13,
    color: '#333',
  },

}); 