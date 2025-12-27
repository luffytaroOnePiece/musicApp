import React, { useState, useEffect } from 'react';
import { getUserTopItems } from '../services/spotifyApi';
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
                        <div key={item.id} className="modal-item-row" onClick={() => type === 'tracks' ? handlePlay(item.uri) : null}>
                            <span className="modal-item-rank">{index + 1}</span>
                            <div className="modal-item-img">
                                {type === 'artists' ? (
                                    <img src={item.images[2]?.url || item.images[0]?.url} alt={item.name} className="artist-img" />
                                ) : (
                                    <img src={item.album.images[2]?.url || item.album.images[0]?.url} alt={item.name} className="track-img" />
                                )}
                            </div>
                            <div className="modal-item-info">
                                <span className="modal-item-name">{item.name}</span>
                                {type === 'tracks' && (
                                    <span className="modal-item-sub">{item.artists[0].name}</span>
                                )}
                            </div>
                            {type === 'tracks' && (
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
    const [timeRange, setTimeRange] = useState('medium_term'); // short_term, medium_term, long_term
    const [topArtists, setTopArtists] = useState([]);
    const [topTracks, setTopTracks] = useState([]);
    const [topGenres, setTopGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null); // 'artists' | 'tracks' | null

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [artistsData, tracksData] = await Promise.all([
                    getUserTopItems('artists', timeRange, 50),
                    getUserTopItems('tracks', timeRange, 50)
                ]);

                setTopArtists(artistsData.items || []);
                setTopTracks(tracksData.items || []);

                // Calculate Top Genres from Artists
                const allGenres = artistsData.items.flatMap(artist => artist.genres);
                const genreCounts = allGenres.reduce((acc, genre) => {
                    acc[genre] = (acc[genre] || 0) + 1;
                    return acc;
                }, {});
                const sortedGenres = Object.entries(genreCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count, percentage: Math.round((count / allGenres.length) * 100) }));
                setTopGenres(sortedGenres);

            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    const ranges = [
        { id: 'short_term', label: 'Last Month' },
        { id: 'medium_term', label: 'Last 6 Months' },
        { id: 'long_term', label: 'All Time' }
    ];

    if (loading) return <div className="stats-loading">
        <div className="spinner"></div>
        <span>Calculating your Replay...</span>
    </div>;

    if (topArtists.length === 0 && topTracks.length === 0) {
        return (
            <div className="stats-view empty-state">
                <div className="empty-content">
                    <h2>No Replay Data Available</h2>
                    <p>Start listening to some music to see your insights appear here.</p>
                </div>
            </div>
        );
    }

    const topArtist = topArtists[0];
    const topTrack = topTracks[0];

    return (
        <div className="stats-view">
            <header className="stats-header-apple">
                <div className="header-title">
                    <h1>Replay '25</h1> {/* Dynamic year would be cool, hardcoded for style now */}
                    <p>Your year in review, updated weekly.</p>
                </div>

                <div className="apple-segment-control">
                    {ranges.map(range => (
                        <button
                            key={range.id}
                            className={`segment-btn ${timeRange === range.id ? 'active' : ''}`}
                            onClick={() => setTimeRange(range.id)}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="bento-grid">
                {/* 1. Main Highlight: Top Artist */}
                {topArtist && (
                    <div className="bento-card highlight-artist-card">
                        <div className="card-bg" style={{ backgroundImage: `url(${topArtist.images[0]?.url})` }}></div>
                        <div className="card-content">
                            <span className="card-label">Top Artist</span>
                            <h2>{topArtist.name}</h2>
                            <div className="artist-badge">#1</div>
                        </div>
                    </div>
                )}

                {/* 2. Top Genres (Pie Chart Style List) */}
                <div className="bento-card genres-card">
                    <h3>Top Genres</h3>
                    <div className="genres-list-apple">
                        {topGenres.map((genre, idx) => (
                            <div key={idx} className="genre-row">
                                <span className="genre-rank">{idx + 1}</span>
                                <span className="genre-name">{genre.name}</span>
                                <span className="genre-percent">{genre.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Top Tracks List */}
                <div className="bento-card tracks-card">
                    <h3>Top Songs</h3>
                    <div className="tracks-list-apple">
                        {topTracks.slice(0, 5).map((track, index) => (
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
                    </div>
                </div>

                {/* 4. Stats Summary */}
                <div className="bento-card summary-card start-card clickable" onClick={() => setActiveModal('artists')}>
                    <div className="summary-stat">
                        <span className="stat-value">{topArtists.length}</span>
                        <span className="stat-label">Artists</span>
                    </div>
                    <div className="card-hover-hint">View All</div>
                </div>

                <div className="bento-card summary-card end-card clickable" onClick={() => setActiveModal('tracks')}>
                    <div className="summary-stat">
                        <span className="stat-value">{topTracks.length}</span>
                        <span className="stat-label">Songs</span>
                    </div>
                    <div className="card-hover-hint">View All</div>
                </div>

                {/* 5. Rest of Artists Grid */}
                <div className="bento-card artists-grid-card">
                    <h3>More Favorite Artists</h3>
                    <div className="mini-artists-grid">
                        {topArtists.slice(1, 9).map((artist) => (
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
                    title="Top Artists"
                    items={topArtists}
                    type="artists"
                    onClose={() => setActiveModal(null)}
                />
            )}
            {activeModal === 'tracks' && (
                <StatsModal
                    title="Top Songs"
                    items={topTracks}
                    type="tracks"
                    onClose={() => setActiveModal(null)}
                    handlePlay={handlePlay}
                    formatTime={formatTime}
                />
            )}
        </div>
    );
};

export default StatsView;
