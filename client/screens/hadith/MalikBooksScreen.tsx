import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function MalikBooksScreen() {
  return <GenericHadithBooksScreen bookKey="malik" chapterRoute="MalikChapter" fallbackTitle="موطأ مالك" />;
}
