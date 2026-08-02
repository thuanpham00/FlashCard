import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Word, WordType } from '../types/Vocabulary';
import {
  createWord,
  deleteWord,
  fetchAll,
  reportProgress,
  updateWord,
  type CreateWordInput,
} from '../api/vocabulary';

export function useVocabulary() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAll();
      setWords(data.words ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addWord = useCallback(async (input: CreateWordInput) => {
    const created = await createWord(input);
    setWords((prev) => [...prev, created]);
    return created;
  }, []);

  const editWord = useCallback(async (id: string, patch: Partial<CreateWordInput>) => {
    const updated = await updateWord(id, patch);
    setWords((prev) => prev.map((w) => (w.id === id ? updated : w)));
    return updated;
  }, []);

  const removeWord = useCallback(async (id: string) => {
    await deleteWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const markKnown = useCallback(
    async (id: string, known: boolean) => {
      const updated = await reportProgress(id, known);
      setWords((prev) => prev.map((w) => (w.id === id ? updated : w)));
      return updated;
    },
    []
  );

  const stats = useMemo(() => {
    const total = words.length;
    const known = words.filter((w) => w.progress.known).length;
    return {
      total,
      known,
      unknown: total - known,
      ratio: total === 0 ? 0 : Math.round((known / total) * 100),
    };
  }, [words]);

  const byType = useMemo(() => {
    const map: Partial<Record<WordType, number>> = {};
    for (const w of words) {
      map[w.type] = (map[w.type] ?? 0) + 1;
    }
    return map;
  }, [words]);

  return {
    words,
    loading,
    error,
    stats,
    byType,
    reload,
    addWord,
    editWord,
    removeWord,
    markKnown,
  };
}