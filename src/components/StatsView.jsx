import React, { useState, useEffect } from 'react';
import { getUserTopItems } from '../services/spotifyApi';
import '../styles/StatsView.css';

const StatsView = ({ handlePlay, formatTime }) => {
    const [timeRange, setTimeRange] = useState('medium_term'); // short_term, medium_term, long_term
    const [topArtists, setTopArtists] = useState([]);
    const [topTracks, setTopTracks] = useState([]);
    const [topGenres, setTopGenres] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [artistsData, tracksData] = await Promise.all([
                    getUserTopItems('artists', timeRange, 20),
                    getUserTopItems('tracks', timeRange, 20)
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
        { id: 'short_term', label: 'Last 4 Weeks' },
        { id: 'medium_term', label: 'Last 6 Months' },
        { id: 'long_term', label: 'All Time' }
    ];

    if (loading) return <div className="stats-loading">Loading insights...</div>;

    if (topArtists.length === 0 && topTracks.length === 0) {
        return (
            <div className="stats-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <h2>No Data Found</h2>
                <p style={{ color: '#b3b3b3', marginBottom: '20px', textAlign: 'center' }}>
                    We couldn't fetch your stats. This usually happens if you haven't granted the "Top Items" permission or if you're new to Spotify.
                </p>
                <button
                    onClick={() => {
                        window.location.href = '/'; // Simple redirect to force re-auth flow eventually or user has to manually logout
                        localStorage.clear(); // Clear tokens to force re-login
                    }}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '30px',
                        border: 'none',
                        background: '#1DB954',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Re-Login to Grant Permissions
                </button>
            </div>
        );
    }

    return (
        <div className="stats-view">
            <div className="stats-header">
                <h1>Your Insights</h1>
                <div className="range-selector">
                    {ranges.map(range => (
                        <button
                            key={range.id}
                            className={timeRange === range.id ? 'active' : ''}
                            onClick={() => setTimeRange(range.id)}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="stats-grid">
                {/* Top Genres */}
                <div className="stats-card genres-card">
                    <h3>Top Genres</h3>
                    <div className="genres-list">
                        {topGenres.map((genre, idx) => (
                            <div key={idx} className="genre-item">
                                <span className="genre-name">{genre.name}</span>
                                <div className="genre-bar-container">
                                    <div className="genre-bar" style={{ width: `${genre.percentage * 5}%`, minWidth: '5px' }}></div>
                                </div>
                                <span className="genre-percentage">{genre.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Metrics */}
                <div className="stats-card metrics-card">
                    <h3>Listening Profile</h3>
                    <div className="metrics-content">
                        <div className="metric">
                            <span className="metric-val">{topArtists.length}</span>
                            <span className="metric-label">Artists</span>
                        </div>
                        <div className="metric">
                            <span className="metric-val">{topTracks.length}</span>
                            <span className="metric-label">Tracks</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <h3>Top Artists</h3>
                <div className="artists-grid">
                    {topArtists.map((artist, index) => (
                        <div key={artist.id} className="artist-item">
                            <div className="artist-rank">{index + 1}</div>
                            <img src={artist.images[0]?.url} alt={artist.name} />
                            <span className="artist-name">{artist.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="stats-section">
                <h3>Top Tracks</h3>
                <div className="tracks-list">
                    {topTracks.map((track, index) => (
                        <div key={track.id} className="track-item" onClick={() => handlePlay(track.uri)}>
                            <div className="track-rank">{index + 1}</div>
                            <img src={track.album.images[2]?.url} alt={track.name} />
                            <div className="track-info">
                                <span className="track-name">{track.name}</span>
                                <span className="track-artist">{track.artists.map(a => a.name).join(', ')}</span>
                            </div>
                            <span className="track-time">{formatTime(track.duration_ms)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsView;
