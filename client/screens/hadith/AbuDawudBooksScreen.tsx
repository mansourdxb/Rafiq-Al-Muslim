import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function AbuDawudBooksScreen() {
  return <GenericHadithBooksScreen bookKey="abudawud" chapterRoute="AbuDawudChapter" fallbackTitle="سنن أبي داود" />;
}
