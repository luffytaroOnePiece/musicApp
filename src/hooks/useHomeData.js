import { useState, useEffect } from "react";
import {
  getNewReleases,
  getFeaturedPlaylists,
  getFollowedArtists,
  getUserPlaylists,
} from "../services/spotifyApi";

const useHomeData = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch User Data & Featured
        const [followedArtistsData, featuredData, playlistsData] = await Promise.all(
          [
            getFollowedArtists(50).catch((err) => {
              console.error("Followed Artists fetch failed", err);
              return { artists: { items: [] } };
            }),
            getFeaturedPlaylists(10).catch((err) => {
              console.error("Featured Playlists fetch failed", err);
              return { playlists: { items: [] } };
            }),
            getUserPlaylists().catch((err) => {
              console.error("User Playlists fetch failed", err);
              return { items: [] };
            }),
          ]
        );

        // setTopArtists(followedArtistsData.artists?.items || []); // We removed the UI for this, but could keep state if needed.
        setFeaturedPlaylists(featuredData.playlists?.items || []);
        setUserPlaylists(playlistsData.items || []);

        // 2. Fetch New Releases based on Followed Artists
        let releases = [];
        const artistsList = followedArtistsData.artists?.items || [];

        if (artistsList.length > 0) {
          // Check more artists (up to 20) to find releases
          const artistsToCheck = artistsList.slice(0, 20);
          const albumsPromises = artistsToCheck.map((artist) =>
            import("../services/spotifyApi").then((api) =>
              api.getArtistAlbums(artist.id, 2)
            )
          );

          const albumsResponses = await Promise.all(albumsPromises);

          // Flatten and collect all albums
          const allAlbums = albumsResponses.flatMap(
            (response) => response.items || []
          );

          // Filter duplicates (by id) and Sort by release date (descending)
          const uniqueAlbums = Array.from(
            new Map(allAlbums.map((item) => [item.id, item])).values()
          );

          // Filter out really old stuff if needed, but for now just sort
          releases = uniqueAlbums.sort(
            (a, b) => new Date(b.release_date) - new Date(a.release_date)
          );
        }
        setNewReleases(releases);
        // setLanguageReleases removed
        setError(null);
      } catch (err) {
        console.error("Home data fetch failed", err);
        setError("Failed to load home content");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    newReleases,
    featuredPlaylists,
    topArtists,
    userPlaylists,

    loading,
    error,
  };
};

export default useHomeData;
