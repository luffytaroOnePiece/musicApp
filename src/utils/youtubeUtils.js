import youtubeLinks from '../data/youtubeLinks.json';

// Normalize the optimized data structure back to the component-friendly format
// Data format: [youtubeId, format, language, genre, name, lyrics(optional)]
const normalizeData = (id, data) => {
    if (!data) return null;

    // Check if data is array (new format) or object (fallback/legacy just in case)
    if (Array.isArray(data)) {
        return {
            youtubelinkID: data[0],
            format: data[1],
            language: data[2],
            genre: data[3],
            name: data[4],
            likes: null, // Not in array
            // Reconstruct lyrics: if matches 1, use id.lrc, else use value
            lyrics: data[5] ? (data[5] === 1 ? `${id}.lrc` : data[5]) : undefined
        };
    }

    // Fallback if somehow still object (shouldn't happen with full migration)
    return {
        youtubelinkID: data.id || data.youtubelinkID,
        format: data.f || data.format,
        language: data.l || data.language,
        genre: data.g || data.genre,
        name: data.n || data.name,
        lyrics: data.ly ? (data.ly === 1 ? `${id}.lrc` : data.ly) : data.lyrics
    };
};

export const getYoutubeLinkData = (trackId) => {
    const data = youtubeLinks[trackId];
    return normalizeData(trackId, data);
};

export const getAllYoutubeLinks = () => {
    return Object.entries(youtubeLinks).map(([id, data]) => [id, normalizeData(id, data)]);
};

export const openYoutubeLink = (trackId) => {
    const linkData = getYoutubeLinkData(trackId);
    if (!linkData) return;

    let qualityParam = "";
    switch (linkData.format) {
        case "4320p": qualityParam = "&vq=hd4320"; break;
        case "2160p": qualityParam = "&vq=hd2160"; break;
        case "1440p": qualityParam = "&vq=hd1440"; break;
        case "1080p": qualityParam = "&vq=hd1080"; break;
        case "720p": qualityParam = "&vq=hd720"; break;
        case "480p": qualityParam = "&vq=large"; break;
        case "360p": qualityParam = "&vq=medium"; break;
        case "240p": qualityParam = "&vq=small"; break;
        case "144p": qualityParam = "&vq=tiny"; break;
        default: qualityParam = "";
    }

    window.open(`https://www.youtube.com/watch?v=${linkData.youtubelinkID}${qualityParam}`, '_blank');
};
