import React from 'react';

const FPDevices = ({ showDevices, setShowDevices, devices, handleDeviceSelect, devicesRef }) => {
    return (
        <div className="fp-devices-container" ref={devicesRef}>
            <button
                className={`control-btn secondary fp-device-btn ${showDevices || (devices.length > 0 && devices.find(d => d.is_active)?.type !== 'Computer') ? 'active' : ''}`}
                onClick={() => setShowDevices(!showDevices)}
                title="Connect to a device"
            >
                <svg role="img" height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-6.5zm-6 0a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25H4V11H1.75A1.75 1.75 0 0 1 0 9.25v-6.5C0 1.784.784 1 1.75 1H4v1.5H1.75zM4 15H2v-1.5h2V15z"></path>
                    <path d="M13 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
                </svg>
            </button>

            {showDevices && (
                <div className="fp-devices-list">
                    <div className="fp-devices-header">
                        <h3>Connect to a device</h3>
                        <img src="https://open.spotifycdn.com/cdn/images/device-picker-header.png" alt="Devices" className="fp-devices-header-img" />
                    </div>
                    {devices.length > 0 ? (
                        <ul>
                            {devices.map(device => (
                                <li
                                    key={device.id}
                                    className={`fp-device-item ${device.is_active ? 'active-device' : ''}`}
                                    onClick={() => handleDeviceSelect(device.id)}
                                >
                                    <div className="fp-device-icon">
                                        {device.type === 'Smartphone' ? (
                                            <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-7zM4 3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 13V3z"></path></svg>
                                        ) : device.type === 'Computer' ? (
                                            <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3zm2-½a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H3zM1 14.5A1.5 1.5 0 0 1 2.5 13h11a1.5 1.5 0 0 1 1.5 1.5v.5h-15v-.5z"></path></svg>
                                        ) : (
                                            <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-6.5zm-6 0a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25H4V11H1.75A1.75 1.75 0 0 1 0 9.25v-6.5C0 1.784.784 1 1.75 1H4v1.5H1.75zM4 15H2v-1.5h2V15z"></path></svg>
                                        )}
                                    </div>
                                    <div className="fp-device-info">
                                        <span className={`fp-device-name ${device.is_active ? 'active-text' : ''}`}>{device.name}</span>
                                        <span className="fp-device-model">{device.type} • {device.is_active ? 'Active' : 'Spotify Connect'}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="fp-no-devices">No devices found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FPDevices;
