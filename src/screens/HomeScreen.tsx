import { useNavigation } from '@react-navigation/native';
import React from "react";
import { Animated, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import chaptersData from '../../data/chapitres.json';
import colors from "../theme/colors";

export default function HomeScreen() {
  const navigation = useNavigation();

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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top","bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.bismillah}>Bismillah,</Text>
          <Text style={styles.welcome}>Bienvenue dans ton espace</Text>
          <TextInput style={styles.searchBar} placeholder="Rechercher" />
        </View>
        <Text style={styles.sectionTitle}>Catégories</Text>
        <View style={styles.categories}>
          <TouchableOpacity style={styles.category} onPress={() => navigation.navigate('Livres' as never)}>
            <Image source={require('../../assets/priere.png')} style={styles.categoryIcon} />
            <Text style={styles.categoryText}>Livres</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.category} onPress={() => navigation.navigate('Horaires' as never)}>
            <Image source={require('../../assets/abulution.png')} style={styles.categoryIcon} />
            <Text style={styles.categoryText}>Horaires</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.category} onPress={() => navigation.navigate('Quiz' as never)}>
            <Image source={require('../../assets/femme.png')} style={styles.categoryIcon} />
            <Text style={styles.categoryText}>Quizz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.category} onPress={() => navigation.navigate('Chapelet' as never)}>
            <Image source={require('../../assets/tasbih.png')} style={styles.categoryIcon} />
            <Text style={styles.categoryText}>Tasbih</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bannerV2}>
          <View style={styles.bannerContentV2}>
            <View style={styles.bannerTextContainerV2}>
              <Text style={styles.bannerTextV2Small}>Un moment de paix à chaque prière</Text>
              <TouchableOpacity style={styles.bannerButtonV2Small}><Text style={styles.bannerButtonTextV2Small}>Commencer</Text></TouchableOpacity>
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
          snapToInterval={132} // largeur de la card + margin
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <View style={styles.bookCardCarouselSmall}>
              <Image source={imageMap[item.image] || require('../../assets/1.png')} style={styles.bookImageCarouselSmall} />
              <Text style={styles.chapterTitleCarouselSmall}>{item.title}</Text>
              <Text style={styles.chapterDescCarouselSmall}>{item.desc}</Text>
              <Text style={styles.chapterAuthorCarouselSmall}>{item.author}</Text>
            </View>
          )}
        />
      </ScrollView>
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
  bismillah: { fontSize: 22, fontWeight: "bold", color: colors.primary },
  welcome: { fontSize: 16, color: colors.text, marginBottom: 10 },
  searchBar: { backgroundColor: colors.white, borderRadius: 24, padding: 12, marginVertical: 10, elevation: 2, fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.primary, marginLeft: 20, marginTop: 20 },
  categories: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  category: { backgroundColor: colors.white, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', width: 78, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, marginHorizontal: 2 },
  categoryIcon: { width: 38, height: 38, marginBottom: 8, resizeMode: 'contain' },
  categoryText: { fontSize: 13, color: colors.primary, fontWeight: 'bold', textAlign: 'center' },
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
}); 