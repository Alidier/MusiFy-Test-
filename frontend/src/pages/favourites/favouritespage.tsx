import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore'; //
import { usePlayerStore } from '@/stores/usePlayerStore'; //
import { Song } from '@/types'; //
import { Button } from '@/components/ui/button'; //
import { Play, ListMusic, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FavouriteButton from '@/components/FavouriteButton';
import { useAuth } from '@clerk/clerk-react';

const FavouritesPage: React.FC = () => {
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const { favouriteSongs, fetchFavouriteSongs, isLoadingFavourites, errorFavourites } = useAuthStore();
  // Используем playAlbum из usePlayerStore, остальные (playSongs, setCurrentSong) здесь не нужны в таком виде
  const { playAlbum, currentSong: playingSong, isPlaying } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      fetchFavouriteSongs();
    }
  }, [isSignedIn, fetchFavouriteSongs]);

  // Исправленный обработчик для воспроизведения песни
  const handlePlaySong = (index: number) => {
    // song параметр здесь не используется, так как playAlbum берет песню из favouriteSongs по индексу
    if (favouriteSongs.length > 0 && index >= 0 && index < favouriteSongs.length) {
      playAlbum(favouriteSongs, index); // Используем playAlbum для установки очереди и начала воспроизведения
    }
  };

  if (!clerkLoaded || (isSignedIn && isLoadingFavourites && favouriteSongs.length === 0 && !errorFavourites)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-var(--header-height,80px))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading Favourites...</span>
      </div>
    );
  }

  if (!isSignedIn && clerkLoaded) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <ListMusic className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-semibold mb-2">Access Your Favourites</h1>
        <p className="text-muted-foreground mb-6">
          Please sign in to view and manage your favourite songs.
        </p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  if (errorFavourites) {
     return (
      <div className="container mx-auto p-4 md:p-8 text-center text-red-500">
        <h1 className="text-2xl font-semibold mb-2">Error Loading Favourites</h1>
        <p>{errorFavourites}</p>
        <Button onClick={() => fetchFavouriteSongs()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  if (favouriteSongs.length === 0 && !isLoadingFavourites) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <ListMusic className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-semibold mb-2">No Favourite Songs Yet</h1>
        <p className="text-muted-foreground mb-6">
          Tap the heart icon on any song to add it to your favourites.
        </p>
        <Button onClick={() => navigate('/')}>Discover Music</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">My Favourite Songs</h1>
      <div className="space-y-3">
        {favouriteSongs.map((song, index) => (
          <div
            key={song._id}
            className="flex items-center justify-between p-3 pr-4 bg-background hover:bg-muted border rounded-lg shadow-sm group transition-colors"
          >
            <div className="flex items-center gap-4 flex-grow min-w-0 cursor-pointer"  onClick={() => handlePlaySong(index)}>
              <img
                src={song.imageUrl || '/img/placeholder-album.jpg'}
                alt={song.title}
                className="w-12 h-12 rounded object-cover"
                onError={(e) => (e.currentTarget.src = '/img/placeholder-album.jpg')}
              />
              <div className="flex-grow min-w-0">
                <h3 className={`font-semibold truncate ${playingSong?._id === song._id && isPlaying ? 'text-primary' : ''}`}>
                  {song.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {song.artist}
                </p>
              </div>
               <div className="text-sm text-muted-foreground hidden sm:block">
                  {/* Можно отобразить длительность песни, если она есть в объекте song и отформатирована */}
                  {/* {formatDuration(song.duration)} */}
               </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
              <FavouriteButton songId={song._id} className="opacity-60 group-hover:opacity-100" />
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaySong(index);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Play song"
              >
                <Play className="w-5 h-5" fill="currentColor" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavouritesPage;