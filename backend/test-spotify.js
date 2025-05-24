// test-spotify.js - Файл для проверки настройки
import dotenv from 'dotenv';
dotenv.config();

async function testSpotifyConnection() {
  console.log('🎵 Testing Spotify API connection...\n');

  // Проверяем переменные окружения
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  console.log('📋 Environment Variables:');
  console.log(`Client ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
  console.log(`Client Secret: ${clientSecret ? '✅ Set' : '❌ Missing'}`);
  console.log(`Redirect URI: ${redirectUri || '❌ Missing'}\n`);

  if (!clientId || !clientSecret) {
    console.log('❌ Missing required environment variables!');
    console.log('Please check your .env.local file');
    return;
  }

  // Тестируем получение токена
  try {
    console.log('🔑 Getting access token...');
    
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const tokenData = await response.json();
    console.log('✅ Access token received successfully!');
    console.log(`Token type: ${tokenData.token_type}`);
    console.log(`Expires in: ${tokenData.expires_in} seconds\n`);

    // Тестируем API запрос
    console.log('🔍 Testing search API...');
    
    const searchResponse = await fetch('https://api.spotify.com/v1/search?q=test&type=track&limit=1', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const track = searchData.tracks.items[0];
    
    if (track) {
      console.log('✅ Search API working!');
      console.log(`Found track: "${track.name}" by ${track.artists[0].name}`);
    } else {
      console.log('⚠️ Search API working but no results found');
    }

    console.log('\n🎉 Spotify integration is ready to use!');
    
  } catch (error) {
    console.log('❌ Error testing Spotify API:');
    console.log(error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Possible solutions:');
      console.log('- Check if Client ID and Client Secret are correct');
      console.log('- Make sure there are no extra spaces in .env.local');
      console.log('- Verify your app is not in development mode restrictions');
    }
  }
}

// Запускаем тест
testSpotifyConnection().catch(console.error);