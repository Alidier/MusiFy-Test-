import Topbar from "@/components/Topbar";

import { useMusicStore } from "@/stores/useMusicStore";

import { useEffect } from "react";

import FeaturedSection from "./components/FeaturedSection";

import { ScrollArea } from "@/components/ui/scroll-area";

import SectionGrid from "./components/SectionGrid";

import { usePlayerStore } from "@/stores/usePlayerStore";


import { useAuthStore } from "@/stores/useAuthStore"; // <-- Импортируем useAuthStore
import { useAuth } from "@clerk/clerk-react";

const HomePage = () => {

    const {

        fetchFeaturedSongs,

        fetchMadeForYouSongs,

        fetchTrendingSongs,

        isLoading,

        madeForYouSongs,

        featuredSongs,

        trendingSongs,

    } = useMusicStore();


    const { initializeQueue } = usePlayerStore();


    useEffect(() => {

        fetchFeaturedSongs();

        fetchMadeForYouSongs();

        fetchTrendingSongs();

    }, [fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);


    useEffect(() => {

        if (madeForYouSongs.length > 0 && featuredSongs.length > 0 && trendingSongs.length > 0) {

            const allSongs = [...featuredSongs, ...madeForYouSongs, ...trendingSongs];

            initializeQueue(allSongs);

        }

    }, [initializeQueue, madeForYouSongs, trendingSongs, featuredSongs]);

    const { fetchAlbums, error: errorAlbums } = useMusicStore();
    const { isSignedIn, isLoaded: clerkAuthLoaded } = useAuth(); // <-- Получаем статус аутентификации Clerk
    const {
        favouriteSongs,
        fetchFavouriteSongs,
        isLoadingFavourites,
        errorFavourites
    } = useAuthStore(); // <-- Получаем данные и функции для избранного

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    // Загружаем избранные песни, если пользователь вошел и они еще не загружены
    useEffect(() => {
        if (isSignedIn && clerkAuthLoaded) {
            // Проверяем, нужно ли загружать (например, если favouriteSongs пустой и не было ошибки)
            if (favouriteSongs.length === 0 && !errorFavourites && !isLoadingFavourites) {
                fetchFavouriteSongs();
            }
        }
    }, [isSignedIn, clerkAuthLoaded, fetchFavouriteSongs, favouriteSongs.length, errorFavourites, isLoadingFavourites]);


    if (errorAlbums) return <div className='p-4 text-red-500'>Error loading albums: {errorAlbums}</div>;
        return (

        <main className='rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900'>

            <Topbar />

            <ScrollArea className='h-[calc(100vh-180px)]'>

                <div className='p-4 sm:p-6'>

                    <h1 className='text-2xl sm:text-3xl font-bold mb-6'>Good afternoon</h1>

                    <FeaturedSection />

                  

                    <div className='space-y-8'>

                        <SectionGrid title='Made For You' songs={madeForYouSongs} isLoading={isLoading} />

                        <SectionGrid title='Trending' songs={trendingSongs} isLoading={isLoading} />
  {isSignedIn && clerkAuthLoaded && (
                        <SectionGrid title="Favourite songs" songs={favouriteSongs} isLoading={isLoading} />
                    )}
                    </div>

                </div>

            </ScrollArea>

        </main>

    );

};

export default HomePage; 