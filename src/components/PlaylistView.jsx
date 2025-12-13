import React, { useState } from "react";
import { setShuffle } from "../services/spotifyApi";
import "../styles/PlaylistView.css";

const PlaylistView = ({
  selectedPlaylist,
  tracks,
  viewMode,
  setViewMode,
  handlePlay,
  formatTime,
  searchTerm,
  deviceId,
}) => {
  const [sortType, setSortType] = useState("custom"); // custom, name, date, release_date
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const handleSortChange = (type) => {
    if (sortType === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(type);
      setSortOrder('asc');
    }
    setSortMenuOpen(false);
  }

  const getSortLabel = () => {
    switch (sortType) {
      case 'name': return 'Name';
      case 'date': return 'Date Added';
      case 'release_date': return 'Date Produced';
      default: return 'Custom Order';
    }
  }

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

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortType === "name") {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
      if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    }
    if (sortType === "date") {
      const dateA = a.added_at ? new Date(a.added_at).getTime() : 0;
      const dateB = b.added_at ? new Date(b.added_at).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
    if (sortType === "release_date") {
      // Fallback for tracks without album release date, though rare in Spotify objects
      const dateA = new Date(a.album.release_date || 0).getTime();
      const dateB = new Date(b.album.release_date || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0; // custom order (index based effectively)
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

          <div className="sort-dropdown" style={{ position: 'relative', marginRight: '16px' }}>
            <button
              className="sort-trigger"
              onClick={() => setSortMenuOpen(!sortMenuOpen)}
            >
              {getSortLabel()}
              <span className="sort-arrow" style={{ transform: sortMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </button>

            {sortMenuOpen && (
              <div className="sort-menu">
                <div className={`sort-item ${sortType === 'custom' ? 'active' : ''}`} onClick={() => handleSortChange('custom')}>
                  Custom Order
                  {sortType === 'custom' && <span>✓</span>}
                </div>
                <div className={`sort-item ${sortType === 'name' ? 'active' : ''}`} onClick={() => handleSortChange('name')}>
                  Name
                  {sortType === 'name' && <span>✓</span>}
                </div>
                <div className={`sort-item ${sortType === 'date' ? 'active' : ''}`} onClick={() => handleSortChange('date')}>
                  Date Added
                  {sortType === 'date' && <span>✓</span>}
                </div>
                <div className={`sort-item ${sortType === 'release_date' ? 'active' : ''}`} onClick={() => handleSortChange('release_date')}>
                  Date Produced
                  {sortType === 'release_date' && <span>✓</span>}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              if (deviceId && selectedPlaylist && tracks.length > 0) {
                const randomIndex = Math.floor(Math.random() * tracks.length);
                await setShuffle(true, deviceId);
                handlePlay(null, selectedPlaylist.uri, randomIndex);
              }
            }}
            className="view-btn warning-btn"
            title="Shuffle Play"
            style={{ marginRight: '10px' }}
          >
            🔊 Shuffle
          </button>

          {sortType !== 'custom' && (
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="view-btn"
              title={sortOrder === 'asc' ? "Ascending" : "Descending"}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          )}

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
        {sortedTracks.map((track, index) => (
          <div
            key={track.id}
            className={`track-item ${viewMode}`}
            onClick={() => handlePlay(track.uri, selectedPlaylist?.uri, tracks.findIndex(t => t.id === track.id))}
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
