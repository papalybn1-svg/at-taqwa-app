import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native'; // Assurez-vous d'avoir installé React Navigation
import React from "react";
import { Image, ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import chaptersData from '../../data/chapitres.json'; // Assurez-vous que le chemin est correct
import colors from "../theme/colors";
import { Chapter, ChaptersData } from '../types/chapters'; // Importez le type
import burgerMenu = require('../../assets/burger-menu.png');
import lockClosed = require('../../assets/lock-closed.png');
import lockOpen = require('../../assets/lock-open.png');

const imageMap: { [key: string]: ImageSourcePropType } = {
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
  // Ajoutez d'autres images ici
};

export default function BooksScreen() {
  const navigation = useNavigation<NavigationProp<any>>(); // Utilisez le hook de navigation avec le type
  const data = chaptersData as ChaptersData; // Typage explicite
  const [progress, setProgress] = React.useState<{[key:string]:number}>({});
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const [selectedChapter, setSelectedChapter] = React.useState<Chapter|null>(null);

  // Charger la progression utilisateur
  React.useEffect(() => {
    AsyncStorage.getItem('chapterProgress').then(data => {
      if (data) setProgress(JSON.parse(data));
    });
  }, []);

  // Sauvegarder la progression
  const saveProgress = (newProgress: {[key:string]:number}) => {
    setProgress(newProgress);
    AsyncStorage.setItem('chapterProgress', JSON.stringify(newProgress));
  };

  // Calcul de la progression d'une partie
  const getPartProgress = (partieKey: string) => {
    const chaps = data[partieKey as keyof ChaptersData].chapitres;
    const total = chaps.length;
    const done = chaps.filter((_, idx) => progress[`chapter${partieKey}_${idx+1}`] === 100).length;
    return Math.round((done / total) * 100);
  };

  // Logique de blocage des parties et chapitres
  const isPartUnlocked = (partIdx: number) => {
    if (partIdx === 0) return true;
    // La partie précédente doit être à 100%
    const prevKey = Object.keys(data)[partIdx-1];
    return getPartProgress(prevKey) === 100;
  };
  const isChapterUnlocked = (partIdx: number, chapIdx: number) => {
    if (!isPartUnlocked(partIdx)) return false;
    if (chapIdx === 0) return true;
    const partKey = Object.keys(data)[partIdx];
    return progress[`chapter${partKey}_${chapIdx}`] === 100;
  };

  // Ouvrir le drawer latéral
  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  // Marquer un chapitre comme lu à 100%
  const completeChapter = (idx: number) => {
    const newProgress = { ...progress, [`chapter${idx+1}`]: 100 };
    saveProgress(newProgress);
  };

  const handleChapterPress = (chapter: Chapter) => {
    navigation.navigate('Chapter', { chapter }); // Naviguez vers l'écran de lecture de chapitre
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Le contenu scrollable */}
      <ScrollView style={styles.container} contentContainerStyle={{paddingTop: 0}}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Livre</Text>
        </View>
        {/* Drawer latéral des chapitres */}
        <Modal visible={drawerVisible} transparent animationType="slide">
          <View style={{ flex:1, flexDirection:'row' }}>
            <View style={{ width:260, backgroundColor:colors.primary, padding:18, borderTopRightRadius:24, borderBottomRightRadius:24 }}>
              <Text style={{ color:'#fff', fontWeight:'bold', fontSize:20, marginBottom:18, textAlign:'center' }}>Chapitres</Text>
              {Object.keys(data).map((partie, pidx) => (
                <View key={pidx}>
                  {data[partie as keyof ChaptersData].chapitres.map((ch, idx) => {
                    const chapIdx = idx + 1;
                    const unlocked = isChapterUnlocked(pidx, idx);
                    return (
                      <View key={idx} style={{ flexDirection:'row', alignItems:'center', marginBottom:10, backgroundColor: unlocked ? (selectedChapter?.title === ch.title ? '#BB9B4E' : 'transparent') : 'transparent', borderRadius:12, padding:unlocked?6:0 }}>
                        <Text style={{ color:'#fff', fontWeight:'bold', fontSize:16, flex:1 }}>{ch.title}</Text>
                        <Image source={unlocked ? lockOpen : lockClosed} style={{ width:22, height:22, tintColor: unlocked ? '#FFD700' : '#fff' }} />
                      </View>
                    );
                  })}
                </View>
              ))}
              <Pressable style={{ marginTop:18, backgroundColor:'#fff', borderRadius:12, paddingVertical:8, paddingHorizontal:24, alignSelf:'center' }} onPress={closeDrawer}>
                <Text style={{ color:colors.primary, fontWeight:'bold' }}>Fermer</Text>
              </Pressable>
            </View>
            <Pressable style={{ flex:1 }} onPress={closeDrawer} />
          </View>
        </Modal>
        {Object.keys(data).map((partie, pidx) => {
          const partUnlocked = isPartUnlocked(pidx);
          return (
            <View key={pidx} style={{ opacity: partUnlocked ? 1 : 0.5 }}>
              <Text style={styles.sectionTitle}>{data[partie as keyof ChaptersData].titre}</Text>
              {/* Barre de progression de la partie */}
              <View style={{ height:8, backgroundColor:'#eee', borderRadius:4, marginHorizontal:16, marginBottom:8 }}>
                <View style={{ height:8, backgroundColor:'#BB9B4E', borderRadius:4, width:`${getPartProgress(partie)}%` }} />
              </View>
              <View style={styles.chapterList}>
                {data[partie as keyof ChaptersData].chapitres.map((ch, idx) => {
                  const chapUnlocked = isChapterUnlocked(pidx, idx);
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={[styles.chapterCard, { opacity: chapUnlocked ? 1 : 0.5 }]} 
                      onPress={() => chapUnlocked && handleChapterPress(ch)}
                      disabled={!chapUnlocked}
                    >
                      <Image 
                        source={imageMap[ch.image] || require('../../assets/1.png')} 
                        style={styles.chapterImage} 
                      />
                      <View style={styles.chapterContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.chapterTitle}>{ch.title}</Text>
                          <View style={{ backgroundColor: '#FFD700', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>{Math.round(progress[`chapter${Object.keys(data)[pidx]}_${idx+1}`]||0)}%</Text>
                          </View>
                        </View>
                        <Text style={styles.chapterDesc}>{ch.desc}</Text>
                        <Text style={styles.chapterAuthor}>{ch.author}</Text>
                        {/* Barre de progression du chapitre */}
                        <View style={{ height:6, backgroundColor:'#eee', borderRadius:3, marginTop:6, width:'100%' }}>
                          <View style={{ height:6, backgroundColor:'#BB9B4E', borderRadius:3, width:`${progress[`chapter${Object.keys(data)[pidx]}_${idx+1}`]||0}%` }} />
                        </View>
                      </View>
                      <Image source={chapUnlocked ? lockOpen : lockClosed} style={{ width:28, height:28, marginLeft:8, tintColor: chapUnlocked ? '#BB9B4E' : '#BB9B4E' }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingVertical: 24, paddingHorizontal: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 10 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginLeft: 20, marginTop: 20, marginBottom: 10 },
  chapterList: { paddingHorizontal: 16 },
  chapterCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, marginBottom: 16, elevation: 2, alignItems: 'center', padding: 10 },
  chapterImage: { width: 60, height: 60, borderRadius: 12, marginRight: 14, resizeMode: 'cover' },
  chapterContent: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  chapterDesc: { fontSize: 13, color: '#444', marginBottom: 4 },
  chapterAuthor: { fontSize: 12, color: colors.primary, fontStyle: 'italic' },
}); 