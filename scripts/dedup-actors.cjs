#!/usr/bin/env node

/**
 * Removes duplicate actor IDs from favoriteActors.json
 * Run: node scripts/dedup-actors.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/data/favoriteActors.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

let totalRemoved = 0;

if (data.categories) {
    data.categories.forEach((cat) => {
        const before = cat.actors.length;
        cat.actors = [...new Set(cat.actors)];
        const removed = before - cat.actors.length;
        if (removed > 0) {
            console.log(`  "${cat.name}": removed ${removed} duplicate(s) (${before} → ${cat.actors.length})`);
        } else {
            console.log(`  "${cat.name}": no duplicates (${cat.actors.length} actors)`);
        }
        totalRemoved += removed;
    });
} else if (data.actors) {
    const before = data.actors.length;
    data.actors = [...new Set(data.actors)];
    const removed = before - data.actors.length;
    console.log(`  Removed ${removed} duplicate(s) (${before} → ${data.actors.length})`);
    totalRemoved = removed;
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(`\n✅ Done! ${totalRemoved} total duplicate(s) removed.`);
