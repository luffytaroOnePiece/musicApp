import React, { useEffect, useState } from "react";
import {
  getUserPlaylists,
  playTrack,
  nextTrack,
  prevTrack,
  pauseTrack,
  resumePlayback,
  seekTrack,
} from "../services/spotifyApi";
import useSpotifyPlayer from "../hooks/useSpotifyPlayer";
import TopBar from "./TopBar";
import AlbumsView from "./AlbumsView";
import PlayerBar from "./PlayerBar";
import FullPlayer from "./FullPlayer";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { player, paused, currentTrack, duration, position, context } =
    useSpotifyPlayer();

  // Data State
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [deviceId, setDeviceId] = useState(null);

  // UI State
  const [lastActivePlaylistContext, setLastActivePlaylistContext] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [albumsResetToken, setAlbumsResetToken] = useState(0);

  // Fetch Playlists on Mount
  useEffect(() => {
    getUserPlaylists()
      .then((data) => {
        const userPlaylists = data.items || [];
        setPlaylists(userPlaylists);
      })
      .catch((err) => {
        console.error(err);
      });
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

  // Handlers
  const handlePlay = (trackUri, contextUri = null, offset = 0, incomingTracks = null) => {
    if (!deviceId) {
      console.warn("Player not ready yet");
      alert("Spotify Player is connecting... Please wait a moment.");
      return;
    }

    if (incomingTracks && Array.isArray(incomingTracks)) {
      setTracks(incomingTracks);
    }

    const activeTracks = incomingTracks || tracks;

    if (
      contextUri &&
      !Array.isArray(contextUri) &&
      contextUri.includes("spotify:") &&
      !contextUri.includes(":artist:")
    ) {
      playTrack(deviceId, contextUri, offset);
    } else {
      let uris = Array.isArray(contextUri)
        ? contextUri
        : activeTracks.map((t) => t.uri);

      let trackIndex = trackUri ? uris.indexOf(trackUri) : -1;
      let finalOffset = trackIndex !== -1 ? trackIndex : offset;

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
    seekTrack(Math.round(e.target.value * 1000)).catch(err => console.error("Seek failed", err));
  };

  const handleVolume = (e) => {
    if (player) player.setVolume(e.target.value / 100);
  };

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

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleShowAlbums = () => {
    setAlbumsResetToken(prev => prev + 1);
    setSearchTerm("");
  };

  const performSearch = async () => {
    // Search is handled within AlbumsView via searchTerm prop
  };

  return (
    <div className="dashboard-container pure-dark sidebar-collapsed">
      <div className="main-content">
        <TopBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          performSearch={performSearch}
          onShowAlbums={handleShowAlbums}
        />

        <AlbumsView handlePlay={handlePlay} searchTerm={searchTerm} formatTime={formatTime} resetToken={albumsResetToken} />
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
          trackList={tracks}
          deviceId={deviceId}
          queueContext={tracks.map(t => t.uri)}
        />
      )}

    </div>
  );
};

export default Dashboard;
