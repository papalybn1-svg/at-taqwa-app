import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import { Animated, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import chaptersData from '../../data/chapitres.json';
import colors from "../theme/colors";
import { Chapter, ChaptersData } from '../types/chapters';
import imageMap from '../../assets/chapterImages';

const { width: screenWidth } = Dimensions.get('window');

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
  const scrollY = React.useRef(new Animated.Value(0)).current;

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

  // Animation du header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [120, 80],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAF9' }}>
             {/* Header simple avec boutons */}
       <View style={styles.simpleHeader}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.simpleBackButton}>
           <MaterialCommunityIcons name="arrow-left" size={24} color="#174C3C" />
         </TouchableOpacity>
         <View style={{ flex: 1 }} />
         <TouchableOpacity onPress={openDrawer} style={styles.simpleMenuButton}>
           <MaterialCommunityIcons name="menu" size={24} color="#174C3C" />
        </TouchableOpacity>
       </View>

      {/* Contenu scrollable */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(data).map((partie, pidx) => (
          <View key={pidx} style={{ marginBottom: 32 }}>
                         {/* Titre de section avec ligne décorative */}
             <View style={styles.sectionHeader}>
               <View style={styles.sectionTitleContainer}>
                 <Text style={styles.newSectionTitle}>{data[partie as keyof ChaptersData].titre}</Text>
                 <View style={styles.sectionLine} />
               </View>
             </View>
            
            {/* Liste des chapitres */}
            <View style={{ paddingHorizontal: 20 }}>
              {data[partie as keyof ChaptersData].chapitres.map((ch, idx) => {
                const chapterProgress = progress[`chapter${Object.keys(data)[pidx]}_${idx+1}`] || 0;
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.newChapterCard,
                      { 
                        transform: [{ scale: 1 }],
                        shadowColor: chapterProgress > 0 ? '#D4AF37' : '#000',
                        shadowOpacity: chapterProgress > 0 ? 0.15 : 0.08,
                      }
                    ]}
                    onPress={() => handleChapterPress(ch)}
                    activeOpacity={0.95}
                  >
                                         {/* Image avec overlay de progression */}
                     <View style={styles.imageContainer}>
                       <Image 
                         source={imageMap[ch.image] || require('../../assets/1.png')} 
                         style={styles.newChapterImage} 
                       />
                       {chapterProgress > 0 && (
                         <View style={styles.progressOverlay}>
                           <MaterialCommunityIcons name="check-circle" size={16} color="#D4AF37" />
                         </View>
                       )}
                     </View>
                    
                    {/* Contenu du chapitre */}
                    <View style={styles.newChapterContent}>
                      <View style={styles.chapterHeader}>
                        <Text style={styles.newChapterTitle} numberOfLines={2}>{ch.title}</Text>
                        <View style={[
                          styles.progressBadge, 
                          { backgroundColor: chapterProgress === 100 ? '#D4AF37' : chapterProgress > 0 ? '#FFF3CD' : '#F1F3F4' }
                        ]}>
                          <Text style={[
                            styles.progressText,
                            { color: chapterProgress === 100 ? 'white' : chapterProgress > 0 ? '#B8860B' : '#666' }
                          ]}>
                            {Math.round(chapterProgress)}%
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.newChapterDesc} numberOfLines={2}>{ch.desc}</Text>
                      
                      <View style={styles.chapterFooter}>
                        <View style={styles.authorContainer}>
                          <MaterialCommunityIcons name="account-edit" size={14} color="#666" />
                          <Text style={styles.newChapterAuthor}>{ch.author}</Text>
      </View>

                        {/* Barre de progression moderne */}
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBg}>
                            <Animated.View 
                              style={[
                                styles.progressBarFill,
                                { 
                                  width: `${chapterProgress}%`,
                                  backgroundColor: chapterProgress === 100 ? '#D4AF37' : '#174C3C'
                                }
                              ]} 
                            />
                          </View>
                        </View>
                      </View>
          
                      {/* Flèche de navigation */}
                      <View style={styles.navArrow}>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#174C3C" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
                 ))}
       </ScrollView>

      {/* Drawer latéral redesigné */}
      <Modal visible={drawerVisible} transparent animationType="slide">
        <View style={styles.drawerOverlay}>
          <Animated.View style={styles.drawerContainer}>
            <LinearGradient
              colors={['#174C3C', '#1F5F4F']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.drawerHeader}>
                <MaterialCommunityIcons name="book-multiple" size={28} color="white" />
                <Text style={styles.drawerTitle}>Table des matières</Text>
                <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerContent}>
                {Object.keys(data).map((partie, pidx) => (
                  <View key={pidx} style={styles.drawerSection}>
                    <Text style={styles.drawerSectionTitle}>{data[partie as keyof ChaptersData].titre}</Text>
                    {data[partie as keyof ChaptersData].chapitres.map((ch, idx) => {
                      const chapterProgress = progress[`chapter${Object.keys(data)[pidx]}_${idx+1}`] || 0;
                      return (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.drawerChapterItem}
                          onPress={() => {
                            handleChapterPress(ch);
                            closeDrawer();
                          }}
                        >
                          <View style={styles.drawerChapterIcon}>
                            <MaterialCommunityIcons 
                              name={chapterProgress === 100 ? "check-circle" : chapterProgress > 0 ? "circle-half-full" : "circle-outline"} 
                              size={16} 
                              color={chapterProgress === 100 ? "#D4AF37" : chapterProgress > 0 ? "#FFF3CD" : "#ffffff80"}
                            />
                          </View>
                          <Text style={styles.drawerChapterText} numberOfLines={2}>{ch.title}</Text>
                          <Text style={styles.drawerChapterProgress}>{Math.round(chapterProgress)}%</Text>
                        </TouchableOpacity>
                      );
                    })}
        </View>
                ))}
      </ScrollView>
            </View>
          </Animated.View>
          <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
                 </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header simple
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAF9',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  simpleBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.3,
  },
  simpleMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 76, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Ancien header (gardé pour compatibilité)
  newHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  newBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newHeaderTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  newHeaderSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section headers
  sectionHeader: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#174C3C',
    letterSpacing: 0.2,
    marginRight: 16,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8F5E8',
    borderRadius: 1,
  },

  // Nouvelles cartes de chapitre
  newChapterCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    padding: 16,
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChapterImage: {
    width: '130%',
    height: '130%',
    resizeMode: 'cover',
    minWidth: '130%',
    minHeight: '130%',
    transform: [{ scale: 1.3 }],
  },
  progressOverlay: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  newChapterContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newChapterTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#174C3C',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 45,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  newChapterDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  chapterFooter: {
    flexDirection: 'column',
    gap: 8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChapterAuthor: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 6,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E8F5E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  navArrow: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -10,
  },

  // Drawer redesigné
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: 320,
    backgroundColor: '#174C3C',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerContent: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  drawerSection: {
    marginBottom: 32,
  },
  drawerSectionTitle: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  drawerChapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  drawerChapterIcon: {
    marginRight: 12,
  },
  drawerChapterText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  drawerChapterProgress: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 