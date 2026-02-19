/**
 * useHadithBook.ts
 * React hook for loading hadith book data from on-demand cache.
 * Returns index data, chapters, loading state, and download trigger.
 */

import { useState, useEffect, useCallback } from "react";
import {
  loadBookData,
  isBookCached,
  downloadBook,
  type BookKey,
  type DownloadProgress,
} from "@/utils/hadithBookCache";

type BookState = {
  /** Chapter index data (titleAr, books list) */
  indexData: any | null;
  /** Chapters object keyed by chapter id */
  chapters: Record<string, any> | null;
  /** Is data being loaded from cache */
  loading: boolean;
  /** Is the book cached locally */
  cached: boolean;
  /** Is the book currently downloading */
  downloading: boolean;
  /** Download progress 0-100 */
  progress: number;
  /** Error message */
  error: string | null;
  /** Trigger download */
  download: () => Promise<void>;
  /** Reload from cache */
  reload: () => Promise<void>;
};

export function useHadithBook(key: BookKey): BookState {
  const [indexData, setIndexData] = useState<any>(null);
  const [chapters, setChapters] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isCached = await isBookCached(key);
      setCached(isCached);

      if (isCached) {
        const data = await loadBookData(key);
        if (data) {
          setIndexData(data.index);
          setChapters(data.chapters);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  const download = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    setProgress(0);
    setError(null);

    try {
      await downloadBook(key, (p: DownloadProgress) => {
        setProgress(p.percent);
      });
      setCached(true);
      // Load data after download
      const data = await loadBookData(key);
      if (data) {
        setIndexData(data.index);
        setChapters(data.chapters);
      }
    } catch (e: any) {
      setError("تأكد من اتصالك بالإنترنت وحاول مرة أخرى");
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  }, [key, downloading]);

  return {
    indexData,
    chapters,
    loading,
    cached,
    downloading,
    progress,
    error,
    download,
    reload: loadFromCache,
  };
}
