import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React from "react";
import { Animated, Image, ImageBackground, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import colors from "../theme/colors";
import { AuthContext } from './LoginScreen';
import { db, reconnectFirestore, testFirestoreConnection } from './firebaseConfig';

type RootStackParamList = {
  Main: undefined;
  Chapter: { chapter: any };
  Login: undefined;
  Notifications: undefined;
  Books: undefined;
  Horaires: undefined;
  Quiz: undefined;
  Tasbih: undefined;
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

const CategoryButton = ({ icon, title, onPress }: { icon: any; title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.categoryButton} onPress={onPress}>
    <View style={styles.categoryIconCircle}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
    </View>
    <Text style={styles.categoryButtonText} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = React.useContext(AuthContext);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [newNotificationsCount, setNewNotificationsCount] = React.useState(0);
  const [hadithOfTheDay, setHadithOfTheDay] = React.useState<{text: string, source: string} | null>(null);
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

  const fallbackHadith = {
    text: "Le Prophète ﷺ a dit : \"La prière est le pilier de la religion. Celui qui l'accomplit a établi sa religion, et celui qui l'abandonne a détruit sa religion.\"",
    source: 'Rapporté par Al-Boukhari'
  };

  const handleChapterPress = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setPreviewModalVisible(true);
  };

  const closePreviewModal = () => {
    setPreviewModalVisible(false);
    setSelectedChapter(null);
  };

  const openFullChapter = () => {
    if (selectedChapter) {
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
    // Mark all notifications as read
    await AsyncStorage.setItem('@last_notification_read', new Date().toISOString());
    setNewNotificationsCount(0);
    navigation.navigate('Notifications' as never);
  }, [navigation]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Attendre que Firestore soit connecté
        if (firestoreStatus === 'connected') {
          await loadNotifications();
          
          // Fetch Hadith of the day
          try {
            const hadithsRef = collection(db, 'hadiths');
            const hadithsQuery = query(hadithsRef, orderBy('createdAt', 'desc'), limit(1));
            const hadithsSnapshot = await getDocs(hadithsQuery);
            if (!hadithsSnapshot.empty) {
              const hadithData = hadithsSnapshot.docs[0].data();
              setHadithOfTheDay({ 
                text: hadithData.text || 'Hadith du jour', 
                source: hadithData.source || 'Source inconnue' 
              });
              console.log('✅ Hadith du jour chargé');
            } else {
              console.log('ℹ️ Aucun hadith trouvé, utilisation du fallback');
              setHadithOfTheDay(fallbackHadith);
            }
          } catch (hadithError) {
            console.error('❌ Erreur lors du chargement du hadith:', hadithError);
            console.log('🔄 Utilisation du hadith de fallback');
            setHadithOfTheDay(fallbackHadith);
          }
        } else if (firestoreStatus === 'error') {
          // Utiliser les données de fallback en cas d'erreur
          console.log('🔄 Mode hors ligne - utilisation des données de fallback');
          setNotifications(fallbackNotifications);
          setHadithOfTheDay(fallbackHadith);
          setNewNotificationsCount(0);
        } else {
          console.log('⏳ En attente de la connexion Firestore...');
        }
      } catch (error) {
        console.error("Erreur de chargement des données:", error);
        // En cas d'erreur, utiliser les données de fallback
        setNotifications(fallbackNotifications);
        setHadithOfTheDay(fallbackHadith);
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

  const allChapters = Object.values(chaptersData).flatMap((partie: any, partieIndex: number) => 
    partie.chapitres.map((ch: any, chapitreIndex: number) => ({
      ...ch,
      id: `${partieIndex}-${chapitreIndex}`,
      partie: partie.titre
    }))
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
          <View>
            <Text style={styles.bismillah}>بسم الله الرحمن الرحيم</Text>
            <Text style={styles.welcomeMessage}>Bienvenue dans ton espace</Text>
          </View>
          <TouchableOpacity onPress={handleNotificationPress} style={styles.notificationButton}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
            {newNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {newNotificationsCount > 99 ? '99+' : newNotificationsCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.gray} style={{marginRight: 10}}/>
            <TextInput
              placeholder="Rechercher"
              placeholderTextColor={colors.gray}
              style={styles.searchInput}
            />
          </View>
      </View>
        
        <View style={styles.section}>
      <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoriesGrid}>
            <CategoryButton icon="book-open-variant" title="Livres" onPress={() => navigation.navigate('Books' as never)} />
            <CategoryButton icon="clock-time-four-outline" title="Heure de prière" onPress={() => navigation.navigate('Horaires' as never)} />
            <CategoryButton icon="puzzle" title="Quiz" onPress={() => navigation.navigate('Quiz' as never)} />
            <CategoryButton icon="hand-heart" title="Tasbih" onPress={() => navigation.navigate('Tasbih' as never)} />
          </View>
      </View>

        <View style={styles.bannerContainer}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Transformez chaque prière en un moment de paix et de connexion</Text>
            <TouchableOpacity style={styles.bannerButton} onPress={() => navigation.navigate('Books' as never)}>
              <Text style={styles.bannerButtonText}>Commencer</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={require('../../assets/femme-transformer.png')} 
            style={styles.bannerImage}
            defaultSource={require('../../assets/femme-transformer.png')}
          />
        </View>

        {hadithOfTheDay &&
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hadith du jour</Text>
            <View style={styles.hadithCard}>
                <MaterialCommunityIcons name="format-quote-open" size={24} color={colors.primary} style={{alignSelf: 'flex-start', opacity: 0.5}}/>
                <Text style={styles.hadithText}>
                  {hadithOfTheDay.text || 'Hadith du jour'}
                </Text>
                <Text style={styles.hadithSource}>
                  — {hadithOfTheDay.source || 'Source inconnue'}
                </Text>
            </View>
          </View>
        }

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aperçu du Livre</Text>
          <Animated.FlatList
            data={allChapters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item.id || index.toString()}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
            contentContainerStyle={{paddingHorizontal: 20}}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={5}
            renderItem={({ item, index }) => {
              const inputRange = [(index - 1) * 170, index * 170, (index + 1) * 170];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.7, 1, 0.7],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View style={{ transform: [{ scale }], opacity, marginHorizontal: 8 }}>
                  <TouchableOpacity style={styles.bookCard} onPress={() => handleChapterPress(item)}>
                    <View style={styles.bookImageContainer}>
                      <Image 
                        source={imageMap[item.image] || imageMap['1']} 
                        style={
                          // Images qui ont besoin de zoom (chapitres avec espaces blancs)
                          ['1', '2', '3', '5'].includes(item.image) ? {
                            width: '220%',
                            height: '220%',
                            position: 'absolute',
                            top: '-60%',
                            left: '-60%'
                          } : {
                            // Images qui remplissent déjà bien (pas de zoom)
                            width: '100%',
                            height: '100%'
                          }
                        }
                        resizeMode="cover"
                        defaultSource={require('../../assets/1.png')}
                        onError={() => console.log('Erreur de chargement image:', item.image)}
                      />
                    </View>
                    <View style={styles.bookCardContent}>
                      <Text style={styles.bookCardTitle} numberOfLines={2}>
                        {item.title || 'Titre du chapitre'}
                      </Text>
                      <Text style={styles.bookCardSubtitle} numberOfLines={1}>
                        {item.partie || 'Partie'}
                      </Text>
                      <Text style={[styles.bookCardSubtitle, { fontSize: 10, marginTop: 4 }]} numberOfLines={1}>
                        {item.desc || 'Description'}
                      </Text>
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
            <View style={styles.previewModalContent}>
              <View style={styles.previewModalHeader}>
                <View style={styles.previewModalImageContainer}>
                  <Image 
                    source={imageMap[selectedChapter.image] || imageMap['1']} 
                    style={styles.previewModalImage}
                  />
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closePreviewModal}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.previewModalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.previewModalTitle}>{selectedChapter.title}</Text>
                <Text style={styles.previewModalSubtitle}>{selectedChapter.partie}</Text>
                <Text style={styles.previewModalDescription}>{selectedChapter.desc}</Text>
                
                <View style={styles.previewContentContainer}>
                  <Text style={styles.previewContentTitle}>Aperçu du contenu :</Text>
                  <Text style={styles.previewContentText}>
                    {chapterPreviews[selectedChapter.id] || 
                      "Ce chapitre explore les aspects fondamentaux de la prière en Islam, offrant des enseignements précieux pour enrichir votre pratique spirituelle et renforcer votre connexion avec Allah."}
                  </Text>
      </View>
    </ScrollView>
              
              <View style={styles.previewModalActions}>
                <TouchableOpacity style={styles.previewModalButton} onPress={openFullChapter}>
                  <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.white} />
                  <Text style={styles.previewModalButtonText}>Lire le chapitre complet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  bismillah: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'left',
  },
  welcomeMessage: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
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
  searchSection: {
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 14,
    paddingHorizontal: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  categoryButton: {
    alignItems: 'center',
    width: '25%',
  },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  categoryButtonText: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  bannerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    marginHorizontal: 24,
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
    paddingRight: 10,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    lineHeight: 22,
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  bannerImage: {
    width: 240,
    height: 300,
    resizeMode: 'contain',
    position: 'absolute',
    right: -70,
    bottom: -80,
  },
  bookCard: {
    width: 160,
    height: 240,
    backgroundColor: colors.white,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  bookImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },

  bookCardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  bookCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 18,
    textAlign: 'center',
  },
  bookCardSubtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
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
  previewModalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  previewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  previewModalImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  previewModalScroll: {
    flex: 1,
    marginBottom: 15,
  },
  previewModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  previewModalSubtitle: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  previewModalDescription: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  previewContentContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  previewContentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  previewContentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  previewModalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  previewModalButton: {
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
  },
  previewModalButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
}); 