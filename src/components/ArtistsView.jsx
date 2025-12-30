import React, { useEffect, useState } from 'react';
import { getFollowedArtists, searchArtists, followArtists, unfollowArtists, checkIfUserFollowsArtists } from '../services/spotifyApi';
import '../styles/ArtistsView.css';

const ArtistsView = () => {
    const [followedArtists, setFollowedArtists] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('followed'); // 'followed' or 'search'
    const [followingState, setFollowingState] = useState({}); // Map of artistId -> isFollowing

    useEffect(() => {
        fetchFollowedArtists();
    }, []);

    const fetchFollowedArtists = async () => {
        setLoading(true);
        try {
            const data = await getFollowedArtists(50); // Fetch up to 50 for now
            const artists = data.artists.items;
            setFollowedArtists(artists);

            // Initialize following state
            const initialFollowState = {};
            artists.forEach(artist => {
                initialFollowState[artist.id] = true;
            });
            setFollowingState(prev => ({ ...prev, ...initialFollowState }));

        } catch (error) {
            console.error("Failed to fetch followed artists", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query) {
            setViewMode('followed');
            setSearchResults([]);
            return;
        }

        setViewMode('search');
        try {
            const data = await searchArtists(query);
            const artists = data.artists.items;
            setSearchResults(artists);

            // Check if we strictly follow these artists to update button state correctly
            const idsToCheck = artists.map(a => a.id);
            if (idsToCheck.length > 0) {
                // Determine which ones are strictly newly searched vs already known
                // But simplified: just check all for accurate UI
                const bools = await checkIfUserFollowsArtists(idsToCheck);
                const newFollowState = {};
                idsToCheck.forEach((id, index) => {
                    newFollowState[id] = bools[index];
                });
                setFollowingState(prev => ({ ...prev, ...newFollowState }));
            }

        } catch (error) {
            console.error("Search failed", error);
        }
    };

    const toggleFollow = async (artist) => {
        const isFollowing = followingState[artist.id];

        // Optimistic update
        setFollowingState(prev => ({ ...prev, [artist.id]: !isFollowing }));

        try {
            if (isFollowing) {
                await unfollowArtists([artist.id]);
                // If in 'followed' view, remove from list
                if (viewMode === 'followed') {
                    setFollowedArtists(prev => prev.filter(a => a.id !== artist.id));
                }
            } else {
                await followArtists([artist.id]);
                if (viewMode === 'followed') {
                    // Re-fetch or add manually if we have full object
                    // For now, simpler to just re-fetch to ensure order
                    fetchFollowedArtists();
                }
            }
        } catch (error) {
            console.error("Failed to toggle follow", error);
            // Revert
            setFollowingState(prev => ({ ...prev, [artist.id]: isFollowing }));
        }
    };

    const displayedArtists = viewMode === 'search' ? searchResults : followedArtists;

    return (
        <div className="artists-view">
            <div className="artists-header">
                <h1>Artists</h1>
                <input
                    type="text"
                    placeholder="Search for artists..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="artists-search-input"
                />
            </div>

            {loading && viewMode === 'followed' && followedArtists.length === 0 ? (
                <div className="loading-spinner">Loading Artists...</div>
            ) : (
                <div className="artists-grid">
                    {displayedArtists.map(artist => (
                        <div key={artist.id} className="artist-card">
                            <div className="artist-image-wrapper">
                                <img
                                    src={artist.images[0]?.url || 'https://via.placeholder.com/150'}
                                    alt={artist.name}
                                    className="artist-image"
                                />
                            </div>
                            <div className="artist-info">
                                <h3 className="artist-name">{artist.name}</h3>
                                <p className="artist-followers">{artist.followers.total.toLocaleString()} followers</p>
                            </div>
                            <button
                                className={`follow-btn ${followingState[artist.id] ? 'following' : ''}`}
                                onClick={() => toggleFollow(artist)}
                            >
                                {followingState[artist.id] ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    ))}

                    {displayedArtists.length === 0 && !loading && (
                        <div className="no-results">
                            {viewMode === 'search' ? `No artists found for "${searchQuery}"` : "You are not following any artists yet."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ArtistsView;
