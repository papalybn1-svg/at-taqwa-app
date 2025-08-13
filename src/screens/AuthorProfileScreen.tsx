import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

export default function AuthorProfileScreen() {
  const navigation = useNavigation();

  // Gestionnaire de geste de swipe
  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      if ((translationX > 50 && velocityX > 500) || translationX > 150) {
        navigation.goBack();
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.safeArea}>
      <PanGestureHandler onHandlerStateChange={onGestureEvent}>
        <View style={styles.safeArea}>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil de l'Auteur</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Photo de profil */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <MaterialCommunityIcons name="account-circle" size={80} color={colors.primary} />
          </View>
          <Text style={styles.authorName}>Aly Sow</Text>
          <Text style={styles.authorTitle}>Imam et Érudit Islamique</Text>
          <Text style={styles.authorLocation}>Dakar, Sénégal</Text>
        </View>

        {/* Statistiques */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>20+</Text>
            <Text style={styles.statLabel}>Années d'expérience</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>15+</Text>
            <Text style={styles.statLabel}>Ouvrages publiés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Étudiants formés</Text>
          </View>
        </View>

        {/* Biographie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biographie</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>
              Aly Sow est un érudit islamique reconnu, spécialisé dans l'enseignement de la prière et de la spiritualité musulmane. 
              Avec plus de 20 ans d'expérience, il a consacré sa vie à transmettre les enseignements authentiques de l'Islam.
            </Text>
            <Text style={styles.bioText}>
              Diplômé de prestigieuses institutions islamiques, il a étudié auprès de grands savants et a développé une approche 
              pédagogique unique qui rend l'apprentissage de la prière accessible à tous.
            </Text>
            <Text style={styles.bioText}>
              Auteur de plusieurs ouvrages sur la spiritualité musulmane, Aly Sow continue d'inspirer et de guider 
              des milliers de fidèles dans leur cheminement spirituel.
            </Text>
          </View>
        </View>

        {/* Formation et expertise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formation et Expertise</Text>
          <View style={styles.expertiseCard}>
            <View style={styles.expertiseItem}>
              <MaterialCommunityIcons name="school" size={20} color={colors.primary} />
              <View style={styles.expertiseContent}>
                <Text style={styles.expertiseTitle}>Formation Académique</Text>
                <Text style={styles.expertiseText}>Études islamiques approfondies dans des institutions reconnues</Text>
              </View>
            </View>
            <View style={styles.expertiseItem}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.primary} />
              <View style={styles.expertiseContent}>
                <Text style={styles.expertiseTitle}>Spécialisation</Text>
                <Text style={styles.expertiseText}>Enseignement de la prière et spiritualité musulmane</Text>
              </View>
            </View>
            <View style={styles.expertiseItem}>
              <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
              <View style={styles.expertiseContent}>
                <Text style={styles.expertiseTitle}>Expérience</Text>
                <Text style={styles.expertiseText}>Plus de 20 ans d'enseignement et de guidance spirituelle</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Publications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publications Principales</Text>
          <View style={styles.publicationsCard}>
            <View style={styles.publicationItem}>
              <MaterialCommunityIcons name="book" size={16} color={colors.primary} />
              <Text style={styles.publicationTitle}>"Les Secrets de la Prière Authentique"</Text>
            </View>
            <View style={styles.publicationItem}>
              <MaterialCommunityIcons name="book" size={16} color={colors.primary} />
              <Text style={styles.publicationTitle}>"Guide Pratique de la Spiritualité Islamique"</Text>
            </View>
            <View style={styles.publicationItem}>
              <MaterialCommunityIcons name="book" size={16} color={colors.primary} />
              <Text style={styles.publicationTitle}>"L'Art de la Connexion Divine"</Text>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactCard}>
            <TouchableOpacity style={styles.contactItem}>
              <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
              <Text style={styles.contactText}>aly.sow@attaqwa.com</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem}>
              <MaterialCommunityIcons name="web" size={20} color={colors.primary} />
              <Text style={styles.contactText}>www.attaqwa.com</Text>
            </TouchableOpacity>
          </View>
        </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 5,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 30,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  authorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  authorTitle: {
    fontSize: 16,
    color: '#BB9B4E',
    fontWeight: '600',
    marginBottom: 4,
  },
  authorLocation: {
    fontSize: 14,
    color: colors.gray,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    marginHorizontal: 24,
    borderRadius: 16,
    paddingVertical: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
  },
  bioCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bioText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  expertiseCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  expertiseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  expertiseContent: {
    flex: 1,
    marginLeft: 15,
  },
  expertiseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  expertiseText: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
  publicationsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  publicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  publicationTitle: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  contactCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
  },
}); 