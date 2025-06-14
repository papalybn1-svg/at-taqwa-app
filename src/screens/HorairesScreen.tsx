import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../theme/colors';

const PRAYER_LABELS = [
  { key: 'Fajr', label: 'Fajr' },
  { key: 'Sunrise', label: 'Subh' },
  { key: 'Dhuhr', label: 'Dhuhr' },
  { key: 'Asr', label: 'Asr' },
  { key: 'Maghrib', label: 'Maghreb' },
  { key: 'Isha', label: 'Isha' },
];
const femmePrieImage = require('../../assets/femme-prie.png');
const defaultImage = require('../../assets/priere.png');

// Fonction utilitaire pour formater l'heure
function formatPrayerTime(time: string) {
  if (!time) return '--h--';
  // Si c'est déjà HH:MM, on formate
  if (/^\d{2}:\d{2}$/.test(time)) {
    const [h, m] = time.split(':');
    return `${h}h${m}`;
  }
  // Si c'est une date ISO, on extrait l'heure
  const match = time.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}h${match[2]}`;
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
          // Silencieux
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
      } else {
        // Silencieux
      }
    } catch (e) {
      // Silencieux
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
        trigger: { hour, minute, repeats: true, type: 'calendar' },
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
    <View style={styles.container}>
      {/* Bannière */}
      <View style={styles.bannerContainer}>
        <Image source={femmePrieImage} style={styles.bannerImgLarge} />
      </View>
      {/* Bloc date + bouton ville */}
      <View style={styles.dateCard}>
        <Image source={defaultImage} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.cityBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.cityBtnText}>{city ? city : 'Ma ville'}</Text>
          </TouchableOpacity>
          <Text style={styles.dateTextYellow}>{date || '--'}</Text>
          <Text style={styles.hijriTextYellow}>{hijri || '--'}</Text>
        </View>
      </View>
      {/* Liste des prières */}
      <View style={styles.prayerListCardV2Compact}>
        {loading ? (
          <ActivityIndicator color={colors.white} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={PRAYER_LABELS}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <View style={[styles.prayerRowV2, nextPrayerKey === item.key && styles.nextPrayerHighlight]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={defaultImage} style={styles.prayerIconV2} />
                  <Text style={styles.prayerLabelV2}>{item.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.prayerTimeV2}>{prayerTimes ? formatPrayerTime(prayerTimes[item.key]) : '--h--'}</Text>
                  <TouchableOpacity
                    style={styles.bellBtnV2}
                    onPress={async () => {
                      if (enabledNotifications[item.key]) {
                        await cancelPrayerNotification(item.key);
                      } else if (prayerTimes && prayerTimes[item.key]) {
                        await schedulePrayerNotification(item.key, prayerTimes[item.key], item.label);
                      }
                    }}
                  >
                    <Image
                      source={defaultImage}
                      style={[styles.bellIconV2, enabledNotifications[item.key] && { tintColor: '#FFD700' }]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separatorV2} />}
          />
        )}
      </View>
      {/* Modal choix ville */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Choisir une ville</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrer une ville (ex: Dakar)"
              value={cityInput}
              onChangeText={setCityInput}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleCitySelect}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.primary }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F7', padding: 0 },
  bannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: Dimensions.get('window').height * 0.23,
    marginBottom: -18,
  },
  bannerImgLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  dateCard: {
    backgroundColor: '#E7C97B',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    padding: 16,
    marginTop: -30,
    marginBottom: 10,
    width: '85%',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 12 },
  dateTextYellow: {
    color: '#7A5B00',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 4,
    marginLeft: 2,
  },
  hijriTextYellow: {
    color: '#7A5B00',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 2,
    marginLeft: 2,
    opacity: 0.8,
  },
  cityBtn: { marginLeft: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14 },
  cityBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  prayerListCardV2Compact: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginHorizontal: 8,
    paddingVertical: 0,
    marginTop: 8,
    flex: 1,
    justifyContent: 'center',
  },
  prayerRowV2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginVertical: 0,
  },
  prayerIconV2: { width: 26, height: 26, marginRight: 12, resizeMode: 'contain' },
  prayerLabelV2: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  prayerTimeV2: { color: colors.white, fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  bellBtnV2: { padding: 4 },
  bellIconV2: { width: 18, height: 18, tintColor: colors.white },
  separatorV2: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 18 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: 300, alignItems: 'center', elevation: 6 },
  input: { backgroundColor: '#F3F5F7', borderRadius: 10, padding: 10, width: '100%', marginBottom: 12, fontSize: 15 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 32, marginTop: 8 },
  nextPrayerHighlight: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
}); 