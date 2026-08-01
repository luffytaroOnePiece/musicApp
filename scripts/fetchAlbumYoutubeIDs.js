import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Paths ───────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../src/data');
const MOVIE_ALBUMS_FILE = path.join(DATA_DIR, 'movieAlbums.json');
const PRIVATE_ALBUMS_FILE = path.join(DATA_DIR, 'privateAlbums.json');
const CACHE_FILE = path.join(DATA_DIR, 'albumYoutubeCache.json');

// ─── Config ──────────────────────────────────────────────────────────────────
const DELAY_MS = 300;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract YouTube playlist ID from various URL formats.
 */
function extractPlaylistId(urlOrId) {
  if (!urlOrId) return null;
  const str = urlOrId.trim();

  // Full URL: extract `list=` param
  if (str.includes('list=')) {
    const match = str.match(/list=([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  }

  // Bare playlist ID (starts with PL usually)
  if (/^[A-Za-z0-9_-]{10,}$/.test(str)) {
    return str;
  }

  return null;
}

/**
 * Fetch playlist items via yt-dlp --flat-playlist.
 * Returns array of { id, title, index } in playlist order.
 */
function fetchPlaylistItems(playlistId) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  try {
    const raw = execSync(
      `yt-dlp --flat-playlist --dump-json --no-warnings "${url}"`,
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, timeout: 120000 }
    );
    return raw.trim().split('\n').filter(Boolean).map((line, index) => {
      const entry = JSON.parse(line);
      return {
        id: entry.id,
        title: entry.title || 'Untitled',
        durationSec: Math.round(entry.duration || 0),
        index,
      };
    });
  } catch (err) {
    console.error(`  ⚠️  yt-dlp failed for playlist ${playlistId}: ${err.message?.substring(0, 100)}`);
    return [];
  }
}

/**
 * Format seconds → "M:SS" or "H:MM:SS"
 */
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch {
      console.warn('⚠️  Could not parse cache file, starting fresh.');
    }
  }
  return { lastUpdated: null, videos: {} };
}

