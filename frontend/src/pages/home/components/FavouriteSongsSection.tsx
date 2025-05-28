// frontend/src/pages/home/components/FavouriteSongsSection.tsx
import React from 'react';
import { Song } from '@/types'; //
import { usePlayerStore } from '@/stores/usePlayerStore'; //
import FavouriteButton from '@/components/FavouriteButton';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FavouriteSongsSectionProps {
  title: string;
  songs: Song[];
}

const FavouriteSongsSection: React.FC<FavouriteSongsSectionProps> = ({ title, songs }) => {
  const { playAlbum } = usePlayerStore();

  if (!songs || songs.length === 0) {
    return null;
  }

  const handlePlaySong = (index: number) => {
    playAlbum(songs, index);
  };

  // Показывать, например, до 6 песен, чтобы соответствовать сетке xl:grid-cols-6
  const songsToShow = songs.slice(0, 6);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold hover:underline cursor-pointer">
          {title}
        </h2>
        {songs.length > songsToShow.length && (
          <Link
            to="/favourites"
            className="text-sm font-semibold text-muted-foreground hover:text-primary hover:underline px-3 py-1 rounded-md"
          >
            Показать все
          </Link>
        )}
      </div>
      {/* Адаптируйте классы сетки под ваш SectionGrid.tsx */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-6"> {/* Увеличил gap-y */}
        {songsToShow.map((song, index) => (
          <div
            key={song._id}
            // Адаптируйте эти классы под ваши стандартные карточки альбомов/плейлистов
            className="bg-[#181818] hover:bg-[#282828] p-4 rounded-md transition-all duration-300 group cursor-pointer flex flex-col"
            onClick={() => handlePlaySong(index)} // Воспроизведение по клику на всю карточку
          >
            <div className="relative aspect-square mb-4"> {/* aspect-square для квадратной обложки, mb-4 для отступа */}
              <img
                src={song.imageUrl || '/img/placeholder-album.jpg'} //
                alt={song.title}
                className="w-full h-full object-cover rounded-md shadow-lg" // rounded-md для обложки
              />
              {/* Кнопка Play появляется при наведении на карточку */}
              <div
                className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center
                           text-black shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                           transition-all duration-300 transform group-hover:scale-105 group-hover:bottom-3"
                // onClick обработан на родительском div, но можно добавить e.stopPropagation() сюда, если нужно
                // onClick={(e) => { e.stopPropagation(); handlePlaySong(index); }}
              >
                <Play className="w-6 h-6 fill-black" />
              </div>
            </div>
            {/* Информация о треке и кнопка избранного */}
            <div className="flex items-start justify-between mt-auto">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-base font-semibold truncate text-white">
                  {song.title}
                </h3>
                <p className="text-sm text-zinc-400 truncate">
                  {song.artist}
                </p>
              </div>
              {/* FavouriteButton требует stopPropagation, чтобы не сработал onClick всей карточки */}
              <div onClick={(e) => e.stopPropagation()}>
                <FavouriteButton
                    songId={song._id}
                    className="text-zinc-400 hover:text-white flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FavouriteSongsSection;