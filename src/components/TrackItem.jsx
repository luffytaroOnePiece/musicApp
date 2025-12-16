import React, { memo } from 'react';
import { openYoutubeLink, getYoutubeLinkData } from '../utils/youtubeUtils';
import '../styles/TrackItem.css';

/**
 * TrackItem Component
 * Renders a single track in either list or card view.
 * 
 * @param {Object} props
 * @param {Object} props.track - The track data object.
 * @param {number} props.index - The visual index (1-based) for list view.
 * @param {string} props.viewMode - 'list' or 'card'.
 * @param {Function} props.handlePlay - Callback to play the track.
 * @param {string} props.selectedPlaylistUri - URI of the current playlist context.
 * @param {number} props.trackIndex - Index of the track in the playlist array.
 * @param {Function} props.formatTime - Helper to format duration ms to mm:ss.
 * @param {Set} props.likedTrackIds - Set of liked track IDs.
 * @param {Function} props.onToggleFavorite - Callback to toggle favorite status.
 * @param {Function} [props.onAddTrack] - Callback to initiate add to playlist flow.
 * @param {Function} [props.onAddToPlaylistClick] - Callback when add button is clicked.
 */
const TrackItem = ({
    track,
    index,
    viewMode,
    handlePlay,
    selectedPlaylistUri,
    trackIndex,
    formatTime,
    likedTrackIds,
    onToggleFavorite,
    onAddTrack,
    onAddToPlaylistClick
}) => {

    const handleYoutubeClick = (e) => {
        e.stopPropagation();
        openYoutubeLink(track.id);
    };

    const hasYoutubeLink = !!getYoutubeLinkData(track.id);
    const isLiked = likedTrackIds?.has(track.id);

    return (
        <div
            className={`track-item ${viewMode}`}
            onClick={() => handlePlay(track.uri, selectedPlaylistUri, trackIndex)}
        >
            {viewMode === "list" && (
                <div className="track-index">{index + 1}</div>
            )}

            <div className="track-art">
                <img src={track.album.images[0]?.url} alt={track.album.name} loading="lazy" />
                {viewMode === "card" && (
                    <div className="play-overlay">▶</div>
                )}
            </div>

            <div className="track-details">
                <div className="track-name" title={track.name}>{track.name}</div>
                <div className="track-artist" title={track.artists.map(a => a.name).join(", ")}>
                    {track.artists.map((a) => a.name).join(", ")}
                </div>
            </div>

            {viewMode === "list" && (
                <>
                    <div className="track-album" title={track.album.name}>{track.album.name}</div>
                    <div className="track-duration">
                        {formatTime(track.duration_ms)}
                    </div>

                    <div className="list-actions">
                        {hasYoutubeLink && (
                            <div
                                className="fav-btn youtube-btn track-item-youtube-btn"
                                onClick={handleYoutubeClick}
                                title="Watch on YouTube"
                            >
                                ▶
                            </div>
                        )}

                        {onToggleFavorite && (
                            <div
                                className={`fav-btn ${isLiked ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(track.id);
                                }}
                                title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
                            >
                                {isLiked ? '♥' : '♡'}
                            </div>
                        )}

                        {onAddTrack && (
                            <div
                                className="track-actions"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToPlaylistClick(track);
                                }}
                                title="Add to playlist"
                            >
                                <div className="delete-btn track-item-add-icon">+</div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* In Card View, Add Track button is standalone (Fav btn missing in original code for card?) */}
            {viewMode === "card" && onAddTrack && (
                <div
                    className="track-actions"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddToPlaylistClick(track);
                    }}
                    title="Add to playlist"
                >
                    <div className="delete-btn track-item-add-icon">+</div>
                </div>
            )}
        </div>
    );
};

export default memo(TrackItem);
