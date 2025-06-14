import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RouteProp } from '@react-navigation/native';
import colors from "../theme/colors";

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

const chapterFiles = {
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

export default function ChapterScreen({ route }: { route: RouteProp<ChapterScreenParams, 'Chapter'> }) {
  const { chapter } = route.params;
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null);

  useEffect(() => {
    try {
      const content = chapterFiles[chapter.image as keyof typeof chapterFiles];
      setChapterContent(content);
    } catch (error) {
      console.error("Erreur lors du chargement du chapitre:", error);
    }
  }, [chapter]);

  if (!chapterContent) {
    return <Text>Chargement...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{chapterContent.chapitre}</Text>
      </View>
      {chapterContent.contenu.map((item, index) => (
        <Text key={index} style={styles.content}>{item.contenu}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingVertical: 24, paddingHorizontal: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 10 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  content: { fontSize: 16, color: '#444', padding: 20, lineHeight: 24 },
});
