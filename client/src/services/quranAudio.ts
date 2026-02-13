import { Audio as ExpoAudio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SURAH_META } from "@/constants/quran/surahMeta";

export const RECITERS = [
  { key: "Abu Bakr Ash-Shaatree_128kbps", label: "أبو بكر الشاطري", folder: "Abu Bakr Ash-Shaatree_128kbps" },
  { key: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net", label: "أحمد بن علي العجمي", folder: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net" },
  { key: "Ahmed_Neana_128kbps", label: "أحمد نعينع", folder: "Ahmed_Neana_128kbps" },
  { key: "Akram_AlAlaqimy_128kbps", label: "أكرم العلقيمي", folder: "Akram_AlAlaqimy_128kbps" },
  { key: "Ayman_Sowaid_64kbps", label: "أيمن سويد", folder: "Ayman_Sowaid_64kbps" },
  { key: "Ibrahim_Akhdar_32kbps", label: "إبراهيم الأخضر", folder: "Ibrahim_Akhdar_32kbps" },
  { key: "Abdullah_Basfar_192kbps", label: "عبد الله بصفر", folder: "Abdullah_Basfar_192kbps" },
  { key: "Abdullah_Matroud_128kbps", label: "عبد الله المطرود", folder: "Abdullah_Matroud_128kbps" },
  { key: "Abdullaah_3awwaad_Al-Juhaynee_128kbps", label: "عبد الله عوّاد الجهني", folder: "Abdullaah_3awwaad_Al-Juhaynee_128kbps" },
  { key: "Abdul_Basit_Mujawwad_128kbps", label: "عبد الباسط عبد الصمد (مجود)", folder: "Abdul_Basit_Mujawwad_128kbps" },
  { key: "Abdul_Basit_Murattal_192kbps", label: "عبد الباسط عبد الصمد (مرتل)", folder: "Abdul_Basit_Murattal_192kbps" },
  { key: "Ali_Hajjaj_AlSuesy_128kbps", label: "علي حجاج السويسي", folder: "Ali_Hajjaj_AlSuesy_128kbps" },
  { key: "Ali_Jaber_64kbps", label: "علي جابر", folder: "Ali_Jaber_64kbps" },
  { key: "Hudhaify_128kbps", label: "علي الحذيفي", folder: "Hudhaify_128kbps" },
  { key: "aziz_alili_128kbps", label: "عزيز عليلي", folder: "aziz_alili_128kbps" },
  { key: "Ghamadi_40kbps", label: "سعد الغامدي", folder: "Ghamadi_40kbps" },
  { key: "Sahl_Yassin_128kbps", label: "سهل ياسين", folder: "Sahl_Yassin_128kbps" },
  { key: "Salah_Al_Budair_128kbps", label: "صلاح البدير", folder: "Salah_Al_Budair_128kbps" },
  { key: "Salaah_AbdulRahman_Bukhatir_128kbps", label: "صلاح عبد الرحمن بخاطر", folder: "Salaah_AbdulRahman_Bukhatir_128kbps" },
  { key: "Saood bin Ibraaheem Ash-Shuraym_128kbps", label: "سعود الشريم", folder: "Saood bin Ibraaheem Ash-Shuraym_128kbps" },
  { key: "Saood_ash-Shuraym_128kbps", label: "سعود الشريم", folder: "Saood_ash-Shuraym_128kbps" },
  { key: "khalefa_al_tunaiji_64kbps", label: "خليفة الطنيجي", folder: "khalefa_al_tunaiji_64kbps" },
  { key: "Khaalid_Abdullaah_al-Qahtaanee_192kbps", label: "خالد عبدالله القحطاني", folder: "Khaalid_Abdullaah_al-Qahtaanee_192kbps" },
  { key: "Karim_Mansoori_40kbps", label: "كريم منصوري", folder: "Karim_Mansoori_40kbps" },
  { key: "Fares_Abbad_64kbps", label: "فارس عباد", folder: "Fares_Abbad_64kbps" },
  { key: "MaherAlMuaiqly128kbps", label: "ماهر المعيقلي", folder: "MaherAlMuaiqly128kbps" },
  { key: "mahmoud_ali_al_banna_32kbps", label: "محمود علي البنا", folder: "mahmoud_ali_al_banna_32kbps" },
  { key: "Husary_128kbps", label: "محمود خليل الحصري", folder: "Husary_128kbps" },
  { key: "Husary_128kbps_Mujawwad", label: "محمود خليل الحصري (مجود)", folder: "Husary_128kbps_Mujawwad" },
  { key: "Husary_Muallim_128kbps", label: "محمود خليل الحصري (المصحف المعلم)", folder: "Husary_Muallim_128kbps" },
  { key: "Mohammad_al_Tablaway_128kbps", label: "محمد محمود الطبلاوي", folder: "Mohammad_al_Tablaway_128kbps" },
  { key: "Muhammad_Ayyoub_128kbps", label: "محمد أيوب", folder: "Muhammad_Ayyoub_128kbps" },
  { key: "Muhammad_Jibreel_128kbps", label: "محمد جبريل", folder: "Muhammad_Jibreel_128kbps" },
  { key: "Minshawy_Mujawwad_192kbps", label: "محمد صديق المنشاوي (مجود)", folder: "Minshawy_Mujawwad_192kbps" },
  { key: "Minshawy_Murattal_128kbps", label: "محمد صديق المنشاوي (مرتل)", folder: "Minshawy_Murattal_128kbps" },
  { key: "Minshawy_Teacher_128kbps", label: "محمد صديق المنشاوي (المصحف المعلم)", folder: "Minshawy_Teacher_128kbps" },
  { key: "Muhammad_AbdulKareem_128kbps", label: "محمد عبد الكريم", folder: "Muhammad_AbdulKareem_128kbps" },
  { key: "Muhsin_Al_Qasim_192kbps", label: "محسن القاسم", folder: "Muhsin_Al_Qasim_192kbps" },
  { key: "Mustafa_Ismail_48kbps", label: "مصطفى إسماعيل", folder: "Mustafa_Ismail_48kbps" },
  { key: "Nasser_Alqatami_128kbps", label: "ناصر القطامي", folder: "Nasser_Alqatami_128kbps" },
  { key: "Nabil_Rifa3i_48kbps", label: "نبيل الرفاعي", folder: "Nabil_Rifa3i_48kbps" },
  { key: "Hani_Rifai_192kbps", label: "هاني الرفاعي", folder: "Hani_Rifai_192kbps" },
  { key: "Yasser_Ad-Dussary_128kbps", label: "ياسر الدوسري", folder: "Yasser_Ad-Dussary_128kbps" },
  { key: "Yaser_Salamah_128kbps", label: "ياسر سلامة", folder: "Yaser_Salamah_128kbps" },

] as const;


