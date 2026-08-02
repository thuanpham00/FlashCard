import { useCallback, useEffect, useState } from 'react';
import type { Word } from '../types/Vocabulary';

const STORAGE_KEY = 'flashcard-memory:v1';

export interface FlashcardMemoryState {
  knownIds: string[];
  unknownIds: string[];
}

function readStorage(): FlashcardMemoryState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { knownIds: [], unknownIds: [] };
    const parsed = JSON.parse(raw) as Partial<FlashcardMemoryState>;
    return {
      knownIds: Array.isArray(parsed.knownIds) ? parsed.knownIds : [],
      unknownIds: Array.isArray(parsed.unknownIds) ? parsed.unknownIds : [],
    };
  } catch {
    return { knownIds: [], unknownIds: [] };
  }
}

function writeStorage(state: FlashcardMemoryState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / disabled storage
  }
}

export function useFlashcardMemory() {
  const [state, setState] = useState<FlashcardMemoryState>(() => readStorage());

  useEffect(() => {
    writeStorage(state);
  }, [state]);

  const classify = useCallback((id: string, correct: boolean) => {
    setState((prev) => {
      const knownSet = new Set(prev.knownIds);
      const unknownSet = new Set(prev.unknownIds);
      if (correct) {
        unknownSet.delete(id);
        knownSet.add(id);
      } else {
        knownSet.delete(id);
        unknownSet.add(id);
      }
      return {
        knownIds: Array.from(knownSet),
        unknownIds: Array.from(unknownSet),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({ knownIds: [], unknownIds: [] });
  }, []);

  return {
    knownIds: state.knownIds,
    unknownIds: state.unknownIds,
    classify,
    reset,
  };
}

export function poolForNextSession(
  words: Word[],
  knownIds: string[],
  unknownIds: string[]
): Word[] {
  const knownSet = new Set(knownIds);
  return words.filter((w) => !knownSet.has(w.id));
}