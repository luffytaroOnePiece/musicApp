import React, { useState } from 'react';
import '../styles/ScriptsView.css';
import spotifyData from '../data/spotify.json';
import movieAlbums from '../data/movieAlbums.json';
import privateAlbums from '../data/privateAlbums.json';
import { getPlaylistTracks, getAlbum, addTracksToPlaylist, getAllPlaylistTracks, invalidateSpotifyCache } from '../services/spotifyApi';
import { clearTmdbCache } from '../services/tmdbApi';

const ScriptsView = () => {
    const [logs, setLogs] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [cacheCleared, setCacheCleared] = useState(false);

    const handleClearCache = () => {
        invalidateSpotifyCache();
        clearTmdbCache();
        setCacheCleared(true);
        setTimeout(() => setCacheCleared(false), 3000);
    };

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
    };

    const fetchAllTracksFromSource = async (sourceId) => {
        // Try playlist first
        try {
            const data = await getPlaylistTracks(sourceId);
            if (data && data.items) {
                return data.items.map(item => item.track.uri).filter(uri => uri && uri.startsWith('spotify:track:'));
            }
        } catch (e) {
            // Ignore error, try album next
        }

        // Try album
        try {
            const data = await getAlbum(sourceId);
            if (data && data.tracks && data.tracks.items) {
                return data.tracks.items.map(item => item.uri).filter(uri => uri && uri.startsWith('spotify:track:'));
            }
        } catch (e) {
            // console.warn(`Failed to fetch tracks for ${sourceId}`, e);
        }

        return [];
    };

    const handleSyncLanguage = async (language) => {
        if (isSyncing) return;
        setIsSyncing(true);
        // setLogs([]); // Optional: clear logs or append? Let's clear for clarity of current action
        // Actually for per language, maybe we just append to a general log or clear.
        // Let's clear to keep it clean.
        setLogs([]);
        addLog(`Starting sync for ${language}...`);

        try {
            const allSources = { ...movieAlbums, ...privateAlbums };
            const targetPlaylistId = spotifyData[language];

            if (!targetPlaylistId) {
                addLog(`No target playlist found for ${language}`, 'error');
                setIsSyncing(false);
                return;
            }

            // Find all source albums for this language
            const matchingSources = Object.entries(allSources).filter(([id, data]) => {
                return data.language === language;
            });

            addLog(`Found ${matchingSources.length} source albums for ${language}`);

            let allTrackUris = [];

            for (const [sourceId, data] of matchingSources) {
                addLog(`Fetching tracks from ${data.name} (${data.type})...`);
                const uris = await fetchAllTracksFromSource(sourceId);
                if (uris.length > 0) {
                    allTrackUris = [...allTrackUris, ...uris];
                } else {
                    addLog(`  No tracks found or error for ${data.name}`, 'error');
                }

                // Add delay to avoid specific rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Deduplicate URIs
            const uniqueSourceUris = [...new Set(allTrackUris)];
            addLog(`Total unique source tracks for ${language}: ${uniqueSourceUris.length}`);

            // Fetch existing tracks in target playlist to prevent duplicates
            addLog(`Fetching existing tracks from target playlist...`);
            const existingData = await getAllPlaylistTracks(targetPlaylistId);
            const existingUris = new Set(
                existingData.items
                    .map(item => item.track?.uri)
                    .filter(uri => uri)
            );
            addLog(`Found ${existingUris.size} existing tracks in target.`);

            // Filter out tracks that are already in the playlist
            const newUrisAsString = uniqueSourceUris.filter(uri => !existingUris.has(uri));

            if (newUrisAsString.length > 0) {
                addLog(`Adding ${newUrisAsString.length} new tracks to ${language} playlist (${uniqueSourceUris.length - newUrisAsString.length} skipped)...`);
                await addTracksToPlaylist(targetPlaylistId, newUrisAsString);
                addLog(`Successfully added tracks to ${language}`, 'success');
            } else {
                addLog(`No new tracks to add for ${language} (all ${uniqueSourceUris.length} already exist)`, 'info');
            }

            addLog(`Sync for ${language} completed!`, 'success');

        } catch (err) {
            console.error(err);
            addLog(`Sync failed: ${err.message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    };



    return (
        <div className="scripts-view">
            <div className="scripts-header">
                <h2>Scripts</h2>
                <p>Manage and automate your music library</p>
            </div>

            <div className="scripts-grid">
                {Object.keys(spotifyData).map(language => (
                    <div className="script-card" key={language}>
                        <h3>Sync {language}</h3>
                        <p>
                            Syncs all {language} tracks from local data to the
                            <strong> {language}</strong> Spotify playlist.
                        </p>
                        <br />
                        <button
                            className="sync-btn"
                            onClick={() => handleSyncLanguage(language)}
                            disabled={isSyncing}
                        >
                            {isSyncing ? 'Syncing...' : `Sync ${language}`}
                        </button>
                    </div>
                ))}

                {/* New Script: Extract YouTube IDs */}
                {/* New Script: Extract YouTube IDs */}
                <div className="script-card">
                    <h3>Extract YouTube IDs</h3>
                    <p>
                        Run the extraction script to save all YouTube IDs to <code>src/data/youtubeIdsByLanguage.json</code>.
                    </p>
                    <br />
                    <code style={{ display: 'block', padding: '10px', background: '#1a1a1a', borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace' }}>
                        npm run extract-ids
                    </code>
                </div>

                {/* Force Clear Cache */}
                <div className="script-card">
                    <h3>🗑️ Force Clear Cache</h3>
                    <p>
                        Clears all in-memory cached responses for both
                        <strong> Spotify</strong> and <strong> TMDB</strong> APIs.
                        Next requests will fetch fresh data from the network.
                    </p>
                    <br />
                    <button
                        className={`sync-btn ${cacheCleared ? 'cache-cleared' : ''}`}
                        onClick={handleClearCache}
                    >
                        {cacheCleared ? '✔ Cache Cleared!' : 'Clear All Cache'}
                    </button>
                </div>
            </div>

            {logs.length > 0 && (
                <div className="log-container">
                    <h3>Logs</h3>
                    <div className="log-output">
                        {logs.map((log, index) => (
                            <div key={index} className={`log-entry ${log.type}`}>
                                <span className="log-time">[{log.timestamp}]</span> {log.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


export default ScriptsView;
