import React from "react";
import useHomeData from "../hooks/useHomeData";
import "../styles/HomeView.css";

const Section = ({ title, children, className = "" }) => (
    <div className={`home-section ${className}`}>
        <div className="section-header">
            <h2>{title}</h2>
        </div>
        <div className="section-content-scroll">
            {children}
        </div>
    </div>
);

const HomeView = ({ handleSelectPlaylist, searchTerm }) => {
    const {
        newReleases,
        featuredPlaylists,
        topArtists,
        userPlaylists,
        loading,
        error
    } = useHomeData();

    if (loading) return <div className="loading-grid">Loading your music...</div>;
    if (error) return <div className="error-state">{error}</div>;

    // Filter playlists if searching (local search)
    const filteredUserPlaylists = userPlaylists.filter((playlist) =>
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If searching, show a simple grid properly
    if (searchTerm) {
        return (
            <div className="home-dashboard search-mode">
                <div className="section-title">Result for "{searchTerm}"</div>
                <div className="playlist-grid">
                    {filteredUserPlaylists.map((playlist) => (
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
                            </div>
                            <div className="card-info">
                                <h3>{playlist.name}</h3>
                                <span>{playlist.tracks?.total} Tracks</span>
                            </div>
                        </div>
                    ))}
                    {filteredUserPlaylists.length === 0 && (
                        <div className="empty-state">No local playlists match "{searchTerm}"</div>
                    )}
                </div>
            </div>
        );
    }

    const heroItem = newReleases[0];

    return (
        <div className="home-dashboard">
            <div className="hero-greeting">
                <h1>Discover</h1>
                <p>Curated fresh picks just for you</p>
            </div>

            {/* Hero Section - Featured New Release */}
            {heroItem && (
                <div className="hero-banner glass-card" onClick={() => handleSelectPlaylist({ ...heroItem, type: 'album' })}>
                    <div className="hero-content">
                        <span className="hero-label">NEW RELEASE</span>
                        <h2>{heroItem.name}</h2>
                        <p>{heroItem.artists[0].name}</p>
                    </div>
                    <div className="hero-image">
                        <img src={heroItem.images[0]?.url} alt={heroItem.name} />
                    </div>
                </div>
            )}

            {/* Top Artists - Circular */}
            {topArtists.length > 0 && (
                <Section title="Your Top Artists" className="artist-section">
                    {topArtists.map(artist => (
                        <div key={artist.id} className="artist-circle-card" onClick={() => handleSelectPlaylist({ ...artist, type: 'artist' })}>
                            <div className="artist-image">
                                <img src={artist.images[0]?.url} alt={artist.name} />
                            </div>
                            <p>{artist.name}</p>
                        </div>
                    ))}
                </Section>
            )}

            {/* New Releases - Horizontal */}
            {newReleases.length > 0 && (
                <Section title="New Releases">
                    {newReleases.map(album => (
                        <div key={album.id} className="scroll-card glass-card" onClick={() => handleSelectPlaylist({ ...album, type: 'album' })}>
                            <div className="card-image">
                                <img src={album.images[0]?.url} alt={album.name} />
                            </div>
                            <div className="card-info">
                                <h3>{album.name}</h3>
                                <span>{album.artists[0].name}</span>
                            </div>
                        </div>
                    ))}
                </Section>
            )}

            {/* Featured Playlists - Horizontal */}
            {featuredPlaylists.length > 0 && (
                <Section title="Featured Playlists">
                    {featuredPlaylists.map(playlist => (
                        <div key={playlist.id} className="scroll-card glass-card" onClick={() => handleSelectPlaylist(playlist)}>
                            <div className="card-image">
                                <img src={playlist.images[0]?.url} alt={playlist.name} />
                            </div>
                            <div className="card-info">
                                <h3>{playlist.name}</h3>
                                <span>{playlist.description || "Spotify Selection"}</span>
                            </div>
                        </div>
                    ))}
                </Section>
            )}

            {/* User Playlists - Horizontal or Grid */}
            <Section title="Your Playlists">
                {userPlaylists.map(playlist => (
                    <div key={playlist.id} className="scroll-card glass-card" onClick={() => handleSelectPlaylist(playlist)}>
                        <div className="card-image">
                            {playlist.images?.[0] ? (
                                <img src={playlist.images[0].url} alt={playlist.name} />
                            ) : (
                                <div className="placeholder-art">🎵</div>
                            )}
                        </div>
                        <div className="card-info">
                            <h3>{playlist.name}</h3>
                            <span>{playlist.owner.display_name}</span>
                        </div>
                    </div>
                ))}
            </Section>

            <div style={{ height: '100px' }}></div>
        </div>
    );
};

export default HomeView;
