// src/controller/spotify.controller.js
import spotifyService from '../lib/spotify.js';

class SpotifyController {
  // Поиск треков в Spotify
  async searchTracks(req, res) {
    try {
      const { query, limit = 20, offset = 0 } = req.query;
      
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query is required' 
        });
      }

      const results = await spotifyService.searchTracks(query, parseInt(limit), parseInt(offset));
      
      // Конвертируем результаты в формат нашего приложения
      const convertedTracks = results.items.map(track => 
        spotifyService.convertSpotifyTrack(track)
      );

      res.json({
        success: true,
        data: {
          tracks: convertedTracks,
          total: results.total,
          limit: results.limit,
          offset: results.offset
        }
      });
    } catch (error) {
      console.error('Error searching tracks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search tracks',
        error: error.message
      });
    }
  }

  // Поиск альбомов в Spotify
  async searchAlbums(req, res) {
    try {
      const { query, limit = 20, offset = 0 } = req.query;
      
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query is required' 
        });
      }

      const results = await spotifyService.searchAlbums(query, parseInt(limit), parseInt(offset));
      
      const convertedAlbums = results.items.map(album => 
        spotifyService.convertSpotifyAlbum(album)
      );

      res.json({
        success: true,
        data: {
          albums: convertedAlbums,
          total: results.total,
          limit: results.limit,
          offset: results.offset
        }
      });
    } catch (error) {
      console.error('Error searching albums:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search albums',
        error: error.message
      });
    }
  }

  // Получить информацию о треке
  async getTrack(req, res) {
    try {
      const { id } = req.params;
      
      const track = await spotifyService.getTrack(id);
      const convertedTrack = spotifyService.convertSpotifyTrack(track);

      res.json({
        success: true,
        data: convertedTrack
      });
    } catch (error) {
      console.error('Error getting track:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get track',
        error: error.message
      });
    }
  }

  // Получить информацию об альбоме с треками
  async getAlbumWithTracks(req, res) {
    try {
      const { id } = req.params;
      
      const [album, tracks] = await Promise.all([
        spotifyService.getAlbum(id),
        spotifyService.getAlbumTracks(id)
      ]);

      const convertedAlbum = spotifyService.convertSpotifyAlbum(album);
      const convertedTracks = tracks.items.map(track => ({
        ...spotifyService.convertSpotifyTrack({
          ...track,
          album: album // добавляем информацию об альбоме для треков
        }),
        track_number: track.track_number
      }));

      res.json({
        success: true,
        data: {
          album: convertedAlbum,
          tracks: convertedTracks
        }
      });
    } catch (error) {
      console.error('Error getting album with tracks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get album',
        error: error.message
      });
    }
  }

  // Получить топ-треки исполнителя
  async getArtistTopTracks(req, res) {
    try {
      const { id } = req.params;
      const { country = 'US' } = req.query;
      
      const data = await spotifyService.getArtistTopTracks(id, country);
      const convertedTracks = data.tracks.map(track => 
        spotifyService.convertSpotifyTrack(track)
      );

      res.json({
        success: true,
        data: convertedTracks
      });
    } catch (error) {
      console.error('Error getting artist top tracks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get artist top tracks',
        error: error.message
      });
    }
  }

  // Начать процесс авторизации пользователя
  async initiateAuth(req, res) {
    try {
      const authUrl = spotifyService.getAuthUrl();
      
      res.json({
        success: true,
        data: {
          auth_url: authUrl
        }
      });
    } catch (error) {
      console.error('Error initiating auth:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate authentication',
        error: error.message
      });
    }
  }

  // Обработка колбэка после авторизации
  async handleAuthCallback(req, res) {
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Authorization failed',
          error: error
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code is required'
        });
      }

      const tokens = await spotifyService.exchangeCodeForTokens(code);
      
      // В реальном приложении здесь нужно сохранить токены в базе данных
      // связанные с пользователем
      
      res.json({
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in
        }
      });
    } catch (error) {
      console.error('Error handling auth callback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to handle authentication callback',
        error: error.message
      });
    }
  }

  // Получить профиль текущего пользователя (требует авторизации)
  async getCurrentUser(req, res) {
    try {
      // Здесь нужно получить токен пользователя из базы данных или сессии
      const userProfile = await spotifyService.getCurrentUser();

      res.json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        error: error.message
      });
    }
  }

  // Получить сохраненные треки пользователя
  async getUserSavedTracks(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const data = await spotifyService.getUserSavedTracks(parseInt(limit), parseInt(offset));
      const convertedTracks = data.items.map(item => ({
        ...spotifyService.convertSpotifyTrack(item.track),
        added_at: item.added_at
      }));

      res.json({
        success: true,
        data: {
          tracks: convertedTracks,
          total: data.total,
          limit: data.limit,
          offset: data.offset
        }
      });
    } catch (error) {
      console.error('Error getting user saved tracks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get saved tracks',
        error: error.message
      });
    }
  }

  // Импорт трека в локальную базу данных
  async importTrack(req, res) {
    try {
      const { spotify_id } = req.body;
      
      if (!spotify_id) {
        return res.status(400).json({
          success: false,
          message: 'Spotify track ID is required'
        });
      }

      // Получаем данные трека из Spotify
      const spotifyTrack = await spotifyService.getTrack(spotify_id);
      const convertedTrack = spotifyService.convertSpotifyTrack(spotifyTrack);

      // Здесь нужно сохранить трек в вашу локальную базу данных
      // Используйте ваш существующий Song model
      // Пример:
      // const Song = require('../models/song.model.js');
      // const newSong = new Song({
      //   ...convertedTrack,
      //   spotify_id: spotify_id
      // });
      // await newSong.save();

      res.json({
        success: true,
        message: 'Track imported successfully',
        data: convertedTrack
      });
    } catch (error) {
      console.error('Error importing track:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import track',
        error: error.message
      });
    }
  }
  
  async getNewReleases(req, res) {
    try {
      const { limit = 20, offset = 0, country = 'US' } = req.query;
      const results = await spotifyService.getNewReleases(parseInt(limit), parseInt(offset), country);
      
      // Конвертируем альбомы в формат нашего приложения
      const convertedAlbums = results.items.map(album => 
        spotifyService.convertSpotifyAlbum(album)
      );

      res.json({
        success: true,
        data: {
          albums: convertedAlbums,
          total: results.total,
          limit: results.limit,
          offset: results.offset
        }
      });
    } catch (error) {
      console.error('Error getting new releases:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get new releases',
        error: error.message
      });
    }
  }
  // Синхронизация плейлиста с Spotify
  async syncPlaylist(req, res) {
    try {
      const { spotify_playlist_id, local_playlist_id } = req.body;
      
      if (!spotify_playlist_id) {
        return res.status(400).json({
          success: false,
          message: 'Spotify playlist ID is required'
        });
      }

      // Получаем треки плейлиста из Spotify
      const playlistTracks = await spotifyService.getPlaylistTracks(spotify_playlist_id);
      const convertedTracks = playlistTracks.items
        .filter(item => item.track && item.track.id) // фильтруем валидные треки
        .map(item => ({
          ...spotifyService.convertSpotifyTrack(item.track),
          added_at: item.added_at
        }));

      // Здесь нужно обновить локальный плейлист
      // Логика зависит от структуры вашей базы данных

      res.json({
        success: true,
        message: 'Playlist synchronized successfully',
        data: {
          synced_tracks: convertedTracks.length,
          tracks: convertedTracks
        }
      });
    } catch (error) {
      console.error('Error syncing playlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync playlist',
        error: error.message
      });
    }
  }
}

const spotifyController = new SpotifyController();
export default spotifyController;  