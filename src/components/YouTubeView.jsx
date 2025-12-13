import React from "react";
import youtubeLinks from "../data/youtubeLinks.json";

const YouTubeView = ({ handlePlay }) => {
    const videos = Object.entries(youtubeLinks);

    const handleVideoClick = (linkData) => {
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

    return (
        <div style={{ padding: "80px 40px 40px 40px", color: "white" }}>
            <h1 style={{ marginBottom: "30px", fontSize: "2.5rem", fontWeight: "bold" }}>
                YouTube Library
            </h1>

            {videos.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888", marginTop: "50px" }}>
                    No videos configured in youtubeLinks.json
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                    gap: "24px"
                }}>
                    {videos.map(([trackId, data]) => (
                        <div
                            key={trackId}
                            onClick={() => handleVideoClick(data)}
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "12px",
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "transform 0.2s, background 0.2s",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                position: "relative"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-5px)";
                                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                // Show play button on hover logic handled by CSS usually, but here we can just make it always visible or use state if needed.
                                // For simplicity, always visible or simple hover effect.
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            }}
                        >
                            <div style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}>
                                <img
                                    src={`https://img.youtube.com/vi/${data.youtubelinkID}/hqdefault.jpg`}
                                    alt="Thumbnail"
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover"
                                    }}
                                />
                                <div style={{
                                    position: "absolute",
                                    bottom: "10px",
                                    right: "10px",
                                    background: "rgba(0,0,0,0.8)",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold"
                                }}>
                                    {data.format}
                                </div>
                            </div>

                            <div style={{ padding: "16px" }}>
                                <div style={{
                                    fontSize: "0.9rem",
                                    color: "#aaa",
                                    marginBottom: "8px",
                                    display: "flex",
                                    justifyContent: "space-between"
                                }}>
                                    <span>{data.genre}</span>
                                    <span>{data.language}</span>
                                </div>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginTop: "12px"
                                }}>
                                    <div style={{
                                        color: "#fff",
                                        fontWeight: "600",
                                        fontSize: "1rem",
                                        flex: 1,
                                        marginRight: "12px",
                                        lineHeight: "1.4"
                                    }}>
                                        {data.name || "Unknown Title"}
                                    </div>

                                    {/* Green Spotify Play Button */}
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (handlePlay) {
                                                handlePlay(`spotify:track:${trackId}`);
                                            }
                                        }}
                                        title="Play on Spotify"
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "50%",
                                            background: "#1DB954",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                                            transition: "transform 0.2s",
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default YouTubeView;
