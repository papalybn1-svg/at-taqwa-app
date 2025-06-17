import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Animated, FlatList, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites] = React.useState<{ id: number; title: string; desc: string }[]>([]); // Récupérer les favoris depuis le contexte ou le stockage local
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderItem = ({ item }: { item: { id: number; title: string; desc: string } }) => (
    <Animated.View style={[styles.favoriteItem, { opacity: fadeAnim }]}>
      <Text style={styles.favoriteTitle}>{item.title}</Text>
      <Text style={styles.favoriteDesc}>{item.desc}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Favoris</Text>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Aucun favori pour le moment</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
  },
  favoriteItem: {
    backgroundColor: '#FDF6ED',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  favoriteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  favoriteDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
}); 