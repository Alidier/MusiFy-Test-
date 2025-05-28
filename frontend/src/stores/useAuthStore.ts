import { axiosInstance } from "@/lib/axios"; //
import { create } from "zustand";
import { Song } from "@/types"; //

interface AuthStore {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;

  favouriteSongs: Song[];
  isLoadingFavourites: boolean;
  errorFavourites: string | null;

  isAdminLoaded: boolean;
  areFavouritesLoaded: boolean;

  checkAdminStatus: () => Promise<void>;
  fetchFavouriteSongs: () => Promise<void>;
  addFavouriteSong: (songId: string) => Promise<void>;
  removeFavouriteSong: (songId: string) => Promise<void>;
  isFavourite: (songId: string) => boolean;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAdmin: false,
  isLoading: false,
  error: null,
  favouriteSongs: [],
  isLoadingFavourites: false,
  errorFavourites: null,
  isAdminLoaded: false,
  areFavouritesLoaded: false,

  checkAdminStatus: async () => {
    const state = get();
    if (state.isLoading) {
      console.log('[AuthStore] Admin status check already in progress, skipping call.');
      return;
    }
    // Если isAdminLoaded уже true, не перезапрашиваем, если нет специальной логики для обновления
    if (state.isAdminLoaded) {
      console.log('[AuthStore] Admin status already loaded, skipping fetch.');
      return; // <-- ВАЖНО: Предотвращаем повторный запрос, если данные уже загружены
    }

    console.log('[AuthStore] checkAdminStatus: Fetching admin status.'); // Этот лог теперь должен появляться реже
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/admin/check");
      set({ isAdmin: response.data.admin, isAdminLoaded: true, isLoading: false });
    } catch (error: any) {
      console.error("[AuthStore] checkAdminStatus: Failed to check admin status:", error);
      set({
        isAdmin: false,
        error: error.response?.data?.message || "Failed to check admin status",
        isAdminLoaded: true,
        isLoading: false,
      });
    }
  },

  fetchFavouriteSongs: async () => {
    const state = get();
    if (state.isLoadingFavourites) {
      console.log('[AuthStore] Favourite songs fetch already in progress, skipping call.');
      return;
    }
    // Если areFavouritesLoaded уже true, не перезапрашиваем
    if (state.areFavouritesLoaded) {
      console.log('[AuthStore] Favourite songs already loaded, skipping fetch.');
      return; // <-- ВАЖНО: Предотвращаем повторный запрос, если данные уже загружены
    }

    console.log('[AuthStore] fetchFavouriteSongs: Fetching favourite songs.'); // Этот лог теперь должен появляться реже fetchFavouriteSongs: Fetching favourite songs. useAuthStore.ts:77:12"]
    set({ isLoadingFavourites: true, errorFavourites: null });
    try {
      const response = await axiosInstance.get<Song[]>("/users/favourites");
      set({ favouriteSongs: response.data, areFavouritesLoaded: true, isLoadingFavourites: false });
    } catch (error: any) {
      console.error("[AuthStore] fetchFavouriteSongs: Failed to fetch favourite songs:", error);
      set({
        errorFavourites: error.response?.data?.message || "Failed to fetch favourite songs",
        areFavouritesLoaded: true,
        isLoadingFavourites: false,
        favouriteSongs: [],
      });
    }
  },

  addFavouriteSong: async (songId: string) => {
    console.log('[AuthStore] Attempting to add favourite song:', songId);
    set({ isLoadingFavourites: true, errorFavourites: null }); // Не меняем areFavouritesLoaded здесь
    try {
      const response = await axiosInstance.post<{ message: string, favouriteSongs: Song[] }>(
        `/users/favourites/${songId}`
      );
      console.log('[AuthStore] Add favourite song - API response:', response.data);
      // Устанавливаем areFavouritesLoaded в true, так как список избранного точно актуален после этого действия
      set({ favouriteSongs: response.data.favouriteSongs, isLoadingFavourites: false, areFavouritesLoaded: true });
    } catch (error: any) {
      console.error("[AuthStore] Failed to add favourite song - API error details:", error.response?.data || error.message, error);
      set({
        errorFavourites: error.response?.data?.message || "Failed to add favourite song",
        isLoadingFavourites: false,
      });
    }
  },

  removeFavouriteSong: async (songId: string) => {
    console.log('[AuthStore] Attempting to remove favourite song:', songId);
    set({ isLoadingFavourites: true, errorFavourites: null }); // Не меняем areFavouritesLoaded здесь
    try {
      const response = await axiosInstance.delete<{ message: string, favouriteSongs: Song[] }>(
        `/users/favourites/${songId}`
      );
      console.log('[AuthStore] Remove favourite song - API response:', response.data);
      // Устанавливаем areFavouritesLoaded в true, так как список избранного точно актуален
      set({ favouriteSongs: response.data.favouriteSongs, isLoadingFavourites: false, areFavouritesLoaded: true });
    } catch (error: any) {
      console.error("[AuthStore] Failed to remove favourite song - API error details:", error.response?.data || error.message, error);
      set({
        errorFavourites: error.response?.data?.message || "Failed to remove favourite song",
        isLoadingFavourites: false,
      });
    }
  },

  isFavourite: (songId: string) => {
    return get().favouriteSongs.some((song) => song._id === songId);
  },

  reset: () => {
    console.log('[AuthStore] Resetting store state.');
    set({
      isAdmin: false,
      isLoading: false,
      error: null,
      favouriteSongs: [],
      isLoadingFavourites: false,
      errorFavourites: null,
      isAdminLoaded: false,
      areFavouritesLoaded: false,
    });
  },
}));