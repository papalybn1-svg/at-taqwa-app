import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from "react";
import { Animated, Dimensions, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import burgerMenu from '../../assets/burger-menu.png';
import chaptersData from '../../data/chapitres.json';
import colors from "../theme/colors";
import { AuthContext } from './LoginScreen';

type RootStackParamList = {
  Main: undefined;
  Chapter: { chapter: any };
  Login: undefined;
};

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, setUser } = React.useContext(AuthContext);
  const [favorites, setFavorites] = React.useState<number[]>([]);
  const [summaryVisible, setSummaryVisible] = React.useState(false);
  const [summaryContent, setSummaryContent] = React.useState<{title: string, desc: string, author: string} | null>(null);

  // --- Nouvelle logique pour l'aperçu des chapitres ---
  // On extrait tous les chapitres de toutes les parties dans un seul tableau
  const allChapters = Object.values(chaptersData).flatMap((partie: any) => partie.chapitres.map((ch: any) => ({
    ...ch,
    partie: partie.titre
  })));
  // Pour l'image, on mappe le numéro à l'asset local
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
  const screenWidth = Dimensions.get('window').width;

  // --- Ajout auto-scroll ---
  const flatListRef = React.useRef<FlatList>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    let scrollValue = 0;
    let scroller: NodeJS.Timeout;
    const totalCards = allChapters.length;
    const cardWidth = 120 + 12; // largeur card + margin
    function autoScroll() {
      scroller = setInterval(() => {
        scrollValue += cardWidth;
        if (scrollValue > (totalCards - 1) * cardWidth) {
          scrollValue = 0;
        }
        flatListRef.current?.scrollToOffset({ offset: scrollValue, animated: true });
      }, 2200); // vitesse lente
    }
    autoScroll();
    return () => clearInterval(scroller);
  }, [allChapters.length]);

  // Déplacer la déclaration de scaleAnim dans le composant
  const scaleAnim = new Animated.Value(1);

  // Fonction pour marquer/démarquer un chapitre en favoris avec animation
  const toggleFavorite = (id: number) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
    setFavorites(prev => prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]);
  };

  // Ajouter l'état et la fonction pour l'animation des catégories
  const categoryScale = React.useRef(new Animated.Value(1)).current;

  const animateCategory = () => {
    Animated.sequence([
      Animated.timing(categoryScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(categoryScale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  // Fonction pour ouvrir le résumé d'un chapitre
  const showSummary = (chapter: any) => {
    setSummaryContent({ title: chapter.title, desc: chapter.desc, author: chapter.author });
    setSummaryVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top","bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.bismillahAr}>بسم الله الرحمن الرحيم</Text>
              <Text style={styles.welcome}>Bienvenue {user?.displayName || user?.email || 'dans ton espace'}</Text>
            </View>
            <TouchableOpacity style={styles.avatarBtnHome}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarHome} />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={38} color={colors.primary} style={styles.avatarHome} />
              )}
            </TouchableOpacity>
          </View>
          <TextInput style={styles.searchBarFlat} placeholder="Rechercher" />
        </View>
        <Text style={styles.sectionTitle}>Catégories</Text>
        <View style={styles.categoriesFlat}>
          <TouchableOpacity style={styles.category} onPress={() => { animateCategory(); navigation.navigate('Books' as never); }}>
            <Animated.View style={{ transform: [{ scale: categoryScale }] }}>
              <Image source={require('../../assets/priere.png')} style={styles.categoryIcon} />
              <Text style={styles.categoryText}>Livres</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.category} onPress={() => { animateCategory(); navigation.navigate('Horaires' as never); }}>
            <Animated.View style={{ transform: [{ scale: categoryScale }] }}>
              <Image source={require('../../assets/abulution.png')} style={styles.categoryIcon} />
              <Text style={styles.categoryText}>Horaires</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.category} onPress={() => { animateCategory(); navigation.navigate('Quiz' as never); }}>
            <Animated.View style={{ transform: [{ scale: categoryScale }] }}>
              <Image source={require('../../assets/femme.png')} style={styles.categoryIcon} />
              <Text style={styles.categoryText}>Quizz</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.category} onPress={() => { animateCategory(); navigation.navigate('Tasbih' as never); }}>
            <Animated.View style={{ transform: [{ scale: categoryScale }] }}>
              <Image source={require('../../assets/tasbih.png')} style={styles.categoryIcon} />
              <Text style={styles.categoryText}>Tasbih</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={styles.bannerV2}>
          <View style={styles.bannerContentV2}>
            <View style={styles.bannerTextContainerV2}>
              <Text style={styles.bannerTextV2Small}>Un moment de paix à chaque prière</Text>
              <TouchableOpacity style={styles.bannerButtonV2Small} onPress={() => navigation.navigate('Books' as never)}>
                <Text style={styles.bannerButtonTextV2Small}>Commencer</Text>
              </TouchableOpacity>
            </View>
            <Image source={require('../../assets/femme-transformer.png')} style={styles.bannerImageWomanV2} />
          </View>
        </View>
        <Text style={styles.sectionTitle}>Aperçu des Livres</Text>
        <FlatList
          ref={flatListRef}
          data={allChapters}
          keyExtractor={(_, idx) => idx.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={132}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => showSummary(item)}>
              <View style={styles.bookCardCarouselSmall}>
                <Image source={imageMap[item.image] || require('../../assets/1.png')} style={styles.bookImageCarouselSmall} />
                <Text style={styles.chapterTitleCarouselSmall}>{item.title}</Text>
                <Text style={styles.chapterDescCarouselSmall}>{item.desc}</Text>
                <Text style={styles.chapterAuthorCarouselSmall}>{item.author}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
        <View style={styles.hadithCardFlat}>
          <MaterialCommunityIcons name="format-quote-open" size={28} color={colors.primary} style={{ marginBottom: 4 }} />
          <Text style={styles.hadithTitleFlat}>Hadith du jour</Text>
          <Text style={styles.hadithTextFlat}>« Les actions ne valent que par les intentions. » (Boukhari & Mouslim)</Text>
        </View>
      </ScrollView>
      <Modal visible={summaryVisible} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.25)', justifyContent:'center', alignItems:'center' }}>
          <View style={{ backgroundColor:'#fff', borderRadius:18, padding:24, width:320, alignItems:'center', elevation:8 }}>
            <Text style={{ fontSize:18, fontWeight:'bold', color:colors.primary, marginBottom:8 }}>{summaryContent?.title}</Text>
            <Text style={{ fontSize:15, color:'#444', marginBottom:8 }}>{summaryContent?.desc}</Text>
            <Text style={{ fontSize:13, color:colors.primary, fontStyle:'italic' }}>{summaryContent?.author}</Text>
            <Pressable style={{ marginTop:18, backgroundColor:colors.primary, borderRadius:12, paddingVertical:8, paddingHorizontal:24 }} onPress={()=>setSummaryVisible(false)}>
              <Text style={{ color:'#fff', fontWeight:'bold' }}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <TouchableOpacity style={{position:'absolute',top:24,right:24,zIndex:10}} onPress={() => setDrawerVisible(true)}>
        <Image source={burgerMenu} style={{ width:32, height:32, tintColor:colors.primary }} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F5F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F5F7',
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  header: { padding: 20, backgroundColor: colors.white },
  bismillahAr: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1.2,
    textShadowColor: '#e0e0e0',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcome: { fontSize: 16, color: colors.text, marginBottom: 10 },
  searchBarFlat: {
    backgroundColor: '#F7F7FA',
    borderRadius: 32,
    padding: 16,
    marginVertical: 14,
    elevation: 1,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderWidth: 0.5,
    borderColor: '#ececec',
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.primary, marginLeft: 20, marginTop: 20 },
  categoriesFlat: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 22,
    gap: 8,
  },
  category: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: 88,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    marginHorizontal: 4,
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  categoryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  bannerV2: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 24,
    borderRadius: 32,
    height: 150,
    width: '94%',
    alignSelf: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'visible',
  },
  bannerContentV2: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    paddingLeft: 28,
    paddingRight: 0,
    justifyContent: 'space-between',
  },
  bannerTextContainerV2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: '100%',
    paddingRight: 8,
  },
  bannerTextV2Small: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'left',
    fontWeight: 'bold',
    width: 120,
    lineHeight: 18,
  },
  bannerButtonV2Small: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  bannerButtonTextV2Small: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
  bannerImageWomanV2: {
    width: 170,
    height: 140,
    resizeMode: 'contain',
    alignSelf: 'flex-end',
    marginLeft: 0,
    marginRight: -30,
    marginTop: -10,
  },
  bookCardCarouselSmall: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    width: 120,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    marginVertical: 6,
  },
  bookImageCarouselSmall: {
    width: 48,
    height: 48,
    marginBottom: 7,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  chapterTitleCarouselSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
    textAlign: 'center',
  },
  chapterDescCarouselSmall: {
    fontSize: 10,
    color: '#444',
    marginBottom: 2,
    textAlign: 'center',
  },
  chapterAuthorCarouselSmall: {
    fontSize: 9,
    color: colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  avatarBtnHome: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: colors.white,
    elevation: 2,
  },
  avatarHome: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.white,
  },
  hadithCardFlat: {
    backgroundColor: '#FDF6ED',
    borderRadius: 22,
    padding: 22,
    marginTop: 18,
    marginHorizontal: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#f3e6d6',
  },
  hadithTitleFlat: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 7,
    textAlign: 'center',
  },
  hadithTextFlat: {
    fontSize: 13,
    color: '#7a5c2e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  avatarBtnHomeFlat: {
    padding: 5,
    borderRadius: 22,
    backgroundColor: colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700', // doré
    marginLeft: 8,
    marginTop: 2,
    opacity: 0.98,
  },
  avatarHomeFlat: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FFD700', // doré
  },
}); 