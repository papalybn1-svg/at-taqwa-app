import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import chaptersData from '../../data/chapitres.json';
import colors from "../theme/colors";
import { Chapter, ChaptersData } from '../types/chapters';
import imageMap from '../../assets/chapterImages';

// Regrouper les blocs en pages (max 15 pages)
function paginateBlocks(blocks: { type: string; contenu: string }[], maxPages = 15) {
  const total = blocks.length;
  if (total <= maxPages) return blocks.map(b => [b]);
  const pageSize = Math.ceil(total / maxPages);
  const pages = [];
  for (let i = 0; i < total; i += pageSize) {
    pages.push(blocks.slice(i, i + pageSize));
  }
  return pages;
}

export default function BooksScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const data = chaptersData as ChaptersData;
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

  // Ouvrir le drawer latéral
  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  // Marquer un chapitre comme lu à 100%
  const completeChapter = (idx: number) => {
    const newProgress = { ...progress, [`chapter${idx+1}`]: 100 };
    saveProgress(newProgress);
  };

  const handleChapterPress = (chapter: Chapter) => {
    navigation.navigate('Chapter', { chapter });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Le contenu scrollable */}
      <ScrollView style={styles.container} contentContainerStyle={{paddingTop: 0}}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>Livre</Text>
        <View style={styles.placeholder} />
      </View>

        {/* Drawer latéral des chapitres */}
        <Modal visible={drawerVisible} transparent animationType="slide">
          <View style={{ flex:1, flexDirection:'row' }}>
            <View style={{ width:260, backgroundColor:colors.primary, padding:18, borderTopRightRadius:24, borderBottomRightRadius:24 }}>
              <Text style={{ color:'#fff', fontWeight:'bold', fontSize:20, marginBottom:18, textAlign:'center' }}>Chapitres</Text>
              {Object.keys(data).map((partie, pidx) => (
                <View key={pidx}>
                  {data[partie as keyof ChaptersData].chapitres.map((ch, idx) => (
                    <View key={idx} style={{ flexDirection:'row', alignItems:'center', marginBottom:10, borderRadius:12, padding:6 }}>
                      <Text style={{ color:'#fff', fontWeight:'bold', fontSize:16, flex:1 }}>{ch.title}</Text>
                    </View>
                  ))}
                </View>
              ))}
              <Pressable style={{ marginTop:18, backgroundColor:'#fff', borderRadius:12, paddingVertical:8, paddingHorizontal:24, alignSelf:'center' }} onPress={closeDrawer}>
                <Text style={{ color:colors.primary, fontWeight:'bold' }}>Fermer</Text>
              </Pressable>
            </View>
            <Pressable style={{ flex:1 }} onPress={closeDrawer} />
          </View>
        </Modal>
        
        {Object.keys(data).map((partie, pidx) => (
          <View key={pidx}>
            <Text style={styles.sectionTitle}>{data[partie as keyof ChaptersData].titre}</Text>
            <View style={styles.chapterList}>
              {data[partie as keyof ChaptersData].chapitres.map((ch, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.chapterCard}
                  onPress={() => handleChapterPress(ch)}
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
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    backgroundColor: colors.primary, 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 18, 
    borderBottomRightRadius: 18, 
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: { 
    padding: 8,
    borderRadius: 8
  },
  headerTitle: { 
    color: colors.white, 
    fontSize: 20, 
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 40
  },
  placeholder: { 
    width: 40
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginLeft: 20, marginTop: 20, marginBottom: 10 },
  chapterList: { paddingHorizontal: 16 },
  chapterCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, marginBottom: 16, elevation: 2, alignItems: 'center', padding: 10 },
  chapterImage: { width: 60, height: 60, borderRadius: 12, marginRight: 14, resizeMode: 'cover' },
  chapterContent: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  chapterDesc: { fontSize: 13, color: '#444', marginBottom: 4 },
  chapterAuthor: { fontSize: 12, color: colors.primary, fontStyle: 'italic' },
}); 