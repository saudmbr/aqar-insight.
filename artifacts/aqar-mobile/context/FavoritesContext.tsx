import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { FavoriteRecord, Listing, apiFetch, endpoints } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface FavoritesState {
  favorites: Listing[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (listing: Listing) => Promise<void>;
  isLoading: boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesState>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  refreshFavorites: async () => {},
  isLoading: true,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery<FavoriteRecord[]>({
    queryKey: ['favorites', user?.id ?? 'guest'],
    queryFn: () => apiFetch<FavoriteRecord[]>(endpoints.favorites),
    enabled: Boolean(user),
    staleTime: 1000 * 30,
  });

  const toggleMutation = useMutation({
    mutationFn: (listingId: number) =>
      apiFetch<{ isFavorite: boolean }>(endpoints.toggleFavorite(listingId), {
        method: 'POST',
      }),
    onSuccess: async (_, listingId) => {
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
      await queryClient.invalidateQueries({ queryKey: ['listing-favorite-status', listingId] });
    },
  });

  const favorites = useMemo(
    () => (favoritesQuery.data ?? []).map((item) => item.listing).filter(Boolean),
    [favoritesQuery.data]
  );

  const isFavorite = useCallback((id: number) => favorites.some((f) => f.id === id), [favorites]);

  const refreshFavorites = useCallback(async () => {
    if (!user) return;
    await favoritesQuery.refetch();
  }, [favoritesQuery, user]);

  const toggleFavorite = useCallback(
    async (listing: Listing) => {
      if (!user) {
        throw new Error('يرجى تسجيل الدخول لحفظ الإعلانات');
      }

      const exists = favorites.some((f) => f.id === listing.id);

      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previous = queryClient.getQueryData<FavoriteRecord[]>(['favorites', user.id]) ?? [];

      queryClient.setQueryData<FavoriteRecord[]>(
        ['favorites', user.id],
        exists
          ? previous.filter((item) => item.listing.id !== listing.id)
          : [
              {
                favoriteId: -listing.id,
                createdAt: new Date().toISOString(),
                listing,
              },
              ...previous,
            ]
      );

      try {
        await toggleMutation.mutateAsync(listing.id);
        await Haptics.impactAsync(
          exists ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
        );
      } catch (error) {
        queryClient.setQueryData(['favorites', user.id], previous);
        throw error;
      }
    },
    [favorites, queryClient, toggleMutation, user]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        isLoading: favoritesQuery.isLoading || toggleMutation.isPending,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
