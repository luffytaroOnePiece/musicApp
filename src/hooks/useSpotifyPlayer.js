import { useState, useEffect } from 'react';
import { getAccessToken } from '../services/auth';

const useSpotifyPlayer = () => {
    const [player, setPlayer] = useState(undefined);
    const [paused, setPaused] = useState(false);
    const [active, setActive] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const token = getAccessToken();
            if (!token) return;

            const player = new window.Spotify.Player({
                name: 'Web Playback SDK Quick Start Player',
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

            player.addListener('player_state_changed', (state => {
                if (!state) {
                    return;
                }

                setPaused(state.paused);
                setCurrentTrack(state.track_window.current_track);

                player.getCurrentState().then(state => {
                    if (!state) {
                        setActive(false);
                    } else {
                        setActive(true);
                    }
                });
            }));

            player.connect();
        };
    }, []);

    return { player, paused, active, currentTrack };
}

export default useSpotifyPlayer;
