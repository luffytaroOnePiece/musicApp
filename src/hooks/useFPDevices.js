import { useState, useEffect, useRef } from 'react';
import { getAvailableDevices, transferPlayback } from '../services/spotifyApi';

const useFPDevices = () => {
    const [devices, setDevices] = useState([]);
    const [showDevices, setShowDevices] = useState(false);
    const devicesRef = useRef(null);

    // Close devices popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (devicesRef.current && !devicesRef.current.contains(event.target)) {
                setShowDevices(false);
            }
        };

        if (showDevices) {
            document.addEventListener('mousedown', handleClickOutside);
            fetchDevices();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDevices]);

    const fetchDevices = async () => {
        try {
            const data = await getAvailableDevices();
            setDevices(data.devices || []);
        } catch (error) {
            console.error('Error fetching devices:', error);
        }
    };

    const handleDeviceSelect = async (deviceId) => {
        try {
            await transferPlayback(deviceId, true);
            setShowDevices(false);
        } catch (error) {
            console.error('Error transferring playback:', error);
        }
    };

    return {
        devices,
        showDevices,
        setShowDevices,
        devicesRef,
        handleDeviceSelect
    };
};

export default useFPDevices;
