export interface Song {
	_id: string;
	title: string;
	artist: string;
	albumId: string | null;
	imageUrl: string;
	audioUrl: string;
	duration: number;
	createdAt: string;
	updatedAt: string;
}

export interface Album {
	_id: string;
	title: string;
	artist: string;
	imageUrl: string;
	releaseYear: number;
	songs: Song[];
}

export interface Stats {
	totalSongs: number;
	totalAlbums: number;
	totalUsers: number;
	totalArtists: number;
}

export interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	_id: string;
	clerkId: string;
	fullName: string;
	imageUrl: string;
}



export interface SpotifyAlbumData {
  id: string; // Spotify ID
  name: string;
  artist: string; // Имена артистов, объединенные через запятую
  release_date: string;
  total_tracks: number;
  external_urls: { spotify: string };
  image?: string;
  spotify_id: string; 
}


export interface SpotifyTrackData {
  id: string; // Spotify ID
  name: string;
  artist: string; // Имена артистов
  album: string; // Название альбома
  duration: number; // в секундах
  preview_url?: string;
  external_urls: { spotify: string };
  image?: string; // Обложка альбома
  spotify_id: string; // Spotify ID
  popularity?: number;
  // added_at?: string; // Если из плейлиста или сохраненных треков
}