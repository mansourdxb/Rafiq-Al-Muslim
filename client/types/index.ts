export interface Preset {
  id: string;
  name: string;
  arabicName?: string;
  target: number;
  count: number;
  color: string;
  isBuiltIn: boolean;
  createdAt: string;
}

export interface DailyLog {
  date: string;
  total: number;
}

export interface AppSettings {
  hapticEnabled: boolean;
  soundEnabled: boolean;
  keepScreenOn: boolean;
  theme: "light" | "dark" | "system";
  language: "en" | "ar";
}

export interface AppState {
  presets: Preset[];
  currentPresetId: string;
  dailyLogs: DailyLog[];
  settings: AppSettings;
  todayTotal: number;
  allTimeTotal: number;
}

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: "subhanallah",
    name: "SubhanAllah",
    arabicName: "سبحان الله",
    target: 33,
    count: 0,
    color: "#5B7C99",
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "alhamdulillah",
    name: "Alhamdulillah",
    arabicName: "الحمد لله",
    target: 33,
    count: 0,
    color: "#8B6F9D",
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "allahuakbar",
    name: "Allahu Akbar",
    arabicName: "الله أكبر",
    target: 33,
    count: 0,
    color: "#4CAF50",
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "lailahaillallah",
    name: "La ilaha illa Allah",
    arabicName: "لا إله إلا الله",
    target: 100,
    count: 0,
    color: "#FF9800",
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "astaghfirullah",
    name: "Astaghfirullah",
    arabicName: "أستغفر الله",
    target: 100,
    count: 0,
    color: "#E91E63",
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  hapticEnabled: true,
  soundEnabled: false,
  keepScreenOn: true,
  theme: "system",
  language: "en",
};
