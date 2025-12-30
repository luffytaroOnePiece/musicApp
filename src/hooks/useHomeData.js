import { useState, useEffect } from 'react';
import {
    getNewReleases,
    getFeaturedPlaylists,
    getUserTopItems,
    getUserPlaylists
} from '../services/spotifyApi';

const useHomeData = () => {
    const [newReleases, setNewReleases] = useState([]);
    const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
    const [topArtists, setTopArtists] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch User Data & Featured
                const [
                    topArtistsData,
                    featuredData,
                    playlistsData
                ] = await Promise.all([
                    getUserTopItems('artists', 'medium_term', 10).catch(err => { console.error("Top Artists fetch failed", err); return { items: [] }; }),
                    getFeaturedPlaylists(10).catch(err => { console.error("Featured Playlists fetch failed", err); return { playlists: { items: [] } }; }),
                    getUserPlaylists().catch(err => { console.error("User Playlists fetch failed", err); return { items: [] }; })
                ]);

                setTopArtists(topArtistsData.items || []);
                setFeaturedPlaylists(featuredData.playlists?.items || []);
                setUserPlaylists(playlistsData.items || []);

                // 2. Fetch New Releases based on Top Artists
                // If we have top artists, fetch their albums. Otherwise fallback to generic new releases
                let releases = [];
                if (topArtistsData.items && topArtistsData.items.length > 0) {
                    const top5Artists = topArtistsData.items.slice(0, 5);
                    const albumsPromises = top5Artists.map(artist =>
                        import('../services/spotifyApi').then(api => api.getArtistAlbums(artist.id, 2))
                    );

                    const albumsResponses = await Promise.all(albumsPromises);

                    // Flatten and collect all albums
                    const allAlbums = albumsResponses.flatMap(response => response.items || []);

                    // Filter duplicates (by id) and Sort by release date (descending)
                    const uniqueAlbums = Array.from(new Map(allAlbums.map(item => [item.id, item])).values());
                    releases = uniqueAlbums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
                }

                // Fallback if no personalized releases found
                if (releases.length === 0) {
                    const genericReleases = await import('../services/spotifyApi').then(api => api.getNewReleases(10));
                    releases = genericReleases.albums?.items || [];
                }

                setNewReleases(releases);
                setError(null);
            } catch (err) {
                console.error("Home data fetch failed", err);
                setError("Failed to load home content");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return {
        newReleases,
        featuredPlaylists,
        topArtists,
        userPlaylists,
        loading,
        error
    };
};

export default useHomeData;