export type ReciterKey = (typeof RECITERS)[number]["key"];

const RECITER_MAP: Record<ReciterKey, { key: ReciterKey; label: string; folder: string }> = RECITERS.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<ReciterKey, { key: ReciterKey; label: string; folder: string }>
);
const DEFAULT_RECITER_KEY: ReciterKey = (RECITERS.find((r) => r.folder === "Alafmahmoud_ali_al_banna_32kbpsasy_128kbps")?.key ?? RECITERS[0].key);
const DEFAULT_RECITER_FOLDER = RECITER_MAP[DEFAULT_RECITER_KEY]?.folder ?? RECITERS[0].folder;
const LEGACY_RECITER_KEYS: Record<string, ReciterKey> = {
  Husary: DEFAULT_RECITER_KEY,
  abdulsamad: (RECITERS.find((r) => r.folder === "AbdulSamad_6Abdul_Basit_Murattal_192kbps4kbps_QuranExplorer.Com")?.key ?? DEFAULT_RECITER_KEY),
  Husary: (RECITERS.find((r) => r.folder === "Husary_128kbps")?.key ?? DEFAULT_RECITER_KEY),
  abdulbasit64: (RECITERS.find((r) => r.folder === "Abdul_Basit_Murattal_64kbps")?.key ?? DEFAULT_RECITER_KEY),
};

