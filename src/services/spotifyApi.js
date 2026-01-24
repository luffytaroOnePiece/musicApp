import { getValidToken, refreshToken } from './auth';

const BASE_URL = 'https://api.spotify.com/v1';

const apiCall = async (endpoint, method = 'GET', body = null) => {
    let token = await getValidToken();
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

    let response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 3000;
        console.warn(`Rate limited. Waiting ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return apiCall(endpoint, method, body);
    }

    if (response.status === 401) {
        console.log('Received 401, trying to refresh token...');
        const newToken = await refreshToken();
        if (newToken) {
            // Retry with new token
            config.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(`${BASE_URL}${endpoint}`, config);

            // Re-check for 429 after 401 retry, just in case
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 3000;
                console.warn(`Rate limited after refresh. Waiting ${waitTime}ms before retrying...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return apiCall(endpoint, method, body);
            }

        } else {
            throw new Error('Session expired. Please login again.');
        }
    }

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Some endpoints returning 204 No Content will throw on .json()
    if (response.status === 204) return null;

    // Check if there is content to parse
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) === 0) return null;

    try {
        return await response.json();
    } catch (e) {
        // If json parsing fails although status is ok and not 204, return null or handle gracefully
        return null;
    }
}

export const getClassUserProfile = () => apiCall('/me');
export const getUserPlaylists = () => apiCall('/me/playlists');
export const getPlaylistTracks = (playlistId) => apiCall(`/playlists/${playlistId}/tracks`);

export const getAllPlaylistTracks = async (playlistId) => {
    let allTracks = [];
    let nextUrl = `/playlists/${playlistId}/tracks?limit=50`;

    while (nextUrl) {
        // Handle full URL from next or relative path
        const endpoint = nextUrl.startsWith('http') ? nextUrl.replace('https://api.spotify.com/v1', '') : nextUrl;
        const data = await apiCall(endpoint);

        if (data && data.items) {
            allTracks = [...allTracks, ...data.items];
        }

        nextUrl = data ? data.next : null;
    }
    return { items: allTracks };
};
export const searchTracks = (query) => apiCall(`/search?q=${encodeURIComponent(query)}&type=track&limit=20`);

export const playTrack = async (deviceId, contextUri, offset = 0) => {
    const body = {};
    if (Array.isArray(contextUri)) {
        body.uris = contextUri;
        if (offset || offset === 0) {
            body.offset = { position: offset };
        }
    } else if (contextUri && contextUri.includes('track')) {
        body.uris = [contextUri];
    } else {
        body.context_uri = contextUri;
        if (offset !== null && offset !== undefined) {
            if (typeof offset === 'object') {
                body.offset = offset;
            } else if (typeof offset === 'number') {
                body.offset = { position: offset };
            }
        }
    }

    const endpoint = deviceId
        ? `/me/player/play?device_id=${deviceId}`
        : `/me/player/play`;

    return apiCall(endpoint, 'PUT', body);
};

export const resumePlayback = async (deviceId) => {
    const endpoint = deviceId
        ? `/me/player/play?device_id=${deviceId}`
        : `/me/player/play`;
    return apiCall(endpoint, 'PUT');
};

export const pauseTrack = async (deviceId) => {
    const endpoint = deviceId
        ? `/me/player/pause?device_id=${deviceId}`
        : `/me/player/pause`;
    return apiCall(endpoint, 'PUT');
}

export const nextTrack = async (deviceId) => {
    const endpoint = deviceId
        ? `/me/player/next?device_id=${deviceId}`
        : `/me/player/next`;
    return apiCall(endpoint, 'POST');
}

export const prevTrack = async (deviceId) => {
    const endpoint = deviceId
        ? `/me/player/previous?device_id=${deviceId}`
        : `/me/player/previous`;
    return apiCall(endpoint, 'POST');
}

export const setShuffle = async (state, deviceId) => {
    return apiCall(`/me/player/shuffle?state=${state}&device_id=${deviceId}`, 'PUT');
}

export const setRepeat = async (state, deviceId) => {
    return apiCall(`/me/player/repeat?state=${state}&device_id=${deviceId}`, 'PUT');
}

export const seekTrack = async (positionMs, deviceId) => {
    const endpoint = deviceId
        ? `/me/player/seek?position_ms=${positionMs}&device_id=${deviceId}`
        : `/me/player/seek?position_ms=${positionMs}`;
    return apiCall(endpoint, 'PUT');
}

export const removeTrackFromPlaylist = async (playlistId, trackUri) => {
    return apiCall(`/playlists/${playlistId}/tracks`, 'DELETE', {
        tracks: [{ uri: trackUri }]
    });
}

