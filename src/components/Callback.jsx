import React, { useEffect, useRef } from 'react';
import { getToken } from '../services/auth';

const Callback = () => {
    const called = useRef(false);
    const [status, setStatus] = React.useState('Processing login...');
    const [errorMsg, setErrorMsg] = React.useState(null);

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            getToken(code)
                .then(() => {
                    // Success! Clean the URL and redirect to home
                    // We use window.location.href to restart the app cleanly
                    // and let the PrivateRoute in App.jsx detect the token
                    window.location.href = '/';
                })
                .catch((error) => {
                    console.error('Token Exchange Error:', error);
                    setStatus(null);
                    setErrorMsg(error.message || 'Unknown error during token exchange');
                });
        } else {
            console.error('No code found in URL');
            setStatus(null);
            setErrorMsg('No code provided in callback URL from Spotify');
        }
    }, []);

    if (errorMsg) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: 'white',
                background: '#000',
                gap: '20px'
            }}>
                <h2 style={{ color: '#ff5555', margin: 0 }}>Login Failed</h2>
                <div style={{
                    background: '#222',
                    padding: '20px',
                    borderRadius: '8px',
                    maxWidth: '80%',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                }}>
                    {errorMsg}
                </div>
                <button
                    onClick={() => window.location.href = '/#/login'}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '20px',
                        background: '#1DB954',
                        color: 'white',
                        fontWeight: 'bold'
                    }}
                >
                    Back to Login
                </button>
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            color: 'white'
        }}>
            {status}
        </div>
    );
};

export default Callback;
