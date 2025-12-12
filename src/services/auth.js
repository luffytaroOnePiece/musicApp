import { clientId, redirectUri, scopes } from '../config';

const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export const loginWithSpotify = async () => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    window.localStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = {
        response_type: 'code',
        client_id: clientId,
        scope: scopes.join(' '),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
    };

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}

export const getToken = async (code) => {
    const codeVerifier = window.localStorage.getItem('spotify_code_verifier');

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    }

    const response = await fetch('https://accounts.spotify.com/api/token', payload);
    const data = await response.json();

    if (response.ok) {
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
        localStorage.setItem('spotify_expires_in', data.expires_in);
        localStorage.setItem('spotify_token_timestamp', Date.now());
        return data.access_token;
    } else {
        console.error('Error fetching token:', data);
        throw new Error(`Failed to get token: ${data.error} - ${data.error_description || ''}`);
    }
}

export const refreshToken = async () => {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) return null;

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
        }),
    }

    const response = await fetch('https://accounts.spotify.com/api/token', payload);
    const data = await response.json();

    if (response.ok) {
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_timestamp', Date.now());
        if (data.refresh_token) {
            localStorage.setItem('spotify_refresh_token', data.refresh_token);
        }
        return data.access_token;
    } else {
        // Refresh token invalid, logout
        logout();
        return null;
    }
}

export const logout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_code_verifier');
    localStorage.removeItem('spotify_expires_in');
    localStorage.removeItem('spotify_token_timestamp');
    window.location.href = '/';
}

export const getAccessToken = () => {
    const accessToken = localStorage.getItem('spotify_access_token');
    const timestamp = localStorage.getItem('spotify_token_timestamp');
    const expiresIn = localStorage.getItem('spotify_expires_in');

    if (!accessToken) return null;

    // Check if expired (give 5 min buffer)
    if (Date.now() - parseInt(timestamp) > (parseInt(expiresIn) - 300) * 1000) {
        // Ideally we auto-refresh here, but for async simplicity we will just return null 
        // or trigger refresh which is async. 
        // For this simple impl, we can try to return the current one and let the caller handle 401, 
        // or better, implement a wrapper that checks validity.
        // Let's rely on the app logic to call refreshToken() if 401.
        return accessToken;
    }

    return accessToken;
}
