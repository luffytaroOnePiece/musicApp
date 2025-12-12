import React from 'react';

const HomeView = ({ playlists, handleSelectPlaylist, loading, error }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="home-dashboard" style={{ paddingTop: '60px' }}>
            <div className="hero-greeting">
                <h1>{getGreeting()}</h1>
                <p>Ready to jump back in?</p>
            </div>

            <div className="section-title">Your Playlists</div>

            {loading ? (
                <div className="loading-grid">Loading your library...</div>
            ) : (
                <div className="playlist-grid">
                    {playlists.map(playlist => (
                        <div
                            key={playlist.id}
                            className="playlist-card glass-card"
                            onClick={() => handleSelectPlaylist(playlist)}
                        >
                            <div className="card-image">
                                {playlist.images?.[0] ? (
                                    <img src={playlist.images[0].url} alt={playlist.name} />
                                ) : (
                                    <div className="placeholder-art">🎵</div>
                                )}
                                <div className="play-btn-overlay">
                                    <svg height="24" width="24" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            </div>
                            <div className="card-info">
                                <h3>{playlist.name}</h3>
                                <span>{playlist.tracks?.total} Tracks</span>
                            </div>
                        </div>
                    ))}
                    {playlists.length === 0 && !loading && !error && (
                        <div className="empty-state">No playlists found. Create one in Spotify!</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomeView;
