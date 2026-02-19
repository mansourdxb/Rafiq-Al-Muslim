import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function AhmedBooksScreen() {
  return <GenericHadithBooksScreen bookKey="ahmed" chapterRoute="AhmedChapter" fallbackTitle="مسند أحمد" />;
}
