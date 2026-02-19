/**
 * generateHadithWrappers.js
 * Generates 9 BooksScreen + 9 ChapterScreen tiny wrapper files
 * that use the GenericHadithBooksScreen and GenericHadithChapterScreen.
 *
 * Usage: node scripts/generateHadithWrappers.js
 */

const fs = require("fs");
const path = require("path");

const SCREENS_DIR = path.join(__dirname, "..", "client", "screens", "hadith");

const BOOKS = [
  { name: "Bukhari",  key: "bukhari",  title: "صحيح البخاري",  chapter: "BukhariChapter" },
  { name: "Muslim",   key: "muslim",   title: "صحيح مسلم",     chapter: "MuslimChapter" },
  { name: "AbuDawud", key: "abudawud", title: "سنن أبي داود",  chapter: "AbuDawudChapter" },
  { name: "Tirmidhi", key: "tirmidhi", title: "جامع الترمذي",  chapter: "TirmidhiChapter" },
  { name: "IbnMajah", key: "ibnmajah", title: "سنن ابن ماجه",  chapter: "IbnMajahChapter" },
  { name: "Nasai",    key: "nasai",    title: "سنن النسائي",   chapter: "NasaiChapter" },
  { name: "Malik",    key: "malik",    title: "موطأ مالك",     chapter: "MalikChapter" },
  { name: "Darimi",   key: "darimi",   title: "سنن الدارمي",   chapter: "DarimiChapter" },
  { name: "Ahmed",    key: "ahmed",    title: "مسند أحمد",     chapter: "AhmedChapter" },
];

for (const book of BOOKS) {
  // BooksScreen wrapper
  const booksContent = `import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function ${book.name}BooksScreen() {
  return <GenericHadithBooksScreen bookKey="${book.key}" chapterRoute="${book.chapter}" fallbackTitle="${book.title}" />;
}
`;
  const booksPath = path.join(SCREENS_DIR, `${book.name}BooksScreen.tsx`);
  fs.writeFileSync(booksPath, booksContent, "utf-8");
  console.log(`  ✓ ${book.name}BooksScreen.tsx`);

  // ChapterScreen wrapper
  const chapterContent = `import React from "react";
import GenericHadithChapterScreen from "./GenericHadithChapterScreen";

export default function ${book.name}ChapterScreen() {
  return <GenericHadithChapterScreen bookKey="${book.key}" />;
}
`;
  const chapterPath = path.join(SCREENS_DIR, `${book.name}ChapterScreen.tsx`);
  fs.writeFileSync(chapterPath, chapterContent, "utf-8");
  console.log(`  ✓ ${book.name}ChapterScreen.tsx`);
}

console.log(`\nDone! Generated ${BOOKS.length * 2} wrapper files.`);
