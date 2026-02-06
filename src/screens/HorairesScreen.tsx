  import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getResponsiveStyle, useResponsive } from '../hooks/useResponsive';
import { CitySearchResult, searchCities } from '../services/citySearchService';
import { cancelAllPrayerNotifications, initializePrayerNotifications } from '../services/prayerNotificationsService';
import {
  fetchPrayerTimes,
  formatPrayerTime,
  getCurrentDate,
  getHijriDate,
  getNextPrayerInfo,
  loadLastPrayerTimes
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

// Liste complète des pays du monde organisés par continents
const WORLD_COUNTRIES = [
  {
    continent: 'Afrique',
    countries: [
      { name: 'Sénégal', cities: ['Dakar', 'Saint-Louis', 'Thiès', 'Kaolack', 'Ziguinchor', 'Touba', 'Mbour', 'Rufisque'] },
      { name: 'Maroc', cities: ['Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Agadir', 'Meknès', 'Oujda'] },
      { name: 'Algérie', cities: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Sétif', 'Tlemcen', 'Béjaïa'] },
      { name: 'Tunisie', cities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Gafsa', 'Monastir'] },
      { name: 'Mali', cities: ['Bamako', 'Sikasso', 'Mopti', 'Kayes', 'Gao', 'Kidal', 'Tombouctou'] },
      { name: 'Côte d\'Ivoire', cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo', 'Man', 'Daloa'] },
      { name: 'Burkina Faso', cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora'] },
      { name: 'Niger', cities: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua'] },
      { name: 'Mauritanie', cities: ['Nouakchott', 'Nouadhibou', 'Rosso', 'Kaédi', 'Atar'] },
      { name: 'Guinée', cities: ['Conakry', 'Kankan', 'Kindia', 'Labé', 'N\'Zérékoré'] },
      { name: 'Gambie', cities: ['Banjul', 'Serekunda', 'Brikama', 'Bakau', 'Farafenni'] },
      { name: 'Guinée-Bissau', cities: ['Bissau', 'Bafatá', 'Gabú', 'Cacheu'] },
      { name: 'Tchad', cities: ['N\'Djamena', 'Moundou', 'Sarh', 'Abéché'] },
      { name: 'Cameroun', cities: ['Douala', 'Yaoundé', 'Garoua', 'Bafoussam', 'Bamenda'] },
      { name: 'Nigeria', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Kaduna'] },
      { name: 'Ghana', cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast'] },
      { name: 'Égypte', cities: ['Le Caire', 'Alexandrie', 'Gizeh', 'Louxor', 'Assouan', 'Port-Saïd'] },
      { name: 'Soudan', cities: ['Khartoum', 'Omdurman', 'Port-Soudan', 'Kassala'] },
      { name: 'Éthiopie', cities: ['Addis-Abeba', 'Dire Dawa', 'Mekele', 'Gondar'] },
      { name: 'Kenya', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'] },
      { name: 'Tanzanie', cities: ['Dar es Salaam', 'Dodoma', 'Zanzibar', 'Arusha'] },
      { name: 'Ouganda', cities: ['Kampala', 'Gulu', 'Mbarara', 'Jinja'] },
      { name: 'Afrique du Sud', cities: ['Johannesburg', 'Le Cap', 'Pretoria', 'Durban', 'Port Elizabeth'] },
    ]
  },
  {
    continent: 'Europe',
    countries: [
      { name: 'France', cities: ['Paris', 'Lyon', 'Marseille', 'Lille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg'] },
      { name: 'Espagne', cities: ['Madrid', 'Barcelone', 'Valence', 'Séville', 'Bilbao', 'Malaga'] },
      { name: 'Italie', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palerme', 'Gênes', 'Florence'] },
      { name: 'Allemagne', cities: ['Berlin', 'Munich', 'Hambourg', 'Francfort', 'Cologne', 'Stuttgart'] },
      { name: 'Royaume-Uni', cities: ['Londres', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Édimbourg'] },
      { name: 'Belgique', cities: ['Bruxelles', 'Anvers', 'Gand', 'Charleroi', 'Liège'] },
      { name: 'Pays-Bas', cities: ['Amsterdam', 'Rotterdam', 'La Haye', 'Utrecht', 'Eindhoven'] },
      { name: 'Suisse', cities: ['Zurich', 'Genève', 'Bâle', 'Berne', 'Lausanne'] },
      { name: 'Portugal', cities: ['Lisbonne', 'Porto', 'Coimbra', 'Braga', 'Faro'] },
      { name: 'Grèce', cities: ['Athènes', 'Thessalonique', 'Patras', 'Héraklion'] },
      { name: 'Turquie', cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Gaziantep'] },
      { name: 'Pologne', cities: ['Varsovie', 'Cracovie', 'Wrocław', 'Gdańsk', 'Poznań'] },
      { name: 'Russie', cities: ['Moscou', 'Saint-Pétersbourg', 'Novossibirsk', 'Ekaterinbourg', 'Kazan'] },
    ]
  },
  {
    continent: 'Asie',
    countries: [
      { name: 'Arabie Saoudite', cities: ['Riyad', 'Djeddah', 'La Mecque', 'Médine', 'Dammam', 'Tabuk'] },
      { name: 'Émirats Arabes Unis', cities: ['Dubaï', 'Abou Dabi', 'Charjah', 'Al Ain', 'Ras el Khaïmah'] },
      { name: 'Qatar', cities: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Dukhan'] },
      { name: 'Koweït', cities: ['Koweït', 'Al Ahmadi', 'Hawalli', 'Farwaniya'] },
      { name: 'Bahreïn', cities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town'] },
      { name: 'Oman', cities: ['Mascate', 'Salalah', 'Sohar', 'Nizwa'] },
      { name: 'Yémen', cities: ['Sanaa', 'Aden', 'Taizz', 'Hodeïda'] },
      { name: 'Jordanie', cities: ['Amman', 'Irbid', 'Zarqa', 'Aqaba'] },
      { name: 'Liban', cities: ['Beyrouth', 'Tripoli', 'Sidon', 'Tyr'] },
      { name: 'Syrie', cities: ['Damas', 'Alep', 'Homs', 'Lattaquié'] },
      { name: 'Irak', cities: ['Bagdad', 'Bassorah', 'Mossoul', 'Erbil', 'Kirkouk'] },
      { name: 'Iran', cities: ['Téhéran', 'Ispahan', 'Chiraz', 'Tabriz', 'Mashhad'] },
      { name: 'Pakistan', cities: ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi'] },
      { name: 'Bangladesh', cities: ['Dacca', 'Chittagong', 'Khulna', 'Rajshahi'] },
      { name: 'Inde', cities: ['New Delhi', 'Mumbai', 'Bangalore', 'Calcutta', 'Chennai', 'Hyderabad'] },
      { name: 'Indonésie', cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'] },
      { name: 'Malaisie', cities: ['Kuala Lumpur', 'George Town', 'Ipoh', 'Johor Bahru', 'Malacca'] },
      { name: 'Singapour', cities: ['Singapour'] },
      { name: 'Thaïlande', cities: ['Bangkok', 'Chiang Mai', 'Pattaya', 'Phuket'] },
      { name: 'Philippines', cities: ['Manille', 'Cebu', 'Davao', 'Zamboanga'] },
      { name: 'Chine', cities: ['Pékin', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'] },
      { name: 'Japon', cities: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Kyoto'] },
      { name: 'Corée du Sud', cities: ['Séoul', 'Busan', 'Incheon', 'Daegu'] },
    ]
  },
  {
    continent: 'Amérique',
    countries: [
      { name: 'États-Unis', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Miami', 'Boston'] },
      { name: 'Canada', cities: ['Toronto', 'Montréal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton'] },
      { name: 'Mexique', cities: ['Mexico', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana'] },
      { name: 'Brésil', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'] },
      { name: 'Argentine', cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'] },
      { name: 'Colombie', cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'] },
      { name: 'Chili', cities: ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta'] },
      { name: 'Pérou', cities: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo'] },
    ]
  },
  {
    continent: 'Océanie',
    countries: [
      { name: 'Australie', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adélaïde'] },
      { name: 'Nouvelle-Zélande', cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'] },
    ]
  }
];

export default function HorairesScreen() {
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string> | null>(null);
  const [date, setDate] = useState('');
  const [hijri, setHijri] = useState('');
  const [city, setCity] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [enabledNotifications, setEnabledNotifications] = useState<{ [key: string]: boolean }>({});
  const [dimensions, setDimensions] = useState({ width: screenWidth, height: screenHeight });
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [nextPrayerInfo, setNextPrayerInfo] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // ✅ Utiliser le hook useNavigation() au lieu de require() pour de meilleures performances
  const navigation = useNavigation();

  // ✅ Mémoriser le callback goBack pour éviter les recréations
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ✅ Mémoriser le callback pour les notifications
  const handleToggleNotifications = useCallback(async () => {
    try {
      if (!notificationsEnabled) {
        if (prayerTimes) {
          await initializePrayerNotifications(prayerTimes, 15);
          setNotificationsEnabled(true);
        } else {
          Alert.alert('Horaires indisponibles', 'Les horaires ne sont pas encore chargés.');
        }
      } else {
        await cancelAllPrayerNotifications();
        setNotificationsEnabled(false);
      }
    } catch (e) {
      console.error('Notif toggle error:', e);
      Alert.alert('Erreur', 'Impossible de mettre à jour les notifications.');
    }
  }, [notificationsEnabled, prayerTimes]);

  // ✅ Mémoriser le geste pour éviter les recréations à chaque render
  // IMPORTANT: Le geste ne doit se déclencher QUE depuis le bord gauche (< 20px)
  // et ignorer complètement les mouvements verticaux pour éviter les conflits avec le ScrollView
  const swipeGesture = useMemo(() => {
    return Gesture.Pan()
      .minDistance(10)
      .activeOffsetX(10)
      .failOffsetY([-80, 80]) // ✅ Très restrictif pour ignorer les mouvements verticaux
      .onStart((event) => {
        // ✅ Vérifier que le geste commence depuis le bord gauche (< 20px)
        if (event.x > 20) {
          return; // Ignorer si le geste ne commence pas depuis le bord gauche
        }
      })
      .onUpdate((event) => {
        // ✅ Si le mouvement vertical est trop important, annuler le geste
        if (Math.abs(event.translationY) > 30) {
          return;
        }
      })
      .onEnd((event) => {
        // ✅ Détecter un swipe horizontal vers la droite depuis le bord gauche
        // ✅ Seulement si le mouvement vertical est minimal (< 30px)
        if (Math.abs(event.translationY) < 30) {
          if (event.translationX > 100 || (event.translationX > 60 && event.velocityX > 600)) {
            handleGoBack();
          }
        }
      });
  }, [handleGoBack]);

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
    const timeoutRef: { current: NodeJS.Timeout | null } = { current: null };
    
    const loadData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setOfflineMode(false);
        
        // 1) CHARGER LE CACHE D'ABORD pour afficher rapidement les données
        const cacheId = 'Dakar|DEFAULT_COUNTRY';
        const cached = await loadLastPrayerTimes(cacheId);
        let hasDataFromCache = false;
        
        if (cached && isMounted) {
          hasDataFromCache = true;
          // Afficher les données en cache immédiatement
          setPrayerTimes(cached.timings);
          setCity(cached.city);
          setLastUpdate(cached.lastUpdate);
          
          // Calculer la prochaine prière
          const nextPrayer = getNextPrayerInfo(cached.timings);
          setNextPrayerInfo(nextPrayer);
          
          // Formatage de la date
          if (cached.date) {
            const gregorian = cached.date.gregorian;
            const hijri = cached.date.hijri;
            
            setDate(`${gregorian.day} ${gregorian.month.fr || gregorian.month.en} ${gregorian.year}`);
            setHijri(`${hijri.day} ${hijri.month.fr || hijri.month.en} ${hijri.year}`);
          } else {
            setDate(getCurrentDate());
            setHijri(getHijriDate());
          }
          
          setOfflineMode(true); // Indiquer que c'est du cache
          setLoading(false); // Arrêter le chargement pour afficher les données
        }
        
        // 2) METTRE À JOUR EN ARRIÈRE-PLAN avec timeout
        // Timeout de sécurité sur le useEffect (20s max)
        timeoutRef.current = setTimeout(() => {
          if (isMounted) {
            console.log('⚠️ Timeout du chargement, utilisation du cache ou fallback');
            setLoading(false);
            if (!hasDataFromCache) {
              // Si pas de cache, utiliser les valeurs par défaut
              setDate(getCurrentDate());
              setHijri(getHijriDate());
              setCity('Dakar (offline)');
              setOfflineMode(true);
            }
          }
        }, 20000);
        
        const result = await fetchPrayerTimes('Dakar', undefined, 15000); // Timeout de 15s
        
        // Nettoyer le timeout si la requête réussit
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        if (!isMounted) return;
        
        // Mettre à jour avec les nouvelles données
        setPrayerTimes(result.timings);
        setCity(result.city);
        setLastUpdate(result.lastUpdate);
        setOfflineMode(result.offline || false);
        
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
        
        // Ne pas programmer de notifications automatiquement; l'utilisateur activera via le switch
        
      } catch (error) {
        if (!isMounted) return;
        console.log('❌ Erreur lors du chargement initial:', error);
        
        // Si on n'a pas encore de données affichées (pas de cache chargé), utiliser les valeurs par défaut
        // Le cache a déjà été vérifié au début, donc si on arrive ici sans données, c'est qu'il n'y avait pas de cache
        setOfflineMode(true);
        setDate(getCurrentDate());
        setHijri(getHijriDate());
        setCity('Dakar (offline)');
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Dépendances vides pour ne charger qu'une fois

  // Fonction pour rechercher des villes en temps réel
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await searchCities(searchQuery, 15);
        setSearchResults(results);
      } catch (error) {
        console.error('❌ Erreur recherche:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Délai de 500ms pour éviter trop de requêtes

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery]);

  // Fonction pour changer de ville
  const handleCityChange = async (selectedCity?: CitySearchResult) => {
    const city = selectedCity ? selectedCity.name : cityInput.trim();
    const country = selectedCity ? selectedCity.country : (countryInput.trim() || 'Senegal');
    
    if (!city) return;
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      setLoading(true);
      setOfflineMode(false);
      
      // 1) CHARGER LE CACHE D'ABORD pour afficher rapidement
      const cacheId = `${city}|${country}`;
      const cached = await loadLastPrayerTimes(cacheId);
      
      if (cached) {
        // Afficher les données en cache immédiatement
        setPrayerTimes(cached.timings);
        setCity(cached.city);
        setLastUpdate(cached.lastUpdate);
        setOfflineMode(true);
        
        // Calculer la prochaine prière
        const nextPrayer = getNextPrayerInfo(cached.timings);
        setNextPrayerInfo(nextPrayer);
        
        // Formatage de la date
        if (cached.date) {
          const gregorian = cached.date.gregorian;
          const hijri = cached.date.hijri;
          
          setDate(`${gregorian.day} ${gregorian.month.fr || gregorian.month.en} ${gregorian.year}`);
          setHijri(`${hijri.day} ${hijri.month.fr || hijri.month.en} ${hijri.year}`);
        }
        
        setLoading(false); // Arrêter le chargement pour afficher le cache
      }
      
      // 2) METTRE À JOUR EN ARRIÈRE-PLAN avec timeout
      timeoutId = setTimeout(() => {
        setLoading(false);
      }, 20000); // Timeout de sécurité de 20s
      
      const result = await fetchPrayerTimes(city, country, 15000);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Mettre à jour avec les nouvelles données
      setPrayerTimes(result.timings);
      setCity(result.city);
      setLastUpdate(result.lastUpdate);
      setOfflineMode(result.offline || false);
      
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
      
      // Ne pas programmer automatiquement lors du changement de ville
      
      setModalVisible(false);
      setCityInput('');
      setCountryInput('');
      setSearchQuery('');
      setSearchResults([]);
      
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.log('❌ Erreur lors du changement de ville:', error);
      Alert.alert(
        'Erreur',
        'Impossible de récupérer les horaires pour cette ville. Les données en cache seront utilisées si disponibles.',
        [{ text: 'OK' }]
      );
      setOfflineMode(true);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
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

  // ✅ Contenu principal de l'écran (réutilisable)
  const mainContent = (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header moderne cohérent avec les autres pages */}
      <View style={[styles.header, { maxWidth: responsive.maxContentWidth }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Heures de prière</Text>
        <TouchableOpacity
          onPress={handleToggleNotifications}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name={notificationsEnabled ? 'bell-ring' : 'bell-outline'}
            size={24}
            color={notificationsEnabled ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Image d'en-tête */}
      <View style={[styles.headerContainer, { maxWidth: responsive.maxContentWidth }]}>
        <Image
          source={require('../../assets/heurepriere.jpg')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      </View>

      {/* Carte dorée avec date */}
      <View style={[styles.dateCard, { maxWidth: responsive.maxContentWidth }]}>
        <View style={styles.dateIconContainer}>
          <MaterialCommunityIcons name="calendar" size={24} color="#2C3E50" />
        </View>
        <View style={styles.dateTextContainer}>
          <Text style={styles.dateText}>{date || '23 Janvier 2025'}</Text>
          <Text style={styles.hijriText}>{hijri || '24 Rajab 1446'}</Text>
        </View>
      </View>

      {/* Section ville */}
      <View style={[styles.citySection, { maxWidth: responsive.maxContentWidth }]}>
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
      <View style={[styles.prayerListContainer, { maxWidth: responsive.maxContentWidth }]}>
        <ScrollView 
          style={styles.prayerListContent}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={[
            styles.prayerListContentContainer,
            { paddingBottom: Math.max(insets.bottom + 40, Platform.OS === 'ios' ? 40 : 60) }
          ]}
          bounces={true}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
          removeClippedSubviews={Platform.OS === 'android'} // ✅ Améliore les performances sur Android
          decelerationRate="normal" // ✅ Scroll plus fluide
          scrollEnabled={true} // ✅ Explicitement activé
          directionalLockEnabled={false} // ✅ Permet le scroll vertical fluide
          keyboardShouldPersistTaps="handled" // ✅ Évite les problèmes de clavier
          overScrollMode="never" // ✅ Désactive l'overscroll sur Android pour plus de fluidité
          persistentScrollbar={false} // ✅ Améliore les performances
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
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ✅ Sur iOS, utiliser GestureDetector pour le swipe. Sur Android, utiliser le geste natif */}
      {Platform.OS === 'ios' ? (
        <GestureDetector gesture={swipeGesture}>
          {mainContent}
        </GestureDetector>
      ) : (
        mainContent
      )}

      {/* Modal choix ville */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Choisir une ville</Text>
              
              {/* Barre de recherche */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un pays ou une ville..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.inputHint}>
                Recherchez n'importe quelle ville dans le monde. Les résultats apparaîtront ci-dessous.
              </Text>
              
              {/* Résultats de recherche en temps réel */}
              {isSearching && (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.searchingText}>Recherche en cours...</Text>
                </View>
              )}
              
              {!isSearching && searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  <Text style={styles.searchResultsTitle}>
                    {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                  </Text>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setCityInput(result.name);
                        setCountryInput(result.country);
                        handleCityChange(result);
                      }}
                    >
                      <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
                      <View style={styles.searchResultTextContainer}>
                        <Text style={styles.searchResultCity}>{result.name}</Text>
                        <Text style={styles.searchResultCountry}>{result.country}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <MaterialCommunityIcons name="map-search-outline" size={48} color="#999" />
                  <Text style={styles.noResultsText}>Aucun résultat trouvé</Text>
                  <Text style={styles.noResultsHint}>
                    Essayez avec un nom de ville différent ou vérifiez l'orthographe
                  </Text>
                </View>
              )}
              
              {/* Liste des pays populaires (affichée seulement si pas de recherche) */}
              {!searchQuery.trim() && (
                <View style={styles.availableCitiesContainer}>
                  <Text style={styles.availableCitiesTitle}>Pays populaires :</Text>
                  <View style={styles.availableCitiesList}>
                    {WORLD_COUNTRIES.map((continent) => (
                      <View key={continent.continent} style={styles.continentSection}>
                        <Text style={styles.continentName}>{continent.continent}</Text>
                        {continent.countries.map((country) => (
                          <View key={country.name} style={styles.countrySection}>
                            <Text style={styles.countryName}>{country.name}</Text>
                            <View style={styles.citiesRow}>
                              {country.cities.map((cityName) => (
                                <TouchableOpacity
                                  key={cityName}
                                  style={styles.cityOption}
                                  onPress={() => {
                                    setCityInput(cityName);
                                    setCountryInput(country.name);
                                    setSearchQuery(`${cityName}, ${country.name}`);
                                  }}
                                >
                                  <Text style={styles.cityOptionText}>{cityName}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              )}
              </View>
            </ScrollView>
            
            {/* Boutons fixes en bas */}
            <View style={styles.modalButtonsContainer}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => {
                  setModalVisible(false);
                  setCityInput('');
                  setCountryInput('');
                  setSearchQuery('');
                  setSearchResults([]);
                  if (searchTimeout) {
                    clearTimeout(searchTimeout);
                    setSearchTimeout(null);
                  }
                }}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalConfirmButton, (!cityInput.trim() && searchResults.length === 0) && styles.modalConfirmButtonDisabled]} 
                onPress={() => {
                  if (searchResults.length > 0) {
                    // Utiliser le premier résultat si disponible
                    handleCityChange(searchResults[0]);
                  } else if (cityInput.trim()) {
                    handleCityChange();
                  }
                }}
                disabled={!cityInput.trim() && searchResults.length === 0}
              >
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
    paddingTop: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
    marginHorizontal: isTablet ? 20 : 16,
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
    height: isTablet ? 200 : (isSmallScreen ? 160 : 180), 
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
    // ✅ Optimisations pour un scroll fluide sur Android
    ...(Platform.OS === 'android' && {
      // Sur Android, ces propriétés améliorent la fluidité
      overScrollMode: 'never', // Évite l'overscroll sur Android
    }),
  },
  prayerListContentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 60, // ✅ Augmenté pour Android pour afficher toutes les 5 prières
    paddingTop: 8, // ✅ Ajouté pour un peu d'espace en haut
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
  modalWrapper: {
    width: isTablet ? '70%' : '90%',
    maxWidth: isTablet ? 600 : 400,
    maxHeight: '90%',
    borderRadius: isTablet ? 24 : 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    flexShrink: 1,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalScrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 0,
    paddingBottom: 80, // Espace pour les boutons fixes
  },
  modalContainer: {
    padding: isTablet ? 32 : 24,
    width: '100%',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 32 : 24,
    paddingVertical: isTablet ? 16 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: isTablet ? 24 : 20,
    borderBottomRightRadius: isTablet ? 24 : 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: isTablet ? 16 : (isSmallScreen ? 13 : 14),
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: isTablet ? 8 : 6,
    marginTop: isTablet ? 16 : 12,
  },
  inputHint: {
    fontSize: isTablet ? 13 : (isSmallScreen ? 11 : 12),
    color: '#666',
    fontStyle: 'italic',
    marginTop: isTablet ? 4 : 2,
    marginBottom: isTablet ? 16 : 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 16 : 12,
    marginBottom: isTablet ? 20 : 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: isTablet ? 8 : 6,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 16 : (isSmallScreen ? 14 : 15),
    paddingVertical: isTablet ? 12 : 10,
    color: '#333',
  },
  clearSearchButton: {
    padding: isTablet ? 4 : 2,
  },
  continentSection: {
    marginBottom: isTablet ? 20 : 16,
  },
  continentName: {
    fontSize: isTablet ? 18 : (isSmallScreen ? 15 : 16),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: isTablet ? 12 : 10,
    marginTop: isTablet ? 12 : 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    marginBottom: isTablet ? 8 : 6,
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#F8F9FA',
    borderRadius: isTablet ? 14 : 10,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 14 : 10,
  },
  countrySection: {
    marginBottom: isTablet ? 16 : 12,
  },
  countryName: {
    fontSize: isTablet ? 15 : (isSmallScreen ? 13 : 14),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: isTablet ? 8 : 6,
    marginTop: isTablet ? 8 : 6,
  },
  citiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityOption: {
    paddingVertical: isTablet ? 8 : 6,
    paddingHorizontal: isTablet ? 12 : 10,
    borderRadius: isTablet ? 10 : 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: isTablet ? 6 : 4,
    marginRight: isTablet ? 8 : 6,
  },
  cityOptionText: {
    fontSize: isTablet ? 14 : (isSmallScreen ? 11 : 12),
    color: '#333',
    fontWeight: '500',
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 20 : 16,
    marginBottom: isTablet ? 16 : 12,
  },
  searchingText: {
    marginLeft: isTablet ? 12 : 8,
    fontSize: isTablet ? 16 : (isSmallScreen ? 13 : 14),
    color: colors.primary,
  },
  searchResultsContainer: {
    marginTop: isTablet ? 16 : 12,
    marginBottom: isTablet ? 16 : 12,
  },
  searchResultsTitle: {
    fontSize: isTablet ? 16 : (isSmallScreen ? 13 : 14),
    fontWeight: 'bold',
    color: '#555',
    marginBottom: isTablet ? 12 : 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 16 : 12,
    borderRadius: isTablet ? 12 : 10,
    marginBottom: isTablet ? 8 : 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchResultTextContainer: {
    flex: 1,
    marginLeft: isTablet ? 12 : 10,
  },
  searchResultCity: {
    fontSize: isTablet ? 16 : (isSmallScreen ? 14 : 15),
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: isTablet ? 2 : 1,
  },
  searchResultCountry: {
    fontSize: isTablet ? 14 : (isSmallScreen ? 12 : 13),
    color: '#666',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 40 : 32,
    marginTop: isTablet ? 20 : 16,
  },
  noResultsText: {
    fontSize: isTablet ? 18 : (isSmallScreen ? 15 : 16),
    fontWeight: '600',
    color: '#666',
    marginTop: isTablet ? 16 : 12,
  },
  noResultsHint: {
    fontSize: isTablet ? 14 : (isSmallScreen ? 12 : 13),
    color: '#999',
    marginTop: isTablet ? 8 : 6,
    textAlign: 'center',
    paddingHorizontal: isTablet ? 32 : 24,
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