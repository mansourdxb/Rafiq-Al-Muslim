/**
 * patchHadithScreens.js
 * Patches all 9 BooksScreens + 9 ChapterScreens to use useHadithBook hook
 * instead of static imports from the_9_books.
 *
 * Usage: node scripts/patchHadithScreens.js
 */

const fs = require("fs");
const path = require("path");

const SCREENS_DIR = path.join(__dirname, "..", "client", "screens", "hadith");

const BOOKS = [
  { name: "Bukhari",  key: "bukhari",  folder: "bukhari" },
  { name: "Muslim",   key: "muslim",   folder: "muslim" },
  { name: "AbuDawud", key: "abudawud", folder: "abudawud" },
  { name: "Tirmidhi", key: "tirmidhi", folder: "tirmidhi" },
  { name: "IbnMajah", key: "ibnmajah", folder: "ibnmajah" },
  { name: "Nasai",    key: "nasai",    folder: "nasai" },
  { name: "Malik",    key: "malik",    folder: "malik" },
  { name: "Darimi",   key: "darimi",   folder: "darimi" },
  { name: "Ahmed",    key: "ahmed",    folder: "ahmed" },
];

let patchedCount = 0;

for (const book of BOOKS) {
  // ── Patch BooksScreen ──
  const booksFile = path.join(SCREENS_DIR, `${book.name}BooksScreen.tsx`);
  if (fs.existsSync(booksFile)) {
    let content = fs.readFileSync(booksFile, "utf-8");
    const hadOldImport = content.includes(`@/data/the_9_books/${book.folder}/index.json`);

    if (hadOldImport) {
      // Remove old static import
      content = content.replace(
        new RegExp(`import\\s+indexData\\s+from\\s+["']@/data/the_9_books/${book.folder}/index\\.json["'];?\\n?`),
        ""
      );

      // Add hook import if not already there
      if (!content.includes("useHadithBook")) {
        content = content.replace(
          /import.*useNavigation.*from.*["']@react-navigation\/native["'];?\n/,
          (match) => match + `import { useHadithBook } from "@/hooks/useHadithBook";\n`
        );
      }

      // Add hook + ActivityIndicator import
      if (!content.includes("ActivityIndicator")) {
        content = content.replace(
          /} from "react-native";/,
          `  ActivityIndicator,\n} from "react-native";`
        );
      }

      // Add Ionicons if not there
      if (!content.includes("Ionicons")) {
        content = content.replace(
          /import.*Feather.*from.*["']@expo\/vector-icons["'];?\n/,
          (match) => match.replace("} from", ", Ionicons } from")
        );
      }

      // Replace the function body to use the hook
      // Find: const books = (indexData as IndexData).books ?? [];
      //       const title = (indexData as IndexData).titleAr;
      content = content.replace(
        /const \[query, setQuery\] = useState\(""\);\s*\n\s*const books = \(indexData as IndexData\)\.books \?\? \[\];\s*\n\s*const title = \(indexData as IndexData\)\.titleAr;/,
        `// Load from cache\n  const { indexData, loading, cached, downloading, progress, download, error } = useHadithBook("${book.key}");\n\n  const [query, setQuery] = useState("");\n  const books: BookItem[] = indexData?.books ?? [];\n  const title = indexData?.titleAr ?? "${book.name}";`
      );

      // Add download screen before main return
      // Find the return ( and add loading/download states before it
      const returnIndex = content.indexOf("  return (");
      if (returnIndex !== -1 && !content.includes("emptyWrap")) {
        const downloadUI = `
  // Show download prompt if not cached
  if (!loading && !cached) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-download-outline" size={56} color="#D4AF37" />
          <Text style={styles.emptyTitle}>الكتاب غير محمل</Text>
          <Text style={styles.emptySub}>يجب تحميل الكتاب أولاً لتتمكن من القراءة</Text>
          {downloading ? (
            <View style={styles.downloadingRow}>
              <ActivityIndicator size="small" color="#2D7A4E" />
              <Text style={styles.downloadPct}>{progress}%</Text>
            </View>
          ) : (
            <Pressable style={styles.downloadCta} onPress={download}>
              <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
              <Text style={styles.downloadCtaText}>تحميل الكتاب</Text>
            </Pressable>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#2D7A4E" />
      </View>
    );
  }

`;
        content = content.slice(0, returnIndex) + downloadUI + content.slice(returnIndex);
      }

      // Add missing styles
      if (!content.includes("emptyWrap")) {
        // styles already added via the UI above
      }
      const stylesEnd = content.lastIndexOf("});");
      if (stylesEnd !== -1 && !content.includes("emptyWrap:")) {
        const extraStyles = `
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 10 },
  emptyTitle: { fontFamily: "CairoBold", fontSize: 20, color: "#1C1714", marginTop: 10 },
  emptySub: { fontFamily: "Cairo", fontSize: 14, color: "#968C80", textAlign: "center" },
  downloadCta: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#2D7A4E", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, marginTop: 10 },
  downloadCtaText: { fontFamily: "CairoBold", fontSize: 16, color: "#FFF" },
  downloadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  downloadPct: { fontFamily: "CairoBold", fontSize: 16, color: "#2D7A4E" },
  errorText: { fontFamily: "Cairo", fontSize: 13, color: "#C0392B", marginTop: 6 },
`;
        content = content.slice(0, stylesEnd) + extraStyles + content.slice(stylesEnd);
      }

      fs.writeFileSync(booksFile, content);
      console.log(`  ✓ ${book.name}BooksScreen.tsx patched`);
      patchedCount++;
    } else {
      console.log(`  ⏭ ${book.name}BooksScreen.tsx — already patched or no old import`);
    }
  } else {
    console.log(`  ⚠ ${book.name}BooksScreen.tsx — not found`);
  }

  // ── Patch ChapterScreen ──
  const chapterFile = path.join(SCREENS_DIR, `${book.name}ChapterScreen.tsx`);
  if (fs.existsSync(chapterFile)) {
    let content = fs.readFileSync(chapterFile, "utf-8");
    const hadOldImport = content.includes(`@/data/the_9_books/${book.folder}/chapters`);

    if (hadOldImport) {
      // Remove old static import
      content = content.replace(
        new RegExp(`import\\s+chapters\\s+from\\s+["']@/data/the_9_books/${book.folder}/chapters["'];?\\n?`),
        ""
      );

      // Add hook import
      if (!content.includes("useHadithBook")) {
        content = content.replace(
          /import HadithImageCard.*\n/,
          (match) => match + `import { useHadithBook } from "@/hooks/useHadithBook";\n`
        );
      }

      // Add hook call after contentWidth
      if (!content.includes(`useHadithBook("${book.key}")`)) {
        content = content.replace(
          /const contentWidth = Math\.min\(width, 430\);/,
          `const contentWidth = Math.min(width, 430);\n\n  // Load from cache\n  const { chapters } = useHadithBook("${book.key}");`
        );
      }

      // Fix chapters access: (chapters as any)[chapterId] → chapters?.[chapterId]
      content = content.replace(
        /\(chapters as any\)\[chapterId\]/g,
        "chapters?.[chapterId]"
      );

      fs.writeFileSync(chapterFile, content);
      console.log(`  ✓ ${book.name}ChapterScreen.tsx patched`);
      patchedCount++;
    } else {
      console.log(`  ⏭ ${book.name}ChapterScreen.tsx — already patched or no old import`);
    }
  } else {
    console.log(`  ⚠ ${book.name}ChapterScreen.tsx — not found`);
  }
}

console.log(`\nDone! Patched ${patchedCount} files.`);
