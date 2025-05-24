import { create } from 'zustand';
import { Song } from '@/types';
import { useChatStore } from './useChatStore';

// Функция для перемешивания массива (алгоритм Фишера-Йетса)
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]; // Создаем копию, чтобы не изменять оригинал
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Обмен элементов
  }
  return shuffled;
};

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  isRepeat: boolean;
  isShuffling: boolean;
  queue: Song[]; // Текущая активная очередь (может быть оригинальной или перемешанной)
  originalQueue: Song[]; // Оригинальная очередь
  shuffledQueue: Song[]; // Перемешанная очередь
  currentIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  previousVolume: number;

  setAudioCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;

  initializeQueue: (songs: Song[]) => void;
  playAlbum: (songs: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  isRepeat: false,
  isShuffling: false,
  queue: [],
  originalQueue: [],
  shuffledQueue: [],
  currentIndex: -1,
  currentTime: 0,
  duration: 0,
  volume: 75,
  isMuted: false,
  previousVolume: 75,

  setAudioCurrentTime: (time: number) => set({ currentTime: time }),
  setDuration: (dur: number) => set({ duration: dur }),
  setVolume: (vol: number) => {
    const newVolume = Math.max(0, Math.min(100, vol));
    set((state) => ({
      volume: newVolume,
      isMuted: newVolume === 0,
      previousVolume: newVolume > 0 ? newVolume : state.previousVolume
    }));
  },
  toggleMute: () => set((state) => {
    if (state.isMuted) {
      return { isMuted: false, volume: state.previousVolume > 0 ? state.previousVolume : 75 };
    } else {
      return { isMuted: true, previousVolume: state.volume, volume: 0 };
    }
  }),

  initializeQueue: (songs: Song[]) => {
    const originalQueue = songs;
    const shuffledQueue = shuffleArray(songs);
    const { isShuffling, currentSong, currentIndex } = get();

    // Определяем текущую активную очередь
    const activeQueue = isShuffling ? shuffledQueue : originalQueue;

    // Определяем, какая песня должна быть текущей
    let newCurrentSong = currentSong;
    let newIndex = currentIndex;

    if (!newCurrentSong && activeQueue.length > 0) {
      // Если нет текущей песни, и очередь не пуста, берем первую
      newCurrentSong = activeQueue[0];
      newIndex = 0;
    } else if (newCurrentSong) {
      // Если есть текущая песня, находим её индекс в новой активной очереди
      const foundIndex = activeQueue.findIndex(s => s._id === newCurrentSong!._id);
      if (foundIndex !== -1) {
        newIndex = foundIndex;
      } else {
        // Если текущая песня не найдена в новой очереди (редкий случай),
        // можно сбросить или выбрать первую
        newIndex = 0;
        newCurrentSong = activeQueue[0] || null;
      }
    } else {
      // Очередь пуста
      newIndex = -1;
      newCurrentSong = null;
    }


    set({
      originalQueue: originalQueue,
      shuffledQueue: shuffledQueue,
      queue: activeQueue,
      currentSong: newCurrentSong,
      currentIndex: newIndex,
    });
  },

  playAlbum: (songs: Song[], startIndex = 0) => {
    if (songs.length === 0) {
      set({
        queue: [], originalQueue: [], shuffledQueue: [],
        currentSong: null, currentIndex: -1, isPlaying: false,
        currentTime: 0, duration: 0
      });
      return;
    }

    const originalQueue = songs;
    const shuffledQueue = shuffleArray(songs);
    const isShuffling = get().isShuffling;
    const activeQueue = isShuffling ? shuffledQueue : originalQueue;

    // Найдем индекс стартовой песни в активной очереди
    const songToPlay = originalQueue[startIndex];
    // Find songToPlay in the activeQueue. If it's not found (e.g., in shuffle mode
    // and the song is not in the shuffled array, which shouldn't happen but defensive),
    // default to the first song in the activeQueue.
    const newIndex = activeQueue.findIndex(s => s._id === songToPlay._id);
    const finalIndex = newIndex !== -1 ? newIndex : 0; // На случай если песня не нашлась

    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit('update_activity', {
        userId: socket.auth.userId,
        activity: `Playing ${songToPlay.title} by ${songToPlay.artist}`,
      });
    }
    set({
      originalQueue: originalQueue,
      shuffledQueue: shuffledQueue,
      queue: activeQueue,
      currentSong: activeQueue[finalIndex], // Играем песню из активной очереди
      currentIndex: finalIndex,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    });
  },

  setCurrentSong: (song: Song | null) => {
    if (!song) {
      set({ isPlaying: false, currentSong: null, currentIndex: -1, currentTime: 0, duration: 0 });
      return;
    }

    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit('update_activity', {
        userId: socket.auth.userId,
        activity: `Playing ${song.title} by ${song.artist}`,
      });
    }

    const { originalQueue, shuffledQueue, isShuffling } = get();
    const activeQueue = isShuffling ? shuffledQueue : originalQueue;
    // Ищем песню по ID в активной очереди.
    const songIndex = activeQueue.findIndex((s) => s._id === song._id);
    const newIndex = songIndex !== -1 ? songIndex : 0; // Если не нашли, по умолчанию первая

    set({
      currentSong: activeQueue[newIndex],
      isPlaying: true,
      currentIndex: newIndex,
      currentTime: 0,
      duration: 0,
    });
  },

  togglePlay: () => {
    const willStartPlaying = !get().isPlaying;

    const currentSong = get().currentSong;
    const socket = useChatStore.getState().socket;
    if (socket.auth) {
      socket.emit('update_activity', {
        userId: socket.auth.userId,
        activity:
          willStartPlaying && currentSong ? `Playing ${currentSong.title} by ${currentSong.artist}` : 'Idle',
      });
    }

    set({ isPlaying: willStartPlaying });
  },

  playNext: () => {
    const { currentIndex, queue, isShuffling } = get();
    const nextIndex = currentIndex + 1; // Теперь это const, так как не переназначается

    console.log('--- playNext Called ---');
    console.log('Current Index:', currentIndex);
    console.log('Is Shuffling:', isShuffling);
    console.log('Current Queue Length:', queue.length);

    if (nextIndex < queue.length) {
      const nextSong = queue[nextIndex];
      const socket = useChatStore.getState().socket;
      if (socket.auth) {
        socket.emit('update_activity', {
          userId: socket.auth.userId,
          activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
        });
      }
      set({
        currentSong: nextSong,
        currentIndex: nextIndex,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      });
      console.log('playNext: Switched to next song:', nextSong.title);
    } else {
      // Если достигнут конец текущей очереди
      if (queue.length > 0) {
        // Перезапускаем с начала активной очереди
        const firstSong = queue[0];
        const socket = useChatStore.getState().socket;
        if (socket.auth) {
          socket.emit('update_activity', {
            userId: socket.auth.userId,
            activity: `Playing ${firstSong.title} by ${firstSong.artist}`,
          });
        }
        set({
          currentSong: firstSong,
          currentIndex: 0,
          isPlaying: true, // Перезапускаем воспроизведение с первой песни
          currentTime: 0,
          duration: 0,
        });
        console.log('playNext: Reached end of queue, restarting from first song:', firstSong.title);
      } else {
        // Очередь пуста
        set({ isPlaying: false, currentTime: 0, duration: 0, currentSong: null, currentIndex: -1 });
        console.log('playNext: No songs in queue, setting isPlaying to false.');
        const socket = useChatStore.getState().socket;
        if (socket.auth) {
          socket.emit('update_activity', {
            userId: socket.auth.userId,
            activity: 'Idle',
          });
        }
      }
    }
    console.log('-----------------------');
  },

  playPrevious: () => {
    const { currentIndex, queue } = get();
    const prevIndex = currentIndex - 1; // Теперь это const

    console.log('--- playPrevious Called ---');
    console.log('Current Index:', currentIndex);

    if (prevIndex >= 0) {
      const prevSong = queue[prevIndex];
      const socket = useChatStore.getState().socket;
      if (socket.auth) {
        socket.emit('update_activity', {
          userId: socket.auth.userId,
          activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
        });
      }
      set({
        currentSong: prevSong,
        currentIndex: prevIndex,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      });
      console.log('playPrevious: Switched to previous song:', prevSong.title);
    } else {
      // Если достигнуто начало очереди
      if (queue.length > 0) {
        // Переходим на последнюю песню активной очереди
        const lastSong = queue[queue.length - 1];
        const socket = useChatStore.getState().socket;
        if (socket.auth) {
          socket.emit('update_activity', {
            userId: socket.auth.userId,
            activity: `Playing ${lastSong.title} by ${lastSong.artist}`,
          });
        }
        set({
          currentSong: lastSong,
          currentIndex: queue.length - 1,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
        });
        console.log('playPrevious: Reached start of queue, restarting from last song:', lastSong.title);
      } else {
        // Очередь пуста
        set({ isPlaying: false, currentTime: 0, duration: 0, currentSong: null, currentIndex: -1 });
        console.log('playPrevious: No songs in queue, setting isPlaying to false.');
        const socket = useChatStore.getState().socket;
        if (socket.auth) {
          socket.emit('update_activity', {
            userId: socket.auth.userId,
            activity: 'Idle',
          });
        }
      }
    }
    console.log('---------------------------');
  },

  toggleRepeat: () => {
    const newRepeatState = !get().isRepeat;
    set({ isRepeat: newRepeatState });
    const currentSong = get().currentSong;
    const socket = useChatStore.getState().socket;
    if (socket.auth && currentSong) {
      socket.emit('update_activity', {
        userId: socket.auth.userId,
        activity: `Playing ${currentSong.title} by ${currentSong.artist}${newRepeatState ? ' (Repeat On)' : ''}`,
      });
    }
  },

  toggleShuffle: () => {
    set((state) => {
      const newIsShuffling = !state.isShuffling;
      let newQueue: Song[];
      let newIndex: number;
      let newCurrentSong: Song | null = state.currentSong;

      if (newIsShuffling) {
        // Включаем перемешивание
        const shuffled = shuffleArray(state.originalQueue);
        newQueue = shuffled;
        // Находим текущую песню в новой перемешанной очереди
        newIndex = newCurrentSong ? newQueue.findIndex(s => s._id === newCurrentSong!._id) : -1;
        if (newIndex === -1 && newQueue.length > 0) {
          newIndex = 0;
          newCurrentSong = newQueue[newIndex];
        } else if (newQueue.length === 0) {
            newIndex = -1;
            newCurrentSong = null;
        }

        console.log('Shuffle ON. New shuffled queue:', newQueue.map(s => s.title));
      } else {
        // Выключаем перемешивание
        newQueue = state.originalQueue;
        // Находим текущую песню в оригинальной очереди
        newIndex = newCurrentSong ? newQueue.findIndex(s => s._id === newCurrentSong!._id) : -1;
        if (newIndex === -1 && newQueue.length > 0) {
          newIndex = 0;
          newCurrentSong = newQueue[newIndex];
        } else if (newQueue.length === 0) {
            newIndex = -1;
            newCurrentSong = null;
        }
        console.log('Shuffle OFF. Restored original queue:', newQueue.map(s => s.title));
      }

      // Обновить активность
      const socket = useChatStore.getState().socket;
      if (socket.auth && newCurrentSong) { // Проверка на null для newCurrentSong
        socket.emit('update_activity', {
          userId: socket.auth.userId,
          activity: `Playing ${newCurrentSong.title} by ${newCurrentSong.artist}${newIsShuffling ? ' (Shuffle On)' : ''}`,
        });
      }

      return {
        isShuffling: newIsShuffling,
        queue: newQueue,
        currentIndex: newIndex,
        currentSong: newCurrentSong,
        isPlaying: state.isPlaying && !!newCurrentSong // Остаемся в состоянии воспроизведения, если была песня
      };
    });
  },
}));