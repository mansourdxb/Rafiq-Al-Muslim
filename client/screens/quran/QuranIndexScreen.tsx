import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadKhatmah, saveKhatmah, type KhatmahState } from "@/src/lib/quran/khatmah";
import { quranFiles } from "@/lib/quran/quranFiles";

type SurahItem = {
  number: number;
  name: string;
  ayahsCount: number;
  typeLabel: string;
  startPage: number;
};
type JuzItem = { index: number; sura: number; aya: number; startPage: number };
type BookmarkItem = {
  key: string;
  sura: number;
  ayah: number;
  surahName: string;
  pageNo: number;
  juzNo: number;
  snippet: string;
  createdAt: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  surahs: SurahItem[];
  juzList: JuzItem[];
  bookmarks: BookmarkItem[];
  currentSurah?: number | null;
  currentJuz?: number | null;
  quarters?: Array<{
    key: string;
    sura: number;
    aya: number;
    surahName: string;
    juzNo: number;
    pageNo: number;
    snippet: string;
    showJuzBadge: boolean;
  }>;
  onSelectSurah: (sura: number) => void;
  onSelectJuz: (sura: number, aya: number) => void;
  onSelectBookmark: (sura: number, aya: number) => void;
  onDeleteBookmark?: (sura: number, aya: number) => void;
  inline?: boolean;
};

const mushafPages: { index: number; sura: number; aya: number }[] = require("../../data/Quran/mushaf-pages.json");

const SEGMENT_TABS = [
  { key: "surah", label: "السور" },
  { key: "juz", label: "الأجزاء" },
  { key: "favorites", label: "المفضلات" },
] as const;

const JUZ_NAMES = [
  "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر",
  "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر",
  "الثامن عشر", "التاسع عشر", "العشرون", "الحادي والعشرون", "الثاني والعشرون", "الثالث والعشرون",
  "الرابع والعشرون", "الخامس والعشرون", "السادس والعشرون", "السابع والعشرون", "الثامن والعشرون",
  "التاسع والعشرون", "الثلاثون",
];

function arabicIndic(value: number) {
  const map = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return String(value)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}

const LAST_READ_KEY = "@tasbeeh/quranLastRead";

