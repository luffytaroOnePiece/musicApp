import React from 'react';
import AlbumFilters from './AlbumFilters';

const AlbumsHeader = ({
    viewMode,
    setViewMode,
    selectedType,
    setSelectedType,
    selectedSort,
    setSelectedSort,
    selectedLanguage,
    setSelectedLanguage,
    types,
    languages,
    onReset
}) => {
    return (
        <div className="albums-list-header">
            <div className="header-top-row">
                <h2>Collections</h2>
                <div className="view-mode-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'albums' ? 'active' : ''}`}
                        onClick={() => setViewMode('albums')}
                    >
                        Albums
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'all-songs' ? 'active' : ''}`}
                        onClick={() => setViewMode('all-songs')}
                    >
                        All Songs
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'live' ? 'active' : ''}`}
                        onClick={() => setViewMode('live')}
                    >
                        Live
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'others' ? 'active' : ''}`}
                        onClick={() => setViewMode('others')}
                    >
                        Others
                    </button>
                </div>
            </div>

            <div className="album-filters-wrapper">
                <AlbumFilters
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    selectedSort={selectedSort}
                    setSelectedSort={setSelectedSort}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    types={types}
                    languages={languages}
                    onReset={onReset}
                />
            </div>
        </div>
    );
};

export default AlbumsHeader;
