import React, { useEffect, useState } from 'react';
import { getClassUserProfile } from '../services/spotifyApi';
import "../styles/UserProfile.css";

const UserProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hardcoded for now, could be from package.json in a real build process if exposed
    const APP_VERSION = "4.4.0";

    const features = [
        "Smart Search & Direct Playback",
        "Your Library & Liked Songs Integration",
        "YouTube Video Integration with Split Player",
        "Zen Mode (Ambient Sounds & Visuals)",
        "Stats & Listening Insights",
        "Transfer Playback to Other Devices",
        "Add & Remove Tracks from Playlists",
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getClassUserProfile();
                setProfile(data);
            } catch (err) {
                console.error("Failed to load profile", err);
                setError("Failed to load user profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="loading-state">Loading Profile...</div>;
    if (error) return <div className="error-state">{error}</div>;
    if (!profile) return null;

    const imageUrl = profile.images && profile.images.length > 0 ? profile.images[0]?.url : null;

    return (
        <div className="user-profile-container">
            <div className="user-profile-header">
                {imageUrl ? (
                    <img src={imageUrl} alt={profile.display_name} className="profile-avatar" />
                ) : (
                    <div className="profile-avatar-placeholder">
                        {profile.display_name?.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="profile-info">
                    <h1>{profile.display_name}</h1>
                    <div className="profile-meta">
                        <div className="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            {profile.email}
                        </div>
                        <div className="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            {profile.country}
                        </div>
                        <div className="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            {profile.followers?.total} Followers
                        </div>
                        <div className="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            {profile.product === 'premium' ? 'Premium' : 'Free'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-content-grid">
                <div className="profile-card">
                    <h3>App Details</h3>
                    <div className="app-version">v{APP_VERSION}</div>
                    <p className="app-description">
                        Music Web App built with React, Vite, and the Spotify Web API.
                        Designed for an immersive listening experience.
                    </p>
                </div>

                <div className="profile-card">
                    <h3>Current Features</h3>
                    <ul className="features-list">
                        {features.map((feature, index) => (
                            <li key={index}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
