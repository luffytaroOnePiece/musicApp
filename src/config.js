export const clientId = '5806d9cdf2f04f71bd7b6c0f95ca97d5';
// For GitHub Pages, we redirect to the main app URL (root) to avoid 404s on subpaths.
const getBaseUrl = () => {
    return window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");
};

// Localhost uses /callback, Production uses the App Root.
// Localhost uses /callback, Production uses the App Root with repo name.
export const redirectUri = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5173/callback'
    : 'https://luffytaroonepiece.github.io/musicApp';

// However, user might deploy to subpath. 
// A safer bet for GitHub Pages is constructing it based on the current URL foundation or hardcoding if known.
// Since we don't know the GH Pages URL yet, we'll try to auto-detect or default to local.

export const scopes = [
    'user-read-private',
    'user-read-email',
    'streaming',
    'app-remote-control',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-library-read',
    'user-library-modify',
    'playlist-read-private',
    'playlist-read-collaborative'
];
