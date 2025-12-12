export const clientId = '5806d9cdf2f04f71bd7b6c0f95ca97d5';
// Automatically determine redirect URI based on current browser location
// This ensures it matches whether you use localhost, 127.0.0.1, or a custom domain.
export const redirectUri = `${window.location.origin}/callback`;

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