export const addTrackToPlaylist = async (playlistId, trackUri) => {
    return apiCall(`/playlists/${playlistId}/tracks`, 'POST', {
        uris: [trackUri]
    });
}

export const addTracksToPlaylist = async (playlistId, trackUris) => {
    // Spotify allows adding max 100 tracks per request
    const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );

    const chunks = chunk(trackUris, 100);
    const results = [];

    for (const c of chunks) {
        const res = await apiCall(`/playlists/${playlistId}/tracks`, 'POST', {
            uris: c
        });
        results.push(res);
    }
    return results;
}

export const checkUserSavedTracks = async (trackIds) => {
    // Spotify allows max 50 IDs per request for checking
    const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );

    const chunks = chunk(trackIds, 50);
    const results = [];

    for (const c of chunks) {
        const ids = c.join(',');
        // apiCall uses BASE_URL, so we don't need full URL here if we change apiCall to take path
        // but wait, verify apiCall implementation logic
        // apiCall adds BASE_URL.
        const data = await apiCall(`/me/tracks/contains?ids=${ids}`);
        results.push(...data);
    }
    return results;
}

export const saveTracks = async (trackIds) => {
    return apiCall(`/me/tracks?ids=${trackIds.join(',')}`, 'PUT');
}

export const removeSavedTracks = async (trackIds) => {
    return apiCall(`/me/tracks?ids=${trackIds.join(',')}`, 'DELETE');
}

export const getUserSavedTracks = (limit = 50, offset = 0) => apiCall(`/me/tracks?limit=${limit}&offset=${offset}`);

export const getUserTopItems = (type = 'artists', time_range = 'medium_term', limit = 20) => {
    return apiCall(`/me/top/${type}?time_range=${time_range}&limit=${limit}`);
};

export const getAvailableDevices = () => apiCall('/me/player/devices');

export const getUserQueue = () => apiCall('/me/player/queue');

export const transferPlayback = async (deviceId, play = false) => {
    return apiCall('/me/player', 'PUT', {
        device_ids: [deviceId],
        play: play
    });
};

export const searchAlbums = (query) => apiCall(`/search?q=${encodeURIComponent(query)}&type=album&limit=20`);
export const searchArtists = (query) => apiCall(`/search?q=${encodeURIComponent(query)}&type=artist&limit=20`);
export const getArtistTopTracks = (artistId) => apiCall(`/artists/${artistId}/top-tracks?market=US`);
export const getAlbum = (albumId) => apiCall(`/albums/${albumId}`);
export const getPlaylist = (playlistId) => apiCall(`/playlists/${playlistId}`);
export const getTracks = (ids) => apiCall(`/tracks?ids=${ids}`);
export const getNewReleases = (limit = 10) => apiCall(`/browse/new-releases?limit=${limit}`);
export const getFeaturedPlaylists = (limit = 10) => apiCall(`/browse/featured-playlists?limit=${limit}`);
export const getArtistAlbums = (artistId, limit = 5) => apiCall(`/artists/${artistId}/albums?limit=${limit}&include_groups=album,single`);

// Artists
export const followArtists = async (artistIds) => {
    return apiCall(`/me/following?type=artist&ids=${artistIds.join(',')}`, 'PUT', { ids: artistIds });
};

export const unfollowArtists = async (artistIds) => {
    // method DELETE with body is unusual but spotify requires it for this endpoint
    // standard apiCall supports body on DELETE
    return apiCall(`/me/following?type=artist&ids=${artistIds.join(',')}`, 'DELETE', { ids: artistIds });
};

export const getFollowedArtists = (limit = 20, after = null) => {
    let url = `/me/following?type=artist&limit=${limit}`;
    if (after) {
        url += `&after=${after}`;
    }
    return apiCall(url);
};

export const checkIfUserFollowsArtists = async (artistIds) => {
    return apiCall(`/me/following/contains?type=artist&ids=${artistIds.join(',')}`);
};



export const getArtists = async (ids) => {
    // Spotify allows max 50 IDs per request
    const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );

    const chunks = chunk(ids, 50);
    let allArtists = [];

    for (const c of chunks) {
        const chunkIds = c.join(',');
        const data = await apiCall(`/artists?ids=${chunkIds}`);
        if (data && data.artists) {
            allArtists = [...allArtists, ...data.artists];
        }
    }
    return { artists: allArtists };
};

export const getAlbums = async (ids) => {
    // Spotify allows max 20 IDs per request for albums
    const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );

    const chunks = chunk(ids, 20);
    let allAlbums = [];

    for (const c of chunks) {
        const chunkIds = c.join(',');
        const data = await apiCall(`/albums?ids=${chunkIds}`);
        if (data && data.albums) {
            allAlbums = [...allAlbums, ...data.albums];
        }
    }
    return { albums: allAlbums };
};
