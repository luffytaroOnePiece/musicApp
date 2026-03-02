import React, { useEffect, useState } from "react";
import {
  getUserPlaylists,
  getPlaylistTracks,
  playTrack,
  searchTracks,
  removeTrackFromPlaylist,
  checkUserSavedTracks,
  saveTracks,
  removeSavedTracks,
  getUserSavedTracks,
  getArtistTopTracks,
  getAlbum,
  nextTrack,
  prevTrack,
  pauseTrack,
  resumePlayback,
  seekTrack,
} from "../services/spotifyApi";
import useSpotifyPlayer from "../hooks/useSpotifyPlayer";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import HomeView from "./HomeView";
import PlaylistView from "./PlaylistView";
import YouTubeView from "./YouTubeView";
import AlbumsView from "./AlbumsView";
import PlayerBar from "./PlayerBar";
import StatsView from "./StatsView";
import ArtistsView from "./ArtistsView";
import ExploreView from "./ExploreView";
import MoviesView from "./MoviesView";

import LiveView from "./LiveView";
import YoutubeMixView from "./YoutubeMixView";
import YouTubeMusicView from "./YouTubeMusicView";

import FullPlayer from "./FullPlayer";
import ZenMode from "./ZenMode";

import UserProfile from "./UserProfile";
import ScriptsView from "./ScriptsView";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { player, paused, currentTrack, duration, position, context } =
    useSpotifyPlayer();

  // Data State
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search State
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'card'
  const [currentTheme, setCurrentTheme] = useState("pure-dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState(new Set()); // Set of strings
  const [lastActivePlaylistContext, setLastActivePlaylistContext] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [showAlbums, setShowAlbums] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [showMixes, setShowMixes] = useState(false);
  const [showArtists, setShowArtists] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [showMovies, setShowMovies] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [showYtMusic, setShowYtMusic] = useState(false);
  const [albumsResetToken, setAlbumsResetToken] = useState(0);

  const themes = [
    { id: "ocean-depths", name: "Ocean Depths" },
    { id: "sunset-vibes", name: "Sunset Vibes" },
    { id: "midnight-nebula", name: "Midnight Nebula" },
    { id: "forest-rain", name: "Forest Rain" },
    { id: "cyber-city", name: "Cyber City" },
    { id: "royal-velvet", name: "Royal Velvet" },
    { id: "pure-dark", name: "Pure Dark" },
  ];

  // Fetch Playlists on Mount
  useEffect(() => {
    setLoading(true);
    getUserPlaylists()
      .then((data) => {
        const userPlaylists = data.items || [];
        const likedSongsPlaylist = {
          id: "liked-songs",
          name: "Liked Songs",
          images: [
            { url: "https://misc.scdn.co/liked-songs/liked-songs-300.png" },
          ], // Standard Spotify Liked Songs cover or similar
          owner: { display_name: "You" },
          description: "Your saved tracks",
        };
        setPlaylists([likedSongsPlaylist, ...userPlaylists]);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load playlists. Please refresh or login again.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen for Player Ready
  useEffect(() => {
    if (player) {
      player.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);
      });
    }
  }, [player]);

  // Track Last Active Playlist Context
  useEffect(() => {
    if (context && context.uri && context.uri.includes('spotify:playlist')) {
      setLastActivePlaylistContext(context.uri);
    } else if (context && context.uri && context.uri.includes('spotify:album')) {
      setLastActivePlaylistContext(context.uri);
    }
  }, [context]);

  // Check Favorites Status
  useEffect(() => {
    const checkFavorites = async () => {
      if (tracks.length === 0) return;
      // Get unique IDs only
      const ids = [...new Set(tracks.map((t) => t.id).filter((id) => id))];
      if (ids.length === 0) return;

      try {
        const results = await checkUserSavedTracks(ids);
        const newLiked = new Set();
        results.forEach((isLiked, index) => {
          if (isLiked) newLiked.add(ids[index]);
        });
        setLikedTrackIds(newLiked);
      } catch (err) {
        console.error("Failed to check favorites", err);
      }
    };
    checkFavorites();
  }, [tracks]); // Re-run when tracks change

  // Handlers
  const handleSelectPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist);
    setSearchResults(null); // Clear search results when selecting playlist
    setSearchTerm(""); // Clear search term when selecting playlist

    try {
      if (playlist.type === 'album') {
        const data = await getAlbum(playlist.id);
        const albumTracks = data.tracks.items.map((t) => ({
          ...t,
          album: data, // Attach full album data for cover art
          added_at: data.release_date,
        }));
        setTracks(albumTracks);
      } else if (playlist.id === "liked-songs") {
        const data = await getUserSavedTracks();
        setTracks(
          data.items.map((item) => ({
            ...item.track,
            added_at: item.added_at,
          }))
        );
      } else {
        const data = await getPlaylistTracks(playlist.id);
        setTracks(
          data.items.map((item) => ({
            ...item.track,
            added_at: item.added_at,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load tracks", err);
    }
  };

  const handleExploreSelect = async (item, type) => {
    try {
      if (type === "artist") {
        const data = await getArtistTopTracks(item.id);
        // Artist top tracks usually have album info on them
        setTracks(data.tracks);
        setSelectedPlaylist({
          name: item.name,
          description: "Artist Top Tracks",
          images: item.images,
          owner: { display_name: "Artist" },
          uri: item.uri,
          id: item.id,
          source: "explore",
        });
      } else if (type === "album") {
        const data = await getAlbum(item.id);
        // Album tracks don't always have the full album object attached to each track
        // We need to attach it so TrackItem can render cover art
        const albumTracks = data.tracks.items.map((t) => ({
          ...t,
          album: data, // Attach the full album object to the track
        }));
        setTracks(albumTracks);
        setSelectedPlaylist({
          name: data.name,
          description: `Album • ${data.release_date.split("-")[0]}`,
          images: data.images,
          owner: { display_name: data.artists[0].name },
          uri: data.uri,
          id: data.id,
          source: "explore",
        });
      }

      // Keep isExploreOpen true to maintain sidebar state
      setSearchResults(null);
      setIsSearching(false);
      setSearchTerm(""); // Clear search request
    } catch (err) {
      console.error("Failed to load explore item", err);
    }
  };

  const performSearch = async () => {
    if (!searchTerm) return;

    // If in Explore mode, we don't trigger global track search
    // ExploreView listens to searchTerm changes directly
    if (isExploreOpen) return;

    setIsSearching(true);
    setSearchResults(null);
    setSelectedPlaylist(null); // Clear playlist selection

    try {
      const data = await searchTracks(searchTerm);
      setSearchResults(data.tracks.items);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlay = (trackUri, contextUri = null, offset = 0, incomingTracks = null) => {
    if (!deviceId) {
      console.warn("Player not ready yet");
      alert("Spotify Player is connecting... Please wait a moment.");
      return;
    }

    // If incoming tracks are provided (e.g. from YouTube view), update the tracks state
    // so the player knows what the current "queue" is.
    if (incomingTracks && Array.isArray(incomingTracks)) {
      setTracks(incomingTracks);
      setSearchResults(null);
      setSelectedPlaylist(null); // Clear specific playlist context
      setSearchTerm("");
    }

    // Determine which list of tracks to use
    // If incomingTracks was just set, we use that (via the arg, as state takes a render to update)
    const activeTracks = incomingTracks || searchResults || tracks;

    // If contextUri is provided (playlist/album) and it's a real Spotify context, play that
    // However, for search results, contextUri is usually empty or custom.
    if (
      contextUri &&
      !Array.isArray(contextUri) &&
      contextUri.includes("spotify:") &&
      !contextUri.includes(":artist:")
    ) {
      playTrack(deviceId, contextUri, offset);
    } else {
      // Otherwise, play the current list of tracks (search results or playlist) as a queue
      // If contextUri is an array (e.g. from Shuffle), use it.
      // Otherwise derive from active tracks.
      let uris = Array.isArray(contextUri)
        ? contextUri
        : activeTracks.map((t) => t.uri);

      // If the passed trackUri is in our list, use its index as offset
      // otherwise fallback to passed offset or 0
      let trackIndex = trackUri ? uris.indexOf(trackUri) : -1;
      let finalOffset = trackIndex !== -1 ? trackIndex : offset;

      // FALLBACK: If track not in list (or list empty), play just this track
      if (trackIndex === -1 && trackUri) {
        uris = [trackUri];
        finalOffset = 0;
      }

      if (uris.length > 0) {
        playTrack(deviceId, uris, finalOffset);
      }
    }
  };

  const handleSeek = (e) => {
    // Optimistic local update (optional, but good for UX)
    // if (player) player.seek(e.target.value * 1000); 

    // Remote seek
    seekTrack(Math.round(e.target.value * 1000)).catch(err => console.error("Seek failed", err));
  };

  const handleVolume = (e) => {
    if (player) player.setVolume(e.target.value / 100);
  };

  // Remote Control Handlers
  const handleTogglePlay = async () => {
    try {
      if (paused) {
        await resumePlayback();
      } else {
        await pauseTrack();
      }
    } catch (err) {
      console.error("Failed to toggle play", err);
    }
  };

  const handleNext = async () => {
    try {
      await nextTrack();
    } catch (err) {
      console.error("Failed to skip next", err);
    }
  };

  const handlePrev = async () => {
    try {
      await prevTrack();
    } catch (err) {
      console.error("Failed to skip previous", err);
    }
  };

  const handleRemoveTrack = async (trackUri) => {
    if (!selectedPlaylist) return;

    // Optimistic UI update
    const originalTracks = [...tracks];
    setTracks(tracks.filter((t) => t.uri !== trackUri));

    try {
      if (selectedPlaylist.id === "liked-songs") {
        // Determine track ID from URI (spotify:track:ID)
        const trackId = trackUri.split(":").pop();
        await removeSavedTracks([trackId]);
        // Update liked state map too
        const nextLiked = new Set(likedTrackIds);
        nextLiked.delete(trackId);
        setLikedTrackIds(nextLiked);
      } else {
        await removeTrackFromPlaylist(selectedPlaylist.id, trackUri);
      }
    } catch (err) {
      console.error("Failed to remove track", err);
      setTracks(originalTracks);
      alert("Failed to remove track");
    }
  };

  const handleToggleFavorite = async (trackId) => {
    const isLiked = likedTrackIds.has(trackId);
    // Optimistic update
    const nextLiked = new Set(likedTrackIds);
    if (isLiked) nextLiked.delete(trackId);
    else nextLiked.add(trackId);
    setLikedTrackIds(nextLiked);

    try {
      if (isLiked) {
        await removeSavedTracks([trackId]);
      } else {
        await saveTracks([trackId]);
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      // Revert
      setLikedTrackIds(likedTrackIds);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const goHome = () => {
    setSelectedPlaylist(null);
    setSearchTerm(""); // Optional: clear search on home
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
    setShowYtMusic(false);
  };

  const handleShowYoutube = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(true);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
  };

  const handleShowAlbums = () => {
    // If already showing albums, increment token to trigger reset
    if (showAlbums) {
      setAlbumsResetToken(prev => prev + 1);
    }

    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(true);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
  };

  const handleShowLive = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(true);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
  };

  const handleShowMixes = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(true);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
    setShowYtMusic(false);
  };

  const handleShowYtMusic = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
    setShowYtMusic(true);
  };

  const handleShowArtists = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(true);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
  };

  const handleShowZenMode = () => {
    setIsZenModeOpen(true);
  };

  const handleShowStats = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(true);
    setIsProfileOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
  };

  const handleShowProfile = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(true);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(false);
  };

  const handleShowExplore = () => {
    setSelectedPlaylist(null); // Clear selected playlist when explicitly clicking Explore tab
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(true);
    setShowMovies(false);
    setShowScripts(false);
  };

  const handleShowMovies = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(true);
    setShowScripts(false);
  };

  const handleShowScripts = () => {
    setSelectedPlaylist(null);
    setSearchResults(null);
    setIsSearching(false);
    setShowYoutube(false);
    setShowAlbums(false);
    setShowLive(false);
    setShowMixes(false);
    setShowArtists(false);
    setIsStatsOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
    setShowMovies(false);
    setShowScripts(true);
  };

  const getActiveModule = () => {
    if (isZenModeOpen) return "zen";
    if (showYoutube) return "youtube";
    if (showAlbums) return "albums";
    if (showLive) return "live";
    if (showMixes) return "mixes";
    if (showYtMusic) return "ytmusic";
    if (showArtists) return "artists";
    if (isStatsOpen) return "stats";
    if (isProfileOpen) return "profile";
    if (showMovies) return "movies";
    if (isExploreOpen) return "explore";
    if (showScripts) return "scripts";
    return "home";
  };

  const handleModuleSelect = (moduleId) => {
    if (moduleId === "home") {
      goHome();
      setIsZenModeOpen(false);
    } else if (moduleId === "movies") {
      handleShowMovies();
      setIsZenModeOpen(false);
    } else if (moduleId === "youtube") {
      handleShowYoutube();
      setIsZenModeOpen(false);
    } else if (moduleId === "albums") {
      handleShowAlbums();
      setIsZenModeOpen(false);
    } else if (moduleId === "live") {
      handleShowLive();
      setIsZenModeOpen(false);
    } else if (moduleId === "mixes") {
      handleShowMixes();
      setIsZenModeOpen(false);
    } else if (moduleId === "artists") {
      handleShowArtists();
      setIsZenModeOpen(false);
    } else if (moduleId === "zen") {
      handleShowZenMode();
    } else if (moduleId === "stats") {
      handleShowStats();
      setIsZenModeOpen(false);
    } else if (moduleId === "profile") {
      handleShowProfile();
      setIsZenModeOpen(false);
    } else if (moduleId === "explore") {
      handleShowExplore();
      setIsZenModeOpen(false);
    } else if (moduleId === "scripts") {
      handleShowScripts();
      setIsZenModeOpen(false);
    } else if (moduleId === "ytmusic") {
      handleShowYtMusic();
      setIsZenModeOpen(false);
    }
  };

  // Helper for add track (missing function in view but logic likely similar to other handlers)
  const handleAddTrackToPlaylist = async (trackUri, playlistId) => {
    try {
      await import("../services/spotifyApi").then((module) =>
        module.addTrackToPlaylist(playlistId, trackUri)
      );
      alert("Track added to playlist!");
    } catch (err) {
      console.error("Failed to add track", err);
      alert("Failed to add track to playlist.");
    }
  };

  return (
    <div
      className={`dashboard-container ${currentTheme} ${!isSidebarOpen ? "sidebar-collapsed" : ""
        }`}
    >
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeModule={getActiveModule()}
        onModuleSelect={handleModuleSelect}
      />

      <div className="main-content">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="sidebar-open-floating"
            title="Show Library"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        <TopBar
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
          themes={themes}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          goHome={goHome}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          performSearch={performSearch}
          onShowYoutube={handleShowYoutube}
          onShowAlbums={handleShowAlbums}
          onShowLive={handleShowLive}
          onShowMixes={handleShowMixes}
          onShowMovies={handleShowMovies}
          onShowZenMode={handleShowZenMode}
        />

        {/* Content Rendering Logic */}
        {isSearching ? (
          <div className="dashboard-searching">Searching...</div>
        ) : showYoutube ? (
          <YouTubeView handlePlay={handlePlay} searchTerm={searchTerm} />
        ) : showAlbums ? (
          <AlbumsView handlePlay={handlePlay} searchTerm={searchTerm} formatTime={formatTime} resetToken={albumsResetToken} />
        ) : showLive ? (
          <LiveView />
        ) : showMixes ? (
          <YoutubeMixView />
        ) : showYtMusic ? (
          <YouTubeMusicView />
        ) : showScripts ? (
          <ScriptsView />
        ) : showArtists ? (
          <ArtistsView
            handlePlay={handlePlay}
            formatTime={formatTime}
            likedTrackIds={likedTrackIds}
            onToggleFavorite={handleToggleFavorite}
            onAddTrack={handleAddTrackToPlaylist}
            deviceId={deviceId}
          />
        ) : isStatsOpen ? (
          <StatsView handlePlay={handlePlay} formatTime={formatTime} />
        ) : showMovies ? (
          <MoviesView />
        ) : showScripts ? (
          <ScriptsView />
        ) : isExploreOpen ? (
          selectedPlaylist && selectedPlaylist.source === "explore" ? (
            <div className="explore-details-wrapper">
              <button
                className="back-btn"
                onClick={() => {
                  setSelectedPlaylist(null);
                  setSearchTerm("");
                }}
              >
                ← Back
              </button>
              <PlaylistView
                selectedPlaylist={selectedPlaylist}
                tracks={tracks}
                viewMode={viewMode}
                setViewMode={setViewMode}
                handlePlay={handlePlay}
                formatTime={formatTime}
                searchTerm={searchTerm}
                deviceId={deviceId}
                onAddTrack={handleAddTrackToPlaylist}
                playlists={playlists}
                likedTrackIds={likedTrackIds}
                onToggleFavorite={handleToggleFavorite}
              // No onRemoveTrack passed here
              />
            </div>
          ) : (
            <ExploreView
              query={searchTerm}
              onSelectContext={handleExploreSelect}
            />
          )
        ) : isProfileOpen ? (
          <UserProfile />
        ) : searchResults ? (
          <PlaylistView
            selectedPlaylist={{
              name: `Search Results for ${searchTerm}`,
              description: "Songs from Spotify",
              images: [],
              owner: { display_name: "Spotify" },
              uri: "",
            }}
            tracks={searchResults}
            viewMode={viewMode}
            setViewMode={setViewMode}
            handlePlay={handlePlay}
            deviceId={deviceId}
            formatTime={formatTime}
            onAddTrack={handleAddTrackToPlaylist}
            playlists={playlists}
            likedTrackIds={likedTrackIds}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : selectedPlaylist ? (
          <PlaylistView
            selectedPlaylist={selectedPlaylist}
            tracks={tracks}
            viewMode={viewMode}
            setViewMode={setViewMode}
            handlePlay={handlePlay}
            formatTime={formatTime}
            searchTerm={searchTerm}
            deviceId={deviceId}
            onRemoveTrack={handleRemoveTrack}
            likedTrackIds={likedTrackIds}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <HomeView
            playlists={playlists}
            handleSelectPlaylist={handleSelectPlaylist}
            loading={loading}
            error={error}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {!isFullPlayerOpen && currentTrack && (
        <PlayerBar
          currentTrack={currentTrack}
          paused={paused}
          player={player}
          duration={duration}
          position={position}
          handleVolume={handleVolume}
          handleSeek={handleSeek}
          formatTime={formatTime}
          onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
          handleNext={handleNext}
          handlePrev={handlePrev}
          handleTogglePlay={handleTogglePlay}
        />
      )}

      {isFullPlayerOpen && (
        <FullPlayer
          currentTrack={currentTrack}
          paused={paused}
          player={player}
          duration={duration}
          position={position}
          handleVolume={handleVolume}
          handleSeek={handleSeek}
          formatTime={formatTime}
          onClose={() => setIsFullPlayerOpen(false)}
          savedContext={lastActivePlaylistContext}
          trackList={searchResults || tracks}
          deviceId={deviceId}
          queueContext={selectedPlaylist?.uri || (searchResults || tracks).map(t => t.uri)}
        />
      )}

      {isZenModeOpen && (
        <ZenMode onClose={() => setIsZenModeOpen(false)} deviceId={deviceId} />
      )}


    </div>
  );
};

export default Dashboard;
