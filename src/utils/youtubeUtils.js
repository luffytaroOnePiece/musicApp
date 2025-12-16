import youtubeLinks from '../data/youtubeLinks.json';

export const getYoutubeLinkData = (trackId) => {
    return youtubeLinks[trackId] || null;
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
