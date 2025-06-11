import React from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "../theme/colors";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.bismillah}>Bismillah,</Text>
        <Text style={styles.welcome}>Bienvenue dans ton espace</Text>
        <TextInput style={styles.searchBar} placeholder="Rechercher" />
      </View>
      <Text style={styles.sectionTitle}>Catégories</Text>
      <View style={styles.categories}>
        <TouchableOpacity style={styles.category}>
          <Image source={require('../../assets/priere.png')} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>Livres</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.category}>
          <Image source={require('../../assets/abulution.png')} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>Horaires</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.category}>
          <Image source={require('../../assets/femme.png')} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>Quizz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.category}>
          <Image source={require('../../assets/tasbih.png')} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>Tasbih</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerText}>Transformez chaque prière en un moment de paix et de connexion</Text>
            <TouchableOpacity style={styles.bannerButton}><Text style={styles.bannerButtonText}>Commencer</Text></TouchableOpacity>
          </View>
          <Image source={require('../../assets/femme-transformer.png')} style={styles.bannerImageWoman} />
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
  banner: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 18,
    borderRadius: 28,
    height: 130,
    width: '92%',
    alignSelf: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: '100%',
  },
  bannerText: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'left',
    fontWeight: 'bold',
    width: 180,
  },
  bannerButton: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignSelf: 'flex-start',
    marginTop: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  bannerImageWoman: {
    width: 130,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginLeft: 10,
    marginRight: 0,
  },
  booksPreview: { flexDirection: "row", justifyContent: "space-around", margin: 20 },
  bookCard: { backgroundColor: colors.white, borderRadius: 18, padding: 12, alignItems: "center", width: 150, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, marginHorizontal: 6 },
  bookImage: { width: 70, height: 70, marginBottom: 10, borderRadius: 12, resizeMode: 'cover' },
}); 