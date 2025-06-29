import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface FavoriteItem {
  id: string;
  title: string;
  desc: string;
  author?: string;
  image?: string;
  partie?: string;
  chapterData?: any;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: async () => {},
  removeFavorite: async () => {},
  isFavorite: () => false,
  loading: false,
});

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: FavoriteItem[]) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  };

  const addFavorite = async (item: FavoriteItem) => {
    const newFavorites = [...favorites, item];
    await saveFavorites(newFavorites);
  };

  const removeFavorite = async (id: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== id);
    await saveFavorites(newFavorites);
  };

  const isFavorite = (id: string) => {
    return favorites.some(fav => fav.id === id);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      loading,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export { FavoritesContext }; 