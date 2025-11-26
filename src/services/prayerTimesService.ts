import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { searchCityWithCountry } from './citySearchService';

// Configuration "Malikite Sénégal" (méthode de calcul)
export const MALIKITE_CONFIG = {
  method: 3, // Muslim World League (MWL)
  school: 0, // Asr Shafi' (proche de la pratique courante)
  latitudeAdjustmentMethod: 'ANGLE_BASED',
};

export const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerKey = (typeof PRAYER_ORDER)[number];

export type PrayerTimings = Record<string, string>;

export interface PrayerTimesResult {
  timings: PrayerTimings;
  date: {
    readable?: string;
    gregorian?: any;
    hijri?: any;
  } | null;
  city: string;
  country?: string;
  timezone: string;
  nextPrayer?: {
    key: PrayerKey;
    name: string;
    time: string;
    minutesUntil: number;
  } | null;
  lastUpdate: string;
  offline?: boolean;
}

const ALADHAN_BASE_URL = 'https://api.aladhan.com/v1';

// ---------- Utilitaires temps / date ----------

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const formatPrayerTime = (time: string | undefined): string => {
  if (!time) return '--:--';
  // l’API renvoie déjà HH:MM (parfois avec suffixes), on normalise un peu
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return `${pad2(h)}:${pad2(m)}`;
};

export const getCurrentDate = (): string => {
  const now = new Date();
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const mois = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  return `${jours[now.getDay()]} ${now.getDate()} ${mois[now.getMonth()]} ${now.getFullYear()}`;
};

// Utilisé uniquement quand on n’a pas la date Hijri de l’API
export const getHijriDate = (): string => {
  return 'Date hijri indisponible hors ligne';
};

// ---------- Cache AsyncStorage ----------

const buildCacheKey = (id: string) => `prayerTimes:last:${id}`;

// Sauvegarde du dernier résultat pour une ville (ou “current_location”)
const saveLastPrayerTimes = async (id: string, data: PrayerTimesResult) => {
  try {
    const payload = {
      ...data,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(buildCacheKey(id), JSON.stringify(payload));
  } catch (error) {
    console.error('❌ Erreur sauvegarde horaires prière (cache):', error);
  }
};

const loadLastPrayerTimes = async (id: string): Promise<PrayerTimesResult | null> => {
  try {
    const raw = await AsyncStorage.getItem(buildCacheKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as PrayerTimesResult;
  } catch (error) {
    console.error('❌ Erreur lecture horaires prière (cache):', error);
    return null;
  }
};

// ---------- Calcul de la prochaine prière ----------

export const getNextPrayerInfo = (timings: PrayerTimings): PrayerTimesResult['nextPrayer'] => {
  if (!timings) return null;

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0,
    0
  );

  let next: PrayerTimesResult['nextPrayer'] | null = null;

  const prayerNames: Record<string, string> = {
    Fajr: 'Fajr',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha',
  };

  for (const key of PRAYER_ORDER) {
    const rawTime = timings[key];
    if (!rawTime) continue;

    const match = rawTime.match(/(\d{1,2}):(\d{2})/);
    if (!match) continue;

    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);

    const prayerDate = new Date(today);
    prayerDate.setHours(h, m, 0, 0);

    const diffMs = prayerDate.getTime() - now.getTime();
    if (diffMs <= 0) continue;

    const diffMinutes = Math.round(diffMs / 60000);

    if (!next || diffMinutes < (next.minutesUntil ?? Number.MAX_SAFE_INTEGER)) {
      next = {
        key: key as PrayerKey,
        name: prayerNames[key] || key,
        time: formatPrayerTime(rawTime),
        minutesUntil: diffMinutes,
      };
    }
  }

  return next;
};

// ---------- Appels API Aladhan ----------

const buildTimingsByCityUrl = (city: string, country: string) => {
  const params = new URLSearchParams({
    city,
    country,
    method: String(MALIKITE_CONFIG.method),
    school: String(MALIKITE_CONFIG.school),
    latitudeAdjustmentMethod: MALIKITE_CONFIG.latitudeAdjustmentMethod,
  });
  return `${ALADHAN_BASE_URL}/timingsByCity?${params.toString()}`;
};

const buildTimingsByCoordsUrl = (lat: number, lon: number) => {
  const now = new Date();
  const timestamp = Math.floor(now.getTime() / 1000);

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    method: String(MALIKITE_CONFIG.method),
    school: String(MALIKITE_CONFIG.school),
    latitudeAdjustmentMethod: MALIKITE_CONFIG.latitudeAdjustmentMethod,
  });

  return `${ALADHAN_BASE_URL}/timings/${timestamp}?${params.toString()}`;
};

