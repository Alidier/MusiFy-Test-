import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongUrlRef = useRef<string | null>(null);

  const { currentSong, isPlaying, volume, isMuted, currentTime } = usePlayerStore(); // Добавили currentTime

  // --- EFFECT 1: Обработка изменения песни и состояния воспроизведения (play/pause) ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) {
      if (audio) audio.pause();
      usePlayerStore.setState({ isPlaying: false, currentTime: 0, duration: 0 });
      prevSongUrlRef.current = null;
      return;
    }

    const isSongChange = prevSongUrlRef.current !== currentSong.audioUrl;

    if (isSongChange) {
      console.log('AudioPlayer: Song changed to', currentSong.title);
      audio.src = currentSong.audioUrl;
      audio.currentTime = 0; // Сброс времени при новой песне
      usePlayerStore.setState({ currentTime: 0, duration: 0 }); // Сброс в сторе
      prevSongUrlRef.current = currentSong.audioUrl;
    }

    if (isPlaying) {
      console.log('AudioPlayer: Attempting to play...');
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("AudioPlayer: Error playing audio:", error);
          if (error.name === 'NotAllowedError') {
            console.warn('AudioPlayer: Autoplay was prevented. User interaction required.');
            usePlayerStore.setState({ isPlaying: false });
          }
        });
      }
    } else {
      console.log('AudioPlayer: Pausing...');
      audio.pause();
    }

  }, [currentSong, isPlaying]);

  // --- EFFECT 2: Обработка событий аудиоэлемента (timeupdate, loadedmetadata, ended, error) ---
  // Этот эффект должен срабатывать только один раз, при монтировании компонента AudioPlayer.
  // Обработчики внутри него будут всегда актуальными благодаря getState().
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const currentStoreState = usePlayerStore.getState();
      const actualIsRepeat = currentStoreState.isRepeat;
      const actualCurrentSong = currentStoreState.currentSong;

      console.log('AudioPlayer: --- EVENT: Audio Ended! ---');
      console.log(`AudioPlayer: isRepeat (from store directly): ${actualIsRepeat}`);
      console.log(`AudioPlayer: Current Song (from store directly): ${actualCurrentSong ? actualCurrentSong.title : 'NULL'}`);
      console.log(`AudioPlayer: Is Playing (from store directly): ${currentStoreState.isPlaying}`);
      console.log('AudioPlayer: ---------------------------');

      if (actualIsRepeat && actualCurrentSong) {
        console.log('AudioPlayer: ACTION: Repeating track -', actualCurrentSong.title);
        audio.currentTime = 0;
        usePlayerStore.setState({ currentTime: 0 }); // Обновляем UI время через стор
        if (!currentStoreState.isPlaying) {
          console.log('AudioPlayer: Repeat: Setting isPlaying to true in store.');
          usePlayerStore.setState({ isPlaying: true });
        } else {
          console.log('AudioPlayer: Repeat: Audio already playing, attempting to re-play audio element.');
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => console.error("AudioPlayer: Error re-playing for repeat:", error));
          }
        }
      } else {
        console.log('AudioPlayer: ACTION: Attempting to play next track. (Repeat is OFF or current song is NULL)');
        currentStoreState.playNext();
      }
    };

    const handleTimeUpdate = () => {
      // Это условие предотвращает зацикливание, когда мы вручную устанавливаем currentTime
      // Мы обновляем стор ТОЛЬКО если изменение пришло от браузера, а не от нашего seek
      if (Math.abs(audio.currentTime - usePlayerStore.getState().currentTime) > 0.5) { // Небольшой допуск
         usePlayerStore.getState().setAudioCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        usePlayerStore.getState().setDuration(audio.duration);
        console.log('AudioPlayer: Loaded metadata, duration:', audio.duration);
      } else {
        usePlayerStore.getState().setDuration(0);
        console.log('AudioPlayer: Loaded metadata, duration is NaN or Infinity, setting to 0.');
      }
    };

    const handleError = (e: Event) => {
      console.error('AudioPlayer: Audio error:', e);
      usePlayerStore.setState({ isPlaying: false, currentSong: null, currentTime: 0, duration: 0 });
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);

    return () => {
      console.log('AudioPlayer: Cleaning up audio event listeners.');
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
    };
  }, []); // Пустой массив зависимостей

  // --- EFFECT 3: Синхронизация громкости ---
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume / 100;
      console.log('AudioPlayer: Volume set to:', audio.volume, 'isMuted:', isMuted);
    }
  }, [volume, isMuted]);

  // --- EFFECT 4: Синхронизация текущего времени для перемотки (Seek) ---
  useEffect(() => {
    const audio = audioRef.current;
    // Важно: избегать зацикливания. Обновляем audio.currentTime только если
    // разница между UI временем и реальным временем аудио заметна.
    // Это предотвращает бесконечные обновления из-за timeupdate события.
    if (audio && Math.abs(audio.currentTime - currentTime) > 0.5) { // Допуск 0.5 секунды
        console.log(`AudioPlayer: Seeking to ${currentTime}`);
        audio.currentTime = currentTime;
    }
  }, [currentTime]); // Реагируем на изменение currentTime из стора

  return <audio ref={audioRef} />;
};

export default AudioPlayer; 