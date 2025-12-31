const BASE_URL = 'https://lrclib.net/api';

/**
 * Fetch lyrics from LRCLIB API.
 * Uses the /get endpoint which tries to find the best match based on duration and metadata.
 * 
 * @param {string} trackName 
 * @param {string} artistName 
 * @param {string} albumName 
 * @param {number} duration - Duration in seconds
 * @returns {Promise<Object|null>} Returns the lyrics object or null if not found.
 */
export const getLyrics = async (trackName, artistName, albumName, duration) => {
    try {
        const params = new URLSearchParams({
            track_name: trackName,
            artist_name: artistName,
            album_name: albumName,
            duration: duration
        });

        const response = await fetch(`${BASE_URL}/get?${params}`);

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`LRCLIB API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch lyrics from LRCLIB:", error);
        return null; // Return null to fail gracefully
    }
};

/**
 * Search for lyrics using the search endpoint.
 * Useful if direct match fails, though /get is preferred for automation.
 * 
 * @param {string} query 
 * @returns {Promise<Array>}
 */
export const searchLyrics = async (query) => {
    try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(`${BASE_URL}/search?${params}`);

        if (!response.ok) {
            throw new Error(`LRCLIB API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to search lyrics on LRCLIB:", error);
        return [];
    }
};
