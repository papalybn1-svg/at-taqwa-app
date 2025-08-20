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
            <ScrollView 
              style={styles.container} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
            >
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
            <MaterialCommunityIcons name="account-circle" size={90} color={colors.primary} />
          </View>
          <Text style={styles.authorName}>Aly Anta Sow</Text>
          <Text style={styles.authorTitle}>Auteur du livre</Text>
          <Text style={styles.authorLocation}>Dakar, Sénégal</Text>
        </View>

        {/* Présentation */}
        <View style={styles.section}>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>
              Aly Anta Sow est un passionné de recherches sur l'islam. Conscient des difficultés rencontrées par les non arabophones dans la maîtrise des textes islamiques généralement diffusés en langue arabe, l'objectif de Aly Anta Sow a toujours été de rendre lesdits textes accessibles à tout musulman.
            </Text>
            <Text style={styles.bioText}>
              Un de ses atouts majeurs est d'avoir côtoyé de grands savants qui ont beaucoup contribué à sa formation. Cela lui a facilité une approche pédagogique particulièrement efficace.
            </Text>
            <Text style={styles.bioText}>
              C'est ainsi qu'il s'est engagé, dans cet ouvrage, à rendre compréhensible aux non arabisants, toute la complexité de la réparation des erreurs dans la prière, base de la présente application.
            </Text>
            <Text style={styles.bioText}>
              Auteur d'essais sur le Hajj, la Oumra, le Jeûne de Ramadan ainsi que sur les différentes étapes de la vie du Prophète, Aly Anta Sow continue ainsi de faciliter à plusieurs fidèles, une bonne pratique islamique.
            </Text>
          </View>
        </View>
            </ScrollView>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 15,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  placeholder: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 30,
  },
  profileImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  authorName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
  },
  authorTitle: {
    fontSize: 18,
    color: '#BB9B4E',
    fontWeight: '600',
    marginBottom: 6,
  },
  authorLocation: {
    fontSize: 15,
    color: colors.gray,
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    marginHorizontal: 24,
    marginTop: 15,
    borderRadius: 16,
    paddingVertical: 18,
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
    marginTop: 20,
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
    borderRadius: 24,
    padding: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bioText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 18,
    textAlign: 'justify',
    fontWeight: '400',
  },
  expertiseCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  expertiseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
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
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  publicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
  },
}); 