export default function QuranIndexScreen({
  visible,
  onClose,
  surahs,
  juzList,
  bookmarks,
  currentSurah,
  currentJuz,
  quarters = [],
  onSelectSurah,
  onSelectJuz,
  onSelectBookmark,
  onDeleteBookmark,
  inline = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [activeSegment, setActiveSegment] = useState<(typeof SEGMENT_TABS)[number]["key"]>("surah");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRead, setLastRead] = useState<{ surahName: string; ayah: number; progress: number } | null>(null);

  useEffect(() => {
    if (!visible) return;
    const loadLastRead = async () => {
      const stored = await AsyncStorage.getItem(LAST_READ_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLastRead({
          surahName: parsed.surahName || "البقرة",
          ayah: parsed.ayah || 286,
          progress: parsed.progress || 45,
        });
      }
    };
    loadLastRead();
  }, [visible]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery) return surahs;
    const query = searchQuery.toLowerCase();
    return surahs.filter((s) => s.name.toLowerCase().includes(query));
  }, [searchQuery, surahs]);

  const renderSurahCard = ({ item }: { item: SurahItem }) => {
    const isActive = item.number === currentSurah;
    const isMadani = item.typeLabel.includes("مدنية");

    return (
      <Pressable
        style={({ pressed }) => [
          styles.surahCard,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          onSelectSurah(item.number);
          onClose();
        }}
      >
        <View style={styles.surahCardRight}>
          <Text style={styles.surahCardNumber}>.{arabicIndic(item.number)}</Text>
          <View style={styles.surahIcon}>
            <Text style={styles.surahIconText}>القرآن الكريم</Text>
          </View>
        </View>

        <View style={styles.surahCardCenter}>
          <Text style={styles.surahCardName}>{item.name}</Text>
          <View style={styles.surahCardMeta}>
            <Ionicons name="moon" size={14} color="#B8AC9B" />
            <Text style={styles.surahCardType}>{isMadani ? "مدنية" : "مكية"}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderJuzCardLegacy = ({ item, index }: { item: any; index: number }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.juzCard,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          onSelectJuz(item.sura, item.aya);
          onClose();
        }}
      >
        <Text style={styles.juzCardNumber}>{arabicIndic(index + 1)}</Text>
        <Text style={styles.juzCardName}>الجزء {JUZ_NAMES[index]}</Text>
      </Pressable>
    );
  };

  /* const renderJuzCard = ({ item, index }: { item: any; index: number }) => {
    const juzNumber = typeof item?.index === "number" ? item.index : index + 1;
    const juzName = JUZ_NAMES[juzNumber - 1] ?? "";
    return (
      <Pressable
        style={({ pressed }) => [
          styles.juzCard,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          onSelectJuz(item.sura, item.aya);
          onClose();
        }}
      >
        <Text style={styles.juzCardNumber}>{arabicIndic(juzNumber)}</Text>
        <Text style={styles.juzCardName}>Ø§Ù„Ø¬Ø²Ø¡ {juzName}</Text>
      </Pressable>
    );
  };

  */
  const renderFavoriteCard = ({ item }: { item: BookmarkItem }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.favoriteCard,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          onSelectBookmark(item.sura, item.ayah);
          onClose();
        }}
      >
        <View style={styles.favoriteCardHeader}>
          <Text style={styles.favoriteCardTitle}>{item.surahName}</Text>
          {onDeleteBookmark && (
            <Pressable onPress={() => onDeleteBookmark(item.sura, item.ayah)}>
              <Ionicons name="trash-outline" size={20} color="#C0392B" />
            </Pressable>
          )}
        </View>
        <Text style={styles.favoriteCardSnippet} numberOfLines={2}>
          {item.snippet}
        </Text>
        <Text style={styles.favoriteCardMeta}>
          الآية {arabicIndic(item.ayah)} • الجزء {arabicIndic(item.juzNo)} • صفحة {arabicIndic(item.pageNo)}
        </Text>
      </Pressable>
    );
  };

  const body = (
    <LinearGradient
      colors={['#2F6E52', '#1E5A3D', '#0F4429']}
      style={styles.root}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color="#B8AC9B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث في القرآن الكريم"
            placeholderTextColor="#B8AC9B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>

        {/* Continue Reading Card */}
        {lastRead && (
          <View style={styles.continueCard}>
            <View style={styles.continueCardPattern}>
              {/* Islamic Pattern SVG placeholder */}
              <View style={styles.patternCircle} />
            </View>
            <View style={styles.continueCardContent}>
              <Text style={styles.continueCardTitle}>استمرار القراءة</Text>
              <Text style={styles.continueCardSubtitle}>
                سورة {lastRead.surahName}، آية {arabicIndic(lastRead.ayah)}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${lastRead.progress}%` }]} />
              </View>
            </View>
          </View>
        )}

        {/* Segment Tabs */}
        <View style={styles.segmentContainer}>
          {SEGMENT_TABS.map((tab) => {
            const active = tab.key === activeSegment;
            return (
              <Pressable
                key={tab.key}
                style={[styles.segmentTab, active && styles.segmentTabActive]}
                onPress={() => setActiveSegment(tab.key)}
              >
                <Text style={[styles.segmentTabText, active && styles.segmentTabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Content List */}
        <View style={styles.listContainer}>
          {activeSegment === "surah" && (
            <FlatList
              data={filteredSurahs}
              renderItem={renderSurahCard}
              keyExtractor={(item) => `surah-${item.number}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeSegment === "juz" && (
            <FlatList
              data={juzList.filter((_, i) => i < 30)}
              renderItem={renderJuzCardLegacy}
              keyExtractor={(item, index) => `juz-${typeof item?.index === "number" ? item.index : index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeSegment === "favorites" && (
            <FlatList
              data={bookmarks}
              renderItem={renderFavoriteCard}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="bookmark-outline" size={48} color="#B8AC9B" />
                  <Text style={styles.emptyText}>لا توجد مفضلات بعد</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </LinearGradient>
  );

  const bodyWithNavigation = (
    <View style={{ flex: 1 }}>
      {body}
      {/* Bottom Navigation - Matches design exactly */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        {/* المزيد (More/Menu) */}
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to More */}}>
          <Ionicons name="ellipsis-horizontal" size={26} color="#8B7B6A" />
          <Text style={styles.navText}>المزيد</Text>
        </Pressable>
        
        {/* الأذكار (Athkar/Remembrance) */}
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Athkar */}}>
          <Ionicons name="color-palette-outline" size={26} color="#8B7B6A" />
          <Text style={styles.navText}>الأذكار</Text>
        </Pressable>
        
        {/* الحديث (Hadith) */}
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Hadith */}}>
          <Ionicons name="chatbubbles-outline" size={26} color="#8B7B6A" />
          <Text style={styles.navText}>الحديث</Text>
        </Pressable>
        
        {/* القرآن (Quran) - ACTIVE */}
        <Pressable style={styles.navItem} onPress={() => {/* Current: Quran */}}>
          <View style={styles.quranIconContainer}>
            <Ionicons name="book" size={26} color="#D4A56A" />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>القرآن</Text>
        </Pressable>
        
        {/* الصلاة (Prayer) */}
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Prayer */}}>
          <Ionicons name="moon-outline" size={26} color="#8B7B6A" />
          <Text style={styles.navText}>الصلاة</Text>
        </Pressable>
      </View>
    </View>
  );

  if (inline) {
    return bodyWithNavigation;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      {bodyWithNavigation}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 123, 101, 0.4)',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Cairo',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Continue Reading Card
  continueCard: {
    backgroundColor: '#E8DCC8',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  continueCardPattern: {
    width: 80,
    height: 80,
    marginLeft: 16,
  },
  patternCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D4B896',
    opacity: 0.3,
  },
  continueCardContent: {
    flex: 1,
  },
  continueCardTitle: {
    fontFamily: 'CairoBold',
    fontSize: 20,
    color: '#2F2A24',
    textAlign: 'right',
    marginBottom: 4,
  },
  continueCardSubtitle: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: '#6E5A46',
    textAlign: 'right',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2F6E52',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4A56A',
    borderRadius: 4,
  },

  // Segment Tabs
  segmentContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(78, 123, 101, 0.3)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentTabText: {
    fontFamily: 'CairoBold',
    fontSize: 14,
    color: '#B8AC9B',
  },
  segmentTabTextActive: {
    color: '#2F6E52',
  },

  // List Container
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
    gap: 12,
  },

  // Surah Card
  surahCard: {
    backgroundColor: 'rgba(78, 123, 101, 0.4)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  surahCardRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  surahCardNumber: {
    fontFamily: 'CairoBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  surahIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 165, 106, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahIconText: {
    fontFamily: 'CairoBold',
    fontSize: 8,
    color: '#D4A56A',
  },
  surahCardCenter: {
    alignItems: 'flex-end',
  },
  surahCardName: {
    fontFamily: 'CairoBold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 4,
  },
  surahCardMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  surahCardType: {
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#B8AC9B',
  },

  // Juz Card
  juzCard: {
    backgroundColor: 'rgba(78, 123, 101, 0.4)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-end',
  },
  juzCardNumber: {
    fontFamily: 'CairoBold',
    fontSize: 24,
    color: '#D4A56A',
    marginBottom: 4,
  },
  juzCardName: {
    fontFamily: 'CairoBold',
    fontSize: 18,
    color: '#FFFFFF',
  },

  // Favorite Card
  favoriteCard: {
    backgroundColor: 'rgba(78, 123, 101, 0.4)',
    borderRadius: 16,
    padding: 16,
  },
  favoriteCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  favoriteCardTitle: {
    fontFamily: 'CairoBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  favoriteCardSnippet: {
    fontFamily: 'KFGQPCUthmanicScript',
    fontSize: 16,
    color: '#E8DCC8',
    textAlign: 'right',
    lineHeight: 28,
    marginBottom: 8,
  },
  favoriteCardMeta: {
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#B8AC9B',
    textAlign: 'right',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#B8AC9B',
    marginTop: 12,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F5F1E8',
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active item styling
  },
  quranIconContainer: {
    // Special styling for active Quran icon
  },
  navText: {
    fontFamily: 'Cairo',
    fontSize: 11,
    color: '#8B7B6A',
    marginTop: 4,
  },
  navTextActive: {
    fontFamily: 'CairoBold',
    color: '#D4A56A',
  },
});