const callAladhan = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }
  const json = await response.json();
  if (json.code !== 200 || !json.data) {
    throw new Error(`Réponse Aladhan invalide: ${JSON.stringify(json)}`);
  }
  return json.data;
};

// ---------- Fonction principale: fetchPrayerTimes ----------

/**
 * Récupère les horaires de prière pour:
 * - une ville précise (cityName + countryName)
 * - ou la position actuelle si cityName non fourni
 *
 * Utilise Aladhan et garde un cache par ville / position.
 */
export const fetchPrayerTimes = async (
  cityName?: string,
  countryName?: string
): Promise<PrayerTimesResult> => {
  const id = cityName
    ? `${cityName.trim()}|${(countryName || '').trim() || 'DEFAULT_COUNTRY'}`
    : 'CURRENT_LOCATION';

  // 1) Tentative online
  try {
    let data: any;
    let finalCity = cityName?.trim();
    let finalCountry = countryName?.trim();
    let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    if (finalCity) {
      // Ville spécifiée: on utilise Nominatim pour trouver lat/lon, puis Aladhan par coordonnées
      const geo = await searchCityWithCountry(finalCity, finalCountry);
      if (geo && geo.lat != null && geo.lon != null) {
        const url = buildTimingsByCoordsUrl(geo.lat, geo.lon);
        data = await callAladhan(url);
        finalCity = geo.displayName || geo.name || finalCity;
        // meta.timezone vient souvent avec la réponse
        if (data.meta?.timezone) {
          timezone = data.meta.timezone;
        }
        finalCountry = geo.country || finalCountry || undefined;
      } else if (finalCity && finalCountry) {
        // fallback timingsByCity
        const url = buildTimingsByCityUrl(finalCity, finalCountry);
        data = await callAladhan(url);
        if (data.meta?.timezone) {
          timezone = data.meta.timezone;
        }
      } else {
        // city sans country → on tente quand même timingsByCity, pays laissé vide
        const url = buildTimingsByCityUrl(finalCity, '');
        data = await callAladhan(url);
        if (data.meta?.timezone) {
          timezone = data.meta.timezone;
        }
      }
    } else {
      // Pas de ville: on essaie la position actuelle
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const url = buildTimingsByCoordsUrl(location.coords.latitude, location.coords.longitude);
        data = await callAladhan(url);
        finalCity = 'Position actuelle';
        if (data.meta?.timezone) {
          timezone = data.meta.timezone;
        }
      } else {
        // GPS refusé → fallback Dakar, Sénégal
        finalCity = 'Dakar';
        finalCountry = 'Senegal';
        const url = buildTimingsByCityUrl(finalCity, finalCountry);
        data = await callAladhan(url);
        if (data.meta?.timezone) {
          timezone = data.meta.timezone;
        } else {
          timezone = 'Africa/Dakar';
        }
      }
    }

    const timings: PrayerTimings = data.timings || {};
    const date = data.date || null;

    const result: PrayerTimesResult = {
      timings,
      date,
      city: finalCity || 'Ville inconnue',
      country: finalCountry,
      timezone,
      nextPrayer: getNextPrayerInfo(timings),
      lastUpdate: new Date().toISOString(),
      offline: false,
    };

    // Sauvegarde pour mode hors ligne
    await saveLastPrayerTimes(id, result);

    return result;
  } catch (error) {
    console.error('❌ Erreur fetchPrayerTimes (online):', error);

    // 2) Fallback: utiliser le dernier succès pour cette ville / position
    const cached = await loadLastPrayerTimes(id);
    if (cached) {
      console.log('📦 Utilisation des derniers horaires en cache pour', id);
      return {
        ...cached,
        offline: true,
      };
    }

    // 3) Fallback ultime: horaires statiques Dakar (pas idéal, mais mieux que rien)
    const now = new Date();
    const fallbackTimings: PrayerTimings = {
      Fajr: '05:45',
      Dhuhr: '13:30',
      Asr: '16:30',
      Maghrib: '19:15',
      Isha: '20:30',
    };

    return {
      timings: fallbackTimings,
      date: null,
      city: 'Dakar (fallback)',
      country: 'Senegal',
      timezone: 'Africa/Dakar',
      nextPrayer: getNextPrayerInfo(fallbackTimings),
      lastUpdate: now.toISOString(),
      offline: true,
    };
  }
};


