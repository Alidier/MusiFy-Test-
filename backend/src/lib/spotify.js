// src/lib/spotify.js
class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    this.baseUrl = 'https://api.spotify.com/v1';
    this.authUrl = 'https://accounts.spotify.com/api/token';
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Получение токена для Client Credentials Flow (для поиска без авторизации пользователя)
  async getClientCredentialsToken() {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      return data.access_token;
    } catch (error) {
      console.error('Error getting Spotify token:', error);
      throw error;
    }
  }

  // URL для авторизации пользователя (Authorization Code Flow)
  getAuthUrl() {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-top-read'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      state: Math.random().toString(36).substring(7)
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Обмен кода авторизации на токены
  async exchangeCodeForTokens(code) {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri
        })
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      return data;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  // Обновление токена доступа
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        })
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }
      return data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Универсальный метод для API запросов
  async makeRequest(endpoint, options = {}) {
    if (!this.accessToken) {
      await this.getClientCredentialsToken();
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.status === 401) {
        // Токен истек, попробуем обновить
        await this.refreshAccessToken();
        return this.makeRequest(endpoint, options);
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Spotify API request failed:', error);
      throw error;
    }
  }

  // Поиск треков
  async searchTracks(query, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      offset: offset.toString()
    });

    const data = await this.makeRequest(`/search?${params.toString()}`);
    return data.tracks;
  }

  // Поиск альбомов
  async searchAlbums(query, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      q: query,
      type: 'album',
      limit: limit.toString(),
      offset: offset.toString()
    });

    const data = await this.makeRequest(`/search?${params.toString()}`);
    return data.albums;
  }

  // Поиск исполнителей
  async searchArtists(query, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      q: query,
      type: 'artist',
      limit: limit.toString(),
      offset: offset.toString()
    });

    const data = await this.makeRequest(`/search?${params.toString()}`);
    return data.artists;
  }

  // Получение информации о треке
  async getTrack(trackId) {
    return await this.makeRequest(`/tracks/${trackId}`);
  }

  // Получение информации об альбоме
  async getAlbum(albumId) {
    return await this.makeRequest(`/albums/${albumId}`);
  }

  // Получение информации об исполнителе
  async getArtist(artistId) {
    return await this.makeRequest(`/artists/${artistId}`);
  }

  // Получение топ-треков исполнителя
  async getArtistTopTracks(artistId, country = 'US') {
    return await this.makeRequest(`/artists/${artistId}/top-tracks?country=${country}`);
  }

  // Получение альбомов исполнителя
  async getArtistAlbums(artistId, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    return await this.makeRequest(`/artists/${artistId}/albums?${params.toString()}`);
  }

  // Получение треков альбома
  async getAlbumTracks(albumId, limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    return await this.makeRequest(`/albums/${albumId}/tracks?${params.toString()}`);
  }

  // Получение плейлистов пользователя (требует авторизации)
  async getUserPlaylists(userId, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    return await this.makeRequest(`/users/${userId}/playlists?${params.toString()}`);
  }

  // Получение треков плейлиста
  async getPlaylistTracks(playlistId, limit = 100, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    return await this.makeRequest(`/playlists/${playlistId}/tracks?${params.toString()}`);
  }

  // Получение профиля текущего пользователя (требует авторизации)
  async getCurrentUser() {
    return await this.makeRequest('/me');
  }

  // Получение сохраненных треков пользователя (требует авторизации)
  async getUserSavedTracks(limit = 20, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    return await this.makeRequest(`/me/tracks?${params.toString()}`);
  }

  // Получение топ-треков пользователя (требует авторизации)
  async getUserTopTracks(timeRange = 'medium_term', limit = 20, offset = 0) {
    const params = new URLSearchParams({
      time_range: timeRange, // short_term, medium_term, long_term
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    return await this.makeRequest(`/me/top/tracks?${params.toString()}`);
  }

  // Конвертация данных Spotify в формат вашего приложения
  convertSpotifyTrack(spotifyTrack) {
    return {
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      artist: spotifyTrack.artists.map(artist => artist.name).join(', '),
      album: spotifyTrack.album.name,
      duration: Math.floor(spotifyTrack.duration_ms / 1000),
      preview_url: spotifyTrack.preview_url,
      external_urls: spotifyTrack.external_urls,
      image: spotifyTrack.album.images[0]?.url,
      spotify_id: spotifyTrack.id,
      popularity: spotifyTrack.popularity
    };
  }
 // Add this method to your SpotifyService class
async getNewReleases(limit = 20, offset = 0, country = 'US') { // Added country parameter
  const params = new URLSearchParams({
    country: country, // Country is often a required or useful parameter
    limit: limit.toString(),
    offset: offset.toString()
  });

  // Ensure this.makeRequest handles token acquisition correctly
  const data = await this.makeRequest(`/browse/new-releases?${params.toString()}`);
  return data.albums; // New releases endpoint returns an object containing an 'albums' property
}
  convertSpotifyAlbum(spotifyAlbum) {
    return {
      id: spotifyAlbum.id,
      name: spotifyAlbum.name,
      artist: spotifyAlbum.artists.map(artist => artist.name).join(', '),
      release_date: spotifyAlbum.release_date,
      total_tracks: spotifyAlbum.total_tracks,
      external_urls: spotifyAlbum.external_urls,
      image: spotifyAlbum.images[0]?.url,
      spotify_id: spotifyAlbum.id
    };
  }
}

// Экспорт единственного экземпляра
const spotifyService = new SpotifyService();
export default spotifyService;