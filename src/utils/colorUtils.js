/**
 * Extracts dominant colors from an image URL using a canvas.
 * @param {string} imageUrl - The URL of the image to extract colors from.
 * @returns {Promise<string[]>} A promise that resolves to an array of hex color strings.
 */
export const extractColors = async (imageUrl) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Resize for faster processing
            canvas.width = 100;
            canvas.height = 100;

            ctx.drawImage(img, 0, 0, 100, 100);

            try {
                const imageData = ctx.getImageData(0, 0, 100, 100).data;
                const colorMap = {};

                // Sample every 10th pixel for performance
                for (let i = 0; i < imageData.length; i += 40) {
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    const a = imageData[i + 3];

                    // Skip transparent pixels and very dark/light ones
                    if (a < 128 || (r < 20 && g < 20 && b < 20) || (r > 240 && g > 240 && b > 240)) continue;

                    // Quantize colors (round to nearest 20) to group similar shades
                    const qr = Math.round(r / 20) * 20;
                    const qg = Math.round(g / 20) * 20;
                    const qb = Math.round(b / 20) * 20;

                    const key = `${qr},${qg},${qb}`;
                    colorMap[key] = (colorMap[key] || 0) + 1;
                }

                // Sort by frequency
                const sortedColors = Object.entries(colorMap)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3) // Get top 3 colors
                    .map(([key]) => {
                        const [r, g, b] = key.split(',').map(Number);
                        return `rgb(${r}, ${g}, ${b})`;
                    });

                resolve(sortedColors.length > 0 ? sortedColors : ['#1DB954', '#191414']); // Spotify defaults
            } catch (e) {
                console.warn('Canvas security error (CORS) - defaulting colors', e);
                resolve(['#535353', '#121212']);
            }
        };

        img.onerror = () => {
            resolve(['#535353', '#121212']);
        };
    });
};