const AR_LABELS: Record<string, string> = {

  // Abdul Basit / Abdul Samad (as per your RECITERS labels)
  "AbdulSamad": "عبد الباسط عبد الصمد",
  "AbdulSamad_64kbps_QuranExplorer.Com": "عبد الباسط عبد الصمد",
  "AbdulSamad_64kbps_QuranExplorer_Com": "عبد الباسط عبد الصمد", // fallback if you used "_" instead of "."

  "Abdul_Basit_Murattal": "عبد الباسط عبد الصمد (مرتل)",
  "Abdul_Basit_Murattal_192kbps": "عبد الباسط عبد الصمد (مرتل)",
  "Abdul_Basit_Mujawwad_128kbps": "عبد الباسط عبد الصمد (مجود)",

  // Juhaynee
  "Abdullaah_3awwaad_Al-Juhaynee_128kbps": "عبد الله عوّاد الجهني",

  // Basfar
  "Abdullah_Basfar": "عبد الله بصفر",
  "Abdullah_Basfar_192kbps": "عبد الله بصفر",
  "Abdullah_Basfar_64kbps": "عبد الله بصفر",
  "Abdullah_Basfar_32kbps": "عبد الله بصفر",

  // Matroud
  "Abdullah_Matroud": "عبد الله المطرود",
  "Abdullah_Matroud_128kbps": "عبد الله المطرود",

  // Sudais (note: folder has As-Sudais, your old map used As_Sudais)
  "Abdurrahmaan_As-Sudais": "عبد الرحمن السديس",
  "Abdurrahmaan_As-Sudais_64kbps": "عبد الرحمن السديس",
  "Abdurrahmaan_As-Sudais_192kbps": "عبد الرحمن السديس",
  "Abdurrahmaan_As_Sudais": "عبد الرحمن السديس",
  "Abdurrahmaan_As_Sudais_64kbps": "عبد الرحمن السديس",
  "Abdurrahmaan_As_Sudais_192kbps": "عبد الرحمن السديس",

  // Ash-Shaatree (some keys include spaces)
  "Abu Bakr Ash-Shaatree": "أبو بكر الشاطري",
  "Abu Bakr Ash-Shaatree_128kbps": "أبو بكر الشاطري",
  "Abu_Bakr_Ash-Shaatree": "أبو بكر الشاطري",
  "Abu_Bakr_Ash-Shaatree_128kbps": "أبو بكر الشاطري",
  "Abu_Bakr_Ash-Shaatree_64kbps": "أبو بكر الشاطري",
  "Abu_Bakr_Ash_Shaatree": "أبو بكر الشاطري",
  "Abu_Bakr_Ash_Shaatree_128kbps": "أبو بكر الشاطري",
  "Abu_Bakr_Ash_Shaatree_64kbps": "أبو بكر الشاطري",

  // Ahmed Neana
  "Ahmed_Neana": "أحمد نعنة",
  "Ahmed_Neana_128kbps": "أحمد نعنة",

  // Ahmed ibn Ali al-Ajamy
  "Ahmed_ibn_Ali_al-Ajamy": "أحمد بن علي العجمي",
  "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net": "أحمد بن علي العجمي",
  "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com": "أحمد بن علي العجمي",
  "ahmed_ibn_ali_al_ajamy_128kbps": "أحمد بن علي العجمي",

  // Akram AlAlaqimy
  "Akram_AlAlaqimy": "أكرم العلقيمي",
  "Akram_AlAlaqimy_128kbps": "أكرم العلقيمي",

  // Ali Hajjaj / Ali Jaber
  "Ali_Hajjaj_AlSuesy": "علي حجاج السويسي",
  "Ali_Hajjaj_AlSuesy_128kbps": "علي حجاج السويسي",
  "Ali_Jaber": "علي جابر",
  "Ali_Jaber_64kbps": "علي جابر",

  // Ayman Sowaid
  "Ayman_Sowaid": "أيمن سويد",
  "Ayman_Sowaid_64kbps": "أيمن سويد",

  // Fares Abbad
  "Fares_Abbad": "فارس عباد",
  "Fares_Abbad_64kbps": "فارس عباد",

  // Aziz alili
  "aziz_alili": "عزيز عليلي",
  "aziz_alili_128kbps": "عزيز عليلي",

  // Ghamadi
  "Ghamadi": "سعد الغامدي",
  "Ghamadi_40kbps": "سعد الغامدي",

  // Hudhaify
  "Hudhaify": "علي الحذيفي",
  "Hudhaify_128kbps": "علي الحذيفي",
  "Hudhaify_64kbps": "علي الحذيفي",
  "Hudhaify_32kbps": "علي الحذيفي",

  // Husary
  "Husary": "محمود خليل الحصري",
  "Husary_128kbps": "محمود خليل الحصري",
  "Husary_64kbps": "محمود خليل الحصري",
  "Husary_128kbps_Mujawwad": "محمود خليل الحصري (مجود)",
  "Husary_Mujawwad_64kbps": "محمود خليل الحصري (مجود)",
  "Husary_Muallim_128kbps": "محمود خليل الحصري (معلّم)",

  // Ibrahim Akhdar
  "Ibrahim_Akhdar": "إبراهيم الأخضر",
  "Ibrahim_Akhdar_32kbps": "إبراهيم الأخضر",
  "Ibrahim_Akhdar_64kbps": "إبراهيم الأخضر",

  // Karim Mansoori / Khalid Qahtanee
  "Karim_Mansoori": "كريم منصوري",
  "Karim_Mansoori_40kbps": "كريم منصوري",
  "Khaalid_Abdullaah_al-Qahtaanee": "خالد عبدالله القحطاني",
  "Khaalid_Abdullaah_al-Qahtaanee_192kbps": "خالد عبدالله القحطاني",

  // Maher AlMuaiqly
  "Maher_AlMuaiqly": "ماهر المعيقلي",
  "Maher_AlMuaiqly_64kbps": "ماهر المعيقلي",
  "MaherAlMuaiqly128kbps": "ماهر المعيقلي",

  // Menshawi / Minshawy variants
  "Menshawi": "محمد صديق المنشاوي",
  "Menshawi_16kbps": "محمد صديق المنشاوي",
  "Menshawi_32kbps": "محمد صديق المنشاوي",
  "Minshawy_Mujawwad_192kbps": "محمد صديق المنشاوي (مجود)",
  "Minshawy_Mujawwad_64kbps": "محمد صديق المنشاوي (مجود)",
  "Minshawy_Murattal_128kbps": "محمد صديق المنشاوي (مرتل)",
  "Minshawy_Teacher_128kbps": "محمد صديق المنشاوي (معلّم)",

  // Tablaway
  "Mohammad_al_Tablaway_128kbps": "محمد محمود الطبلاوي",
  "Mohammad_al_Tablaway_64kbps": "محمد الطبلاوي",

  // Muhammad AbdulKareem
  "Muhammad_AbdulKareem_128kbps": "محمد عبد الكريم",

  // Muhammad Ayyoub
  "Muhammad_Ayyoub": "محمد أيوب",
  "Muhammad_Ayyoub_128kbps": "محمد أيوب",
  "Muhammad_Ayyoub_64kbps": "محمد أيوب",
  "Muhammad_Ayyoub_32kbps": "محمد أيوب",

  // Muhammad Jibreel
  "Muhammad_Jibreel": "محمد جبريل",
  "Muhammad_Jibreel_128kbps": "محمد جبريل",
  "Muhammad_Jibreel_64kbps": "محمد جبريل",

  // Muhsin Al Qasim
  "Muhsin_Al_Qasim": "محسن القاسم",
  "Muhsin_Al_Qasim_192kbps": "محسن القاسم",

  // Mustafa Ismail
  "Mustafa_Ismail": "مصطفى إسماعيل",
  "Mustafa_Ismail_48kbps": "مصطفى إسماعيل",

  // Nabil / Nasser
  "Nabil_Rifa3i": "نبيل الرفاعي",
  "Nabil_Rifa3i_48kbps": "نبيل الرفاعي",
  "Nasser_Alqatami": "ناصر القطامي",
  "Nasser_Alqatami_128kbps": "ناصر القطامي",

  // Hani Rifai
  "Hani_Rifai": "هاني الرفاعي",
  "Hani_Rifai_192kbps": "هاني الرفاعي",
  "Hani_Rifai_64kbps": "هاني الرفاعي",

  // Sahl / Salah / Bukhatir
  "Sahl_Yassin": "سهل ياسين",
  "Sahl_Yassin_128kbps": "سهل ياسين",
  "Salah_Al_Budair": "صلاح البدير",
  "Salah_Al_Budair_128kbps": "صلاح البدير",
  "Salaah_AbdulRahman_Bukhatir": "صلاح عبد الرحمن بخاطر",
  "Salaah_AbdulRahman_Bukhatir_128kbps": "صلاح عبد الرحمن بخاطر",

  // Shuraym (one key includes spaces)
  "Saood_ash-Shuraym": "سعود الشريم",
  "Saood_ash-Shuraym_128kbps": "سعود الشريم",
  "Saood_ash-Shuraym_64kbps": "سعود الشريم",
  "Saood bin Ibraaheem Ash-Shuraym_128kbps": "سعود الشريم",
  "Saood_ash_Shuraym": "سعود الشريم",
  "Saood_ash_Shuraym_128kbps": "سعود الشريم",
  "Saood_ash_Shuraym_64kbps": "سعود الشريم",

  // Yaser / Dussary
  "Yaser_Salamah": "ياسر سلامة",
  "Yaser_Salamah_128kbps": "ياسر سلامة",
  "Yasser_Ad-Dussary": "ياسر الدوسري",
  "Yasser_Ad-Dussary_128kbps": "ياسر الدوسري",
  "Yasser_Ad_Dussary": "ياسر الدوسري",
  "Yasser_Ad_Dussary_128kbps": "ياسر الدوسري",

  // Khalefa tunaiji
  "khalefa_al_tunaiji_64kbps": "خليفة الطنيجي",

  // Mahmoud Ali Al Banna
  "mahmoud_ali_al_banna_32kbps": "محمود علي البنا",


  // Warsh
  "warsh": "ورش",
};


