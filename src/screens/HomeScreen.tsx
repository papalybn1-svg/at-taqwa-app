import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, getFirestore, limit, orderBy, query } from 'firebase/firestore';
import React from "react";
import { Animated, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import chaptersData from '../../data/chapitres.json';
import colors from "../theme/colors";
import { AuthContext } from './LoginScreen';

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
};

const imageMap: { [key: string]: any } = {
  "1": require('../../assets/1.png'),
  "2": require('../../assets/2.png'),
  "3": require('../../assets/3.png'),
  "4": require('../../assets/4.png'),
  "5": require('../../assets/5.png'),
  "6": require('../../assets/6.png'),
  "7": require('../../assets/12.png'),
  "8": require('../../assets/15.png'),
  "9": require('../../assets/16.png'),
  "10": require('../../assets/17.png'),
  "11": require('../../assets/20.png'),
  "12": require('../../assets/21.png'),
};

const CategoryButton = ({ icon, title, onPress }: { icon: any; title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.categoryButton} onPress={onPress}>
    <View style={styles.categoryIconCircle}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
    </View>
    <Text style={styles.categoryButtonText}>{title}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = React.useContext(AuthContext);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [newNotificationsCount, setNewNotificationsCount] = React.useState(0);
  const [hadithOfTheDay, setHadithOfTheDay] = React.useState<{text: string, source: string} | null>(null);
  const db = getFirestore();
  const scrollX = React.useRef(new Animated.Value(0)).current;

  const loadNotifications = React.useCallback(async () => {
    try {
      const notifQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
      const notifSnapshot = await getDocs(notifQuery);
      const fetchedNotifications: Notification[] = notifSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Notification',
          body: data.message || data.body || 'Contenu de la notification',
          message: data.message || 'Contenu de la notification',
          createdAt: data.createdAt || new Date(),
          type: data.type || 'general'
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

      console.log(`Notifications chargées: ${fetchedNotifications.length}, Nouvelles: ${newCount}`);
      setNewNotificationsCount(newCount);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    }
  }, [db]);

  const handleNotificationPress = React.useCallback(async () => {
    // Mark all notifications as read
    await AsyncStorage.setItem('@last_notification_read', new Date().toISOString());
    setNewNotificationsCount(0);
    navigation.navigate('Notifications' as never);
  }, [navigation]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        await loadNotifications();
        
        // Fetch Hadith of the day
        const hadithsRef = collection(db, 'hadiths');
        const hadithsQuery = query(hadithsRef, orderBy('createdAt', 'desc'), limit(1));
        const hadithsSnapshot = await getDocs(hadithsQuery);
        if (!hadithsSnapshot.empty) {
          const hadithData = hadithsSnapshot.docs[0].data();
          setHadithOfTheDay({ 
            text: hadithData.text || 'Hadith du jour', 
            source: hadithData.source || 'Source inconnue' 
          });
        }

      } catch (error) {
        console.error("Erreur de chargement des données:", error);
      }
    };
    fetchData();
  }, []);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
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
            <CategoryButton icon="clock-time-four-outline" title="Prière" onPress={() => navigation.navigate('Horaires' as never)} />
            <CategoryButton icon="head-question-outline" title="Quiz" onPress={() => navigation.navigate('Quiz' as never)} />
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
            contentContainerStyle={{paddingHorizontal: 16}}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={5}
            renderItem={({ item, index }) => {
              const inputRange = [(index - 1) * 180, index * 180, (index + 1) * 180];
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
                  <TouchableOpacity style={styles.bookCard} onPress={() => navigation.navigate('Chapter', { chapter: item })}>
                    <View style={styles.bookImageContainer}>
                      <Image 
                        source={imageMap[item.image] || require('../../assets/1.png')} 
                        style={styles.bookImage}
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
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'left',
  },
  welcomeMessage: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
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
    width: '24%',
  },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  categoryButtonText: {
    fontSize: 13,
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
    width: 80,
    height: 100,
    resizeMode: 'contain',
  },
  bookCard: {
    width: 170,
    height: 220,
    backgroundColor: colors.white,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  bookImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f8f9fa',
  },
  bookImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookCardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  bookCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 18,
    textAlign: 'center',
  },
  bookCardSubtitle: {
    fontSize: 12,
    color: colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  hadithCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  hadithText: {
    fontSize: 16,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: 8,
  },
  hadithSource: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'right',
    fontWeight: 'bold',
  },
}); 