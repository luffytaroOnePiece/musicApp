import React, { useState, useCallback } from "react";
import { setShuffle } from "../services/spotifyApi";
import TrackItem from './TrackItem';
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

  const handleAddToPlaylistClick = useCallback((track) => {
    setTrackToAdd(track);
    setShowPlaylistSelect(true);
  }, []);

  const confirmAddToPlaylist = (playlistId) => {
    if (onAddTrack && trackToAdd) {
      onAddTrack(trackToAdd.uri, playlistId);
    }
    setShowPlaylistSelect(false);
    setTrackToAdd(null);
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

  const finalTracks = sortType === 'favorites'
    ? sortedTracks.filter(t => likedTrackIds?.has(t.id))
    : sortedTracks;

  return (
    <div className="playlist-view-container">
      {showPlaylistSelect && (
        <div className="playlist-modal-overlay" onClick={() => setShowPlaylistSelect(false)}>
          <div className="playlist-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="playlist-modal-title">Select Playlist</h3>
            <div className="playlist-modal-list">
              {playlists?.map(p => (
                <button
                  key={p.id}
                  onClick={() => confirmAddToPlaylist(p.id)}
                  className="playlist-modal-item"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button onClick={() => setShowPlaylistSelect(false)} className="playlist-modal-cancel">Cancel</button>
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
            <h1 className="playlist-header-title">
              {selectedPlaylist.name}
            </h1>
            <p className="playlist-header-desc">
              {selectedPlaylist.description ||
                `By ${selectedPlaylist.owner.display_name}`}
            </p>
            <div className="playlist-stats">
              {(() => {
                const totalDurationMs = tracks.reduce((acc, t) => acc + t.duration_ms, 0);
                const hrs = Math.floor(totalDurationMs / 3600000);
                const mins = Math.floor((totalDurationMs % 3600000) / 60000);
                const uniqueArtists = new Set(tracks.flatMap(t => t.artists.map(a => a.id))).size;
                return (
                  <>
                    <span>{tracks.length} Songs</span>
                    <span className="stats-dot">•</span>
                    <span>{hrs > 0 ? `${hrs} hr ` : ''}{mins} min</span>
                    <span className="stats-dot">•</span>
                    <span>{uniqueArtists} Artists</span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="view-controls">

          <div className="sort-dropdown sort-dropdown-container">
            <button
              className="sort-trigger"
              onClick={() => setSortMenuOpen(!sortMenuOpen)}
            >
              {getSortLabel()}
              <span className={`sort-arrow ${sortMenuOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
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
                // If it's Liked Songs (no context URI), we play list of URIs
                if (selectedPlaylist.id === 'liked-songs') {
                  // Fisher-Yates shuffle
                  const shuffled = [...tracks];
                  for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                  }

                  // Limit to 50 tracks max for API body
                  const uris = shuffled.slice(0, 50).map(t => t.uri);

                  // Ensure shuffle is OFF so it plays our shuffled order starting from index 0
                  // (Or ON if we don't care, but OFF guarantees our order)
                  await setShuffle(false, deviceId);
                  handlePlay(null, uris); // pass array as context
                } else {
                  const randomIndex = Math.floor(Math.random() * tracks.length);
                  await setShuffle(true, deviceId);
                  handlePlay(null, selectedPlaylist.uri, randomIndex);
                }
              }
            }}
            className="view-btn warning-btn shuffle-btn-margin"
            title="Shuffle Play"
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
          <div className="no-tracks-msg">
            {sortType === 'favorites' ? "No favorite tracks found in this list" : `No tracks found matching "${searchTerm}"`}
          </div>
        )}
        {finalTracks.map((track, index) => (
          <TrackItem
            key={track.id}
            track={track}
            index={index}
            viewMode={viewMode}
            handlePlay={handlePlay}
            selectedPlaylistUri={selectedPlaylist?.uri}
            trackIndex={tracks.findIndex(t => t.id === track.id)}
            formatTime={formatTime}
            likedTrackIds={likedTrackIds}
            onToggleFavorite={onToggleFavorite}
            onAddTrack={onAddTrack}
            onAddToPlaylistClick={handleAddToPlaylistClick}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaylistView;