const removeNoise = (folder: string) => {
  let value = folder.replace(/_(\\d+kbps).*/i, "");
  value = value.replace(/_QuranExplorer\\.Com/i, "");
  value = value.replace(/_ketaballah\\.net/i, "");
  return value.replace(/_/g, " ").trim();
};

export const getArabicReciterLabel = (folder: string) => {
  const normalized = folder.replace(/\\./g, "_").replace(/-/g, "_");
  if (AR_LABELS[folder]) return AR_LABELS[folder];
  if (AR_LABELS[normalized]) return AR_LABELS[normalized];
  const base = removeNoise(normalized);
  if (AR_LABELS[base]) return AR_LABELS[base];
  const match = Object.keys(AR_LABELS).find((k) => base.startsWith(k));
  if (match) return AR_LABELS[match];
  return removeNoise(folder);
};

export const RECITER_OPTIONS = RECITERS.map((r) => ({
  ...r,
  label: getArabicReciterLabel(r.folder),
}));

export const pad3 = (value: number) => String(value).padStart(3, "0");

export function buildEveryAyahUrl(surah: number, ayah: number, reciter: ReciterKey): string {
  const folder = RECITER_MAP[reciter]?.folder ?? DEFAULT_RECITER_FOLDER;
  return `https://everyayah.com/data/${folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

export const getReciterDir = (folder: string) => {
  if (!FileSystem.cacheDirectory) return "";
  return `${FileSystem.cacheDirectory}quran-audio/${folder}/`;
};

export const getSurahDoneMarkerPath = (folder: string, surahNumber: number) => {
  const dir = getReciterDir(folder);
  if (!dir) return "";
  return `${dir}surah_${pad3(surahNumber)}.done`;
};

export const isSurahDownloaded = async (folder: string, surahNumber: number): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  const marker = getSurahDoneMarkerPath(folder, surahNumber);
  if (!marker) return false;
  try {
    const info = await FileSystem.getInfoAsync(marker);
    return info.exists;
  } catch {
    return false;
  }
};

export const downloadSurah = async (
  folder: string,
  surahNumber: number,
  ayahCount: number,
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (Platform.OS === "web") return;
  const dir = getReciterDir(folder);
  if (!dir || ayahCount <= 0) return;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  let completed = 0;
  const total = Math.max(1, ayahCount);
  for (let ayah = 1; ayah <= ayahCount; ayah += 1) {
    const file = `${dir}${pad3(surahNumber)}${pad3(ayah)}.mp3`;
    const info = await FileSystem.getInfoAsync(file);
    if (!info.exists) {
      const url = `https://everyayah.com/data/${folder}/${pad3(surahNumber)}${pad3(ayah)}.mp3`;
      await FileSystem.downloadAsync(url, file);
    }
    completed += 1;
    if (onProgress) {
      onProgress(Math.min(1, completed / total));
    }
  }
  const marker = getSurahDoneMarkerPath(folder, surahNumber);
  if (marker) {
    await FileSystem.writeAsStringAsync(marker, String(Date.now()));
  }
};

