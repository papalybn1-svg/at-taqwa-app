import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from "react";
import { Animated, Appearance, Dimensions, Easing, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import chaptersData from '../../data/chapitres.json';
import colors from "../theme/colors";
import { AuthContext } from './LoginScreen';
import { db } from './firebaseConfig';
const burgerMenu = require('../../assets/burger-menu.png');
const lockClosed = require('../../assets/lock-closed.png');
const lockOpen = require('../../assets/lock-open.png');

type RootStackParamList = {
  Chapter: {
    chapter: {
      title: string;
      desc: string;
      image: string;
    };
  };
  // ... autres écrans si besoin
};

type ChapterScreenParams = {
  Chapter: {
    chapter: {
      title: string;
      desc: string;
      image: string;
    };
  };
};

type ChapterContent = {
  chapitre: string;
  contenu: Array<{
    type: string;
    contenu: string;
  }>;
};

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

// Fonction utilitaire pour obtenir l'image du chapitre ou une image par défaut
function getChapterImage(key: string) {
  if (imageMap[key]) return imageMap[key];
  console.warn('Image de chapitre non trouvée pour la clé :', key);
  return require('../../assets/1.png');
}

// Nouveau composant BurgerButton moderne
function BurgerButton({ onPress, size = 38, style = {} }: { onPress: () => void; size?: number; style?: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={[{
      width: size, height: size, borderRadius: size/2, backgroundColor: 'rgba(25,81,74,0.10)', justifyContent: 'center', alignItems: 'center', shadowColor: '#19514A', shadowOpacity: 0.10, shadowRadius: 6, elevation: 4
    }, style]} activeOpacity={0.7}>
      <View style={{ width: size*0.5, height: size*0.5, justifyContent: 'space-between' }}>
        <View style={{ height: 3, backgroundColor: '#19514A', borderRadius: 2, marginBottom: 4 }} />
        <View style={{ height: 3, backgroundColor: '#19514A', borderRadius: 2, marginBottom: 4 }} />
        <View style={{ height: 3, backgroundColor: '#19514A', borderRadius: 2 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function ChapterScreen({ route }: { route: RouteProp<ChapterScreenParams, 'Chapter'> }) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { chapter } = route.params;
  const { user } = useContext(AuthContext); 
  const [chapterContent, setChapterContent] = useState<any>(null);
  const data = chaptersData as any;
  const [progress, setProgress] = useState<number>(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerAnim] = useState(new Animated.Value(-300));
  const screenWidth = Dimensions.get('window').width;
  const [textSize, setTextSize] = useState(16);
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');
  const [scrollY] = useState(new Animated.Value(0));
  const [paraAnim] = useState<any[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const chapterBlocks = chapterContent?.contenu || [];
  const totalPages = chapterBlocks.length;
  const flatListRef = useRef<any>(null);
  // Animation de transition fade
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const logActivity = async () => {
      if (!user || !chapter) return;

      try {
        await addDoc(collection(db, 'readingActivity'), {
          userId: user.uid,
          userEmail: user.email,
          chapterId: chapter.image, // 'image' is used as an ID here
          chapterTitle: chapter.title,
          readAt: serverTimestamp(),
        });
        console.log(`Activity logged for user ${user.uid} reading chapter ${chapter.title}`);
      } catch (error) {
        console.error("Error logging reading activity: ", error);
      }
    };

    logActivity();
  }, [chapter, user]);

  useEffect(() => {
    try {
      const content = chapterFiles[chapter.image];
      setChapterContent(content);
    } catch (error) {
      console.error("Erreur lors du chargement du chapitre:", error);
    }
  }, [chapter]);

  useEffect(() => {
    AsyncStorage.getItem('chapterProgress').then(data => {
      if (data) setProgress(JSON.parse(data));
    });
  }, []);

  // Mémorisation taille texte
  useEffect(() => {
    AsyncStorage.getItem('chapterTextSize').then(val => {
      if (val) setTextSize(Number(val));
    });
  }, []);
  useEffect(() => {
    AsyncStorage.setItem('chapterTextSize', String(textSize));
  }, [textSize]);

  // Initialiser les anims pour chaque paragraphe
  useEffect(() => {
    if (chapterContent && chapterContent.contenu) {
      paraAnim.length = 0;
      for (let i = 0; i < chapterContent.contenu.length; i++) {
        paraAnim[i] = new Animated.Value(0);
      }
      // Animation d'apparition en cascade
      chapterContent.contenu.forEach((_:any, i:number) => {
        setTimeout(() => {
          Animated.timing(paraAnim[i], { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
        }, 200 + i * 120);
      });
    }
  }, [chapterContent]);

  // Calcul de la progression de lecture + apparition bouton retour haut
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (e:any) => {
        const contentHeight = e.nativeEvent.contentSize.height;
        const scrollViewHeight = e.nativeEvent.layoutMeasurement.height;
        const scrollYVal = e.nativeEvent.contentOffset.y;
        const totalScrollable = contentHeight - scrollViewHeight;
        const prog = totalScrollable > 0 ? Math.min(1, scrollYVal / totalScrollable) : 0;
        setProgress(prog);
        setShowScrollTop(prog > 0.3);
      }
    }
  );

  // Gestion taille texte
  const textSizes = [16, 19, 22];
  const nextTextSize = () => {
    Vibration.vibrate(10);
    setTextSize(s => textSizes[(textSizes.indexOf(s) + 1) % textSizes.length]);
  };

  // Mode nuit
  const toggleNight = () => {
    Vibration.vibrate(10);
    setIsDark(d => !d);
  };

  // Scroll to top
  const scrollToTop = () => {
    if (flatListRef.current) flatListRef.current.scrollTo({ y: 0, animated: true });
    Vibration.vibrate(10);
  };

  // Couleurs dynamiques
  const bg = isDark ? '#181C1F' : colors.background;
  const fg = isDark ? '#F3F5F7' : '#444';
  const card = isDark ? '#23272B' : '#fff';
  const accent = isDark ? '#FFD700' : colors.primary;
  const citationBg = isDark ? '#23272B' : '#FDF6ED';

  // Navigation vers un autre chapitre
  const handleChapterPress = (ch: any) => {
    setDrawerVisible(false);
    navigation.navigate('Chapter', { chapter: ch });
  };

  // Ouvre le drawer avec animation
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  };
  // Ferme le drawer avec animation
  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: -300,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setDrawerVisible(false));
  };

  // Navigation par card, navigation par boutons uniquement
  const goNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
  };
  const goPrev = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  // Animation de transition fade
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [currentPage]);

  if (!chapterContent) {
    return <Text>Chargement...</Text>;
  }

  const item = chapterBlocks[currentPage];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header image parallaxe, overlay dégradé, card titre animée, boutons */}
      <View style={{ position: 'relative', overflow: 'visible' }}>
        <Animated.Image
          source={getChapterImage(chapter.image)}
          style={{
            width: screenWidth,
            height: 180,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            resizeMode: 'cover',
            transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 180], outputRange: [0, -180/3], extrapolate: 'clamp' }) }],
          }}
        />
        {/* Overlay dégradé dynamique */}
        <LinearGradient
          colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0.0)']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 100, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        />
        {/* Card titre animée */}
        <Animated.View style={{ position: 'absolute', left: 24, right: 24, bottom: -32, zIndex: 10, opacity: paraAnim[0] || 1, transform: [{ translateY: paraAnim[0] ? paraAnim[0].interpolate({ inputRange: [0,1], outputRange: [30,0] }) : 0 }] }}>
          <View style={{ backgroundColor: card, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 22, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 10, elevation: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: accent, textAlign: 'center', letterSpacing: 0.5 }}>{chapterContent.chapitre}</Text>
          </View>
        </Animated.View>
        {/* Burger en surimpression en haut à droite de l'image */}
        <View style={{ position: 'absolute', top: 18, right: 18 }}>
          <TouchableOpacity onPress={openDrawer} activeOpacity={0.7} onPressIn={()=>Vibration.vibrate(10)} style={{ borderRadius: 22, overflow: 'hidden' }}>
            <BurgerButton onPress={openDrawer} />
          </TouchableOpacity>
        </View>
        {/* Bouton Aa centré juste sous le titre, avant le texte */}
        <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', alignItems: 'center', marginTop: 18, marginBottom: 2 }}>
          <TouchableOpacity onPress={nextTextSize} style={{ backgroundColor: colors.primary, borderRadius: 22, paddingVertical: 6, paddingHorizontal: 16, elevation: 2 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Aa</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Affichage du bloc de texte brut avec animation fade */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0, paddingTop: 10, paddingBottom: 100 }}>
        <Animated.View style={{ width: '100%', maxWidth: 420, opacity: fadeAnim }}>
          {item && item.type === 'citation' ? (
            <View style={{ backgroundColor: '#FDF6ED', borderLeftWidth: 5, borderLeftColor: colors.primary, borderRadius: 14, marginHorizontal: 24, marginVertical: 10, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ fontStyle: 'italic', color: colors.primary, fontSize: textSize, lineHeight: textSize * 1.5, textAlign: 'center' }}>{item.contenu}</Text>
            </View>
          ) : item && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%', justifyContent: 'center', paddingHorizontal: 24 }}>
              <Text style={{ fontSize: textSize * 1.7, color: colors.primary, fontWeight: 'bold', lineHeight: textSize * 1.8 }}>{item.contenu.charAt(0)}</Text>
              <Text style={{ fontSize: textSize, color: '#444', lineHeight: textSize * 1.5, marginLeft: 6, flex: 1 }}>{item.contenu.slice(1)}</Text>
            </View>
          )}
        </Animated.View>
      </View>
      {/* Boutons fixes en bas, numéro de page centré entre les deux */}
      <View style={{ position: 'absolute', bottom: 32, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity onPress={goPrev} disabled={currentPage === 0} style={[styles.navBtn, { opacity: currentPage === 0 ? 0.4 : 1, marginRight: 10 }]}>
          <Text style={styles.navBtnText}>Précédent</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16, marginHorizontal: 10 }}>{currentPage+1} / {totalPages}</Text>
        <TouchableOpacity onPress={goNext} disabled={currentPage === totalPages-1} style={[styles.navBtn, { opacity: currentPage === totalPages-1 ? 0.4 : 1, marginLeft: 10 }]}> 
          <Text style={styles.navBtnText}>Suivant</Text>
        </TouchableOpacity>
      </View>
      {/* Bouton retour en haut */}
      {showScrollTop && (
        <TouchableOpacity
          onPress={scrollToTop}
          style={{ position: 'absolute', bottom: 100, right: 24, backgroundColor: accent, borderRadius: 22, padding: 12, elevation: 6, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8 }}
          activeOpacity={0.8}
          onPressIn={()=>Vibration.vibrate(10)}
        >
          <Text style={{ color: card, fontWeight: 'bold', fontSize: 18 }}>↑</Text>
        </TouchableOpacity>
      )}
      {/* Drawer latéral animé à gauche */}
      <Modal visible={drawerVisible} transparent animationType="none">
        <Pressable style={{ flex:1, backgroundColor:'rgba(0,0,0,0.18)' }} onPress={closeDrawer} />
        <Animated.View style={{ position:'absolute', left:0, top:0, bottom:0, width:280, backgroundColor:colors.primary, padding:18, borderTopRightRadius:32, borderBottomRightRadius:32, shadowColor:'#000', shadowOpacity:0.18, shadowRadius:16, elevation:16, transform:[{ translateX: drawerAnim }] }}>
          <Text style={{ color:'#fff', fontWeight:'bold', fontSize:22, marginBottom:18, textAlign:'center', letterSpacing:1 }}>Chapitres</Text>
          {Object.keys(data).map((partie, pidx) => (
            <View key={pidx} style={{ marginBottom:18 }}>
              <Text style={{ color:'#FFD700', fontWeight:'bold', fontSize:15, marginBottom:6, marginLeft:2, letterSpacing:0.5 }}>{data[partie].titre}</Text>
              {data[partie].chapitres.map((ch: any, idx: number) => {
                const unlocked = true; // (Suppression des fonctions de progression par chapitre, car progress est maintenant un nombre pour la barre de lecture)
                const isCurrent = unlocked && ch.title === chapter.title;
                return (
                  <Pressable key={idx} onPress={() => unlocked && handleChapterPress(ch)} disabled={!unlocked} style={{ flexDirection:'row', alignItems:'center', marginBottom:6, backgroundColor: isCurrent ? '#fff' : 'transparent', borderRadius:10, paddingVertical: isCurrent ? 8 : 6, paddingHorizontal:10, opacity: unlocked ? 1 : 0.5, shadowColor: isCurrent ? '#FFD700' : 'transparent', shadowOpacity: isCurrent ? 0.12 : 0, shadowRadius: isCurrent ? 6 : 0, elevation: isCurrent ? 4 : 0 }}>
                    <View style={{ flex:1 }}>
                      <Text style={{ color: isCurrent ? colors.primary : '#fff', fontWeight:'bold', fontSize:15 }}>{ch.title}</Text>
                      <View style={{ height:3, backgroundColor:'#fff', borderRadius:2, marginTop:3, width:'100%' }}>
                        <View style={{ height:3, backgroundColor:'#FFD700', borderRadius:2, width: unlocked ? '100%' : '0%' }} />
                      </View>
                    </View>
                    <Image source={unlocked ? lockOpen : lockClosed} style={{ width:22, height:22, tintColor: unlocked ? (isCurrent ? colors.primary : '#FFD700') : '#fff', marginLeft:8 }} />
                  </Pressable>
                );
              })}
            </View>
          ))}
          <Pressable style={{ marginTop:18, backgroundColor:'#fff', borderRadius:12, paddingVertical:8, paddingHorizontal:24, alignSelf:'center', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:4, elevation:2 }} onPress={closeDrawer}>
            <Text style={{ color:colors.primary, fontWeight:'bold', fontSize:15 }}>Fermer</Text>
          </Pressable>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingVertical: 24, paddingHorizontal: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 10 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  content: { fontSize: 16, color: '#444', padding: 20, lineHeight: 24 },
  navBtn: { backgroundColor: colors.primary, borderRadius: 22, padding: 14, elevation: 6, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8 },
  navBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 18 },
});
