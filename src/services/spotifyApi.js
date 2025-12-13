import { getAccessToken } from './auth';

const BASE_URL = 'https://api.spotify.com/v1';

const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = getAccessToken();
    if (!token) throw new Error("No token");

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const config = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
        if (response.status === 401) {
            // Handle token expiry if needed, or propagate error
            // window.location.href = '/login'; // Or let the caller handle it
        }
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
}

export const getClassUserProfile = () => apiCall('/me');
export const getUserPlaylists = () => apiCall('/me/playlists');
export const getPlaylistTracks = (playlistId) => apiCall(`/playlists/${playlistId}/tracks`);
export const searchTracks = (query) => apiCall(`/search?q=${encodeURIComponent(query)}&type=track&limit=20`);
export const playTrack = async (deviceId, contextUri, offset = 0) => {
    // This requires PUT
    const token = getAccessToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // contextUri can be an album/playlist URI, or we can pass use uris: [trackUri]
    const body = {};
    if (contextUri.includes('track')) {
        body.uris = [contextUri];
    } else {
        body.context_uri = contextUri;
        if (offset) body.offset = { position: offset };
    }

    await fetch(`${BASE_URL}/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });
};

export const pauseTrack = async (deviceId) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const nextTrack = async (deviceId) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/me/player/next?device_id=${deviceId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const prevTrack = async (deviceId) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/me/player/previous?device_id=${deviceId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const setShuffle = async (state, deviceId) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/me/player/shuffle?state=${state}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}
