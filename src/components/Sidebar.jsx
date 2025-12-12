import React from 'react';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, playlists, selectedPlaylist, handleSelectPlaylist, loading, error }) => {
    return (
        <div className={`sidebar ${!isSidebarOpen ? 'hidden' : ''}`}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#b3b3b3' }}>Your Library</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="sidebar-toggle-btn" title="Hide Library">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                </div>
            </div>
            <ul className="playlist-list">
                {loading && <li style={{ padding: '12px 16px', color: '#888' }}>Loading...</li>}
                {error && <li style={{ padding: '12px 16px', color: 'red' }}>{error}</li>}
                {!loading && !error && playlists.length === 0 && <li style={{ padding: '12px 16px', color: '#888' }}>No playlists found</li>}
                {playlists.map(p => (
                    <li key={p.id} onClick={() => handleSelectPlaylist(p)} className={selectedPlaylist?.id === p.id ? 'active' : ''}>
                        {p.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
