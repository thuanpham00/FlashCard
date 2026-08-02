import seedData from '../data/seed.json';
import type { VocabularyFile, Word, WordType } from '../types/Vocabulary';

const STORAGE_KEY = 'flashcard-dictionary:words:v1';
const SEED_VERSION_KEY = 'flashcard-dictionary:seed-version:v1';
const CURRENT_SEED_VERSION = String(seedData.words?.length ?? 0);

export interface CreateWordInput {
  term: string;
  type: WordType;
  meaning: string;
  synonyms?: string[];
  example?: string;
}

function isWord(value: unknown): value is Word {
  if (!value || typeof value !== 'object') return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    typeof w.term === 'string' &&
    typeof w.type === 'string' &&
    typeof w.meaning === 'string' &&
    Array.isArray(w.synonyms) &&
    typeof w.progress === 'object' &&
    typeof (w.progress as { known?: unknown }).known === 'boolean'
  );
}

function normalize(data: VocabularyFile | { words: unknown }): Word[] {
  const list = Array.isArray(data.words) ? data.words : [];
  return list.filter(isWord);
}

function loadFromStorage(): Word[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return [];
    return normalize(parsed as { words: unknown });
  } catch (err) {
    console.warn('Failed to read from localStorage:', err);
    return [];
  }
}

function saveToStorage(words: Word[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ words }, null, 2));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    throw err;
  }
}

function getAll(): Word[] {
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (storedVersion !== CURRENT_SEED_VERSION) {
    const fresh = normalize(seedData as unknown as { words: unknown });
    saveToStorage(fresh);
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
    return fresh;
  }
  return loadFromStorage();
}

function persist(words: Word[]): void {
  saveToStorage(words);
  localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
}

function uuid(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function fetchAll(): Promise<VocabularyFile> {
  const words = getAll();
  return Promise.resolve({ words });
}

export function createWord(input: CreateWordInput): Promise<Word> {
  const words = getAll();
  const newWord: Word = {
    id: uuid(),
    term: input.term.trim(),
    type: input.type,
    meaning: input.meaning.trim(),
    synonyms: (input.synonyms ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean),
    example: input.example?.trim() || undefined,
    progress: { known: false, reviewCount: 0 },
    createdAt: new Date().toISOString(),
  };
  persist([...words, newWord]);
  return Promise.resolve(newWord);
}

export function updateWord(
  id: string,
  patch: Partial<CreateWordInput>
): Promise<Word> {
  const words = getAll();
  const idx = words.findIndex((w) => w.id === id);
  if (idx === -1) {
    return Promise.reject(new Error('Word not found'));
  }
  const existing = words[idx];
  const updated: Word = {
    ...existing,
    term:
      typeof patch.term === 'string' ? patch.term.trim() : existing.term,
    type: patch.type ?? existing.type,
    meaning:
      typeof patch.meaning === 'string'
        ? patch.meaning.trim()
        : existing.meaning,
    synonyms: Array.isArray(patch.synonyms)
      ? patch.synonyms.map((s) => String(s).trim()).filter(Boolean)
      : existing.synonyms,
    example:
      typeof patch.example === 'string'
        ? patch.example.trim() || undefined
        : existing.example,
  };
  const next = [...words];
  next[idx] = updated;
  persist(next);
  return Promise.resolve(updated);
}

export function deleteWord(id: string): Promise<void> {
  const words = getAll();
  const next = words.filter((w) => w.id !== id);
  if (next.length === words.length) {
    return Promise.reject(new Error('Word not found'));
  }
  persist(next);
  return Promise.resolve();
}

export function reportProgress(id: string, known: boolean): Promise<Word> {
  const words = getAll();
  const idx = words.findIndex((w) => w.id === id);
  if (idx === -1) {
    return Promise.reject(new Error('Word not found'));
  }
  const existing = words[idx];
  const updated: Word = {
    ...existing,
    progress: {
      known,
      reviewCount: existing.progress.reviewCount + 1,
      lastReviewedAt: new Date().toISOString(),
    },
  };
  const next = [...words];
  next[idx] = updated;
  persist(next);
  return Promise.resolve(updated);
}

export function resetToSeed(): Promise<void> {
  const fresh = normalize(seedData as unknown as { words: unknown });
  persist(fresh);
  return Promise.resolve();
}