import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LibraryHomeScreen from "@/screens/library/LibraryHomeScreen";
import LibraryQuranScreen from "@/screens/library/LibraryQuranScreen";
import LibraryHadithScreen from "@/screens/library/LibraryHadithScreen";
import BukhariBooksScreen from "@/screens/BukhariBooksScreen";
import BukhariChapterScreen from "@/screens/BukhariChapterScreen";
import MuslimBooksScreen from "@/screens/MuslimBooksScreen";
import MuslimChapterScreen from "@/screens/MuslimChapterScreen";
import AbuDawudBooksScreen from "@/screens/AbuDawudBooksScreen";
import AbuDawudChapterScreen from "@/screens/AbuDawudChapterScreen";
import AhmedBooksScreen from "@/screens/AhmedBooksScreen";
import AhmedChapterScreen from "@/screens/AhmedChapterScreen";
import DarimiBooksScreen from "@/screens/DarimiBooksScreen";
import DarimiChapterScreen from "@/screens/DarimiChapterScreen";
import TirmidhiBooksScreen from "@/screens/TirmidhiBooksScreen";
import TirmidhiChapterScreen from "@/screens/TirmidhiChapterScreen";
import IbnMajahBooksScreen from "@/screens/IbnMajahBooksScreen";
import IbnMajahChapterScreen from "@/screens/IbnMajahChapterScreen";
import NasaiBooksScreen from "@/screens/NasaiBooksScreen";
import NasaiChapterScreen from "@/screens/NasaiChapterScreen";
import MalikBooksScreen from "@/screens/MalikBooksScreen";
import MalikChapterScreen from "@/screens/MalikChapterScreen";
import FavoritesScreen from "@/screens/FavoritesScreen";
import QuranSurahListScreen from "@/screens/quran/QuranSurahListScreen";
import QuranSurahDetailsScreen from "@/screens/quran/QuranSurahDetailsScreen";

export type LibraryStackParamList = {
  LibraryHome: undefined;
  LibraryQuran: undefined;
  LibraryHadith: undefined;
  Library: undefined;
  BukhariBooks: undefined;
  BukhariChapter: { chapterId: number; highlightId?: number | string };
  MuslimBooks: undefined;
  MuslimChapter: { chapterId: number; highlightId?: number | string };
  AbuDawudBooks: undefined;
  AbuDawudChapter: { chapterId: number; highlightId?: number | string };
  AhmedBooks: undefined;
  AhmedChapter: { chapterId: number; highlightId?: number | string };
  DarimiBooks: undefined;
  DarimiChapter: { chapterId: number; highlightId?: number | string };
  TirmidhiBooks: undefined;
  TirmidhiChapter: { chapterId: number; highlightId?: number | string };
  IbnMajahBooks: undefined;
  IbnMajahChapter: { chapterId: number; highlightId?: number | string };
  NasaiBooks: undefined;
  NasaiChapter: { chapterId: number; highlightId?: number | string };
  MalikBooks: undefined;
  MalikChapter: { chapterId: number; highlightId?: number | string };
  Favorites: undefined;
  QuranSurahList: undefined;
  QuranSurahDetails: { number: number; fileName: string };
};

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export default function LibraryStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="LibraryHome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LibraryHome" component={LibraryHomeScreen} />
      <Stack.Screen name="LibraryQuran" component={LibraryQuranScreen} />
      <Stack.Screen name="LibraryHadith" component={LibraryHadithScreen} />
      <Stack.Screen name="Library" component={LibraryHomeScreen} />
      <Stack.Screen name="BukhariBooks" component={BukhariBooksScreen} />
      <Stack.Screen name="BukhariChapter" component={BukhariChapterScreen} />
      <Stack.Screen name="MuslimBooks" component={MuslimBooksScreen} />
      <Stack.Screen name="MuslimChapter" component={MuslimChapterScreen} />
      <Stack.Screen name="AbuDawudBooks" component={AbuDawudBooksScreen} />
      <Stack.Screen name="AbuDawudChapter" component={AbuDawudChapterScreen} />
      <Stack.Screen name="AhmedBooks" component={AhmedBooksScreen} />
      <Stack.Screen name="AhmedChapter" component={AhmedChapterScreen} />
      <Stack.Screen name="DarimiBooks" component={DarimiBooksScreen} />
      <Stack.Screen name="DarimiChapter" component={DarimiChapterScreen} />
      <Stack.Screen name="TirmidhiBooks" component={TirmidhiBooksScreen} />
      <Stack.Screen name="TirmidhiChapter" component={TirmidhiChapterScreen} />
      <Stack.Screen name="IbnMajahBooks" component={IbnMajahBooksScreen} />
      <Stack.Screen name="IbnMajahChapter" component={IbnMajahChapterScreen} />
      <Stack.Screen name="NasaiBooks" component={NasaiBooksScreen} />
      <Stack.Screen name="NasaiChapter" component={NasaiChapterScreen} />
      <Stack.Screen name="MalikBooks" component={MalikBooksScreen} />
      <Stack.Screen name="MalikChapter" component={MalikChapterScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="QuranSurahList" component={QuranSurahListScreen} />
      <Stack.Screen name="QuranSurahDetails" component={QuranSurahDetailsScreen} />
    </Stack.Navigator>
  );
}
