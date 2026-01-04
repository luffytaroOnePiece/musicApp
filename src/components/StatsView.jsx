import React, { useState, useEffect } from 'react';
import { searchArtists, getPlaylist, getArtistTopTracks } from '../services/spotifyApi';
import movieAlbums from '../data/movieAlbums.json';
import privateAlbums from '../data/privateAlbums.json';

const albumsData = { ...movieAlbums, ...privateAlbums };
import othersData from '../data/others.json';
import '../styles/StatsView.css';

const StatsModal = ({ title, items, type, onClose, handlePlay, formatTime }) => {
    if (!items) return null;

    return (
        <div className="stats-modal-overlay" onClick={onClose}>
            <div className="stats-modal-content" onClick={e => e.stopPropagation()}>
                <div className="stats-modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="stats-modal-list">
                    {items.map((item, index) => (
                        <div key={item.id} className="modal-item-row" onClick={() => (type === 'tracks' || type === 'highlights') ? handlePlay(item.uri) : null}>
                            <span className="modal-item-rank">{index + 1}</span>
                            <div className="modal-item-img">
                                {type === 'artists' ? (
                                    <img src={item.images[2]?.url || item.images[0]?.url} alt={item.name} className="artist-img" />
                                ) : (
                                    <img src={item.album?.images[2]?.url || item.album?.images[0]?.url || item.images?.[0]?.url} alt={item.name} className="track-img" />
                                )}
                            </div>
                            <div className="modal-item-info">
                                <span className="modal-item-name">{item.name}</span>
                                {(type === 'tracks' || type === 'highlights') && (
                                    <span className="modal-item-sub">{item.artists?.[0]?.name}</span>
                                )}
                            </div>
                            {(type === 'tracks' || type === 'highlights') && item.duration_ms && (
                                <span className="modal-item-duration">{formatTime(item.duration_ms)}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatsView = ({ handlePlay, formatTime }) => {
    const [stats, setStats] = useState({
        artists: [],
        movies: [],
        topGenres: [],
        awardsCount: 0,
        lifestyleCount: 0,
        totalArtists: 0,
        totalMovies: 0,
        highlightArtist: null,
        featuredTracks: []
    });
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const fetchedArtists = [];
                const fetchedMovies = [];
                const genreCounts = {};

                // 1. Process merged albums data (Parallel Fetching)
                const entries = Object.entries(albumsData);
                await Promise.all(entries.map(async ([id, data]) => {
                    try {
                        if (data.type === 'Private') {
                            // 'Private' entries are Artists. The key is a Playlist ID, checking metadata via Name Search
                            // because we don't have the Artist ID, only their Playlist ID.
                            const searchRes = await searchArtists(data.name);
                            if (searchRes?.artists?.items?.length > 0) {
                                // Use the first result as the artist
                                const artist = searchRes.artists.items[0];
                                fetchedArtists.push({
                                    ...artist,
                                    playlistId: id, // Keep reference
                                    localName: data.name
                                });
                                // Aggregate Genres
                                artist.genres.forEach(g => {
                                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                                });
                            }
                        } else if (data.type === 'Movie') {
                            // 'Movie' entries are Soundtracks (Playlists). Fetch via Playlist ID.
                            const playlist = await getPlaylist(id);
                            if (playlist) {
                                fetchedMovies.push({
                                    id: playlist.id,
                                    name: data.name || playlist.name,
                                    images: playlist.images,
                                    uri: playlist.uri,
                                    tracks: playlist.tracks
                                });
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch metadata for ${data.name}`, e);
                    }
                }));

                // 2. Process others.json
                let awardsCount = 0;
                let lifestyleCount = 0;
                Object.values(othersData).forEach(items => {
                    items.forEach(item => {
                        if (item.type === 'Award') awardsCount++;
                        if (item.type === 'Lifestyle') lifestyleCount++;
                    });
                });

                // 3. Calculate Top Genres
                const sortedGenres = Object.entries(genreCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => ({
                        name,
                        count,
                        // Estimate percentage against total artists fetched
                        percentage: Math.round((count / fetchedArtists.length) * 100) || 0
                    }));

                // 4. Pick Highlight Artist & Featured Tracks
                let highlightArtist = null;
                let featuredTracks = [];
                if (fetchedArtists.length > 0) {
                    const randomIndex = Math.floor(Math.random() * fetchedArtists.length);
                    highlightArtist = fetchedArtists[randomIndex];

                    // Fetch top tracks for this artist
                    try {
                        const topTracksData = await getArtistTopTracks(highlightArtist.id);
                        featuredTracks = topTracksData.tracks?.slice(0, 5) || [];
                    } catch (e) {
                        console.warn("Could not fetch top tracks for highlight artist", e);
                    }
                }

                setStats({
                    artists: fetchedArtists,
                    movies: fetchedMovies,
                    topGenres: sortedGenres,
                    awardsCount,
                    lifestyleCount,
                    totalArtists: fetchedArtists.length,
                    totalMovies: fetchedMovies.length,
                    highlightArtist,
                    featuredTracks
                });

            } catch (err) {
                console.error("Failed to fetch library stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="stats-loading">
        <div className="spinner"></div>
        <span>Analyzing Library...</span>
    </div>;

    return (
        <div className="stats-view">
            <header className="stats-header-apple">
                <div className="header-title">
                    <h1>Library Insights</h1>
                    <p>Overview of your curated collection.</p>
                </div>
            </header>

            <div className="bento-grid">
                {/* 1. Highlight Artist */}
                {stats.highlightArtist && (
                    <div className="bento-card highlight-artist-card">
                        <div className="card-bg" style={{ backgroundImage: `url(${stats.highlightArtist.images[0]?.url})` }}></div>
                        <div className="card-content">
                            <span className="card-label">Artist Spotlight</span>
                            <h2>{stats.highlightArtist.name}</h2>
                            <div className="artist-badge">Featured</div>
                        </div>
                    </div>
                )}

                {/* 2. Genre Distribution */}
                <div className="bento-card genres-card">
                    <h3>Collection Genres</h3>
                    <div className="genres-list-apple">
                        {stats.topGenres.map((genre, idx) => (
                            <div key={idx} className="genre-row">
                                <span className="genre-rank">{idx + 1}</span>
                                <span className="genre-name">{genre.name}</span>
                                <span className="genre-percent">{genre.percentage}%</span>
                            </div>
                        ))}
                        {stats.topGenres.length === 0 && <p className="no-data-msg">No genre data available.</p>}
                    </div>
                </div>

                {/* 3. Featured Tracks (from Highlight Artist) */}
                <div className="bento-card tracks-card">
                    <h3>{stats.highlightArtist ? `Top Songs by ${stats.highlightArtist.name}` : "Featured Songs"}</h3>
                    <div className="tracks-list-apple">
                        {stats.featuredTracks.map((track) => (
                            <div key={track.id} className="track-row" onClick={() => handlePlay(track.uri)}>
                                <div className="track-img-container">
                                    <img src={track.album.images[2]?.url} alt={track.name} />
                                    <div className="play-overlay">▶</div>
                                </div>
                                <div className="track-info-apple">
                                    <span className="track-name">{track.name}</span>
                                    <span className="track-artist">{track.artists[0].name}</span>
                                </div>
                                <span className="track-duration">{formatTime(track.duration_ms)}</span>
                            </div>
                        ))}
                        {stats.featuredTracks.length === 0 && <p className="no-data-msg">Select an artist to see top songs.</p>}
                    </div>
                </div>

                {/* 4. Stats Counters */}
                <div className="bento-card summary-card start-card clickable" onClick={() => setActiveModal('artists')}>
                    <div className="summary-stat">
                        <span className="stat-value">{stats.totalArtists}</span>
                        <span className="stat-label">Artists</span>
                    </div>
                    <div className="card-hover-hint">View All</div>
                </div>

                <div className="bento-card summary-card end-card">
                    <div className="summary-stat">
                        <span className="stat-value">{stats.totalMovies}</span>
                        <span className="stat-label">Movies / Albums</span>
                    </div>
                </div>

                <div className="bento-card summary-card">
                    <div className="summary-stat">
                        <span className="stat-value">{stats.awardsCount}</span>
                        <span className="stat-label">Awards Logged</span>
                    </div>
                </div>

                <div className="bento-card summary-card">
                    <div className="summary-stat">
                        <span className="stat-value">{stats.lifestyleCount}</span>
                        <span className="stat-label">Lifestyle Clips</span>
                    </div>
                </div>

                {/* 5. Artists Grid */}
                <div className="bento-card artists-grid-card">
                    <h3>Collection Artists</h3>
                    <div className="mini-artists-grid">
                        {stats.artists.slice(0, 10).map((artist) => (
                            <div key={artist.id} className="mini-artist-container" title={artist.name}>
                                <div className="mini-artist-img">
                                    <img src={artist.images[2]?.url || artist.images[0]?.url} alt={artist.name} />
                                </div>
                                <span className="mini-artist-name">{artist.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {activeModal === 'artists' && (
                <StatsModal
                    title="All Artists"
                    items={stats.artists}
                    type="artists"
                    onClose={() => setActiveModal(null)}
                />
            )}
        </div>
    );
};

export default StatsView;
