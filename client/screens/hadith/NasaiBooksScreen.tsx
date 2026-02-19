import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function NasaiBooksScreen() {
  return <GenericHadithBooksScreen bookKey="nasai" chapterRoute="NasaiChapter" fallbackTitle="سنن النسائي" />;
}
