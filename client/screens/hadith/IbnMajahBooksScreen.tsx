import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function IbnMajahBooksScreen() {
  return <GenericHadithBooksScreen bookKey="ibnmajah" chapterRoute="IbnMajahChapter" fallbackTitle="سنن ابن ماجه" />;
}