function saveCache(cache) {
  cache.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// ─── Main Logic ──────────────────────────────────────────────────────────────

function loadAlbumsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveAlbumsFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Process a single album entry that has a youtubePlaylist field.
 * - Fetches the YouTube playlist
 * - Populates youtubeIDs in order
 * - Updates the cache with video metadata
 * 
 * Returns { updated: boolean, newCount: number, cachedCount: number }
 */
async function processAlbum(spotifyId, albumData, cache) {
  const playlistUrl = albumData.youtubePlaylist;
  const playlistId = extractPlaylistId(playlistUrl);

  if (!playlistId) {
    console.error(`  ⚠️  Could not extract playlist ID from: ${playlistUrl}`);
    return { updated: false, newCount: 0, cachedCount: 0 };
  }

  console.log(`  📋 Fetching YouTube playlist: ${playlistId}`);
  const items = fetchPlaylistItems(playlistId);

  if (items.length === 0) {
    console.error(`  ❌ No videos found in playlist ${playlistId}`);
    return { updated: false, newCount: 0, cachedCount: 0 };
  }

  // Check if youtubeIDs already match (cache hit = no change needed)
  const existingIds = albumData.youtubeIDs || [];
  const newIds = items.map(item => item.id);

  const idsChanged = existingIds.length !== newIds.length ||
    existingIds.some((id, i) => id !== newIds[i]);

  let newCount = 0;
  let cachedCount = 0;

  // Update cache with video metadata
  for (const item of items) {
    if (cache.videos[item.id]) {
      // Already cached — just update title if different
      if (cache.videos[item.id].title !== item.title && item.title !== 'Untitled') {
        cache.videos[item.id].title = item.title;
      }
      cachedCount++;
    } else {
      // New video — add to cache
      cache.videos[item.id] = {
        id: item.id,
        title: item.title,
        thumbnail: `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`,
        duration: formatDuration(item.durationSec || 0),
        durationSec: item.durationSec || 0,
        cachedAt: new Date().toISOString(),
      };
      newCount++;
    }
  }

  // Update album's youtubeIDs (always write in playlist order)
  albumData.youtubeIDs = newIds;

  if (idsChanged) {
    console.log(`  ✅ Updated: ${newIds.length} videos (${newCount} new, ${cachedCount} cached)`);
  } else {
    console.log(`  ⚡ No changes: ${newIds.length} videos (all cached)`);
  }

  return { updated: idsChanged, newCount, cachedCount };
}

/**
 * Main entry point.
 * Options:
 *   --language <lang>   Only process albums matching this language
 *   --file <filename>   Only process a specific file (movieAlbums or privateAlbums)
 *   --id <spotifyId>    Only process a specific album by Spotify ID
 */
async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      flags[args[i].substring(2)] = args[i + 1];
      i++;
    }
  }

  const filterLanguage = flags.language || null;
  const filterFile = flags.file || null;
  const filterId = flags.id || null;

  console.log('\n🎵 Album YouTube IDs Fetch Script');
  console.log('═'.repeat(50));

  if (filterLanguage) console.log(`🔍 Filter: language = "${filterLanguage}"`);
  if (filterFile) console.log(`🔍 Filter: file = "${filterFile}"`);
  if (filterId) console.log(`🔍 Filter: id = "${filterId}"`);
  console.log('');

  // Load cache
  const cache = loadCache();
  const cachedVideoCount = Object.keys(cache.videos).length;
  console.log(`📦 Cache: ${cachedVideoCount} videos loaded.`);
  if (cache.lastUpdated) console.log(`📅 Last updated: ${cache.lastUpdated}`);
  console.log('');

  // Load album files
  const files = [];
  if (!filterFile || filterFile === 'movieAlbums') {
    files.push({ path: MOVIE_ALBUMS_FILE, name: 'movieAlbums' });
  }
  if (!filterFile || filterFile === 'privateAlbums') {
    files.push({ path: PRIVATE_ALBUMS_FILE, name: 'privateAlbums' });
  }

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalNew = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const albums = loadAlbumsFile(file.path);
    const entries = Object.entries(albums);
    let fileModified = false;

    console.log(`\n📂 Processing ${file.name}.json (${entries.length} albums)`);
    console.log('─'.repeat(50));

    for (const [spotifyId, albumData] of entries) {
      // Filter by ID
      if (filterId && spotifyId !== filterId) continue;

      // Filter by language
      if (filterLanguage && albumData.language !== filterLanguage) continue;

      // Skip albums without youtubePlaylist field
      if (!albumData.youtubePlaylist) {
        totalSkipped++;
        continue;
      }

      console.log(`\n🎬 ${albumData.name || spotifyId} [${albumData.language || '?'}]`);
      totalProcessed++;

      try {
        const result = await processAlbum(spotifyId, albumData, cache);
        if (result.updated) {
          totalUpdated++;
          fileModified = true;
        }
        totalNew += result.newCount;
      } catch (err) {
        console.error(`  ❌ Error processing ${spotifyId}: ${err.message}`);
      }

      // Small delay between albums to be nice to YouTube
      await sleep(DELAY_MS);
    }

    // Write back if modified
    if (fileModified) {
      saveAlbumsFile(file.path, albums);
      console.log(`\n💾 Saved ${file.name}.json`);
    }
  }

  // Save cache
  saveCache(cache);
  console.log(`\n💾 Saved cache (${Object.keys(cache.videos).length} total videos)`);

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Processed: ${totalProcessed} albums with youtubePlaylist`);
  console.log(`   Updated:   ${totalUpdated} albums had changes`);
  console.log(`   New videos: ${totalNew}`);
  console.log(`   Skipped:   ${totalSkipped} albums (no youtubePlaylist field)`);
  console.log('═'.repeat(50) + '\n');
}

main().catch(err => {
  console.error('💥 Fatal:', err.message);
  process.exit(1);
});
