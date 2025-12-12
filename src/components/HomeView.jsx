import React from "react";

const HomeView = ({
  playlists,
  handleSelectPlaylist,
  loading,
  error,
  searchTerm,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="home-dashboard" style={{ paddingTop: "60px" }}>
      <div className="hero-greeting">
        <h1>{searchTerm ? `Results for ${searchTerm}` : getGreeting()}</h1>
        {!searchTerm && <p>Ready to jump back in?</p>}
      </div>

      {!searchTerm && <div className="section-title">Your Playlists</div>}

      {loading ? (
        <div className="loading-grid">Loading your library...</div>
      ) : (
        <div className="playlist-grid">
          {filteredPlaylists.map((playlist) => (
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
                  <svg height="24" width="24" viewBox="0 0 24 24" fill="black">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="card-info">
                <h3>{playlist.name}</h3>
                <span>{playlist.tracks?.total} Tracks</span>
              </div>
            </div>
          ))}
          {filteredPlaylists.length === 0 && !loading && !error && (
            <div
              className="empty-state"
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "40px",
              }}
            >
              {searchTerm ? (
                <div>
                  <p style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
                    No local playlists match <strong>"{searchTerm}"</strong>
                  </p>
                  <p style={{ color: "#aaa" }}>
                    Press{" "}
                    <span
                      style={{
                        border: "1px solid #aaa",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "0.8rem",
                      }}
                    >
                      Enter
                    </span>{" "}
                    to search on Spotify
                  </p>
                </div>
              ) : (
                "No playlists found. Create one in Spotify!"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeView;
