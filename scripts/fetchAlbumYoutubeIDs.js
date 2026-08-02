import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Paths ───────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../src/data');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');       // Source of truth (human-edited)
const ALBUMS_DATA_FILE = path.join(DATA_DIR, 'albumsData.json');    // Generated output (app reads this)
const CACHE_FILE = path.join(DATA_DIR, 'albumYoutubeCache.json');

// ─── Config ──────────────────────────────────────────────────────────────────
const DELAY_MS = 300;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractPlaylistId(urlOrId) {
  if (!urlOrId) return null;
  const str = urlOrId.trim();
  if (str.includes('list=')) {
    const match = str.match(/list=([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  }
  if (/^[A-Za-z0-9_-]{10,}$/.test(str)) return str;
  return null;
}

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
    try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); }
    catch { console.warn('⚠️  Could not parse cache, starting fresh.'); }
  }
  return { lastUpdated: null, videos: {} };
}

function saveCache(cache) {
  cache.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// ─── Process a single playlist URL → array of video IDs ─────────────────────

function processPlaylist(playlistUrl, cache, label) {
  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) {
    console.error(`  ⚠️  Could not extract playlist ID from: ${playlistUrl}`);
    return { ids: [], newCount: 0, cachedCount: 0 };
  }

  console.log(`  📋 Fetching ${label}: ${playlistId}`);
  const items = fetchPlaylistItems(playlistId);

  if (items.length === 0) {
    console.error(`  ❌ No videos found in ${label} ${playlistId}`);
    return { ids: [], newCount: 0, cachedCount: 0 };
  }

  let newCount = 0, cachedCount = 0;

  for (const item of items) {
    if (cache.videos[item.id]) {
      if (cache.videos[item.id].title !== item.title && item.title !== 'Untitled') {
        cache.videos[item.id].title = item.title;
      }
      cachedCount++;
    } else {
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

  return { ids: items.map(i => i.id), newCount, cachedCount };
}

// ─── Main ────────────────────────────────────────────────────────────────────

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
  const filterId = flags.id || null;

  console.log('\n🎵 Album YouTube IDs Fetch Script');
  console.log('═'.repeat(50));
  if (filterLanguage) console.log(`🔍 Filter: language = "${filterLanguage}"`);
  if (filterId) console.log(`🔍 Filter: id = "${filterId}"`);

  // Load source config
  if (!fs.existsSync(PLAYLISTS_FILE)) {
    console.error('❌ playlists.json not found!');
    process.exit(1);
  }
  const playlists = JSON.parse(fs.readFileSync(PLAYLISTS_FILE, 'utf-8'));

  // Load existing output (for merging/preserving fields like tmdbID)
  let existingOutput = {};
  if (fs.existsSync(ALBUMS_DATA_FILE)) {
    try { existingOutput = JSON.parse(fs.readFileSync(ALBUMS_DATA_FILE, 'utf-8')); }
    catch { /* fresh start */ }
  }

  // Load cache
  const cache = loadCache();
  console.log(`\n📦 Cache: ${Object.keys(cache.videos).length} videos loaded.`);
  if (cache.lastUpdated) console.log(`📅 Last updated: ${cache.lastUpdated}`);

  const output = {};
  let totalProcessed = 0, totalUpdated = 0, totalNew = 0;

  const entries = Object.entries(playlists);
  console.log(`\n📂 Processing ${entries.length} playlists`);
  console.log('─'.repeat(50));

  for (const [spotifyId, config] of entries) {
    if (filterId && spotifyId !== filterId) continue;
    if (filterLanguage && config.language !== filterLanguage) continue;

    console.log(`\n🎬 ${config.name} [${config.language || '?'}]`);
    totalProcessed++;

    // Start with config fields
    const entry = {
      name: config.name,
      youtubePlaylist: config.youtubePlaylist || '',
      livePlaylist: config.livePlaylist || '',
      type: config.type || 'Movie',
      language: config.language || '',
      movieId: config.movieId || '',
      tmdbID: config.movieId || '',
      trailerId: config.TrailerId || config.trailerId || '',
      watched: config.Watched !== undefined ? config.Watched : (config.watched !== undefined ? config.watched : false),
    };

    // Preserve extra fields from existing output (e.g. tmdbID if not set in config)
    if (existingOutput[spotifyId]) {
      const prev = existingOutput[spotifyId];
      if (prev.tmdbID && !entry.tmdbID) entry.tmdbID = prev.tmdbID;
      if (prev.movieId && !entry.movieId) entry.movieId = prev.movieId;
      if (prev.trailerId && !entry.trailerId) entry.trailerId = prev.trailerId;
      if (prev.watched !== undefined && entry.watched === undefined) entry.watched = prev.watched;
    }

    // Fetch main YouTube playlist
    if (config.youtubePlaylist) {
      const result = processPlaylist(config.youtubePlaylist, cache, 'YouTube playlist');
      entry.youtubeIDs = result.ids;
      totalNew += result.newCount;

      const prevIds = existingOutput[spotifyId]?.youtubeIDs || [];
      if (JSON.stringify(prevIds) !== JSON.stringify(result.ids)) totalUpdated++;

      console.log(`  ✅ ${result.ids.length} videos (${result.newCount} new, ${result.cachedCount} cached)`);
    } else {
      entry.youtubeIDs = existingOutput[spotifyId]?.youtubeIDs || [];
    }

    // Fetch live playlist
    if (config.livePlaylist) {
      const result = processPlaylist(config.livePlaylist, cache, 'Live playlist');
      entry.liveIDs = result.ids;
      totalNew += result.newCount;
      console.log(`  🎤 ${result.ids.length} live videos (${result.newCount} new, ${result.cachedCount} cached)`);
    } else {
      entry.liveIDs = existingOutput[spotifyId]?.liveIDs || [];
    }

    output[spotifyId] = entry;
    await sleep(DELAY_MS);
  }

  // Write output
  fs.writeFileSync(ALBUMS_DATA_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`\n💾 Saved albumsData.json (${Object.keys(output).length} albums)`);

  // Save cache
  saveCache(cache);
  console.log(`💾 Saved cache (${Object.keys(cache.videos).length} total videos)`);

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Processed:  ${totalProcessed} albums`);
  console.log(`   Updated:    ${totalUpdated} albums had changes`);
  console.log(`   New videos: ${totalNew}`);
  console.log('═'.repeat(50) + '\n');
}

main().catch(err => {
  console.error('💥 Fatal:', err.message);
  process.exit(1);
});
