import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function BukhariBooksScreen() {
  return <GenericHadithBooksScreen bookKey="bukhari" chapterRoute="BukhariChapter" fallbackTitle="صحيح البخاري" />;
}
