import React, { useEffect, useState } from 'react';
import { searchAlbums, searchArtists } from '../services/spotifyApi';
import '../styles/ExploreView.css';

const ExploreView = ({ query, onSelectContext }) => {
    const [albums, setAlbums] = useState([]);
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [filter, setFilter] = useState('all'); // all, artists, albums

    useEffect(() => {
        const fetchData = async () => {
            if (!query) return;
            setLoading(true);
            setHasSearched(true);
            try {
                // If filtered, we could optimize to only fetch what's needed,
                // but checking both is fine for now as API calls are light.
                const [albumData, artistData] = await Promise.all([
                    filter === 'artists' ? Promise.resolve({ albums: { items: [] } }) : searchAlbums(query),
                    filter === 'albums' ? Promise.resolve({ artists: { items: [] } }) : searchArtists(query)
                ]);

                if (filter === 'artists') {
                    setAlbums([]);
                    setArtists(artistData.artists.items || []);
                } else if (filter === 'albums') {
                    setAlbums(albumData.albums.items || []);
                    setArtists([]);
                } else {
                    setAlbums(albumData.albums.items || []);
                    setArtists(artistData.artists.items || []);
                }

            } catch (error) {
                console.error("Explore fetch failed", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (query) fetchData();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [query, filter]); // Re-fetch on filter change or query change

    if (loading) {
        return (
            <div className="explore-view">
                <div className="explore-filters">
                    <button className={`explore-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                    <button className={`explore-filter-btn ${filter === 'artists' ? 'active' : ''}`} onClick={() => setFilter('artists')}>Artists</button>
                    <button className={`explore-filter-btn ${filter === 'albums' ? 'active' : ''}`} onClick={() => setFilter('albums')}>Albums</button>
                </div>
                <div className="explore-loading">Exploring...</div>
            </div>
        )
    }

    if (!query && !hasSearched) {
        return (
            <div className="explore-view">
                <div className="explore-filters">
                    <button className={`explore-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                    <button className={`explore-filter-btn ${filter === 'artists' ? 'active' : ''}`} onClick={() => setFilter('artists')}>Artists</button>
                    <button className={`explore-filter-btn ${filter === 'albums' ? 'active' : ''}`} onClick={() => setFilter('albums')}>Albums</button>
                </div>
                <div className="explore-placeholder">
                    <div style={{ color: '#888' }}>
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <div>Start typing to explore Albums and Artists</div>
                </div>
            </div>
        );
    }

    return (
        <div className="explore-view">
            <div className="explore-filters">
                <button className={`explore-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                <button className={`explore-filter-btn ${filter === 'artists' ? 'active' : ''}`} onClick={() => setFilter('artists')}>Artists</button>
                <button className={`explore-filter-btn ${filter === 'albums' ? 'active' : ''}`} onClick={() => setFilter('albums')}>Albums</button>
            </div>

            {/* Artists Section */}
            {artists.length > 0 && (filter === 'all' || filter === 'artists') && (
                <div className="explore-section">
                    <h2 className="explore-heading">Artists</h2>
                    <div className="explore-grid">
                        {artists.map(artist => (
                            <div
                                key={artist.id}
                                className="explore-card artist"
                                onClick={() => onSelectContext(artist, 'artist')}
                            >
                                <div className="explore-image-container">
                                    <img
                                        src={artist.images[0]?.url || 'https://via.placeholder.com/150'}
                                        alt={artist.name}
                                        className="explore-image"
                                    />
                                </div>
                                <div className="explore-title">{artist.name}</div>
                                <div className="explore-subtitle">Artist</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Albums Section */}
            {albums.length > 0 && (filter === 'all' || filter === 'albums') && (
                <div className="explore-section">
                    <h2 className="explore-heading">Albums</h2>
                    <div className="explore-grid">
                        {albums.map(album => (
                            <div
                                key={album.id}
                                className="explore-card"
                                onClick={() => onSelectContext(album, 'album')}
                            >
                                <div className="explore-image-container">
                                    <img
                                        src={album.images[0]?.url || 'https://via.placeholder.com/150'}
                                        alt={album.name}
                                        className="explore-image"
                                    />
                                </div>
                                <div className="explore-title">{album.name}</div>
                                <div className="explore-subtitle">
                                    {album.release_date?.split('-')[0]} • {album.artists[0]?.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasSearched && albums.length === 0 && artists.length === 0 && (
                <div className="explore-placeholder">
                    <div>No results found for "{query}"</div>
                </div>
            )}
        </div>
    );
};

export default ExploreView;
