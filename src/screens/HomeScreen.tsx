import { useNavigation } from '@react-navigation/native';
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "../theme/colors";

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
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
      <View style={styles.booksPreview}>
        <View style={styles.bookCard}>
          <Image source={require('../../assets/1.png')} style={styles.bookImage} />
          <Text>Chapitre 1 : Purification{"\n"}20 mn</Text>
        </View>
        <View style={styles.bookCard}>
          <Image source={require('../../assets/3.png')} style={styles.bookImage} />
          <Text>Chapitre 1 : Purification{"\n"}20 mn</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F7' },
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
  booksPreview: { flexDirection: "row", justifyContent: "space-around", margin: 20 },
  bookCard: { backgroundColor: colors.white, borderRadius: 18, padding: 12, alignItems: "center", width: 150, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, marginHorizontal: 6 },
  bookImage: { width: 70, height: 70, marginBottom: 10, borderRadius: 12, resizeMode: 'cover' },
}); 