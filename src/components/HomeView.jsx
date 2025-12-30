import React from "react";
import useHomeData from "../hooks/useHomeData";
import "../styles/HomeView.css";
import Section from "./home/Section";
import HeroSection from "./home/HeroSection";

import ScrollCard from "./home/ScrollCard";

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
            </div >
        );
    }

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



            {/* New Releases - Horizontal */}
            {newReleases.length > 0 && (
                <Section title="New Releases">
                    {newReleases.map(album => (
                        <ScrollCard
                            key={album.id}
                            title={album.name}
                            subtitle={album.artists[0]?.name}
                            image={album.images[0]?.url}
                            onClick={() => handleSelectPlaylist({ ...album, type: 'album' })}
                        />
                    ))}
                </Section>
            )}



            {/* Featured Playlists - Horizontal */}
            {featuredPlaylists.length > 0 && (
                <Section title="Featured Playlists">
                    {featuredPlaylists.map(playlist => (
                        <ScrollCard
                            key={playlist.id}
                            title={playlist.name}
                            subtitle={playlist.description || "Spotify Selection"}
                            image={playlist.images[0]?.url}
                            onClick={() => handleSelectPlaylist(playlist)}
                        />
                    ))}
                </Section>
            )}

            {/* User Playlists - Horizontal or Grid */}
            <Section title="Your Playlists">
                {userPlaylists.map(playlist => (
                    <ScrollCard
                        key={playlist.id}
                        title={playlist.name}
                        subtitle={playlist.owner.display_name}
                        image={playlist.images?.[0]?.url}
                        onClick={() => handleSelectPlaylist(playlist)}
                    />
                ))}
            </Section>

            <div style={{ height: '100px' }}></div>
        </div >
    );
};

export default HomeView;
