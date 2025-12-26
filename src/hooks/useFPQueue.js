import { useState, useEffect, useRef } from 'react';
import { getAvailableDevices, playTrack, setRepeat } from '../services/spotifyApi';

const useFPQueue = ({ player, savedContext, queueContext }) => {
    const [showQueue, setShowQueue] = useState(false);
    const queueRef = useRef(null);

    // Close queue when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside BOTH queue popup AND the toggle button (to avoid immediate reopen)
            // Note: The toggle button check is usually handled by keeping the button ref or just checking strict containment in the popup
            // In the original code, it was: if (queueRef.current && !queueRef.current.contains(event.target))
            if (queueRef.current && !queueRef.current.contains(event.target)) {
                setShowQueue(false);
            }
        };

        if (showQueue) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showQueue]);

    const toggleQueue = () => {
        setShowQueue(!showQueue);
    };

    const handleQueueTrackClick = async (trackUri) => {
        if (!player) return;

        try {
            const devicesData = await getAvailableDevices();
            const activeDevice = devicesData.devices.find(d => d.is_active);
            const targetDeviceId = activeDevice ? activeDevice.id : devicesData.devices[0]?.id;

            if (targetDeviceId) {
                // Priority 1: Use the Passed Queue Context (from Dashboard)
                // Priority 2: Use the Captured Queue Context (from API - legacy/backup)
                // Priority 3: Fallback to sticky context

                let contextUriToUse = queueContext;

                if (!contextUriToUse && savedContext) {
                    contextUriToUse = savedContext;
                }

                // If context is an array (list of URIs), find the index
                if (Array.isArray(contextUriToUse)) {
                    const trackIndex = contextUriToUse.indexOf(trackUri);
                    if (trackIndex !== -1) {
                        await playTrack(targetDeviceId, contextUriToUse, trackIndex);
                    } else {
                        // Fallback: just play the track if not in list
                        await playTrack(targetDeviceId, trackUri);
                    }
                }
                // If context is a string (Playlist/Album URI)
                else if (typeof contextUriToUse === 'string') {
                    await playTrack(targetDeviceId, contextUriToUse, { uri: trackUri });
                }
                // Fallback: No context
                else {
                    await playTrack(targetDeviceId, trackUri);
                }

                // Close queue immediately
                setShowQueue(false);

                // AGGRESSIVE FIX: Force Repeat OFF again after delay
                setTimeout(async () => {
                    try {
                        await setRepeat('off', targetDeviceId);
                    } catch (err) {
                        console.error("Post-play repeat disable failed:", err);
                    }
                }, 1000);
            }
        } catch (e) {
            console.error("Error playing queue track:", e);
        }
    };

    return {
        showQueue,
        toggleQueue,
        handleQueueTrackClick,
        queueRef
    };
};

export default useFPQueue;
