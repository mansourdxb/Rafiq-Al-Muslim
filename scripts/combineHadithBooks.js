/**
 * combineHadithBooks.js
 * Run ONCE from project root to combine each book's data into a single JSON.
 *
 * Structure per book folder:
 *   index.json        ← book metadata + chapter list
 *   1.json, 2.json... ← chapter data (numbered)
 *   chapters.ts       ← barrel file (ignored)
 *
 * Usage:
 *   node scripts/combineHadithBooks.js
 *
 * Output: client/data/hadith_combined/{book}.json
 */

const fs = require("fs");
const path = require("path");

const BOOKS_DIR = path.join(__dirname, "..", "client", "data", "the_9_books");
const OUTPUT_DIR = path.join(__dirname, "..", "client", "data", "hadith_combined");

const bookFolders = fs.readdirSync(BOOKS_DIR).filter((f) => {
  return fs.statSync(path.join(BOOKS_DIR, f)).isDirectory();
});

console.log(`Found ${bookFolders.length} book folders: ${bookFolders.join(", ")}`);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

for (const bookName of bookFolders) {
  const bookDir = path.join(BOOKS_DIR, bookName);
  const indexPath = path.join(bookDir, "index.json");

  if (!fs.existsSync(indexPath)) {
    console.log(`  ⚠ Skipping ${bookName} — no index.json`);
    continue;
  }

  const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

  // Read numbered JSON files (1.json, 2.json, etc.) directly in the book folder
  const allFiles = fs.readdirSync(bookDir);
  const chapterFiles = allFiles
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .filter((f) => /^\d+\.json$/.test(f)); // only numbered files

  const chapters = {};
  for (const chapFile of chapterFiles) {
    const chapId = path.basename(chapFile, ".json");
    try {
      chapters[chapId] = JSON.parse(fs.readFileSync(path.join(bookDir, chapFile), "utf-8"));
    } catch (e) {
      console.log(`  ⚠ Error reading ${bookName}/${chapFile}: ${e.message}`);
    }
  }

  const combined = { index: indexData, chapters };
  const jsonStr = JSON.stringify(combined);
  const outputPath = path.join(OUTPUT_DIR, `${bookName}.json`);
  fs.writeFileSync(outputPath, jsonStr);

  const sizeMB = (Buffer.byteLength(jsonStr, "utf-8") / 1048576).toFixed(1);
  console.log(`  ✓ ${bookName}.json — ${chapterFiles.length} chapters, ${sizeMB} MB`);
}

console.log(`\nDone! Files saved to: ${OUTPUT_DIR}`);