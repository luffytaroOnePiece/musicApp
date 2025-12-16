import React, { useEffect, useRef } from 'react';
import { getToken } from '../services/auth';
import '../styles/Callback.css';

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
            <div className="callback-error-container">
                <h2 className="callback-title">Login Failed</h2>
                <div className="callback-error-message">
                    {errorMsg}
                </div>
                <button
                    onClick={() => window.location.href = '/#/login'}
                    className="callback-button"
                >
                    Back to Login
                </button>
            </div>
        )
    }

    return (
        <div className="callback-loading-container">
            {status}
        </div>
    );
};

export default Callback;