export async function getCachedAyahUri(opts: {
  surah: number;
  ayah: number;
  reciter: ReciterKey;
}): Promise<string> {
  const { surah, ayah, reciter } = opts;
  const url = buildEveryAyahUrl(surah, ayah, reciter);
  if (Platform.OS === "web" || !FileSystem.cacheDirectory) {
    return url;
  }
  const folder = RECITER_MAP[reciter]?.folder ?? RECITER_MAP.Husary_128kbps.folder;
  const dir = getReciterDir(folder);
  const file = `${dir}${pad3(surah)}${pad3(ayah)}.mp3`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const info = await FileSystem.getInfoAsync(file);
  if (info.exists && info.uri) {
    return info.uri;
  }
  const downloaded = await FileSystem.downloadAsync(url, file);
  return downloaded.uri;
}

export type PlayerState = {
  visible: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  surah: number | null;
  ayah: number | null;
  surahName?: string;
  reciterKey: ReciterKey;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  repeatOne: boolean;
};

export type QuranPlaybackState = {
  isPlaying: boolean;
  isPaused: boolean;
  surahNumber: number | null;
  ayahNumber: number | null;
  reciterKey: ReciterKey | null;
  positionMillis?: number;
  durationMillis?: number;
};

const DEFAULT_STATE: PlayerState = {
  visible: false,
  isLoading: false,
  isPlaying: false,
  surah: null,
  ayah: null,
  surahName: undefined,
  reciterKey: DEFAULT_RECITER_KEY,
  positionMillis: 0,
  durationMillis: 0,
  rate: 1,
  repeatOne: false,
};

const SUBSCRIBERS = new Set<(s: PlayerState) => void>();
let playerState: PlayerState = { ...DEFAULT_STATE };

const PLAYBACK_SUBSCRIBERS = new Set<(s: QuranPlaybackState) => void>();
let playbackState: QuranPlaybackState = {
  isPlaying: false,
  isPaused: false,
  surahNumber: null,
  ayahNumber: null,
  reciterKey: null,
  positionMillis: 0,
  durationMillis: 0,
};

