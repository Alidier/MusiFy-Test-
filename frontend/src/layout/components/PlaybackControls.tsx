import { Button } from "@/components/ui/button"; //
import { Slider } from "@/components/ui/slider"; //
import { usePlayerStore } from "@/stores/usePlayerStore"; //
import {
    Laptop2,
    ListMusic,
    Mic2,
    Pause,
    Play,
    Repeat,
    Shuffle,
    SkipBack,
    SkipForward,
    Volume1,
    VolumeX,
    // Heart, // Можно добавить, если хотите отдельную иконку, но FavouriteButton уже содержит ее
} from "lucide-react";
import { useEffect } from "react";
import FavouriteButton from "@/components/FavouriteButton"; // <-- Новый импорт
import { useAuth } from "@clerk/clerk-react"; // <-- Для проверки аутентификации

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
    const {
        currentSong,
        isPlaying,
        isRepeat,
        isShuffling,
        togglePlay,
        playNext,
        playPrevious,
        toggleRepeat,
        toggleShuffle,
        currentTime,
        duration,
        volume,
        isMuted,
        // Функции setAudioCurrentTime, setVolume, toggleMute вызываются через usePlayerStore.getState() в вашем коде
    } = usePlayerStore();

    const { isSignedIn } = useAuth(); // <-- Для условного отображения кнопки

    const handleVolumeToggle = () => {
        usePlayerStore.getState().toggleMute();
    };

    const handleVolumeChange = (value: number[]) => {
        usePlayerStore.getState().setVolume(value[0]);
    };

    const handleSeek = (value: number[]) => {
        usePlayerStore.getState().setAudioCurrentTime(value[0]);
    };

    // Ваш существующий useEffect для логирования
    useEffect(() => {
        console.log('--- PlaybackControls useEffect Triggered (UI Update) ---');
        console.log('Current Song:', currentSong?.title);
        console.log('Is Playing:', isPlaying);
        console.log('Is Repeat:', isRepeat);
        console.log('Is Shuffling:', isShuffling);
        console.log('Current Time:', currentTime);
        console.log('Duration:', duration);
        console.log('Volume:', volume);
        console.log('Is Muted:', isMuted);
        console.log('--------------------------------------------');

        return () => {
            console.log('--- PlaybackControls useEffect Cleanup (UI Update) ---');
        };
    }, [currentSong, isPlaying, isRepeat, isShuffling, currentTime, duration, volume, isMuted]);


    return (
        <footer className='h-20 sm:h-24 bg-zinc-900 border-t border-zinc-800 px-4'>
            <div className='flex justify-between items-center h-full max-w-[1800px] mx-auto'>
                {/* currently playing song & favourite button */}
                <div className='hidden sm:flex items-center gap-3 min-w-[180px] w-[30%]'> {/* Уменьшил gap до 3 */}
                    {currentSong && (
                        <>
                            <img
                                src={currentSong.imageUrl}
                                alt={currentSong.title}
                                className='w-14 h-14 object-cover rounded-md'
                            />
                            <div className='flex-1 min-w-0'>
                                <div className='font-medium truncate hover:underline cursor-pointer text-white'> {/* Добавил text-white */}
                                    {currentSong.title}
                                </div>
                                <div className='text-sm text-zinc-400 truncate hover:underline cursor-pointer'>
                                    {currentSong.artist}
                                </div>
                            </div>
                            {/* Кнопка "Избранное" */}
                            {isSignedIn && (
                                <FavouriteButton
                                    songId={currentSong._id}
                                    className="text-zinc-400 hover:text-white flex-shrink-0" // Добавлен flex-shrink-0
                                />
                            )}
                        </>
                    )}
                </div>

                {/* player controls */}
                <div className='flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[45%]'>
                    <div className='flex items-center gap-4 sm:gap-6'>
                        <Button
                            size='icon'
                            variant='ghost'
                            className={`hidden sm:inline-flex hover:text-white ${isShuffling ? 'text-green-500' : 'text-zinc-400'}`}
                            onClick={toggleShuffle}
                            disabled={!currentSong || usePlayerStore.getState().originalQueue.length <= 1}
                        >
                            <Shuffle className='h-4 w-4' />
                        </Button>
                        <Button
                            size='icon'
                            variant='ghost'
                            className='hover:text-white text-zinc-400'
                            onClick={playPrevious}
                            disabled={!currentSong}
                        >
                            <SkipBack className='h-4 w-4' />
                        </Button>
                        <Button
                            size='icon'
                            className='bg-white hover:bg-white/80 text-black rounded-full h-8 w-8'
                            onClick={togglePlay}
                            disabled={!currentSong}
                        >
                            {isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
                        </Button>
                        <Button
                            size='icon'
                            variant='ghost'
                            className='hover:text-white text-zinc-400'
                            onClick={playNext}
                            disabled={!currentSong}
                        >
                            <SkipForward className='h-4 w-4' />
                        </Button>
                        <Button
                            size='icon'
                            variant='ghost'
                            className={`hidden sm:inline-flex hover:text-white ${isRepeat ? 'text-green-500' : 'text-zinc-400'}`}
                            onClick={toggleRepeat}
                            disabled={!currentSong}
                        >
                            <Repeat className='h-4 w-4' />
                        </Button>
                    </div>
                    <div className='hidden sm:flex items-center gap-2 w-full'>
                        <div className='text-xs text-zinc-400'>{formatTime(currentTime)}</div>
                        <Slider
                            value={[currentTime]}
                            max={duration || 100} // Если duration 0, max будет 100, чтобы слайдер отображался
                            step={1}
                            className='w-full hover:cursor-grab active:cursor-grabbing'
                            onValueChange={handleSeek} // onValueChange для обновления при перетаскивании (опционально)
                            // onValueCommit={handleSeekCommit} // Используйте onValueCommit если хотите обновлять только после отпускания
                            disabled={!currentSong || duration === 0}
                        />
                        <div className='text-xs text-zinc-400'>{formatTime(duration)}</div>
                    </div>
                </div>

                {/* volume controls */}
                <div className='hidden sm:flex items-center gap-4 min-w-[180px] w-[30%] justify-end'>
                    <Button size='icon' variant='ghost' className='hover:text-white text-zinc-400'>
                        <Mic2 className='h-4 w-4' />
                    </Button>
                    <Button size='icon' variant='ghost' className='hover:text-white text-zinc-400'>
                        <ListMusic className='h-4 w-4' />
                    </Button>
                    <Button size='icon' variant='ghost' className='hover:text-white text-zinc-400'>
                        <Laptop2 className='h-4 w-4' />
                    </Button>
                    <div className='flex items-center gap-2'>
                        <Button
                            size='icon'
                            variant='ghost'
                            className='hover:text-white text-zinc-400'
                            onClick={handleVolumeToggle}
                        >
                            {isMuted || volume === 0 ? <VolumeX className='h-4 w-4' /> : <Volume1 className='h-4 w-4' />}
                        </Button>
                        <Slider
                            value={[isMuted ? 0 : volume]}
                            max={100}
                            step={1}
                            className='w-24 hover:cursor-grab active:cursor-grabbing'
                            onValueChange={handleVolumeChange}
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
};