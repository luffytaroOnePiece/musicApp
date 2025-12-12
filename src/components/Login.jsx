import React from 'react';
import { loginWithSpotify } from '../services/auth';
import { redirectUri } from '../config';
import '../styles/Login.css'; // We will create this

const Login = () => {
    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Music App</h1>
                <p>Premium Spotify Client</p>
                <button onClick={loginWithSpotify} className="login-btn">
                    Connect with Spotify
                </button>

            </div>
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>
        </div>
    );
};

export default Login;