export function getPlayerState(): PlayerState {
  return playerState;
}

export function getQuranPlaybackState(): QuranPlaybackState {
  return playbackState;
}

const emitState = (next: Partial<PlayerState>) => {
  playerState = { ...playerState, ...next };
  SUBSCRIBERS.forEach((cb) => cb(playerState));
};

const emitPlaybackState = (next: Partial<QuranPlaybackState>) => {
  playbackState = { ...playbackState, ...next };
  PLAYBACK_SUBSCRIBERS.forEach((cb) => cb(playbackState));
};

export function subscribePlayer(cb: (s: PlayerState) => void): () => void {
  SUBSCRIBERS.add(cb);
  cb(playerState);
  return () => {
    SUBSCRIBERS.delete(cb);
  };
}

export function subscribeQuranPlayback(cb: (s: QuranPlaybackState) => void): () => void {
  PLAYBACK_SUBSCRIBERS.add(cb);
  cb(playbackState);
  return () => {
    PLAYBACK_SUBSCRIBERS.delete(cb);
  };
}

const RECITER_STORAGE_KEY = "quran.reciterKey";
let reciterLoaded = false;
const loadReciterKey = async (): Promise<ReciterKey> => {
  if (reciterLoaded) return playerState.reciterKey;
  try {
    const raw = await AsyncStorage.getItem(RECITER_STORAGE_KEY);
    if (raw) {
      if (raw in RECITER_MAP) {
        emitState({ reciterKey: raw as ReciterKey });
      } else if (raw in LEGACY_RECITER_KEYS) {
        emitState({ reciterKey: LEGACY_RECITER_KEYS[raw] });
      }
    }
  } catch {
    // ignore
  }
  reciterLoaded = true;
  return playerState.reciterKey;
};

const persistReciterKey = async (key: ReciterKey) => {
  if (key === playerState.reciterKey) return;
  emitState({ reciterKey: key });
  try {
    await AsyncStorage.setItem(RECITER_STORAGE_KEY, key);
  } catch {
    // ignore
  }
};

const SURAH_MAP = new Map(SURAH_META.map((s) => [s.number, s]));
const resolveSurahName = (surah: number, provided?: string) => {
  if (provided) return provided;
  return SURAH_MAP.get(surah)?.name_ar ?? `???? ${surah}`;
};

let audioModeReady = false;
let sound: ExpoAudio.Sound | null = null;
let currentKey: string | null = null;
let webAudio: HTMLAudioElement | null = null;
let webKey: string | null = null;
let currentAyahCount: number | null = null;
let webStatusTimer: ReturnType<typeof setInterval> | null = null;
let stopAtTarget: { surah: number; ayah: number } | null = null;

const compareAyahRef = (a: { surah: number; ayah: number }, b: { surah: number; ayah: number }) => {
  if (a.surah !== b.surah) return a.surah - b.surah;
  return a.ayah - b.ayah;
};

const stopWebPolling = () => {
  if (webStatusTimer) {
    clearInterval(webStatusTimer);
    webStatusTimer = null;
  }
};

const startWebPolling = () => {
  if (webStatusTimer) return;
  webStatusTimer = setInterval(() => {
    if (!webAudio) return;
    const duration = Math.floor((webAudio.duration || 0) * 1000) || 0;
    const position = Math.floor((webAudio.currentTime || 0) * 1000) || 0;
    emitPlaybackState({
      isPlaying: !webAudio.paused,
      isPaused: webAudio.paused,
      positionMillis: position,
      durationMillis: duration,
    });
    if (webAudio.ended) {
      stopWebPolling();
      emitPlaybackState({ isPlaying: false, isPaused: false });
      void handleEnded();
    }
  }, 500);
};

const ensureAudioMode = async () => {
  if (Platform.OS === "web") return;
  if (audioModeReady) return;
  await ExpoAudio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: ExpoAudio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    interruptionModeAndroid: ExpoAudio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioModeReady = true;
};

const makeKey = (surah: number, ayah: number, reciterKey: ReciterKey) => `${reciterKey}:${surah}:${ayah}`;

const handleEnded = async () => {
  if (!playerState.surah || !playerState.ayah) return;
  if (stopAtTarget && compareAyahRef({ surah: playerState.surah, ayah: playerState.ayah }, stopAtTarget) >= 0) {
    stopAtTarget = null;
    await stopAndHide();
    return;
  }
  if (playerState.repeatOne) {
    await playAyah({
      surah: playerState.surah,
      ayah: playerState.ayah,
      surahName: playerState.surahName,
      reciterKey: playerState.reciterKey,
      ayahCount: currentAyahCount ?? undefined,
    });
    return;
  }
  await nextAyah();
};

