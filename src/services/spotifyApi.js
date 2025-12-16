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
    if (Array.isArray(contextUri)) {
        body.uris = contextUri;
        // Support offset for URI arrays too
        if (offset || offset === 0) {
            body.offset = { position: offset };
        }
    } else if (contextUri && contextUri.includes('track')) {
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

export const setRepeat = async (state, deviceId) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/me/player/repeat?state=${state}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const removeTrackFromPlaylist = async (playlistId, trackUri) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/playlists/${playlistId}/tracks`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tracks: [{ uri: trackUri }]
        })
    });
}

export const addTrackToPlaylist = async (playlistId, trackUri) => {
    const token = getAccessToken();
    const response = await fetch(`${BASE_URL}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uris: [trackUri]
        })
    });
    if (!response.ok) {
        throw new Error(`Failed to add track: ${response.status} ${response.statusText}`);
    }
}
export const checkUserSavedTracks = async (trackIds) => {
    // Spotify allows max 50 IDs per request for checking
    const token = getAccessToken();
    // Helper to chunk array
    const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );

    const chunks = chunk(trackIds, 50);
    const results = [];

    for (const c of chunks) {
        const ids = c.join(',');
        const data = await apiCall(`/me/tracks/contains?ids=${ids}`);
        results.push(...data);
    }
    return results;
}

export const saveTracks = async (trackIds) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/me/tracks?ids=${trackIds.join(',')}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const removeSavedTracks = async (trackIds) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/me/tracks?ids=${trackIds.join(',')}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const getUserSavedTracks = (limit = 50, offset = 0) => apiCall(`/me/tracks?limit=${limit}&offset=${offset}`);

export const getUserTopItems = (type = 'artists', time_range = 'medium_term', limit = 20) => {
    return apiCall(`/me/top/${type}?time_range=${time_range}&limit=${limit}`);
};

export const getAvailableDevices = () => apiCall('/me/player/devices');

export const transferPlayback = async (deviceId, play = false) => {
    const token = getAccessToken();
    await fetch(`${BASE_URL}/me/player`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            device_ids: [deviceId],
            play: play
        })
    });
};
