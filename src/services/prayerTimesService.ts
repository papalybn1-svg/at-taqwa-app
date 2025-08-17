import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Configuration MALIKITE pour le Sénégal
const MALIKITE_CONFIG = {
  method: 3, // Muslim World League (MWL)
  school: 0, // Shafi' (équivalent Malikite pour Asr)
  latitudeAdjustmentMethod: 'ANGLE_BASED',
  timezone: 'Africa/Dakar'
};

// Ordre des prières
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

// Fonction utilitaire pour convertir HH:MM en minutes
const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Fonction pour obtenir la date du jour au format YYYY-MM-DD
const getTodayDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Fonction pour générer la clé de cache
const getCacheKey = (date: string, timezone: string, method: number, school: number, city?: string): string => {
  const cityKey = city ? `:${city}` : '';
  return `prayer:${date}:${timezone}:${method}:${school}${cityKey}`;
};

// Fonction pour sauvegarder en cache
const saveToCache = async (key: string, data: any): Promise<void> => {
  try {
    const cacheData = {
      ...data,
      cachedAt: new Date().toISOString()
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    console.log('💾 Cache sauvegardé:', key);
  } catch (error) {
    console.log('❌ Erreur sauvegarde cache:', error);
  }
};

// Fonction pour récupérer du cache
const getFromCache = async (key: string): Promise<any | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      console.log('📦 Cache récupéré:', key);
      return data;
    }
  } catch (error) {
    console.log('❌ Erreur récupération cache:', error);
  }
  return null;
};

// Fonction pour construire l'URL de l'API (selon spécifications)
const buildApiUrl = (params: {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  method?: number;
  school?: number;
  timezone?: string;
}): string => {
  const {
    city,
    country,
    latitude,
    longitude,
    method = MALIKITE_CONFIG.method,
    school = MALIKITE_CONFIG.school,
    timezone = MALIKITE_CONFIG.timezone
  } = params;

  const baseParams = `method=${method}&school=${school}&latitudeAdjustmentMethod=${MALIKITE_CONFIG.latitudeAdjustmentMethod}&timezonestring=${encodeURIComponent(timezone)}`;

  if (city && country) {
    return `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&${baseParams}`;
  } else if (latitude && longitude) {
    const timestamp = Math.floor(Date.now() / 1000); // Timestamp en secondes
    return `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${latitude}&longitude=${longitude}&${baseParams}`;
  }

  throw new Error('Paramètres insuffisants pour construire l\'URL');
};

// Fonction pour calculer la prochaine prière (selon spécifications)
const getNextPrayer = (timings: Record<string, string>): string => {
  if (!timings) return 'Fajr';

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  
  const next = PRAYER_ORDER.find(k => toMinutes(timings[k]) > nowMin);
  return next ?? 'Fajr';
};

// Fonction pour formater l'heure
const formatPrayerTime = (time: string): string => {
  if (!time) return '--:--';
  return time;
};

