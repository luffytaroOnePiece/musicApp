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
  onRemoveTrack,
  onAddTrack,
  playlists,
  likedTrackIds,
  onToggleFavorite
}) => {
  const [sortType, setSortType] = useState("custom"); // custom, name, date, release_date, favorites
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Add to Playlist State
  const [showPlaylistSelect, setShowPlaylistSelect] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState(null);

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
      case 'favorites': return 'Favorites';
      default: return 'Custom Order';
    }
  }

  const handleAddToPlaylistClick = (track) => {
    setTrackToAdd(track);
    setShowPlaylistSelect(true);
  }

  const confirmAddToPlaylist = (playlistId) => {
    if (onAddTrack && trackToAdd) {
      onAddTrack(trackToAdd.uri, playlistId);
    }
    setShowPlaylistSelect(false);
    setTrackToAdd(null);
  }

  // Helper for fav button
  const renderFavButton = (track) => {
    if (!onToggleFavorite) return null;
    return (
      <div
        className={`fav-btn ${likedTrackIds?.has(track.id) ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(track.id);
        }}
        title={likedTrackIds?.has(track.id) ? "Remove from Liked Songs" : "Save to Liked Songs"}
      >
        {likedTrackIds?.has(track.id) ? '♥' : '♡'}
      </div>
    );
  };

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

  const finalTracks = sortType === 'favorites'
    ? sortedTracks.filter(t => likedTrackIds?.has(t.id))
    : sortedTracks;

  return (
    <div style={{ paddingTop: "60px" }}>
      {showPlaylistSelect && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }} onClick={() => setShowPlaylistSelect(false)}>
          <div style={{
            background: '#1e1e1e',
            padding: '24px',
            borderRadius: '12px',
            width: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #333'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '12px' }}>Select Playlist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {playlists?.map(p => (
                <button key={p.id} onClick={() => confirmAddToPlaylist(p.id)} style={{
                  background: 'transparent',
                  border: '1px solid #333',
                  padding: '12px',
                  color: 'white',
                  textAlign: 'left',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  {p.name}
                </button>
              ))}
            </div>
            <button onClick={() => setShowPlaylistSelect(false)} style={{
              marginTop: '16px',
              background: '#333',
              border: 'none',
              padding: '8px 16px',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%'
            }}>Cancel</button>
          </div>
        </div>
      )}

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
                <div className={`sort-item ${sortType === 'favorites' ? 'active' : ''}`} onClick={() => handleSortChange('favorites')}>
                  Favorites
                  {sortType === 'favorites' && <span>✓</span>}
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
        {finalTracks.length === 0 && (
          <div style={{ padding: "20px", color: "#888", textAlign: "center" }}>
            {sortType === 'favorites' ? "No favorite tracks found in this list" : `No tracks found matching "${searchTerm}"`}
          </div>
        )}
        {finalTracks.map((track, index) => (
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
              {viewMode === "card" && (
                <div className="play-overlay">▶</div>
              )}
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
                {renderFavButton(track)}
              </>
            )}

            {/* Add Button - Show in both list and card (search results) */}
            {onAddTrack && (
              <div
                className={`${viewMode === 'list' ? 'track-actions' : ''}`}
                style={viewMode === 'card' ? {
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px', // Opposite to fav button
                  zIndex: 10,
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#1DB954',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                } : {}}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToPlaylistClick(track);
                }}
                title="Add to playlist"
              >
                <div className="delete-btn" style={{ fontSize: '1.5rem', lineHeight: '24px' }}>+</div>
              </div>
            )}

            {onRemoveTrack && viewMode === "list" && (
              <div
                className="track-actions"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${track.name}" from this playlist?`)) {
                    onRemoveTrack(track.uri);
                  }
                }}
                title="Remove from playlist"
              >
                <div className="delete-btn">🗑️</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistView;
