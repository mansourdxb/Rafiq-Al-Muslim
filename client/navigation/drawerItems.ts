export type DrawerRow = {
  key: string;
  title: string;
  route?: string;
  params?: any;
  icon: string;
  allowNavigateOnParent?: boolean;
  children?: DrawerRow[];
};

export type DrawerSection = {
  key: string;
  title: string;
  rows: DrawerRow[];
};

export const drawerSections: DrawerSection[] = [
  {
    key: "quran",
    title: "\u0627\u0644\u0642\u0631\u0622\u0646",
    rows: [
      {
        key: "quran_parent",
        title: "\u0627\u0644\u0642\u0631\u0622\u0646",
        icon: "BookOpen",
        children: [
          {
            key: "quran-reader",
            title: "\u0627\u0644\u0645\u0635\u062d\u0641",
            route: "Main",
            params: { screen: "LibraryTab", params: { screen: "LibraryQuran" } },
            icon: "BookOpen",
          },
          {
            key: "quran-index",
            title: "\u0627\u0644\u0641\u0647\u0631\u0633",
            route: "QuranReader",
            params: { sura: 1, aya: 1, page: 1, source: "index", openIndex: true },
            icon: "List",
          },
          {
            key: "quran-tafsir",
            title: "\u0627\u0644\u062a\u0641\u0633\u064a\u0631",
            route: "TafsirSettings",
            params: { title: "\u0627\u0644\u062a\u0641\u0633\u064a\u0631" },
            icon: "BookText",
          },
          {
            key: "quran-highlights",
            title: "\u0627\u0644\u062a\u0645\u064a\u064a\u0632\u0627\u062a",
            route: "HighlightsSettings",
            params: { title: "\u0627\u0644\u062a\u0645\u064a\u064a\u0632\u0627\u062a" },
            icon: "Highlighter",
          },
          {
            key: "quran-khatma",
            title: "\u0627\u0644\u062e\u062a\u0645\u0629",
            route: "KhatmaSettings",
            params: { title: "\u0627\u0644\u062e\u062a\u0645\u0629" },
            icon: "CheckCircle",
          },
          {
            key: "quran-fawasel",
            title: "\u0627\u0644\u0641\u0648\u0627\u0635\u0644",
            route: "FawaselSettings",
            params: { title: "\u0627\u0644\u0641\u0648\u0627\u0635\u0644" },
            icon: "Bookmark",
          },
        ],
      },
    ],
  },
  {
    key: "hadith",
    title: "\u0627\u0644\u062d\u062f\u064a\u062b \u0627\u0644\u0634\u0631\u064a\u0641",
    rows: [
      {
        key: "hadith_parent",
        title: "\u0627\u0644\u062d\u062f\u064a\u062b \u0627\u0644\u0634\u0631\u064a\u0641",
        icon: "ScrollText",
        children: [
          {
            key: "hadith-nine-books",
            title: "\u0643\u062a\u0628 \u0627\u0644\u062d\u062f\u064a\u062b \u0627\u0644\u062a\u0633\u0639\u0629",
            route: "Main",
            params: { screen: "LibraryTab", params: { screen: "LibraryHadith" } },
            icon: "LibraryBig",
          },
          {
            key: "hadith-forty",
            title: "\u0627\u0644\u0623\u0631\u0628\u0639\u0648\u0646",
            route: "FortyHadith",
            params: { title: "\u0627\u0644\u0623\u0631\u0628\u0639\u0648\u0646" },
            icon: "ListOrdered",
          },
        ],
      },
    ],
  },
  {
    key: "salatuk",
    title: "\u0635\u0644\u0627\u062a\u0643",
    rows: [
      {
        key: "salatuk_parent",
        title: "\u0635\u0644\u0627\u062a\u0643",
        icon: "Navigation",
        children: [
          {
            key: "salatuk-home",
            title: "\u0635\u0644\u0627\u062a\u0643",
            route: "Salatuk",
            params: { screen: "SalatukHome" },
            icon: "Navigation",
          },
          {
            key: "salatuk-settings",
            title: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0635\u0644\u0627\u0629",
            route: "Salatuk",
            params: { screen: "SalatukSettings" },
            icon: "SlidersHorizontal",
          },
        ],
      },
    ],
  },
  {
    key: "zikr",
    title: "\u0627\u0644\u0630\u0643\u0631",
    rows: [
      {
        key: "zikr_parent",
        title: "\u0627\u0644\u0630\u0643\u0631",
        icon: "Sparkles",
        children: [
          {
            key: "zikr-manage",
            title: "\u0627\u0644\u0623\u0630\u0643\u0627\u0631",
            route: "Main",
            params: { screen: "PresetsTab" },
            icon: "Sparkles",
          },
          {
            key: "zikr-manage-add",
            title: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u0630\u0643\u0627\u0631",
            route: "Main",
            params: { screen: "PresetsTab", params: { screen: "AddZikr" } },
            icon: "Plus",
          },
          {
            key: "zikr-stats",
            title: "\u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a",
            route: "Main",
            params: { screen: "StatsTab" },
            icon: "BarChart2",
          },
        ],
      },
    ],
  },
  {
    key: "general",
    title: "\u0639\u0627\u0645",
    rows: [
      {
        key: "general_parent",
        title: "\u0639\u0627\u0645",
        icon: "Settings",
        children: [
          {
            key: "general-settings",
            title: "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a",
            route: "Main",
            params: { screen: "SettingsTab" },
            icon: "Settings",
          },
          {
            key: "general-fonts",
            title: "\u0627\u0644\u062e\u0637\u0648\u0637",
            route: "FontSettings",
            params: { title: "\u0627\u0644\u062e\u0637\u0648\u0637" },
            icon: "Type",
          },
          {
            key: "general-theme",
            title: "\u0627\u0644\u062b\u064a\u0645",
            route: "ThemeSettings",
            params: { title: "\u0627\u0644\u062b\u064a\u0645" },
            icon: "Moon",
          },
          {
            key: "general-about",
            title: "about",
            route: "About",
            icon: "Info",
          },
        ],
      },
    ],
  },
];
