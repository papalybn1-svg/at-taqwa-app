import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

const PRAYER_LABELS = [
  { key: 'Fajr', label: 'Fajr', icon: 'weather-sunset-up', color: '#FFA726' },
  { key: 'Sunrise', label: 'Lever du soleil', icon: 'white-balance-sunny', color: '#FFD54F' },
  { key: 'Dhuhr', label: 'Dhuhr', icon: 'weather-sunny', color: '#FF8A65' },
  { key: 'Asr', label: 'Asr', icon: 'weather-partly-cloudy', color: '#FF7043' },
  { key: 'Maghrib', label: 'Maghrib', icon: 'weather-sunset-down', color: '#FF7043' },
  { key: 'Isha', label: 'Isha', icon: 'weather-night', color: '#7E57C2' },
];

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
    fetchPrayerTimes();
    // Ne pas afficher d'alerte si expo-notifications n'est pas supporté
    try {
      Notifications.requestPermissionsAsync();
    } catch (e) {
      // Silencieux
    }
  }, []);

  const fetchPrayerTimes = async (manualCity?: string) => {
    setLoading(true);
    try {
      let url = '';
      if (manualCity || city) {
        const targetCity = manualCity || city;
        url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(targetCity)}&country=&method=2&school=1&iso8601=true`;
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Utiliser des données par défaut
          setPrayerTimes({
            Fajr: '05:30',
            Sunrise: '06:45',
            Dhuhr: '13:15',
            Asr: '16:30',
            Maghrib: '19:45',
            Isha: '21:00'
          });
          setDate('23 Janvier 2025');
          setHijri('24 Rajab 1446');
          setCity('Dakar');
          setLoading(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now()/1000)}?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&method=2&school=1&iso8601=true`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 200) {
        setPrayerTimes(data.data.timings);
        setDate(`${data.data.date.gregorian.day} ${data.data.date.gregorian.month.en} ${data.data.date.gregorian.year}`);
        setHijri(`${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`);
        if (data.data.meta && data.data.meta.timezone) {
          setCity(manualCity || city); 
        }
      } else {
        // Données par défaut en cas d'erreur
        setPrayerTimes({
          Fajr: '05:30',
          Sunrise: '06:45',
          Dhuhr: '13:15',
          Asr: '16:30',
          Maghrib: '19:45',
          Isha: '21:00'
        });
        setDate('23 Janvier 2025');
        setHijri('24 Rajab 1446');
        setCity('Dakar');
      }
    } catch (e) {
      // Données par défaut en cas d'erreur
      setPrayerTimes({
        Fajr: '05:30',
        Sunrise: '06:45',
        Dhuhr: '13:15',
        Asr: '16:30',
        Maghrib: '19:45',
        Isha: '21:00'
      });
      setDate('23 Janvier 2025');
      setHijri('24 Rajab 1446');
      setCity('Dakar');
    }
    setLoading(false);
  };

  const handleCitySelect = () => {
    setModalVisible(false);
    setCity(cityInput);
    fetchPrayerTimes(cityInput);
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
      // Formate l'heure
      let h, m;
      if (/^\d{2}:\d{2}$/.test(time)) {
        [h, m] = time.split(':');
      } else {
        const match = time.match(/T(\d{2}):(\d{2})/);
        if (match) {
          h = match[1]; m = match[2];
        } else return;
      }
      const hour = Number(h);
      const minute = Number(m);
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
    } catch (e) {
      // Silencieux si non supporté
    }
  }

  // Fonction pour annuler une notification
  async function cancelPrayerNotification(prayerKey: string) {
    try {
      const id = enabledNotifications[prayerKey];
      if (id) {
        await Notifications.cancelScheduledNotificationAsync(id);
        setEnabledNotifications((prev) => ({ ...prev, [prayerKey]: null }));
      }
    } catch (e) {
      // Silencieux si non supporté
    }
  }

  return (
    <SafeAreaView style={styles.container}>
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
                      if (enabledNotifications[item.key]) {
                        await cancelPrayerNotification(item.key);
                      } else if (prayerTimes && prayerTimes[item.key]) {
                        await schedulePrayerNotification(item.key, prayerTimes[item.key], item.label);
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
    </SafeAreaView>
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

}); 