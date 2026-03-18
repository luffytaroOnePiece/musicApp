import { useState, useCallback, useEffect, useRef } from "react";

const API_URL = "/api/favorites";

/**
 * Custom hook: manage YouTube‑Music favourites via local JSON file.
 *
 * Each favourite entry shape:
 * {
 *   ytId        : string,
 *   title       : string,
 *   albumName   : string,
 *   language    : string,
 *   type        : string,
 *   addedAt     : string,   // ISO timestamp
 * }
 */
const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const savingRef = useRef(false);

  // Load from JSON file on mount
  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFavorites(data);
      })
      .catch(() => {});
  }, []);

  // Persist to JSON file
  const persistToFile = useCallback((favs) => {
    if (savingRef.current) return;
    savingRef.current = true;
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(favs),
    })
      .catch(() => {})
      .finally(() => {
        savingRef.current = false;
      });
  }, []);

  const isFavorite = useCallback(
    (ytId) => favorites.some((f) => f.ytId === ytId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (meta) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.ytId === meta.ytId);
        const next = exists
          ? prev.filter((f) => f.ytId !== meta.ytId)
          : [
              ...prev,
              {
                ytId: meta.ytId,
                title: meta.title || "Untitled",
                albumName: meta.albumName || "",
                language: meta.language || "",
                type: meta.type || "",
                addedAt: new Date().toISOString(),
              },
            ];
        persistToFile(next);
        return next;
      });
    },
    [persistToFile],
  );

  /** Download favourites as a .json file */
  const exportFavorites = useCallback(() => {
    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ytm-favorites.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [favorites]);

  return { favorites, isFavorite, toggleFavorite, exportFavorites };
};

export default useFavorites;