// Fonction pour obtenir la date actuelle
const getCurrentDate = (): string => {
  const now = new Date();
  return now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Fonction pour obtenir la date Hijri
const getHijriDate = (): string => {
  // Pour l'instant, retourner une date Hijri simulée
  // Plus tard, on pourra utiliser l'API Aladhan pour la date Hijri
  return 'Date Hijri';
};

// Fonction principale pour récupérer les horaires de prière
export const fetchPrayerTimes = async (cityName?: string): Promise<{
  timings: Record<string, string>;
  date: any;
  city: string;
  nextPrayer: string;
  lastUpdate: string;
}> => {
  const today = getTodayDate();
  const cacheKey = getCacheKey(today, MALIKITE_CONFIG.timezone, MALIKITE_CONFIG.method, MALIKITE_CONFIG.school, cityName);
  
  try {
    // Essayer de récupérer du cache d'abord
    const cached = await getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Utilisation du cache pour aujourd\'hui');
      return {
        timings: cached.timings,
        date: cached.date,
        city: cached.city,
        nextPrayer: getNextPrayer(cached.timings),
        lastUpdate: cached.cachedAt
      };
    }

    // Si pas de cache, faire l'appel API
    let url: string;
    let city = cityName || 'Dakar';
    let country = 'Senegal';

    if (cityName) {
      url = buildApiUrl({ city, country });
    } else {
      // Essayer d'obtenir la localisation GPS
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          url = buildApiUrl({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          console.log('📍 Utilisation GPS:', location.coords);
        } else {
          url = buildApiUrl({ city, country });
        }
      } catch (error) {
        console.log('❌ Erreur GPS, utilisation Dakar par défaut:', error);
        url = buildApiUrl({ city, country });
      }
    }

    console.log('🌐 URL appelée:', url);
    console.log('⏰ TZ utilisé:', MALIKITE_CONFIG.timezone);
    console.log('📊 Method:', MALIKITE_CONFIG.method, 'School:', MALIKITE_CONFIG.school);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Extrait timings:', {
      Fajr: data.data.timings.Fajr,
      Dhuhr: data.data.timings.Dhuhr,
      Asr: data.data.timings.Asr,
      Maghrib: data.data.timings.Maghrib,
      Isha: data.data.timings.Isha
    });

    const result = {
      timings: data.data.timings,
      date: data.data.date,
      city: city,
      nextPrayer: getNextPrayer(data.data.timings),
      lastUpdate: new Date().toISOString()
    };

    // Sauvegarder en cache
    await saveToCache(cacheKey, result);

    return result;

  } catch (error) {
    console.error('❌ Erreur fetch horaires:', error);
    
    // En cas d'erreur, essayer de récupérer le dernier succès du jour
    const lastSuccess = await getFromCache(cacheKey);
    if (lastSuccess) {
      console.log('🔄 Utilisation du dernier succès du jour');
      return {
        timings: lastSuccess.timings,
        date: lastSuccess.date,
        city: lastSuccess.city,
        nextPrayer: getNextPrayer(lastSuccess.timings),
        lastUpdate: lastSuccess.cachedAt
      };
    }

    // Fallback avec des horaires par défaut (Dakar)
    const fallbackTimings = {
      Fajr: '05:45',
      Dhuhr: '13:15',
      Asr: '16:30',
      Maghrib: '19:15',
      Isha: '20:30'
    };

    return {
      timings: fallbackTimings,
      date: { gregorian: { day: new Date().getDate(), month: { fr: 'Janvier' }, year: new Date().getFullYear() } },
      city: 'Dakar (offline)',
      nextPrayer: getNextPrayer(fallbackTimings),
      lastUpdate: new Date().toISOString()
    };
  }
};

// Fonction pour obtenir les informations de la prochaine prière
export const getNextPrayerInfo = (timings: Record<string, string>): {
  key: string;
  name: string;
  time: string;
  minutesUntil: number;
} | null => {
  if (!timings) return null;

  const nextPrayerKey = getNextPrayer(timings);
  const nextPrayerTime = timings[nextPrayerKey];
  
  if (!nextPrayerTime) return null;

  const now = new Date();
  const nextTime = new Date();
  const [hours, minutes] = nextPrayerTime.split(':').map(Number);
  nextTime.setHours(hours, minutes, 0, 0);

  // Si la prière est déjà passée aujourd'hui, c'est pour demain
  if (nextTime <= now) {
    nextTime.setDate(nextTime.getDate() + 1);
  }

  const minutesUntil = Math.floor((nextTime.getTime() - now.getTime()) / (1000 * 60));

  const prayerNames: Record<string, string> = {
    Fajr: 'Subh',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha'
  };

  return {
    key: nextPrayerKey,
    name: prayerNames[nextPrayerKey] || nextPrayerKey,
    time: nextPrayerTime,
    minutesUntil
  };
};

// Export des fonctions utilitaires
export {
    MALIKITE_CONFIG,
    PRAYER_ORDER, formatPrayerTime,
    getCurrentDate,
    getHijriDate
};
