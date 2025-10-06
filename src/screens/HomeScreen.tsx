import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React from 'react';
import {
    Alert,
    Animated,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import { getResponsiveStyle, useResponsive } from '../hooks/useResponsive';
import colors from '../theme/colors';
import { useEntitlements } from '../contexts/EntitlementsContext';
import { AuthContext } from './LoginScreen';
import { db, reconnectFirestore, testFirestoreConnection } from './firebaseConfig';

// Fonction utilitaire pour obtenir l'image d'un chapitre avec fallback
const getChapterImage = (imageKey: string) => {
  console.log('🔍 Tentative de chargement image:', imageKey);
  if (imageMap[imageKey]) {
    console.log('✅ Image trouvée dans le mapping:', imageKey);
    return imageMap[imageKey];
  }
  console.log('⚠️ Image non trouvée, utilisation du fallback:', imageKey);
  // Fallback vers l'image par défaut
  return imageMap['1'] || require('../../assets/1.png');
};

type RootStackParamList = {
  Main: undefined;
  Chapter: { chapter: any };
  Login: undefined;
  Notifications: undefined;
  Books: undefined;
  Horaires: undefined;
  Quiz: undefined;
  QuizStart: undefined;
  QuizGame: undefined;
  OriginalQuiz: undefined;
  QuizChapterSelect: undefined;
  Tasbih: undefined;
  Admin: undefined;
  AuthorProfile: undefined;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  message?: string;
  createdAt: any;
  type?: string;
  source: string;
};

type Chapter = {
  id: string;
  title: string;
  desc: string;
  author: string;
  image: string;
  partie: string;
  partieTitre?: string;
  content?: string;
};

// Contenu d'aperçu pour chaque chapitre
const chapterPreviews: { [key: string]: string } = {
  "0-0": `La prière (As-Salât) est le deuxième pilier de l'Islam après l'attestation de foi. Elle constitue le lien direct entre le serviteur et son Seigneur. Dans ce chapitre, nous explorerons la signification profonde de la prière, ses sources dans le Coran et la Sunna, ainsi que ses vertus spirituelles et sociales.

La prière n'est pas seulement un acte d'adoration, mais un moment de purification de l'âme et de renforcement de la foi. Elle nous rappelle constamment notre devoir envers Allah et nous maintient sur le droit chemin.`,
  
  "0-1": `La purification (At-Tahâra) est la condition sine qua non pour la validité de toute prière. Sans elle, aucun acte d'adoration ne peut être accepté. Ce chapitre détaille les différents types de purification requis avant la prière.

La purification comprend à la fois la purification physique (des mains, du visage, des pieds) et la purification spirituelle (de l'intention et du cœur). Elle symbolise notre préparation à rencontrer Allah dans la prière.`,
  
  "0-2": `Outre la purification, d'autres conditions doivent être remplies pour que la prière soit valide. Ces conditions concernent le temps, l'orientation vers la Kaaba, la couverture du corps, et l'état mental du fidèle.

Chaque condition a sa raison d'être et contribue à la perfection de l'acte d'adoration. Le respect de ces conditions témoigne de notre soumission totale à la volonté divine.`,
  
  "1-0": `La prière suit un ordre précis et des mouvements codifiés. Chaque geste a sa signification et sa place dans l'ensemble de l'acte d'adoration. Ce chapitre vous guide pas à pas dans l'exécution correcte de la prière.

De la position debout à la prosternation, en passant par l'inclination, chaque mouvement doit être effectué avec conscience et dévotion. La prière est un dialogue avec Allah, un moment de recueillement et de soumission.`,
  
  "1-1": `Les actes surérogatoires (Sunnas) enrichissent la prière et nous rapprochent d'Allah. Bien qu'ils ne soient pas obligatoires, ils complètent et embellissent notre adoration. Ce chapitre détaille ces actes recommandés.

Les Sunnas incluent les invocations supplémentaires, les gestes recommandés, et les attitudes à adopter pendant la prière. Leur pratique témoigne de notre amour pour Allah et notre désir de perfection dans l'adoration.`,
  
  "1-2": `Les obligations divines (Fard) constituent le minimum requis pour que la prière soit valide. Leur omission ou modification rend la prière invalide et nécessite une réparation. Ce chapitre explique ces obligations essentielles.

Chaque obligation a été prescrite par Allah et transmise par le Prophète ﷺ. Leur respect est une manifestation de notre obéissance et de notre soumission à la volonté divine.`,
  
  "1-3": `Les prières surérogatoires (Nawâfil) sont des actes d'adoration supplémentaires qui nous rapprochent d'Allah. Elles complètent les prières obligatoires et nous permettent d'exprimer notre amour et notre gratitude envers notre Créateur.

Ces prières peuvent être accomplies à différents moments de la journée et de la nuit. Elles constituent une source de bénédictions et de récompenses supplémentaires pour le fidèle dévoué.`,
  
  "2-0": `La prière en commun (Salât Al-Jamâ'a) revêt une importance particulière dans l'Islam. Elle symbolise l'unité de la communauté musulmane et renforce les liens fraternels entre les fidèles. Ce chapitre explore les règles de la prière collective.

Prier en commun multiplie les récompenses et nous rappelle que nous faisons partie d'une communauté unie par la foi. L'Imam guide la prière et les fidèles suivent ses mouvements dans l'unité et la discipline.`,
  
  "2-1": `En priant derrière l'Imam, le fidèle doit respecter certaines règles pour ne pas perturber la prière collective. Ce chapitre détaille les erreurs à éviter et les comportements à adopter lors de la prière en commun.

Le fidèle doit suivre l'Imam sans le devancer et sans trop tarder. Il doit maintenir l'alignement et respecter l'ordre établi pour préserver l'harmonie de la prière collective.`,
  
  "2-2": `L'Imam, en tant que guide de la prière, a des responsabilités particulières. Il doit veiller à la correcte exécution de la prière et guider les fidèles avec bienveillance et compétence. Ce chapitre aborde les devoirs de l'Imam.

Un bon Imam doit connaître les règles de la prière, avoir une belle voix pour la récitation, et être attentif aux besoins de la communauté. Il doit aussi corriger les erreurs avec tact et bienveillance.`,
  
  "2-3": `La prière du vendredi (Salât Al-Jumu'a) est une obligation particulière pour les hommes musulmans. Elle se distingue par le sermon (Khutba) qui précède la prière et par son caractère communautaire. Ce chapitre explique les spécificités de cette prière.

Le vendredi est un jour béni dans l'Islam, un moment de rassemblement et de renforcement de la foi communautaire. Le sermon permet de rappeler les enseignements islamiques et de guider la communauté.`,
  
  "2-4": `Le voyageur bénéficie de facilités particulières dans l'accomplissement de ses prières. Ces facilités sont une manifestation de la miséricorde divine envers les fidèles qui se déplacent. Ce chapitre détaille les règles de la prière en voyage.

Le raccourcissement et la combinaison des prières sont permis au voyageur pour faciliter son adoration. Ces facilités témoignent de la sagesse divine qui tient compte des circonstances de la vie humaine.`
};

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { entitlements } = useEntitlements();
  const { user } = React.useContext(AuthContext);
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const styles = createStyles(responsive, responsiveStyle);
  
  const CategoryButton = ({ icon, title, onPress }: { icon: any; title: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.categoryButton} onPress={onPress}>
      <View style={styles.categoryIconCircle}>
        <MaterialCommunityIcons 
          name={icon} 
          size={responsive.isLandscape ? (icon === 'hands-pray' ? 24 : 20) : (icon === 'hands-pray' ? 28 : 24)} 
          color={colors.primary} 
        />
      </View>
      <Text 
        style={styles.categoryButtonText}
        numberOfLines={2}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.9}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
  
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [newNotificationsCount, setNewNotificationsCount] = React.useState(0);

  const [previewModalVisible, setPreviewModalVisible] = React.useState(false);
  const [selectedChapter, setSelectedChapter] = React.useState<Chapter | null>(null);
  const [firestoreStatus, setFirestoreStatus] = React.useState<'connecting' | 'connected' | 'error'>('connecting');

  const scrollX = React.useRef(new Animated.Value(0)).current;

  // Test de connexion Firestore au démarrage
  React.useEffect(() => {
    const testConnection = async () => {
      console.log('🚀 Test de connexion Firestore au démarrage...');
      setFirestoreStatus('connecting');
      
      try {
        // Forcer la reconnexion
        await reconnectFirestore();
        
        // Tester la connexion avec timeout
        const connectionPromise = testFirestoreConnection();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        
        const isConnected = await Promise.race([connectionPromise, timeoutPromise]);
        
        if (isConnected) {
          console.log('✅ Firestore connecté avec succès');
          setFirestoreStatus('connected');
        } else {
          console.log('❌ Firestore non connecté');
          setFirestoreStatus('error');
        }
      } catch (error) {
        console.error('❌ Erreur lors du test de connexion:', error);
        setFirestoreStatus('error');
        
        // En cas d'erreur, on continue avec les données locales
        console.log('🔄 Utilisation du mode hors ligne avec données locales');
      }
    };

    testConnection();
  }, []);

  // Données de fallback pour le mode hors ligne
  const fallbackNotifications: Notification[] = [
    {
      id: 'fallback-1',
      title: 'Bienvenue dans At-Taqwa App',
      body: 'Découvrez nos fonctionnalités et commencez votre voyage spirituel.',
      message: 'Découvrez nos fonctionnalités et commencez votre voyage spirituel.',
      createdAt: new Date(),
      type: 'welcome',
      source: 'Système'
    },
    {
      id: 'fallback-2',
      title: 'Mode hors ligne activé',
      body: 'Vous êtes actuellement en mode hors ligne. Certaines fonctionnalités peuvent être limitées.',
      message: 'Vous êtes actuellement en mode hors ligne. Certaines fonctionnalités peuvent être limitées.',
      createdAt: new Date(),
      type: 'info',
      source: 'Système'
    }
  ];



  // Fonction pour vérifier si un chapitre est premium et non débloqué
  const isPremiumChapter = (chapter: Chapter) => {
    const premiumParts = ['deuxieme_partie', 'troisieme_partie'];
    if (!premiumParts.includes(chapter.partie)) {
      return false; // Pas une partie premium
    }
    
    // Vérifier si l'utilisateur a accès à cette partie premium
    if (chapter.partie === 'deuxieme_partie' && entitlements.part2) {
      return false; // Partie 2 débloquée
    }
    if (chapter.partie === 'troisieme_partie' && entitlements.part3) {
      return false; // Partie 3 débloquée
    }
    
    return true; // Partie premium non débloquée
  };

  const handleChapterPress = (chapter: Chapter) => {
    // Si le chapitre est premium, afficher un message au lieu d'ouvrir le modal
    if (isPremiumChapter(chapter)) {
      const partieNumero = chapter.partie === 'deuxieme_partie' ? '2' : '3';
      Alert.alert(
        'Contenu Premium',
        `Ce chapitre fait partie de la Partie ${partieNumero} qui nécessite un paiement pour être accessible.${'\n\n'}Débloquez l'accès complet à cette partie premium.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Voir les parties', 
            onPress: () => navigation.navigate('Books' as never)
          }
        ]
      );
      return;
    }
    
    setSelectedChapter(chapter);
    setPreviewModalVisible(true);
  };

  const closePreviewModal = () => {
    setPreviewModalVisible(false);
    setSelectedChapter(null);
  };

  const openFullChapter = () => {
    if (selectedChapter) {
      // Vérifier si c'est un chapitre premium non débloqué
      if (isPremiumChapter(selectedChapter)) {
        const partieNumero = selectedChapter.partie === 'deuxieme_partie' ? '2' : '3';
        Alert.alert(
          'Contenu Premium',
          `Ce chapitre fait partie de la Partie ${partieNumero} qui nécessite un paiement pour être accessible.${'\n\n'}Débloquez l'accès complet à cette partie premium.`,
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Voir les parties', 
              onPress: () => {
                closePreviewModal();
                navigation.navigate('Books' as never);
              }
            }
          ]
        );
        return;
      }
      
      closePreviewModal();
      navigation.navigate('Chapter', { chapter: selectedChapter });
    }
  };

  const loadNotifications = React.useCallback(async () => {
    if (firestoreStatus !== 'connected') {
      console.log('⚠️ Firestore non connecté, impossible de charger les notifications');
      return;
    }

    try {
      console.log("🔍 Tentative de chargement des notifications...");
      
      const notifQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
      console.log("📋 Requête créée, exécution...");
      
      const notifSnapshot = await getDocs(notifQuery);
      console.log(`📊 Snapshot reçu: ${notifSnapshot.docs.length} documents`);
      
      const fetchedNotifications: Notification[] = notifSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📄 Document ${doc.id}:`, data);
        return {
          id: doc.id,
          title: data.title || 'Notification',
          body: data.message || data.body || 'Contenu de la notification',
          message: data.message || 'Contenu de la notification',
          createdAt: data.createdAt || new Date(),
          type: data.type || 'general',
          source: data.authorName || data.author || data.createdBy || 'Admin'
        };
      });
      setNotifications(fetchedNotifications);

      // Get last read timestamp
      const lastRead = await AsyncStorage.getItem('@last_notification_read');
      const lastReadTime = lastRead ? new Date(lastRead) : new Date(0);

      // Count new notifications
      const newCount = fetchedNotifications.filter(notif => {
        const notifTime = notif.createdAt?.toDate?.() || new Date(notif.createdAt);
        return notifTime > lastReadTime;
      }).length;

      console.log(`✅ Notifications chargées: ${fetchedNotifications.length}, Nouvelles: ${newCount}`);
      setNewNotificationsCount(newCount);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des notifications:", error);
      console.error("🔍 Détails de l'erreur:", {
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        code: error instanceof Error && 'code' in error ? (error as any).code : 'Code inconnu',
        stack: error instanceof Error ? error.stack : 'Stack inconnu'
      });
      
      // Tentative de reconnexion en cas d'erreur
      if (error instanceof Error && error.message.includes('offline')) {
        console.log('🔄 Tentative de reconnexion...');
        await reconnectFirestore();
      }
    }
  }, [db, firestoreStatus]);

  const handleNotificationPress = React.useCallback(async () => {
    console.log('🔔 Bouton notification cliqué !');
    console.log('📍 Début de handleNotificationPress');
    
    try {
      console.log('📱 Tentative de sauvegarde AsyncStorage...');
      await AsyncStorage.setItem('@last_notification_read', new Date().toISOString());
      console.log('✅ AsyncStorage sauvegardé avec succès');
      
      console.log('🔄 Remise à zéro du compteur...');
      setNewNotificationsCount(0);
      console.log('✅ Compteur remis à zéro');
      
      console.log('🧭 Tentative de navigation vers Notifications...');
      navigation.navigate('Notifications');
      console.log('✅ Navigation lancée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la navigation vers Notifications:', error);
      console.error('🔍 Détails complets de l\'erreur:', JSON.stringify(error, null, 2));
      
      // Fallback : essayer de naviguer directement
      try {
        console.log('🔄 Tentative de navigation alternative...');
        navigation.navigate('Notifications' as never);
      } catch (fallbackError) {
        console.error('❌ Erreur de navigation alternative:', fallbackError);
      }
    }
  }, [navigation]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Attendre que Firestore soit connecté
        if (firestoreStatus === 'connected') {
          await loadNotifications();
          

        } else if (firestoreStatus === 'error') {
          // Utiliser les données de fallback en cas d'erreur
          console.log('🔄 Mode hors ligne - utilisation des données de fallback');
          setNotifications(fallbackNotifications);
          setNewNotificationsCount(0);
        } else {
          console.log('⏳ En attente de la connexion Firestore...');
        }
      } catch (error) {
        console.error("Erreur de chargement des données:", error);
        // En cas d'erreur, utiliser les données de fallback
        setNotifications(fallbackNotifications);
        setNewNotificationsCount(0);
      }
    };
    fetchData();
  }, [firestoreStatus, loadNotifications]);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (firestoreStatus === 'connected') {
        loadNotifications();
      }
    }, [firestoreStatus, loadNotifications])
  );

  // Import des fichiers de chapitres (comme dans ChapterScreen)
  const chapterFiles: { [key: string]: any } = {
    "1": require('../../data/chapitres/chapitre_01.json'),
    "2": require('../../data/chapitres/chapitre_02.json'),
    "3": require('../../data/chapitres/chapitre_03.json'),
    "4": require('../../data/chapitres/chapitre_04.json'),
    "5": require('../../data/chapitres/chapitre_05.json'),
    "6": require('../../data/chapitres/chapitre_06.json'),
    "7": require('../../data/chapitres/chapitre_07.json'),
    "8": require('../../data/chapitres/chapitre_08.json'),
    "9": require('../../data/chapitres/chapitre_09.json'),
    "10": require('../../data/chapitres/chapitre_10.json'),
    "11": require('../../data/chapitres/chapitre_11.json'),
    "12": require('../../data/chapitres/chapitre_12.json'),
  };

  // Fonction pour diviser le contenu en sections (copiée de ChapterScreen)
  const splitIntroAndSections = (contenu: any[]) => {
    const sections: { title: string, items: any[] }[] = [];
    let currentSection: { title: string, items: any[] } | null = null;

    contenu.forEach((item) => {
      // Si c'est un titre de section (I., II., III., etc.)
      if (item.contenu && typeof item.contenu === 'string' && item.contenu.match(/^\s*[IVXLCDM]+[\.-]/)) {
        // Sauvegarder la section précédente si elle existe
        if (currentSection) {
          sections.push(currentSection);
        }
        // Créer une nouvelle section avec ce titre
        currentSection = { title: item.contenu, items: [] };
      } else {
        // Si on a une section en cours, ajouter l'item à cette section
        if (currentSection) {
          currentSection.items.push(item);
        } else {
          // Si on n'a pas encore de section (début du chapitre), créer une première section sans titre
          if (sections.length === 0) {
            sections.push({ title: "", items: [item] });
          } else {
            // Ajouter à la première section existante
            sections[0].items.push(item);
          }
        }
      }
    });
    
    // Ajouter la dernière section si elle existe
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Garder toutes les sections non vides
    const filteredSections = sections.filter(section => {
      return section.items && section.items.length > 0;
    });
    
    return { sections: filteredSections };
  };

  // Fonction pour calculer le nombre de pages d'un chapitre
  const getChapterPages = (chapterImage: string) => {
    try {
      const chapterFile = chapterFiles[chapterImage];
      if (chapterFile && chapterFile.contenu) {
        const { sections } = splitIntroAndSections(chapterFile.contenu);
        return sections.length;
      }
    } catch (error) {
      console.log('Erreur lors du calcul des pages pour le chapitre', chapterImage);
    }
    return 1; // Valeur par défaut
  };



  // Correction : tous les chapitres doivent apparaître
  let globalChapitreIndex = 1;
  const allChapters = Object.entries(chaptersData).flatMap(([partieKey, partie]: any, partieIndex: number) =>
    partie.chapitres.map((ch: any, chapitreIndex: number) => {
      const currentChapitreNumber = globalChapitreIndex++;
      const pageCount = getChapterPages(ch.image);
      return {
        ...ch,
        id: `${partieIndex}-${chapitreIndex}`,
        partie: partieKey, // Utiliser la clé de la partie au lieu du titre
        partieTitre: partie.titre, // Garder le titre pour l'affichage
        title: `Chapitre ${currentChapitreNumber}.`,
        pageCount: pageCount
      };
    })
  );

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
          <View>
            <Text style={styles.bismillah}>بسم الله الرحمن الرحيم</Text>
            <Text style={styles.welcomeMessage}>
              Bienvenue {user?.displayName || user?.email?.split('@')[0] || ''}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleNotificationPress} 
            style={styles.notificationButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#174C3C" />
            {newNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {newNotificationsCount > 99 ? '99+' : newNotificationsCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
      </View>

        <View style={styles.bannerContainer}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Transformez chaque prière en un moment de paix</Text>
            <TouchableOpacity style={styles.bannerButton} onPress={() => navigation.navigate('Books')}>
              <Text style={styles.bannerButtonText}>Commencer</Text>
            </TouchableOpacity>
      </View>
          <Image 
            source={require('../../assets/femme-transformer.png')} 
            style={styles.bannerImage}
            defaultSource={require('../../assets/femme-transformer.png')}
          />
      </View>

        <View style={styles.section}>
      <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoriesGrid}>
            <CategoryButton icon="book-open-variant" title="Livres" onPress={() => navigation.navigate('Books')} />
            <CategoryButton icon="clock-time-four-outline" title="Heure de prière" onPress={() => navigation.navigate('Horaires')} />
            <CategoryButton icon="puzzle" title="Quiz" onPress={() => navigation.navigate('Quiz')} />
            <CategoryButton icon="hands-pray" title="Tasbih" onPress={() => navigation.navigate('Tasbih')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auteur du livre</Text>
          <View style={styles.authorCard}>

            <View style={styles.authorHeader}>
              <Text style={styles.authorName}>Aly Anta Sow</Text>
              <TouchableOpacity style={styles.authorButtonSmall} onPress={() => navigation.navigate('AuthorProfile')}>
                <MaterialCommunityIcons name="account-details" size={14} color={colors.white} />
                <Text style={styles.authorButtonTextSmall}>En savoir plus</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.authorDetails}>
              <Text style={styles.authorBio}>
                Passionné de recherches sur l'islam, il rend les textes islamiques accessibles aux non arabophones.
                Auteur d'essais sur le Hajj, la Oumra, le Jeûne de Ramadan et la vie du Prophète.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aperçu du Livre</Text>
          <Animated.FlatList
            data={allChapters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item.id || index.toString()}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
            contentContainerStyle={{paddingHorizontal: 12, paddingVertical: 8}}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={5}
            renderItem={({ item, index }) => {
              const inputRange = [(index - 1) * 176, index * 176, (index + 1) * 176];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.96, 1, 0.96],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.8, 1, 0.8],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View style={{ transform: [{ scale }], opacity, marginHorizontal: 6 }}>
                  <TouchableOpacity 
                    style={[
                      styles.bookCardModern,
                      styles.premiumCard
                    ]} 
                    onPress={() => handleChapterPress(item)}
                  >
                    <View style={styles.bookImageContainer}>
                      <Image 
                        source={getChapterImage(item.image)} 
                        style={styles.bookImageModern}
                        resizeMode="cover"
                        fadeDuration={0}
                        onError={() => {
                          console.log('Erreur de chargement image:', item.image);
                        }}
                      />
                      {/* Indicateur premium pour les chapitres premium */}
                      {isPremiumChapter(item) && (
                        <View style={styles.premiumBadge}>
                          <MaterialCommunityIcons name="crown" size={16} color={colors.secondary} />
                          <Text style={styles.premiumText}>PREMIUM</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.bookCardContentModern}>
                      <Text style={styles.bookCardTitleModern} numberOfLines={1}>{item.title.replace(/\.\s*$/, ':')}</Text>
                      <Text style={styles.bookCardDescModern} numberOfLines={3}>{item.desc || 'Titre du chapitre'}</Text>
                      <Text style={styles.bookCardSubtitleModern} numberOfLines={2}>{item.partieTitre || 'Partie'}</Text>
                      <View style={styles.bookCardFooterModern}>
                        <View style={styles.pagesCountModern}>
                          <MaterialCommunityIcons name="book-open-page-variant" size={12} color={colors.gray} />
                          <Text style={styles.pagesCountTextModern}>{item.pageCount} pages</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )
            }}
          />
        </View>
      </ScrollView>
      {previewModalVisible && selectedChapter && (
        <Modal
          visible={previewModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closePreviewModal}
        >
          <View style={styles.previewModalOverlay}>
            <View style={styles.previewModalContentModern}>
              <View style={styles.previewModalHeaderModern}>
                  <Image 
                    source={getChapterImage(selectedChapter.image)} 
                  style={styles.previewModalImageModern}
                    resizeMode="cover"
                    fadeDuration={0}
                    onError={() => console.log('Erreur de chargement image modal:', selectedChapter.image)}
                  />
                <TouchableOpacity style={styles.closeButton} onPress={closePreviewModal}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.previewModalTitleModern}>{selectedChapter.title}</Text>
              <Text style={styles.previewModalSubtitleModern}>{selectedChapter.partieTitre}</Text>
              <Text style={styles.previewModalAuthorModern}>par {selectedChapter.author || 'Auteur inconnu'}</Text>
              <ScrollView style={styles.previewModalScrollModern} showsVerticalScrollIndicator={false}>
                <Text style={styles.previewModalDescriptionModern}>
                  {chapterPreviews[selectedChapter.id] ? 
                    chapterPreviews[selectedChapter.id].substring(0, 350) + '...'
                    :
                    selectedChapter.desc || "Ce chapitre explore les aspects fondamentaux de la prière en Islam, offrant des enseignements précieux pour enrichir votre pratique spirituelle et renforcer votre connexion avec Allah. Découvrez les secrets d'une prière authentique et transformatrice qui vous rapprochera de votre Créateur..."
                  }
                  </Text>
    </ScrollView>
              <TouchableOpacity 
                style={[
                  styles.previewModalButtonModern,
                  isPremiumChapter(selectedChapter) && styles.previewModalButtonPremium
                ]} 
                onPress={openFullChapter}
              >
                  <MaterialCommunityIcons 
                    name={isPremiumChapter(selectedChapter) ? "crown" : "book-open-variant"} 
                    size={20} 
                    color={colors.white} 
                  />
                <Text style={styles.previewModalButtonTextModern}>
                  {isPremiumChapter(selectedChapter) ? 'Chapitre Premium' : 'Lire le chapitre complet'}
                </Text>
                </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const createStyles = (responsive: any, responsiveStyle: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F6' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 15,
    marginBottom: 20,
  },
  bismillah: {
    fontSize: responsiveStyle.fontSize['3xl'],
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  welcomeMessage: {
    fontSize: responsiveStyle.fontSize.base,
    color: colors.gray,
    marginTop: responsiveStyle.spacing.xs,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  bannerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -5,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20,
    position: 'relative',
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 40,
    maxWidth: '70%',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
    lineHeight: 18,
    marginBottom: 10,
  },
  bannerButton: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  bannerImage: {
    width: 140,
    height: 180,
    resizeMode: 'contain',
    position: 'absolute',
    right: -30,
    bottom: -30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  categoriesGrid: {
    flexDirection: responsive.isLandscape ? 'row' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveStyle.spacing.xl,
    minHeight: responsive.isLandscape ? 80 : 100,
    flexWrap: responsive.isLandscape ? 'wrap' : 'nowrap',
  },
  categoryButton: {
    alignItems: 'center',
    width: responsive.isLandscape ? '22%' : '25%',
    minHeight: responsive.isLandscape ? 70 : 80,
    marginBottom: responsive.isLandscape ? responsiveStyle.spacing.sm : 0,
  },
  categoryIconCircle: {
    width: responsive.isLandscape ? Math.min(50, responsive.width * 0.12) : Math.min(60, responsive.width * 0.15),
    height: responsive.isLandscape ? Math.min(50, responsive.width * 0.12) : Math.min(60, responsive.width * 0.15),
    borderRadius: responsive.isLandscape ? Math.min(25, responsive.width * 0.06) : Math.min(30, responsive.width * 0.075),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveStyle.spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  categoryButtonText: {
    fontSize: responsive.isLandscape ? responsiveStyle.fontSize.sm : responsiveStyle.fontSize.base,
    color: colors.text,
    textAlign: 'center',
    lineHeight: responsive.isLandscape ? responsiveStyle.fontSize.sm * 1.2 : responsiveStyle.fontSize.base * 1.4,
  },
  bookCardModern: {
    width: 160,
    height: 280,
    backgroundColor: colors.white,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  bookImageContainer: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookImageModern: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bookCardContentModern: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  bookCardTitleModern: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 4,
    height: 16,
  },
  bookCardDescModern: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 4,
    height: 39,
  },
  bookCardSubtitleModern: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 12,
    paddingHorizontal: 4,
    height: 24,
  },
  bookCardFooterModern: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  readTimeModern: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeTextModern: {
    color: colors.gray,
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  pagesCountModern: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagesCountTextModern: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  hadithCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  hadithText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 6,
  },
  hadithSource: {
    fontSize: 12,
    color: colors.primary,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModalContentModern: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 370,
    alignSelf: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    alignItems: 'center',
  },
  previewModalHeaderModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  previewModalImageModern: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    resizeMode: 'cover',
  },
  previewModalTitleModern: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  previewModalSubtitleModern: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '600',
  },
  previewModalAuthorModern: {
    fontSize: 13,
    color: colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  previewModalScrollModern: {
    maxHeight: 120,
    marginBottom: 10,
  },
  previewModalDescriptionModern: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  previewModalButtonModern: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 10,
  },
  previewModalButtonTextModern: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  authorText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: colors.gray,
    marginLeft: 4,
    fontWeight: '500',
  },
  readMoreButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 10,
  },
  readMoreText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  authorCard: {
    backgroundColor: colors.white,
    borderRadius: responsive.isLandscape ? 16 : 18,
    padding: responsive.isLandscape ? 16 : 20,
    marginHorizontal: responsive.isLandscape ? 16 : 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  authorHeader: {
    flexDirection: responsive.isLandscape ? 'column' : 'row',
    alignItems: responsive.isLandscape ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    marginBottom: responsive.isLandscape ? 12 : 15,
    gap: responsive.isLandscape ? 8 : 0,
  },
  authorAvatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  authorDetails: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    fontSize: responsive.isLandscape ? 14 : 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: responsive.isLandscape ? 6 : 8,
    flex: responsive.isLandscape ? 0 : 1, // Ne pas prendre tout l'espace en mode paysage
  },
  authorTitle: {
    fontSize: 14,
    color: 'colors.secondary',
    fontWeight: '600',
    marginBottom: 0,
    marginLeft: 8,
  },
  authorBio: {
    fontSize: 13,
    color: colors.gray,
    lineHeight: 18,
    fontWeight: '400',
  },
  authorButton: {
    backgroundColor: colors.secondary,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  authorButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
  },
  authorButtonSmall: {
    backgroundColor: colors.secondary,
    borderRadius: responsive.isLandscape ? 16 : 18,
    paddingVertical: responsive.isLandscape ? 6 : 8,
    paddingHorizontal: responsive.isLandscape ? 12 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxWidth: responsive.width * 0.4, // Limiter la largeur maximale
  },
  authorButtonTextSmall: {
    color: colors.white,
    fontWeight: '600',
    fontSize: responsive.isLandscape ? 10 : 11,
    marginLeft: responsive.isLandscape ? 4 : 6,
    flexShrink: 1, // Permettre au texte de se réduire si nécessaire
  },
  authorBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  authorBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bookOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumber: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
  },
  chapterNumberText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  pagesCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagesCountText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  premiumText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  previewModalButtonPremium: {
    backgroundColor: colors.secondary,
  },
}); 