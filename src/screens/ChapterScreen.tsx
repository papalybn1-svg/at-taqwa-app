import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import imageMap from '../../assets/chapterImages';
import chaptersDataRaw from '../../data/chapitres.json';
import { ChaptersData } from '../types/chapters';

const chaptersData = chaptersDataRaw as ChaptersData;

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

// Fonction utilitaire pour découper l'intro et les sections
function splitIntroAndSections(contenu: any[]) {
  const sections: { title: string, items: any[] }[] = [];
  let intro: any[] = [];
  let currentSection: { title: string, items: any[] } | null = null;

  contenu.forEach((item) => {
    if (item.contenu && typeof item.contenu === 'string' && item.contenu.match(/^[IVXLCDM]+\./)) {
      // Nouvelle section
      if (currentSection) sections.push(currentSection);
      currentSection = { title: item.contenu, items: [] };
    } else {
      if (currentSection) {
        currentSection.items.push(item);
      } else {
        intro.push(item);
      }
    }
  });
  if (currentSection) sections.push(currentSection);
  return { intro, sections };
}

function getAllChapters() {
  // Retourne un tableau à plat de tous les chapitres avec leur partie et leur index
  const result: any[] = [];
  (Object.keys(chaptersData) as (keyof ChaptersData)[]).forEach((partieKey) => {
    const partie = chaptersData[partieKey];
    partie.chapitres.forEach((ch: any, idx: number) => {
      result.push({ ...ch, partieKey, partieTitre: partie.titre, chapitreIndex: idx });
    });
  });
  return result;
}

const ChapterScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  // TOUS LES HOOKS EN PREMIER
  const [textSize, setTextSize] = useState(16);
  const screenWidth = Dimensions.get('window').width;
  const scrollViewRef = useRef<ScrollView>(null);
  const { chapter } = route.params;
  const [chapterContent, setChapterContent] = useState<any>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0); // 0 = intro
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isFavorite, setIsFavorite] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);

  // useEffect pour charger le contenu du chapitre
  useEffect(() => {
    if (chapter && chapter.image && chapterFiles[chapter.image]) {
      setChapterContent(chapterFiles[chapter.image]);
      // Démarrer à la section spécifiée si on vient des favoris
      const initialSection = route.params.initialSection || 0;
      setCurrentSectionIndex(initialSection);
    }
  }, [chapter, route.params.initialSection]);

  // useEffect pour charger les favoris
  useEffect(() => {
    loadFavorites();
  }, []);

  // useEffect pour vérifier si cette page/section est en favoris
  useEffect(() => {
    if (chapter && favorites.length >= 0) {
      const pageId = `${chapter.image}_${chapter.title}_section_${currentSectionIndex}`;
      setIsFavorite(favorites.some(fav => fav.id === pageId));
    }
  }, [chapter, favorites, currentSectionIndex]);

  // useEffect pour l'animation de fondu
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentSectionIndex]);

  // Tailles de texte disponibles
  const textSizes = [16, 19, 22];
  const nextTextSize = () => {
    setTextSize(s => textSizes[(textSizes.indexOf(s) + 1) % textSizes.length]);
  };

  // Fonctions de gestion des favoris
  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  };

  const saveFavorites = async (newFavorites: any[]) => {
    try {
      console.log('Sauvegarde des favoris:', newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      console.log('Favoris sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!chapter) return;
    
    // Créer un ID unique pour cette page/section spécifique
    const pageId = `${chapter.image}_${chapter.title}_section_${currentSectionIndex}`;
    console.log('Toggle favori pour la page:', pageId);
    
    const allChapters = getAllChapters();
    const currentChapterData = allChapters.find(ch => ch.image === chapter.image && ch.title === chapter.title);
    
    // Récupérer le titre de la section actuelle
    const { intro, sections } = splitIntroAndSections(chapterContent.contenu as any[]);
    let sectionTitle = "Introduction";
    if (currentSectionIndex > 0) {
      sectionTitle = sections[currentSectionIndex - 1]?.title || `Section ${currentSectionIndex}`;
    }
    
    const favoriteItem = {
      id: pageId,
      title: `${chapter.title} - ${sectionTitle}`,
      desc: `Page ${currentSectionIndex + 1} du chapitre`,
      author: 'At-Taqwa',
      image: chapter.image,
      partie: currentChapterData?.partieTitre || '',
      chapterData: {
        ...chapter,
        startSection: currentSectionIndex // Sauvegarder la section pour y revenir
      }
    };

    let newFavorites;
    if (isFavorite) {
      // Retirer des favoris
      console.log('Retirer la page des favoris');
      newFavorites = favorites.filter(fav => fav.id !== pageId);
    } else {
      // Ajouter aux favoris
      console.log('Ajouter la page aux favoris:', favoriteItem);
      newFavorites = [...favorites, favoriteItem];
    }
    
    await saveFavorites(newFavorites);
    setIsFavorite(!isFavorite);
  };

  // On ne retourne rien avant d'avoir appelé tous les hooks !
  if (!chapterContent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#174C3C" />
        <Text style={{ marginTop: 16 }}>Chargement du chapitre...</Text>
      </View>
    );
  }

  // Découpage intro/sections
  const { intro, sections } = splitIntroAndSections(chapterContent.contenu as any[]);
  const totalSections = 1 + sections.length; // 1 pour l'intro

  // Liste plate de tous les chapitres
  const allChapters = getAllChapters();
  // Trouver l'index du chapitre courant
  const currentChapterIndex = allChapters.findIndex(
    (ch) => ch.image === chapter.image && ch.title === chapter.title
  );
  const nextChapter = allChapters[currentChapterIndex + 1];

  // Rendu du contenu d'une section
  const renderContent = (items: any[]) => (
    items.map((item, idx) => {
      if (item.type === "tableau" && Array.isArray(item.contenu)) {
        // Affichage simple du tableau
        return (
          <View key={idx} style={{ marginVertical: 18, borderWidth: 1, borderColor: '#174C3C', borderRadius: 8, overflow: 'hidden' }}>
            {item.contenu.map((row: string[], rIdx: number) => (
              <View key={rIdx} style={{ flexDirection: 'row', backgroundColor: rIdx === 0 ? '#E8F5E8' : '#fff' }}>
                {row.map((cell, cIdx) => (
                  <Text
                    key={cIdx}
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRightWidth: cIdx < row.length - 1 ? 1 : 0,
                      borderRightColor: '#174C3C',
                      fontWeight: rIdx === 0 ? 'bold' : 'normal',
                      color: '#174C3C',
                      fontSize: textSize - 1,
                      textAlign: 'center'
                    }}
                  >
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );
      }
      // Style pour les titres principaux (I., II., etc.)
      if (item.contenu && typeof item.contenu === 'string' && item.contenu.match(/^[IVXLCDM]+\./)) {
        return null; // On n'affiche pas le titre de section ici (déjà dans l'indicateur)
      }
      // Style pour les sous-titres
      if (item.contenu === item.contenu.toUpperCase() && item.contenu.length < 50) {
        return (
          <Text 
            key={idx} 
            style={[
              styles.subtitle,
              { fontSize: textSize + 2 }
            ]}
          >
            {item.contenu}
          </Text>
        );
      }
      // Style pour les citations en arabe
      if (item.contenu && typeof item.contenu === 'string' && item.contenu.match(/[ء-ي]/)) {
        return (
          <View key={idx} style={styles.arabicContainer}>
            <Text style={[styles.arabicText, { fontSize: textSize + 4 }]}> 
              {item.contenu}
            </Text>
          </View>
        );
      }
      // Style pour les versets coraniques
      if (item.contenu && typeof item.contenu === 'string' && item.contenu.includes('S') && item.contenu.includes('v')) {
        return (
          <View key={idx} style={styles.verseContainer}>
            <Text style={[styles.verseText, { fontSize: textSize }]}> 
              {item.contenu}
            </Text>
          </View>
        );
      }
      // Style par défaut pour le texte normal
      return (
        <Text 
          key={idx} 
          style={[
            styles.paragraph, 
            { 
              fontSize: textSize,
              lineHeight: textSize * 1.5,
              marginBottom: 16
            }
          ]}
        >
          {item.contenu}
        </Text>
      );
    })
  );

  // Indicateur de section
  let sectionIndicator = "Introduction";
  if (currentSectionIndex > 0) {
    sectionIndicator = sections[currentSectionIndex - 1]?.title || "";
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F7F6' }}>
      {/* Header avec image et titre */}
      <View style={{ position: 'relative', overflow: 'visible' }}>
        <Image
          source={imageMap[chapter.image] || imageMap['1']}
          style={{
            width: screenWidth,
            height: 200,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            resizeMode: 'cover',
          }}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.0)']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        />
        {/* Bouton retour */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{
            position: 'absolute',
            top: 45,
            left: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 22,
            padding: 10,
            elevation: 4,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#174C3C" />
        </TouchableOpacity>
        {/* Bouton zoom */}
        <TouchableOpacity 
          onPress={nextTextSize}
          style={{
            position: 'absolute',
            top: 45,
            right: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 22,
            padding: 10,
            elevation: 4,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <MaterialCommunityIcons name="magnify-plus" size={24} color="#174C3C" />
        </TouchableOpacity>
        {/* Carte titre - descendue pour mieux montrer l'image */}
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: -40, zIndex: 10 }}>
          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 20, 
            paddingVertical: 20, 
            paddingHorizontal: 24, 
            shadowColor: '#000', 
            shadowOpacity: 0.15, 
            shadowRadius: 12, 
            elevation: 10, 
            alignItems: 'center'
          }}>
            {/* Affichage de la partie */}
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#666', textAlign: 'center', letterSpacing: 0.3, marginBottom: 6 }}>
              {allChapters[currentChapterIndex]?.partieTitre}
            </Text>
            {/* Titre du chapitre */}
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#174C3C', textAlign: 'center', lineHeight: 28 }}>
              {chapter.title}
            </Text>
          </View>
        </View>
      </View>

      {/* Indicateur de section */}
      <View style={{ alignItems: 'center', paddingHorizontal: 24, marginTop: 60, marginBottom: 16 }}>
        <View style={{
          backgroundColor: '#E8F5E8',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#174C3C20'
        }}>
          <Text style={{ color: '#174C3C', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{sectionIndicator}</Text>
        </View>
      </View>

      {/* Contenu animé */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 90, maxWidth: 420, alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          {currentSectionIndex === 0
            ? renderContent(intro)
            : renderContent(sections[currentSectionIndex - 1]?.items || [])}
    </ScrollView>
      </Animated.View>

      {/* Navigation bas */}
      <View style={{ flexDirection: 'column', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        {/* Bouton Favoris */}
        <TouchableOpacity
          onPress={toggleFavorite}
          style={styles.favoriteButton}
        >
          <MaterialCommunityIcons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={18} 
            color="#174C3C"
          />
          <Text style={[styles.favoriteButtonText, { color: "#174C3C" }]}>
            {isFavorite ? "Retirer" : "Favoris"}
          </Text>
        </TouchableOpacity>
        
        {/* Navigation sections */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 }}>
          <TouchableOpacity
            onPress={() => setCurrentSectionIndex(i => Math.max(0, i - 1))}
            disabled={currentSectionIndex === 0}
            style={{ opacity: currentSectionIndex === 0 ? 0.4 : 1, backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Précédent</Text>
          </TouchableOpacity>
          {/* Pagination */}
          <View style={{ minWidth: 60, alignItems: 'center' }}>
            <Text style={{ color: '#174C3C', fontWeight: 'bold', fontSize: 16 }}>{currentSectionIndex + 1}/{totalSections}</Text>
          </View>
          {currentSectionIndex === totalSections - 1 ? (
            nextChapter ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('Chapter', { chapter: nextChapter })}
                style={{ backgroundColor: '#D4AF37', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Chapitre suivant</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ opacity: 0.4, backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Suivant</Text>
              </View>
            )
          ) : (
            <TouchableOpacity
              onPress={() => setCurrentSectionIndex(i => Math.min(totalSections - 1, i + 1))}
              style={{ backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Suivant</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: 'bold',
    color: '#174C3C',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'left',
  },
  subtitle: {
    fontWeight: 'bold',
    color: '#174C3C',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  paragraph: {
    color: '#333',
    textAlign: 'left',
  },
  arabicContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderRightWidth: 4,
    borderRightColor: '#174C3C',
  },
  arabicText: {
    fontFamily: 'Traditional Arabic',
    textAlign: 'right',
    color: '#174C3C',
  },
  verseContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  verseText: {
    fontStyle: 'italic',
    color: '#174C3C',
    textAlign: 'left',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAF9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  favoriteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ChapterScreen;