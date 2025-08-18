import React, { createContext, useContext, useEffect, useState } from 'react';
import { read as readUserStorage, write as writeUserStorage } from '../utils/userStorage';
import { useAuth } from './useAuth';

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
  const { user } = useAuth();

  useEffect(() => {
    loadFavorites();
  }, [user?.uid]); // Recharger quand l'utilisateur change

  const loadFavorites = async () => {
    try {
      if (!user?.uid) {
        // Si pas d'utilisateur, vider les favoris
        setFavorites([]);
        return;
      }
      
      const storedFavorites = await readUserStorage<FavoriteItem[]>(user.uid, 'favorites');
      if (storedFavorites) {
        setFavorites(storedFavorites);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: FavoriteItem[]) => {
    try {
      await writeUserStorage(user?.uid, 'favorites', newFavorites);
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

  return React.createElement(
    FavoritesContext.Provider,
    {
      value: {
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        loading,
      }
    },
    children
  );
};

export { FavoritesContext };
