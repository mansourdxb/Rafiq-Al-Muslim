import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function MuslimBooksScreen() {
  return <GenericHadithBooksScreen bookKey="muslim" chapterRoute="MuslimChapter" fallbackTitle="صحيح مسلم" />;
}
