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

  // useEffect pour charger le contenu du chapitre
  useEffect(() => {
    if (chapter && chapter.image && chapterFiles[chapter.image]) {
      setChapterContent(chapterFiles[chapter.image]);
      setCurrentSectionIndex(0);
    }
  }, [chapter]);

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

  // On ne retourne rien avant d'avoir appelé tous les hooks !
  if (!chapterContent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8e6c3d" />
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
          <View key={idx} style={{ marginVertical: 18, borderWidth: 1, borderColor: '#8e6c3d', borderRadius: 8, overflow: 'hidden' }}>
            {item.contenu.map((row: string[], rIdx: number) => (
              <View key={rIdx} style={{ flexDirection: 'row', backgroundColor: rIdx === 0 ? '#f0e6d6' : '#fff' }}>
                {row.map((cell, cIdx) => (
                  <Text
                    key={cIdx}
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRightWidth: cIdx < row.length - 1 ? 1 : 0,
                      borderRightColor: '#8e6c3d',
                      fontWeight: rIdx === 0 ? 'bold' : 'normal',
                      color: '#5a3921',
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
    <View style={{ flex: 1, backgroundColor: '#f9f5f0' }}>
      {/* Header avec image et titre */}
      <View style={{ position: 'relative', overflow: 'visible' }}>
        <Image
          source={imageMap[chapter.image] || imageMap['1']}
          style={{
            width: screenWidth,
            height: 180,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            resizeMode: 'cover',
          }}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0.0)']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 100, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        />
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: -32, zIndex: 10 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 22, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 10, elevation: 8, alignItems: 'center' }}>
            {/* Affichage de la partie */}
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8e6c3d', textAlign: 'center', letterSpacing: 0.5 }}>
              {allChapters[currentChapterIndex]?.partieTitre}
            </Text>
            {/* Titre du chapitre */}
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8e6c3d', textAlign: 'center', marginTop: 4 }}>
              {chapter.title}
            </Text>
          </View>
        </View>
      </View>

      {/* Bouton Aa pour changer la taille du texte */}
      <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', alignItems: 'center', marginTop: 18, marginBottom: 2 }}>
        <TouchableOpacity onPress={nextTextSize} style={{ backgroundColor: '#8e6c3d', borderRadius: 22, paddingVertical: 6, paddingHorizontal: 16, elevation: 2 }}>
        </TouchableOpacity>
      </View>


      {/* Indicateur de section et navigation */}
      <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 0 }}>
        <Text style={{ color: '#8e6c3d', fontWeight: 'bold', fontSize: 16 }}>{sectionIndicator}</Text>
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <TouchableOpacity
          onPress={() => setCurrentSectionIndex(i => Math.max(0, i - 1))}
          disabled={currentSectionIndex === 0}
          style={{ opacity: currentSectionIndex === 0 ? 0.4 : 1, backgroundColor: '#8e6c3d', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Précédent</Text>
        </TouchableOpacity>
        {/* Pagination */}
        <View style={{ minWidth: 60, alignItems: 'center' }}>
          <Text style={{ color: '#8e6c3d', fontWeight: 'bold', fontSize: 16 }}>{currentSectionIndex + 1}/{totalSections}</Text>
        </View>
        {currentSectionIndex === totalSections - 1 ? (
          nextChapter ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Chapter', { chapter: nextChapter })}
              style={{ backgroundColor: '#19514A', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Chapitre suivant</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ opacity: 0.4, backgroundColor: '#8e6c3d', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Suivant</Text>
            </View>
          )
        ) : (
          <TouchableOpacity
            onPress={() => setCurrentSectionIndex(i => Math.min(totalSections - 1, i + 1))}
            style={{ backgroundColor: '#8e6c3d', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Suivant</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: 'bold',
    color: '#8e6c3d',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'left',
  },
  subtitle: {
    fontWeight: 'bold',
    color: '#5a3921',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  paragraph: {
    color: '#333',
    textAlign: 'left',
  },
  arabicContainer: {
    backgroundColor: '#f0e6d6',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderRightWidth: 4,
    borderRightColor: '#8e6c3d',
  },
  arabicText: {
    fontFamily: 'Traditional Arabic',
    textAlign: 'right',
    color: '#5a3921',
  },
  verseContainer: {
    backgroundColor: '#f5efe7',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8e6c3d',
  },
  verseText: {
    fontStyle: 'italic',
    color: '#5a3921',
    textAlign: 'left',
  },
});

export default ChapterScreen;