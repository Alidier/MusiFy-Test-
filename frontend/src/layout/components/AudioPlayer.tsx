// frontend/src/layout/components/AudioPlayer.tsx
import { usePlayerStore } from "@/stores/usePlayerStore"; //
import { useEffect, useRef } from "react";
import { Song } from "@/types"; // Убедитесь, что Song импортирован

const AudioPlayer = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const {
        currentSong,
        isPlaying,
        volume,
        isMuted,
        isRepeat,
        currentTime, // Получаем currentTime для установки в <audio>
        setAudioCurrentTime,
        setDuration,
        playNext,
        // Убедитесь, что все необходимые функции из стора здесь перечислены,
        // если они используются для управления <audio> элементом напрямую
    } = usePlayerStore();

    // Эффект для управления источником аудио, воспроизведением/паузой
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (currentSong) {
            if (audio.src !== currentSong.audioUrl) {
                console.log(`AudioPlayer: Song changed to ${currentSong.title}, URL: ${currentSong.audioUrl}`);
                audio.src = currentSong.audioUrl;
                // Сбрасываем currentTime и duration в сторе при смене трека,
                // они будут обновлены из событий 'loadedmetadata' и 'timeupdate'
                setAudioCurrentTime(0); // Сброс currentTime в сторе
                setDuration(0);       // Сброс duration в сторе
                audio.load(); // Важно для применения нового src
            }

            if (isPlaying) {
                audio.play().catch(error => console.error("Error playing audio:", error));
            } else {
                audio.pause();
            }
        } else {
            // Если нет currentSong, останавливаем и сбрасываем
            audio.pause();
            audio.src = ""; // Очищаем src
            setAudioCurrentTime(0);
            setDuration(0);
        }
    }, [currentSong, isPlaying, setAudioCurrentTime, setDuration]); // Зависимости

    // Эффект для управления громкостью и Mute
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
            audioRef.current.muted = isMuted;
            // console.log(`AudioPlayer: Volume set to: ${volume / 100} isMuted: ${isMuted}`); // Этот лог был в вашем PlaybackControls
        }
    }, [volume, isMuted]);

    // Эффект для управления режимом Повтора (loop)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.loop = isRepeat;
        }
    }, [isRepeat]);

    // Эффект для установки currentTime в <audio> элементе, если он меняется извне (например, клик по слайдеру)
    // Этот эффект нужен, если currentTime в сторе может быть изменен не только событием timeupdate самого плеера.
    useEffect(() => {
        const audio = audioRef.current;
        if (audio && Math.abs(audio.currentTime - currentTime) > 0.5) { // Условие для предотвращения цикла обновлений
            console.log(`AudioPlayer: Seeking audio to ${currentTime}`);
            audio.currentTime = currentTime;
        }
    }, [currentTime]); // Зависит только от currentTime из стора

    // Эффект для подписки на события HTMLAudioElement
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            // Обновляем currentTime в сторе только если разница значительна,
            // чтобы избежать слишком частых обновлений, если currentTime уже обновлялся извне.
            // Однако, обычно setAudioCurrentTime(audio.currentTime) здесь является основным источником обновления currentTime.
            if (Math.abs(usePlayerStore.getState().currentTime - audio.currentTime) > 0.1) {
                 setAudioCurrentTime(audio.currentTime);
            }
        };

        const handleLoadedMetadata = () => {
            if (isFinite(audio.duration)) {
                setDuration(audio.duration);
                console.log(`AudioPlayer: Loaded metadata, duration: ${audio.duration}`);
            } else {
                console.warn(`AudioPlayer: Loaded metadata, but duration is not finite: ${audio.duration}`);
                // Используем длительность из объекта Song, если она есть и валидна
                const songDurationFromData = usePlayerStore.getState().currentSong?.duration;
                if (songDurationFromData && isFinite(songDurationFromData)) {
                    setDuration(songDurationFromData);
                     console.log(`AudioPlayer: Using duration from song data: ${songDurationFromData}`);
                } else {
                    setDuration(0); // Или другое значение по умолчанию
                }
            }
        };

        const handleEnded = () => {
            console.log("AudioPlayer: Song ended.");
            // Если не включен режим повтора, переключаем на следующий трек
            if (!audio.loop) { // audio.loop будет true, если isRepeat true
                 playNext();
            }
            // Если audio.loop = true (isRepeat = true), трек начнется заново автоматически
        };

        const handleCanPlay = () => {
            console.log("AudioPlayer: Can play through.");
            // Попытка воспроизведения, если isPlaying=true и трек был на паузе из-за буферизации
            if (usePlayerStore.getState().isPlaying && audio.paused) {
                audio.play().catch(error => console.error("Error in canplay auto-play:", error));
            }
        };

        const handleError = (e: Event) => {
            console.error("AudioPlayer: Error encountered with audio element", audio.error, e);
            // TODO: Возможно, обработка ошибки (например, сообщение пользователю, пропуск трека)
        };

        const handlePlay = () => {
            console.log("AudioPlayer: Play event triggered");
            if (!usePlayerStore.getState().isPlaying) {
                // Синхронизируем состояние, если воспроизведение началось из-за внешнего события (например, autoplay)
                // usePlayerStore.getState().togglePlay(); // Это может вызвать цикл, если togglePlay меняет isPlaying
            }
        };

        const handlePause = () => {
            console.log("AudioPlayer: Pause event triggered");
            if (usePlayerStore.getState().isPlaying && !audio.ended) { // Не меняем isPlaying, если это конец трека (handleEnded сработает)
                // Синхронизируем состояние, если пауза вызвана извне
                // usePlayerStore.getState().togglePlay(); // Это может вызвать цикл
            }
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("canplaythrough", handleCanPlay);
        audio.addEventListener("error", handleError);
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);

        return () => {
            console.log("AudioPlayer: Cleaning up audio event listeners.");
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("canplaythrough", handleCanPlay);
            audio.removeEventListener("error", handleError);
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
        };
        // Зависимости этого useEffect должны включать функции, которые он вызывает из стора,
        // чтобы реагировать на их изменение, если они не стабильны.
        // Однако, setAudioCurrentTime, setDuration, playNext обычно стабильны из Zustand.
        // currentSong здесь нужен, чтобы перенавесить слушатели, если сам audio объект пересоздается
        // (хотя в данном коде audioRef.current должен быть стабильным).
        // Основная цель - навесить слушатели один раз.
    }, [setAudioCurrentTime, setDuration, playNext]); // Достаточно этих зависимостей для установки слушателей

    return <audio ref={audioRef} className="hidden" preload="metadata" />;
};

export default AudioPlayer;