import React, { useState, useEffect, useRef } from 'react';
import YouTubeCard from '../youtube/YouTubeCard';
import '../../styles/albums/AlbumDetail.css';
import '../../styles/AlbumFilters.css';

const AlbumTracks = ({
    viewMode,
    albumOthers,
    visibleTracks,
    tracks,
    localData,
    handleVideoClick,
    onPlay,
    localSearchTerm,
    setLocalSearchTerm,
    sortOrder,
    setSortOrder
}) => {

    // Dropdown Component (internal)
    const DetailDropdown = ({ label, selected, onSelect, options }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);

        const isActive = selected && selected !== "Original" && selected !== "Default";

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        return (
            <div className="filter-chip-dropdown" ref={dropdownRef}>
                <button
                    className={`filter-chip ${isActive ? 'filter-chip--active' : ''} ${isOpen ? 'filter-chip--open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="filter-chip-label">{label}</span>
                    <span className="filter-chip-value">{selected}</span>
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`filter-chip-arrow ${isOpen ? 'open' : ''}`}
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                {isOpen && (
                    <div className="filter-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: 160 }}>
                        {options.map((option) => (
                            <button
                                key={option}
                                className={`filter-dropdown-item ${selected === option ? "filter-dropdown-item--active" : ""}`}
                                onClick={() => {
                                    onSelect(option);
                                    setIsOpen(false);
                                }}
                            >
                                <span>{option}</span>
                                {selected === option && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="album-controls-bar">
                <div className="search-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Find in this album..."
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                    />
                </div>

                <div className="sort-dropdown">
                    <DetailDropdown
                        label="Sort by"
                        selected={sortOrder}
                        onSelect={setSortOrder}
                        options={['Original', 'Title', 'Duration', 'Date Added', 'Date Published']}
                    />
                </div>
            </div>

            <div className="album-tracks-grid">
                {viewMode === 'others' ? (
                    albumOthers.map((item, index) => (
                        <YouTubeCard
                            key={item.id}
                            trackId={`other-${index}`}
                            data={{
                                name: item.name,
                                youtubelinkID: item.id,
                                genre: item.type,
                                format: "HD"
                            }}
                            handlePlay={() => handleVideoClick(item.id, item.name)}
                        />
                    ))
                ) : (
                    visibleTracks.map((item) => {
                        const track = item.track;
                        if (!track) return null;

                        // Locate original index for Youtube Mapping
                        const originalIndex = tracks.findIndex(raw => raw.track && raw.track.id === track.id);
                        if (originalIndex === -1) return null;

                        const ytIdRaw = localData.youtubeIDs[originalIndex];
                        if (!ytIdRaw) return null;

                        const ytIds = ytIdRaw.split(',');

                        if (viewMode === 'live') {
                            // Display live versions (index 1+)
                            const liveIds = ytIds.slice(1);
                            if (liveIds.length === 0) return null; // Or return a placeholder?

                            return liveIds.map((liveId, i) => {
                                const cardData = {
                                    name: `${track.name} (Live ${i + 1})`,
                                    youtubelinkID: liveId.trim(),
                                    genre: "Live",
                                    format: localData.format || "HD"
                                };
                                return (
                                    <YouTubeCard
                                        key={`${track.id}-live-${i}`}
                                        trackId={track.id}
                                        data={cardData}
                                        handlePlay={() => handleVideoClick(liveId.trim(), cardData.name)}
                                    />
                                );
                            });

                        } else {
                            // Display original version (index 0)
                            const originalId = ytIds[0];
                            const cardData = {
                                name: track.name,
                                youtubelinkID: originalId.trim(),
                                genre: track.album && track.album.release_date ? new Date(track.album.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : (localData.type || "Playlist"),
                                format: localData.format || "HD"
                            };

                            return (
                                <YouTubeCard
                                    key={item.id}
                                    trackId={item.track.id}
                                    data={cardData}
                                    handlePlay={() => onPlay(track.uri)}
                                />
                            );
                        }
                    })
                )}
            </div>
        </>
    );
};

export default AlbumTracks;