const attachWebEvents = (audio: HTMLAudioElement, url: string) => {
  audio.onplaying = () => {
    console.log("[QuranAudio][web] playing", url);
    emitState({ isPlaying: true, isLoading: false });
    emitPlaybackState({ isPlaying: true, isPaused: false });
  };
  audio.onpause = () => {
    console.log("[QuranAudio][web] paused", url);
    emitState({ isPlaying: false });
    emitPlaybackState({ isPlaying: false, isPaused: true });
  };
  audio.onloadedmetadata = () => {
    const duration = Math.floor(audio.duration * 1000) || 0;
    emitState({ durationMillis: duration });
    emitPlaybackState({ durationMillis: duration });
  };
  audio.ontimeupdate = () => {
    const position = Math.floor(audio.currentTime * 1000) || 0;
    emitState({ positionMillis: position });
    emitPlaybackState({ positionMillis: position });
  };
  audio.onended = () => {
    emitState({ isPlaying: false });
    emitPlaybackState({ isPlaying: false, isPaused: false });
    void handleEnded();
  };
  audio.onerror = (e) => {
    console.error("[QuranAudio][web] error", url, e);
    emitState({ isPlaying: false, isLoading: false });
    emitPlaybackState({ isPlaying: false, isPaused: false });
  };
};

const startWebPlayback = async (surah: number, ayah: number, reciterKey: ReciterKey) => {
  const url = buildEveryAyahUrl(surah, ayah, reciterKey);
  console.log("[QuranAudio][web] url", url);
  if (webAudio) {
    webAudio.pause();
    webAudio.currentTime = 0;
  }
  const HtmlAudioCtor = typeof window !== "undefined" ? window.Audio : null;
  webAudio = HtmlAudioCtor ? new HtmlAudioCtor(url) : null;
  if (!webAudio) {
    emitState({ isPlaying: false, isLoading: false });
    emitPlaybackState({ isPlaying: false, isPaused: false });
    return;
  }
  webAudio.preload = "auto";
  webAudio.crossOrigin = "anonymous";
  webAudio.playbackRate = playerState.rate || 1;
  attachWebEvents(webAudio, url);
  webKey = makeKey(surah, ayah, reciterKey);
  startWebPolling();
  await webAudio.play();
};

const startNativePlayback = async (surah: number, ayah: number, reciterKey: ReciterKey) => {
  await ensureAudioMode();
  await stopInternal(false);
  const uri = await getCachedAyahUri({ surah, ayah, reciter: reciterKey });
  const newSound = new ExpoAudio.Sound();
  await newSound.loadAsync({ uri }, { shouldPlay: true, rate: playerState.rate || 1 });
  await newSound.playAsync();
  newSound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) return;
    emitPlaybackState({
      isPlaying: status.isPlaying,
      isPaused: !status.isPlaying,
      positionMillis: status.positionMillis ?? 0,
      durationMillis: status.durationMillis ?? 0,
    });
    emitState({
      isPlaying: status.isPlaying,
      positionMillis: status.positionMillis ?? 0,
      durationMillis: status.durationMillis ?? 0,
    });
    if (status.didJustFinish) {
      emitState({ isPlaying: false });
      void handleEnded();
    }
  });
  sound = newSound;
  currentKey = makeKey(surah, ayah, reciterKey);
};

const stopInternal = async (hide: boolean) => {
  stopAtTarget = null;
  if (Platform.OS === "web") {
    if (webAudio) {
      webAudio.pause();
      webAudio.currentTime = 0;
      webAudio = null;
      webKey = null;
    }
    stopWebPolling();
  } else if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;
    currentKey = null;
  }
  emitState({
    isPlaying: false,
    isLoading: false,
    positionMillis: 0,
    durationMillis: 0,
    ...(hide ? { visible: false, surah: null, ayah: null, surahName: undefined } : null),
  });
  emitPlaybackState({
    isPlaying: false,
    isPaused: false,
    positionMillis: 0,
    durationMillis: 0,
    ...(hide ? { surahNumber: null, ayahNumber: null, reciterKey: null } : null),
  });
};

