import React from "react";

const PlaylistView = ({
  selectedPlaylist,
  tracks,
  viewMode,
  setViewMode,
  handlePlay,
  formatTime,
  searchTerm,
}) => {
  // Search Filtering
  const filteredTracks = tracks.filter((track) => {
    if (!searchTerm) return true;
    const lowSearch = searchTerm.toLowerCase();
    return (
      track.name.toLowerCase().includes(lowSearch) ||
      track.artists.some((a) => a.name.toLowerCase().includes(lowSearch)) ||
      track.album.name.toLowerCase().includes(lowSearch)
    );
  });

  return (
    <div style={{ paddingTop: "60px" }}>
      <header className="main-header">
        <div className="playlist-info">
          {selectedPlaylist.images?.[0] && (
            <img
              src={selectedPlaylist.images[0].url}
              alt={selectedPlaylist.name}
            />
          )}
          <div>
            <h1 style={{ fontSize: "3rem", marginBottom: "10px" }}>
              {selectedPlaylist.name}
            </h1>
            <p style={{ color: "#aaa" }}>
              {selectedPlaylist.description ||
                `By ${selectedPlaylist.owner.display_name}`}
            </p>
          </div>
        </div>

        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            ≡ List
          </button>
          <button
            className={`view-btn ${viewMode === "card" ? "active" : ""}`}
            onClick={() => setViewMode("card")}
          >
            :: Grid
          </button>
        </div>
      </header>

      <div className={`content-area ${viewMode}`}>
        {filteredTracks.length === 0 && (
          <div style={{ padding: "20px", color: "#888", textAlign: "center" }}>
            No tracks found matching "{searchTerm}"
          </div>
        )}
        {filteredTracks.map((track, index) => (
          <div
            key={track.id}
            className={`track-item ${viewMode}`}
            onClick={() => handlePlay(track.uri, selectedPlaylist?.uri, index)}
          >
            {viewMode === "list" && (
              <div className="track-index">{index + 1}</div>
            )}

            {/* Card view needs big image, List view needs small/none or layout change */}
            <div className="track-art">
              <img src={track.album.images[0]?.url} alt="" />
              {viewMode === "card" && <div className="play-overlay">▶</div>}
            </div>

            <div className="track-details">
              <div className="track-name">{track.name}</div>
              <div className="track-artist">
                {track.artists.map((a) => a.name).join(", ")}
              </div>
            </div>

            {viewMode === "list" && (
              <>
                <div className="track-album">{track.album.name}</div>
                <div className="track-duration">
                  {formatTime(track.duration_ms)}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistView;
