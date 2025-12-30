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

const HeroSection = ({ title, items, onItemClick }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="hero-wrapper">
            {title && (
                <div className="section-header" style={{ maxWidth: '1200px', margin: '0 auto 20px auto', padding: '0 10px' }}>
                    <h2>{title}</h2>
                </div>
            )}
            <div className="hero-section-grid">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`hero-card glass-card ${index === 0 ? 'hero-main' : 'hero-secondary'}`}
                        style={{ '--hero-bg': `url(${item.images[0]?.url})` }}
                        onClick={() => onItemClick({ ...item, type: 'album' })}
                    >
                        <div className="hero-bg-overlay"></div>
                        <div className="hero-content">
                            <span className="hero-label">NEW RELEASE</span>
                            <h2>{item.name}</h2>
                            <p>{item.artists[0].name}</p>
                        </div>
                        <div className="hero-image">
                            <img src={item.images[0]?.url} alt={item.name} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HomeView = ({ handleSelectPlaylist, searchTerm }) => {
    const {
        newReleases,
        featuredPlaylists,
        topArtists,
        userPlaylists,
        languageReleases,
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

            {/* Main Hero Section */}
            {newReleases.length > 0 && (
                <HeroSection
                    title=""
                    items={newReleases.slice(0, 3)}
                    onItemClick={handleSelectPlaylist}
                />
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

            {/* Language Specific New Releases as Hero Grids */}
            {languageReleases?.telugu?.length > 0 && (
                <HeroSection
                    title="New in Telugu"
                    items={languageReleases.telugu.slice(0, 3)}
                    onItemClick={handleSelectPlaylist}
                />
            )}

            {languageReleases?.hindi?.length > 0 && (
                <HeroSection
                    title="New in Hindi"
                    items={languageReleases.hindi.slice(0, 3)}
                    onItemClick={handleSelectPlaylist}
                />
            )}

            {languageReleases?.english?.length > 0 && (
                <HeroSection
                    title="New in English"
                    items={languageReleases.english.slice(0, 3)}
                    onItemClick={handleSelectPlaylist}
                />
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
        </div >
    );
};

export default HomeView;
