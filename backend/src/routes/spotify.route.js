// src/routes/spotify.route.js
import { Router } from 'express';
import spotifyController from '../controller/spotify.controller.js';

const router = Router();

// Поиск контента
router.get('/search/tracks', spotifyController.searchTracks);
router.get('/search/albums', spotifyController.searchAlbums);

// Получение информации о контенте
router.get('/track/:id', spotifyController.getTrack);
router.get('/album/:id', spotifyController.getAlbumWithTracks);
router.get('/artist/:id/top-tracks', spotifyController.getArtistTopTracks);

// Авторизация пользователя
router.get('/auth/init', spotifyController.initiateAuth);
router.get('/auth/callback', spotifyController.handleAuthCallback);

// Пользовательские данные (требуют авторизации)
router.get('/me', spotifyController.getCurrentUser);
router.get('/me/tracks', spotifyController.getUserSavedTracks);

// Импорт и синхронизация
router.post('/import/track', spotifyController.importTrack);
router.post('/sync/playlist', spotifyController.syncPlaylist);


router.get('/new-releases', spotifyController.getNewReleases);
export default router; 