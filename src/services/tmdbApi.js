const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_READ_ACCESS_TOKEN = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

const BASE_URL = "https://api.themoviedb.org/3";

const getHeaders = () => ({
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`
});

const fetchTmdb = async (endpoint, params = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    // Check if params has api_key, if not add it or rely on Bearer token (Bearer usually preferred for v3/v4 mixed but v3 uses key often)
    // TMDB usually accepts Bearer token for authentication.

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            console.error("TMDB API Error:", response.status, response.statusText);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("TMDB Request Failed:", error);
        return null;
    }
};

export const searchMulti = async (query) => {
    if (!query) return null;
    return fetchTmdb('/search/multi', {
        query: query,
        include_adult: false,
        language: 'en-US',
        page: 1
    });
};

export const getDetails = async (id, type) => {
    // type should be 'movie' or 'tv'
    if (!id || !type) return null;
    return fetchTmdb(`/${type}/${id}`, { language: 'en-US' });
};

export const getImages = async (id, type) => {
    if (!id || !type) return null;
    return fetchTmdb(`/${type}/${id}/images`, {}); // No language param to get all images or specify 'null'
};

export const getImageUrl = (path, size = 'original') => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};
