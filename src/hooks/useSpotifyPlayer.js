import { useState, useEffect } from 'react';
import { getAccessToken } from '../services/auth';

const useSpotifyPlayer = () => {
    const [player, setPlayer] = useState(undefined);
    const [paused, setPaused] = useState(false);
    const [active, setActive] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [context, setContext] = useState(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const token = getAccessToken();
            if (!token) return;

            const player = new window.Spotify.Player({
                name: 'Music App Premium Player',
                getOAuthToken: cb => { cb(token); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('initialization_error', ({ message }) => {
                console.error('Failed to initialize', message);
            });

            player.addListener('authentication_error', ({ message }) => {
                console.error('Failed to authenticate', message);
            });

            player.addListener('account_error', ({ message }) => {
                console.error('Failed to validate Spotify account', message);
            });

            player.addListener('playback_error', ({ message }) => {
                console.error('Failed to perform playback', message);
            });

            player.addListener('player_state_changed', (state => {
                if (!state) {
                    return;
                }

                setPaused(state.paused);
                setCurrentTrack(state.track_window.current_track);
                setDuration(state.duration);
                setPosition(state.position);
                setContext(state.context); // Capture context

                player.getCurrentState().then(state => {
                    setActive(!!state);
                });
            }));

            player.connect();
        };

        return () => {
            // Cleanup: Disconnect player if component unmounts
            // Note: We can't access 'player' variable here directly if it's inside the window callback scope
            // But we can keep a reference if we restructure, or we can just rely on the fact that 
            // setPlayer sets the state, but state is not available in cleanup of the same effect run (stale closure).
            // Actually, we can define player variable outside the callback? No, it's async.
            // Better strategy: We can't easily clean up the *first* instance if it's created asynchronously inside.
            // But we can store it in a ref or move the creation logic.
        };
    }, []);

    // New Effect for cleanup based on player state
    useEffect(() => {
        return () => {
            if (player) {
                console.log("Disconnecting Spotify Player...");
                player.disconnect();
            }
        };
    }, [player]);

    // Update position every second when playing
    useEffect(() => {
        if (!player || paused) return;

        const interval = setInterval(() => {
            player.getCurrentState().then(state => {
                if (state) {
                    setPosition(state.position);
                }
            }).catch(e => console.warn("Polling state failed", e));
        }, 1000);

        return () => clearInterval(interval);
    }, [player, paused]);

    return { player, paused, active, currentTrack, duration, position, context };
}

export default useSpotifyPlayer;
