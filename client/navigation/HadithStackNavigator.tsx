import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LibraryHadithScreen from "@/screens/hadith/LibraryHadithScreen";
import BukhariBooksScreen from "@/screens/hadith/BukhariBooksScreen";
import BukhariChapterScreen from "@/screens/hadith/BukhariChapterScreen";
import MuslimBooksScreen from "@/screens/hadith/MuslimBooksScreen";
import MuslimChapterScreen from "@/screens/hadith/MuslimChapterScreen";
import AbuDawudBooksScreen from "@/screens/hadith/AbuDawudBooksScreen";
import AbuDawudChapterScreen from "@/screens/hadith/AbuDawudChapterScreen";
import AhmedBooksScreen from "@/screens/hadith/AhmedBooksScreen";
import AhmedChapterScreen from "@/screens/hadith/AhmedChapterScreen";
import DarimiBooksScreen from "@/screens/hadith/DarimiBooksScreen";
import DarimiChapterScreen from "@/screens/hadith/DarimiChapterScreen";
import TirmidhiBooksScreen from "@/screens/hadith/TirmidhiBooksScreen";
import TirmidhiChapterScreen from "@/screens/hadith/TirmidhiChapterScreen";
import IbnMajahBooksScreen from "@/screens/hadith/IbnMajahBooksScreen";
import IbnMajahChapterScreen from "@/screens/hadith/IbnMajahChapterScreen";
import NasaiBooksScreen from "@/screens/hadith/NasaiBooksScreen";
import NasaiChapterScreen from "@/screens/hadith/NasaiChapterScreen";
import MalikBooksScreen from "@/screens/hadith/MalikBooksScreen";
import MalikChapterScreen from "@/screens/hadith/MalikChapterScreen";
import FavoritesScreen from "@/screens/hadith/FavoritesScreen";
import HadithSearchScreen from "@/screens/hadith/HadithSearchScreen";

export type HadithStackParamList = {
  HadithHome: undefined;
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
  HadithSearch: undefined;
};

const Stack = createNativeStackNavigator<HadithStackParamList>();

export default function HadithStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HadithHome" component={LibraryHadithScreen} />
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
      <Stack.Screen name="HadithSearch" component={HadithSearchScreen} />
    </Stack.Navigator>
  );
}
