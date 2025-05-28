import { Button } from "@/components/ui/button"; //
import { ScrollArea } from "@/components/ui/scroll-area"; //
import { useMusicStore } from "@/stores/useMusicStore"; //
import { usePlayerStore } from "@/stores/usePlayerStore"; //
import { Clock, Pause, Play, Heart } from "lucide-react"; // Добавлена иконка Heart
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Song } from "@/types"; //
import { useAuth as useClerkAuth } from "@clerk/clerk-react"; // Для проверки аутентификации
import FavouriteButton from "@/components/FavouriteButton"; // Импортируем компонент кнопки "Избранное"
import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton"; // Предполагается, что у вас есть этот компонент

export const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const AlbumPage = () => {
    const { albumId } = useParams<{ albumId: string }>(); // Указываем тип для albumId
    const { fetchAlbumById, currentAlbum, isLoading, error } = useMusicStore(); // Добавляем error из useMusicStore
    const { currentSong, isPlaying, playAlbum, togglePlay, initializeQueue, queue } = usePlayerStore(); //
    const { isSignedIn } = useClerkAuth(); // Получаем статус аутентификации пользователя

    useEffect(() => {
        if (albumId) {
            fetchAlbumById(albumId);
        }
    }, [fetchAlbumById, albumId]);

    useEffect(() => {
        if (currentAlbum && currentAlbum.songs.length > 0) {
            const isAlbumAlreadyLoadedInQueue =
                queue.length > 0 &&
                currentAlbum.songs.length === queue.length && // Проверяем также длину для большей точности
                currentAlbum.songs.every((song, index) => song._id === queue[index]?._id);

            if (!isAlbumAlreadyLoadedInQueue) {
                console.log("AlbumPage: Initializing player queue with album songs.");
                initializeQueue(currentAlbum.songs);
            }
        }
    }, [currentAlbum, initializeQueue, queue]);

    if (isLoading && !currentAlbum) return <PlaylistSkeleton />; // Показываем скелет, если загрузка и нет данных
    if (error) return <div className="h-full flex items-center justify-center text-red-500 p-6">Error loading album: {error}</div>;
    if (!currentAlbum) return <div className="h-full flex items-center justify-center p-6">Album not found.</div>;


    const isCurrentAlbumPlaying = currentAlbum?.songs.some((song) => song._id === currentSong?._id);

    const handlePlayAlbum = () => {
        if (!currentAlbum || currentAlbum.songs.length === 0) return;

        if (isCurrentAlbumPlaying) {
            togglePlay();
        } else {
            playAlbum(currentAlbum.songs, 0);
        }
    };

    const handlePlaySong = (index: number) => {
        if (!currentAlbum || currentAlbum.songs.length === 0) return;
        playAlbum(currentAlbum.songs, index);
    };

    // Определяем, какую колонку для "Избранного" использовать (1fr или auto/фиксированную)
    // И корректируем grid-cols в зависимости от того, вошел ли пользователь
    const songsListGridCols = isSignedIn
        ? "grid-cols-[16px_4fr_2fr_auto_auto]" // #, Title, Released, Fav, Duration
        : "grid-cols-[16px_4fr_2fr_1fr]";    // #, Title, Released, Duration

    const tableHeaderGridCols = isSignedIn
        ? "grid-cols-[16px_4fr_2fr_auto_1fr]" // Добавили колонку для иконки Heart
        : "grid-cols-[16px_4fr_2fr_1fr]";


    return (
        <div className='h-full'>
            <ScrollArea className='h-full rounded-md'>
                <div className='relative min-h-full'>
                    <div
                        className='absolute inset-0 bg-gradient-to-b from-[#5038a0]/80 via-zinc-900/80
                                to-zinc-900 pointer-events-none'
                        aria-hidden='true'
                    />
                    <div className='relative z-10'>
                        <div className='flex flex-col sm:flex-row p-6 gap-6 pb-8 items-center sm:items-end'>
                            <img
                                src={currentAlbum?.imageUrl || "/img/placeholder-album.jpg"} // Добавляем fallback
                                alt={currentAlbum?.title}
                                className='w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] shadow-xl rounded object-cover'
                                onError={(e) => (e.currentTarget.src = "/img/placeholder-album.jpg")}
                            />
                            <div className='flex flex-col items-center sm:items-start text-center sm:text-left'>
                                <p className='text-xs sm:text-sm font-medium'>Album</p>
                                <h1 className='text-4xl sm:text-5xl md:text-7xl font-bold my-2 sm:my-4 break-words'>
                                    {currentAlbum?.title}
                                </h1>
                                <div className='flex flex-col sm:flex-row items-center gap-x-2 gap-y-1 text-sm text-zinc-100'>
                                    <span className='font-medium text-white'>{currentAlbum?.artist}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{currentAlbum?.songs.length} songs</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{currentAlbum?.releaseYear}</span>
                                </div>
                            </div>
                        </div>

                        <div className='px-6 pb-4 flex items-center gap-6'>
                            <Button
                                onClick={handlePlayAlbum}
                                size='icon'
                                className='w-14 h-14 rounded-full bg-green-500 hover:bg-green-400
                                 hover:scale-105 transition-all flex-shrink-0' // Добавлено flex-shrink-0
                                disabled={!currentAlbum?.songs || currentAlbum.songs.length === 0}
                            >
                                {isPlaying && isCurrentAlbumPlaying ? (
                                    <Pause className='h-7 w-7 text-black' />
                                ) : (
                                    <Play className='h-7 w-7 text-black' />
                                )}
                            </Button>
                             {/* Можно добавить еще кнопки действий с альбомом, например, "Добавить в очередь", "Поделиться" */}
                        </div>

                        <div className='bg-black/20 backdrop-blur-sm pb-20'> {/* Добавил padding-bottom для плеера */}
                            <div
                                className={`grid ${tableHeaderGridCols} gap-4 px-10 py-2 text-sm
                                 text-zinc-400 border-b border-white/5`}
                            >
                                <div>#</div>
                                <div>Title</div>
                                <div>Released Date</div>
                                {isSignedIn && (
                                    <div className="flex items-center justify-center">
                                        <Heart className='h-4 w-4' />
                                    </div>
                                )}
                                <div className="flex items-center justify-end sm:justify-start"> {/* Изменено для лучшего выравнивания */}
                                    <Clock className='h-4 w-4' />
                                </div>
                            </div>

                            <div className='px-6'>
                                <div className='space-y-1 py-4'> {/* Уменьшил space-y для компактности */}
                                    {currentAlbum?.songs.map((song, index) => {
                                        const isCurrentSong = currentSong?._id === song._id;
                                        return (
                                            <div
                                                key={song._id}
                                                // onClick={() => handlePlaySong(index)} // Переносим onClick на конкретные элементы если нужно
                                                className={`grid ${songsListGridCols} gap-4 px-4 py-2.5 text-sm items-center
                                                 text-zinc-400 hover:bg-white/10 rounded-md group 
                                                 ${isCurrentSong ? 'bg-white/15 text-green-400' : ''}
                                                `}
                                            >
                                                <div
                                                    className='flex items-center justify-center cursor-pointer'
                                                    onClick={() => handlePlaySong(index)}
                                                >
                                                    {isCurrentSong && isPlaying ? (
                                                        <div className='size-4 text-green-400'>♫</div>
                                                    ) : (
                                                        <span className='group-hover:hidden'>{index + 1}</span>
                                                    )}
                                                    {(!isCurrentSong || (isCurrentSong && !isPlaying)) && (
                                                        <Play className='h-4 w-4 hidden group-hover:block' />
                                                    )}
                                                </div>

                                                <div
                                                    className='flex items-center gap-3 cursor-pointer'
                                                    onClick={() => handlePlaySong(index)}
                                                >
                                                    <img
                                                        src={song.imageUrl || "/img/placeholder-album.jpg"} // Fallback
                                                        alt={song.title}
                                                        className='size-10 rounded object-cover'
                                                        onError={(e) => (e.currentTarget.src = "/img/placeholder-album.jpg")}
                                                    />
                                                    <div>
                                                        <div className={`font-medium truncate ${isCurrentSong ? 'text-green-400' : 'text-white group-hover:text-white'}`}>
                                                            {song.title}
                                                        </div>
                                                        <div className="truncate">{song.artist}</div>
                                                    </div>
                                                </div>
                                                <div className='flex items-center truncate'>{new Date(song.createdAt).toLocaleDateString()}</div>
                                                {isSignedIn && (
                                                    <div className="flex items-center justify-center">
                                                        <FavouriteButton songId={song._id} />
                                                    </div>
                                                )}
                                                <div className='flex items-center justify-end sm:justify-start truncate'>{formatDuration(song.duration)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};
export default AlbumPage;