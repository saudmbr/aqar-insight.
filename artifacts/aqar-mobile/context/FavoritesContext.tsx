import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Listing } from '@/constants/api';

interface FavoritesState {
  favorites: Listing[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (listing: Listing) => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesState>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  isLoading: true,
});

const STORAGE_KEY = 'aqar_favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) setFavorites(JSON.parse(data));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const isFavorite = useCallback((id: number) => favorites.some((f) => f.id === id), [favorites]);

  const toggleFavorite = useCallback(
    async (listing: Listing) => {
      const exists = favorites.some((f) => f.id === listing.id);
      const updated = exists
        ? favorites.filter((f) => f.id !== listing.id)
        : [...favorites, listing];
      setFavorites(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await Haptics.impactAsync(exists ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    },
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
