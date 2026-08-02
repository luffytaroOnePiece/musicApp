import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getPlaylist } from "../services/spotifyApi";
import albumsData from "../data/albumsData.json";

import othersData from "../data/others.json";
import AlbumsList from "./albums/AlbumsList";
import AlbumDetail from "./albums/AlbumDetail";
import AlbumsHeader from "./albums/AlbumsHeader";
import AggregatedGrid from "./albums/AggregatedGrid";
import VideoModal from "./common/VideoModal";
import "../styles/AlbumsView.css";

const AlbumsView = ({ handlePlay, searchTerm, formatTime, resetToken, onDetailActiveChange }) => {
  // Selection state
  const [selectedId, setSelectedId] = useState(null);
  const [itemsMetadata, setItemsMetadata] = useState({});
  const [fullItemData, setFullItemData] = useState(null);

  useEffect(() => {
    if (onDetailActiveChange) {
      onDetailActiveChange(!!selectedId);
    }
  }, [selectedId, onDetailActiveChange]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("albums"); // 'albums' | 'all-songs' | 'others'

  // Filter States
  const [selectedType, setSelectedType] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Default");

  // Computed Lists State
  const [songsList, setSongsList] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Modal Playback State
  const [playingVideo, setPlayingVideo] = useState(null);

  // 1. Extract Filter Options
  const { types, languages } = useMemo(() => {
    const t = new Set(["All"]);
    const l = new Set(["All"]);

    if (albumsData) {
      Object.values(albumsData).forEach((album) => {
        if (album.type) t.add(album.type);
        if (album.language) l.add(album.language);
      });
    }

    return {
      types: Array.from(t).sort(),
      languages: Array.from(l).sort(),
    };
  }, []); // albumsData is static imported json, so empty dependency is fine

  // 2. Initial Load - Metadata
  useEffect(() => {
    let isMounted = true;

    const fetchMetadata = async () => {
      // Avoid re-fetching if we already have data
      if (Object.keys(itemsMetadata).length > 0) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (!albumsData) throw new Error("Albums data is missing");
        const entries = Object.entries(albumsData);

        if (entries.length === 0) {
          if (isMounted) setLoading(false);
          return;
        }

        if (isMounted) setLoading(true); // Ensure loading is true before start

        // Randomization: Shuffle entries BEFORE fetching so they appear in random order incrementally
        for (let i = entries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [entries[i], entries[j]] = [entries[j], entries[i]];
        }

        // Optimization: Batch requests to avoid 429s and show content progressively
        const BATCH_SIZE = 10;
        const DELAY_MS = 500;

        const chunk = (arr, size) =>
          Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
          );

        const batches = chunk(entries, BATCH_SIZE);

        for (const batch of batches) {
          if (!isMounted) break;

          const batchResults = await Promise.all(
            batch.map(async ([spotifyId, localData]) => {
              try {
                const playlist = await getPlaylist(spotifyId);
                if (!playlist) throw new Error("Playlist not found");

                return [
                  spotifyId,
                  {
                    ...localData,
                    spotifyName: playlist.name,
                    images: playlist.images,
                    owner: playlist.owner?.display_name,
                    release_date:
                      playlist.release_date ||
                      playlist.tracks?.items?.[0]?.track?.album?.release_date,
                    description: playlist.description,
                  },
                ];
              } catch (err) {
                console.error(`Failed to fetch playlist ${spotifyId}`, err);
                // Return local data even if Spotify fetch fails, so we don't crash
                return [
                  spotifyId,
                  {
                    ...localData,
                    error: true,
                    name: localData.name || "Unknown Album",
                  },
                ];
              }
            })
          );

          // Progressive Update: Update state after each batch
          if (isMounted) {
            const batchMetadata = Object.fromEntries(batchResults);
            setItemsMetadata((prev) => ({ ...prev, ...batchMetadata }));

            // Stop global loading spinner after first batch so user sees content immediately
            setLoading(false);
          }

          // Small delay between batches
          if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
          }
        }
      } catch (err) {
        console.error("Critical error in AlbumsView", err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchMetadata();

    return () => {
      isMounted = false;
    };
    // DEPENDENCY FIX: Remove itemsMetadata from dependency to prevent loop if it updates but length check fails somehow.
    // Actually, empty dependency is better for "Initial Load".
  }, []);

  // 3. Detail Load
  useEffect(() => {
    const fetchFullData = async () => {
      if (!selectedId) return;
      setLoading(true);
      try {
        const data = await getPlaylist(selectedId);
        setFullItemData(data);
      } catch (err) {
        console.error("Failed to load full playlist", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullData();
  }, [selectedId]);

  // 4. Reset View when token changes
  useEffect(() => {
    if (resetToken > 0) {
      setSelectedId(null);
      setFullItemData(null);
      setViewMode("albums");
    }
  }, [resetToken]);

  // 5. Fetch Songs Based on viewMode
  useEffect(() => {
    if (viewMode === "albums") {
      setSongsList([]);
      return;
    }

    const fetchSongs = async () => {
      setLoadingSongs(true);
      const songs = [];

      // Helper: Filter matches
      const isMatch = (meta) => {
        if (!meta) return false;
        const matchesType =
          selectedType === "All" || meta.type === selectedType;
        const matchesLanguage =
          selectedLanguage === "All" || meta.language === selectedLanguage;
        return matchesType && matchesLanguage;
      };

      // CASE: OTHERS
      if (viewMode === "others") {
        // Iterate over othersData
        Object.entries(othersData).forEach(([albumId, videoList]) => {
          const meta = itemsMetadata[albumId];
          // Only include if album matches filter (or if we decide Others ignores filters? Let's respect filters)
          // If itemsMetadata isn't ready, we might miss items. But loading should be done.
          if (meta && isMatch(meta)) {
            videoList.forEach((video) => {
              songs.push({
                id: video.id,
                name: video.name,
                type: video.type,
                albumName: meta.name,
                videoId: video.id, // Normalized
                format: "HD",
                keyId: `other-${video.id}`,
              });
            });
          } else if (!meta) {
            // Fallback if metadata missing but we have others data?
            // Maybe beneficial to show it anyway?
            // videoList.forEach(...)
          }
        });
      }
      // CASE: ALL SONGS
      else {
        const relevantAlbumIds = Object.keys(itemsMetadata).filter((id) =>
          isMatch(itemsMetadata[id])
        );

        const promises = relevantAlbumIds.map(async (id) => {
          const meta = itemsMetadata[id];
          try {
            const playlist = await getPlaylist(id);
            if (!playlist || !playlist.tracks) return [];

            const rawTracks = playlist.tracks.items;
            const youtubeIDs = albumsData[id]?.youtubeIDs || [];
            const localFormat = albumsData[id]?.format || "HD";

            return rawTracks
              .map((item, i) => {
                if (!item.track || !youtubeIDs[i]) return null;
                return {
                  ...item.track,
                  id: item.track.id,
                  name: item.track.name,
                  videoId: youtubeIDs[i],
                  type: meta.type || "Song",
                  format: localFormat,
                  keyId: item.track.id,
                  trackUri: item.track.uri,
                  linked_youtube_id: youtubeIDs[i],
                  linked_format: localFormat,
                };
              })
              .filter(Boolean);
          } catch (e) {
            console.warn("Error fetching tracks for album", id, e);
            return [];
          }
        });

        const results = await Promise.all(promises);
        results.forEach((s) => songs.push(...s));
      }

      // Shuffle songs
      for (let i = songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]];
      }

      setSongsList(songs);
      setLoadingSongs(false);
    };

    fetchSongs();
  }, [viewMode, itemsMetadata, selectedType, selectedLanguage]);

  // Handlers
  const handleItemClick = (id) => {
    setFullItemData(null);
    setLoading(true);
    setSelectedId(id);
  };
  const handleBack = () => {
    setSelectedId(null);
    setFullItemData(null);
  };
  const handleResetFilters = () => {
    setSelectedType("All");
    setSelectedLanguage("All");
    setSelectedSort("Default");
  };

  // Playback Handlers
  // 1. All Songs Playback (Play in Spotify)
  const handlePlayAllSongsItem = (item) => {
    if (item.trackUri) {
      const queueUris = sortedSongs.map((s) => s.trackUri).filter(Boolean);
      handlePlay(item.trackUri, queueUris, 0, sortedSongs);
    }
  };

  // 2. Default Playback (Modal for Live/Others)
  const handleVideoClick = (id, title) => {
    setPlayingVideo({ id, title });
  };

  // Unified Play Handler for Grid
  const handleGridPlay = (item) => {
    if (viewMode === "all-songs") {
      handlePlayAllSongsItem(item);
    } else {
      handleVideoClick(item.videoId, item.name);
    }
  };

  // Detail View Handlers (Pass-through)
  const handlePlayTrack = useCallback(
    (trackUri) => {
      if (!fullItemData) return;
      const rawTracks = fullItemData.tracks.items;
      const youtubeIDs = albumsData[selectedId].youtubeIDs;
      const clickedIndex = rawTracks.findIndex(
        (item) => item.track.uri === trackUri
      );
      if (clickedIndex === -1) return;

      const queue = rawTracks
        .map((item, i) => {
          if (!item.track || !youtubeIDs[i]) return null;
          return {
            ...item.track,
            linked_youtube_id: youtubeIDs[i],
            linked_format: albumsData[selectedId].format,
          };
        })
        .filter(Boolean);

      handlePlay(
        trackUri,
        queue.map((t) => t.uri),
        0,
        queue
      );
    },
    [fullItemData, selectedId, handlePlay]
  ); // Re-create only if data changes

  const handlePlayContext = useCallback(() => {
    if (!fullItemData || !albumsData[selectedId]) return;
    const rawTracks = fullItemData.tracks.items;
    const youtubeIDs = albumsData[selectedId].youtubeIDs;
    const queue = rawTracks
      .map((item, i) => {
        if (!item.track || !youtubeIDs[i]) return null;
        return {
          ...item.track,
          linked_youtube_id: youtubeIDs[i],
          linked_format: albumsData[selectedId].format,
        };
      })
      .filter(Boolean);

    if (queue.length > 0) {
      handlePlay(
        queue[0].uri,
        queue.map((t) => t.uri),
        0,
        queue
      );
    }
  }, [fullItemData, selectedId, handlePlay]);

  const handleShuffleContext = useCallback(() => {
    if (!fullItemData || !albumsData[selectedId]) return;
    const rawTracks = fullItemData.tracks.items;
    const youtubeIDs = albumsData[selectedId].youtubeIDs;
    const queue = rawTracks
      .map((item, i) => {
        if (!item.track || !youtubeIDs[i]) return null;
        return {
          ...item.track,
          linked_youtube_id: youtubeIDs[i],
          linked_format: albumsData[selectedId].format,
        };
      })
      .filter(Boolean);

    const shuffledQueue = [...queue];
    for (let i = shuffledQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQueue[i], shuffledQueue[j]] = [
        shuffledQueue[j],
        shuffledQueue[i],
      ];
    }

    if (shuffledQueue.length > 0) {
      handlePlay(
        shuffledQueue[0].uri,
        shuffledQueue.map((t) => t.uri),
        0,
        shuffledQueue
      );
    }
  }, [fullItemData, selectedId, handlePlay]);

  // RENDER
  // List View Filter Logic (Moved up to avoid Hook errors)
  const filteredItems = Object.entries(itemsMetadata).filter(([id, meta]) => {
    const matchesType = selectedType === "All" || meta.type === selectedType;
    const matchesLanguage =
      selectedLanguage === "All" || meta.language === selectedLanguage;
    const matchesSearch =
      !searchTerm ||
      (meta.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meta.spotifyName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesLanguage && matchesSearch;
  });

  // Sort Logic (Moved up)
  const sortedItems = useMemo(() => {
    if (selectedSort === "Default") return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const dateA = new Date(a[1].release_date || 0);
      const dateB = new Date(b[1].release_date || 0);

      if (selectedSort === "Date (Newest)") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  }, [filteredItems, selectedSort]);

  // Sort Logic for SongsList (All Songs view)
  const sortedSongs = useMemo(() => {
    if (selectedSort === "Default") return songsList;

    return [...songsList].sort((a, b) => {
      const dateA = new Date(a.album?.release_date || 0);
      const dateB = new Date(b.album?.release_date || 0);

      if (selectedSort === "Date (Newest)") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  }, [songsList, selectedSort]);

  // RENDER
  if (error) {
    return (
      <div className="albums-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  // Detail View
  if (selectedId && fullItemData) {
    return (
      <AlbumDetail
        fullItemData={fullItemData}
        localData={albumsData[selectedId]}
        itemsMetadata={itemsMetadata}
        onBack={handleBack}
        onPlay={handlePlayTrack}
        onPlayContext={handlePlayContext}
        onShuffleContext={handleShuffleContext}
        onAlbumClick={handleItemClick} // For "More by Artist"
        formatTime={formatTime}
      />
    );
  }

  // List View


  return (
    <div className="albums-view-container">
      <VideoModal video={playingVideo} onClose={() => setPlayingVideo(null)} />

      <AlbumsHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        types={types}
        languages={languages}
        onReset={handleResetFilters}
      />

      {/* Check global loading only for initial metadata, BUT show UI if we have data or if ViewMode != albums */}
      {/* Improving UX: If loading is true but we are switching views, we might want to show loading spinner inside the grid area, not replace whole screen optionally */}

      {loading ? (
        <div className="albums-loading">Loading Collections...</div>
      ) : (
        <>
          {viewMode === "albums" ? (
            <AlbumsList items={sortedItems} onItemClick={handleItemClick} />
          ) : (
            <AggregatedGrid
              viewMode={viewMode}
              items={sortedSongs}
              loading={loadingSongs}
              searchTerm={searchTerm}
              onPlay={handleGridPlay}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AlbumsView;
