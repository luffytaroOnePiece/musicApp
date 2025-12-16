# Music Web App - Project Structure

This document provides a high-level overview of the project structure to assist AI agents and developers in navigating the codebase.

## Root Directory
- **`src/`**: Contains the source code for the React application.
- **`public/`**: Static assets.
- **`index.html`**: Entry HTML file.
- **`vite.config.js`**: Vite configuration.
- **`package.json`**: Dependencies and scripts.

## Source Directory (`src`)

### Entry Points
- **`main.jsx`**: Application entry point. Mounts the React app.
- **`App.jsx`**: Main application wrapper. Handles authentication state (login vs. dashboard).

### Components (`src/components/`)
UI components are located here. The application follows a modular design.

- **`Login.jsx`**: Landing page for user authentication via Spotify.
- **`Dashboard.jsx`**: The main controller component for the authenticated view. Manages state for:
    - Spotify Player (playback, volume, seek).
    - Playlists and Tracks data.
    - Navigation (View modes: Home, Playlist, YouTube, Stats).
    - Search functionality.
    - Theme switching.
- **`Sidebar.jsx`**: Left navigation bar (Home, YouTube, Zen Mode, Stats).
- **`TopBar.jsx`**: Top navigation bar containing search, theme toggle, and user info.
- **`PlayerBar.jsx`**: Bottom persistent player controls (play/pause, skip, volume).
- **`FullPlayer.jsx`**: Expanded full-screen player view with album art and detailed controls.
- **`HomeView.jsx`**: Dashboard home view displaying user playlists.
- **`PlaylistView.jsx`**: Detailed view of a selected playlist. Handles:
    - Track listing (List and Grid views).
    - Sorting and Filtering.
    - Playlist actions (Play, Shuffle).
- **`TrackItem.jsx`**: Reusable component for rendering a single track in a playlist. extracted from `PlaylistView.jsx`.
- **`YouTubeView.jsx`**: Dedicated view for browsing and playing YouTube videos.
- **`StatsView.jsx`**: Displays user listening statistics (Top Artists, Tracks, Genres).
- **`ZenMode.jsx`**: A simplified, distraction-free player mode.
- **`GlossySelect.jsx`**: A custom styled dropdown component.
- **`Callback.jsx`**: Handles the Spotify OAuth callback.
- **`youtube/`**: Sub-components for YouTube functionality.
    - `YouTubeCard.jsx`: Displays a single YouTube video thumbnail.
    - `YouTubeFilters.jsx`: Filter chips for YouTube search.

### Services (`src/services/`)
Encapsulates external API interactions.

- **`spotifyApi.js`**: Functions for interacting with the Spotify Web API (fetch playlists, tracks, player controls).
- **`auth.js`**: Handles Spotify OAuth flow (login URL, token extraction).

### Hooks (`src/hooks/`)
Custom React hooks.

- **`useSpotifyPlayer.js`**: Hook to initialize and manage the Spotify Web Playback SDK instance. Returns player state and controls.

### Data (`src/data/`)
Static data files.

- **`youtubeLinks.json`**: Maps Spotify Track IDs to YouTube Video IDs for the "Watch on YouTube" feature.
- **`zenMode.json`**: Configuration for Zen Mode (backgrounds, audio sources).

### Styles (`src/styles/`)
CSS files correspond one-to-one with components (e.g., `Dashboard.css`, `PlaylistView.css`). `index.css` contains global styles and variables.

## Key Relationships
1.  **`App.jsx`** conditionally renders `Login` or `Dashboard` based on the URL hash (token presence).
2.  **`Dashboard.jsx`** acts as the central hub, passing state and handlers down to `Sidebar`, `TopBar`, and the active main view (`HomeView`, `PlaylistView`, etc.).
3.  **`useSpotifyPlayer`** provides the real-time playback state used by `PlayerBar` and `FullPlayer`.