export async function playAyah(opts: {
  surah: number;
  ayah: number;
  surahName?: string;
  reciterKey?: ReciterKey;
  ayahCount?: number;
  stopAt?: { surah: number; ayah: number } | null;
}): Promise<void> {
  const { surah, ayah, surahName, reciterKey, ayahCount, stopAt } = opts;
  const storedReciter = await loadReciterKey();
  const nextReciter = reciterKey ?? storedReciter;
  if (reciterKey) {
    await persistReciterKey(reciterKey);
  }
  if (Object.prototype.hasOwnProperty.call(opts, "stopAt")) {
    if (stopAt && compareAyahRef({ surah, ayah }, stopAt) <= 0) {
      stopAtTarget = stopAt;
    } else {
      stopAtTarget = null;
    }
  }
  currentAyahCount = ayahCount ?? SURAH_MAP.get(surah)?.ayahCount ?? null;
  const key = makeKey(surah, ayah, nextReciter);
  currentKey = key;
  emitState({
    visible: true,
    isLoading: true,
    surah,
    ayah,
    surahName: resolveSurahName(surah, surahName),
    reciterKey: nextReciter,
  });
  emitPlaybackState({
    isPlaying: false,
    isPaused: false,
    surahNumber: surah,
    ayahNumber: ayah,
    reciterKey: nextReciter,
    positionMillis: 0,
    durationMillis: 0,
  });
  if (Platform.OS === "web") {
    await startWebPlayback(surah, ayah, nextReciter);
    return;
  }
  await startNativePlayback(surah, ayah, nextReciter);
  emitState({ isLoading: false, isPlaying: true });
}

export async function togglePlayPause(): Promise<void> {
  if (Platform.OS === "web") {
    if (!webAudio) return;
    if (webAudio.paused) {
      await webAudio.play();
      emitState({ isPlaying: true });
      emitPlaybackState({ isPlaying: true, isPaused: false });
    } else {
      webAudio.pause();
      emitState({ isPlaying: false });
      emitPlaybackState({ isPlaying: false, isPaused: true });
    }
    return;
  }
  if (!sound) return;
  const status = await sound.getStatusAsync();
  if (!status.isLoaded) return;
  if (status.isPlaying) {
    await sound.pauseAsync();
    emitState({ isPlaying: false });
    emitPlaybackState({ isPlaying: false, isPaused: true });
  } else {
    await sound.playAsync();
    emitState({ isPlaying: true });
    emitPlaybackState({ isPlaying: true, isPaused: false });
  }
}

export async function stopAndHide(): Promise<void> {
  await stopInternal(true);
}

export async function seekToMillis(ms: number): Promise<void> {
  if (Platform.OS === "web") {
    if (!webAudio) return;
    webAudio.currentTime = Math.max(0, ms / 1000);
    emitState({ positionMillis: Math.max(0, ms) });
    return;
  }
  if (!sound) return;
  await sound.setPositionAsync(Math.max(0, ms));
}

export async function setRate(nextRate: number): Promise<void> {
  emitState({ rate: nextRate });
  if (Platform.OS === "web") {
    if (webAudio) {
      webAudio.playbackRate = nextRate;
    }
    return;
  }
  if (!sound) return;
  await sound.setRateAsync(nextRate, true);
}

export async function toggleRepeatOne(): Promise<void> {
  emitState({ repeatOne: !playerState.repeatOne });
}

export async function nextAyah(): Promise<void> {
  const surah = playerState.surah;
  const ayah = playerState.ayah;
  if (!surah || !ayah) return;
  const meta = SURAH_MAP.get(surah);
  const count = currentAyahCount ?? meta?.ayahCount ?? 0;
  if (ayah < count) {
    await playAyah({
      surah,
      ayah: ayah + 1,
      surahName: meta?.name_ar,
      reciterKey: playerState.reciterKey,
      ayahCount: currentAyahCount ?? meta?.ayahCount,
    });
    return;
  }
  if (surah < 114) {
    const nextMeta = SURAH_MAP.get(surah + 1);
    await playAyah({
      surah: surah + 1,
      ayah: 1,
      surahName: nextMeta?.name_ar,
      reciterKey: playerState.reciterKey,
      ayahCount: nextMeta?.ayahCount,
    });
    return;
  }
  await stopAndHide();
}

export async function prevAyah(): Promise<void> {
  const surah = playerState.surah;
  const ayah = playerState.ayah;
  if (!surah || !ayah) return;
  if (ayah > 1) {
    const meta = SURAH_MAP.get(surah);
    await playAyah({
      surah,
      ayah: ayah - 1,
      surahName: meta?.name_ar,
      reciterKey: playerState.reciterKey,
      ayahCount: currentAyahCount ?? meta?.ayahCount,
    });
    return;
  }
  if (surah > 1) {
    const prevMeta = SURAH_MAP.get(surah - 1);
    const lastAyah = prevMeta?.ayahCount ?? 1;
    await playAyah({
      surah: surah - 1,
      ayah: lastAyah,
      surahName: prevMeta?.name_ar,
      reciterKey: playerState.reciterKey,
      ayahCount: prevMeta?.ayahCount,
    });
    return;
  }
}
