import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { Animated, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import imageMap from '../../assets/chapterImages';
import colors from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites] = React.useState<{ id: string; title: string; desc: string; author?: string; image?: string; partie?: string; chapterData?: any }[]>([]); 
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  // Charger les favoris depuis AsyncStorage
  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      console.log('Favoris chargés depuis AsyncStorage:', storedFavorites);
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        console.log('Favoris parsés:', parsedFavorites);
        setFavorites(parsedFavorites);
      } else {
        console.log('Aucun favori trouvé dans AsyncStorage');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  };

  // Recharger les favoris à chaque fois qu'on arrive sur la page
  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [favorites]);

  const removeFavorite = async (id: string) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      const newFavorites = favorites.filter(item => item.id !== id);
      setFavorites(newFavorites);
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
      // Reset animation for remaining items
      Animated.timing(fadeAnim, {
      toValue: 1,
        duration: 300,
      useNativeDriver: true,
    }).start();
    });
  };

  const renderItem = ({ item, index }: { item: { id: string; title: string; desc: string; author?: string; image?: string; partie?: string; chapterData?: any }, index: number }) => {
    const inputRange = [index * 100, (index + 1) * 100];
    const scale = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    });

    return (
      <Animated.View style={[
        styles.favoriteCard,
        {
          opacity: fadeAnim,
          transform: [{ scale }]
        }
      ]}>
        <TouchableOpacity 
          style={styles.favoriteContent}
          activeOpacity={0.95}
          onPress={() => {
            // Navigation vers le chapitre et la section spécifique
            if (item.chapterData) {
              (navigation as any).navigate('Chapter', { 
                chapter: item.chapterData,
                initialSection: item.chapterData.startSection || 0
              });
            }
          }}
        >
          {/* Image du chapitre si disponible */}
          {item.image && (
            <View style={styles.favoriteImageContainer}>
              <Image 
                source={imageMap[item.image] || imageMap['1']} 
                style={styles.favoriteImage}
              />
            </View>
          )}
          
          {/* Contenu principal */}
          <View style={styles.favoriteTextContainer}>
            <View style={styles.favoriteHeader}>
              <Text style={styles.favoriteTitle} numberOfLines={2}>{item.title}</Text>
              <TouchableOpacity 
                onPress={() => removeFavorite(item.id)}
                style={styles.removeButton}
              >
                <MaterialCommunityIcons name="heart" size={20} color="#174C3C" />
              </TouchableOpacity>
            </View>
            
            {item.partie && (
              <Text style={styles.favoritePartie}>{item.partie}</Text>
            )}
            
            <Text style={styles.favoriteDesc} numberOfLines={3}>{item.desc}</Text>
            
            {item.author && (
              <View style={styles.favoriteFooter}>
                <MaterialCommunityIcons name="account-edit" size={14} color="#666" />
                <Text style={styles.favoriteAuthor}>{item.author}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <Animated.View style={[
      styles.emptyContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="heart-outline" size={80} color="#E8F5E8" />
      </View>
      <Text style={styles.emptyTitle}>Aucun favori</Text>
      <Text style={styles.emptySubtitle}>
        Ajoutez vos chapitres préférés à vos favoris pour les retrouver facilement
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => (navigation as any).navigate('Books')}
      >
        <MaterialCommunityIcons name="book-open-variant" size={20} color="white" />
        <Text style={styles.emptyButtonText}>Explorer les livres</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header épuré */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#174C3C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        <View style={styles.headerSpacer} />
      </View>



      {/* Liste des favoris */}
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerSpacer: {
    width: 32,
  },



  // Liste
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Cartes de favoris
  favoriteCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  favoriteContent: {
    flexDirection: 'row',
    padding: 16,
  },
  favoriteImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#f8f9fa',
  },
  favoriteImage: {
    width: '110%',
    height: '110%',
    resizeMode: 'cover',
    transform: [{ scale: 1.1 }],
  },
  favoriteTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  favoriteTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#174C3C',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  removeButton: {
    padding: 4,
  },
  favoritePartie: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoriteDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  favoriteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteAuthor: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 6,
  },

  // État vide
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8FAF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E8F5E8',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#174C3C',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 