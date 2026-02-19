import React from "react";
import GenericHadithBooksScreen from "./GenericHadithBooksScreen";

export default function DarimiBooksScreen() {
  return <GenericHadithBooksScreen bookKey="darimi" chapterRoute="DarimiChapter" fallbackTitle="سنن الدارمي" />;
}
