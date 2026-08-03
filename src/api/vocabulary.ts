import type { VocabularyFile, Word, WordType } from '../types/Vocabulary';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export interface CreateWordInput {
  term: string;
  type: WordType;
  meaning: string;
  synonyms?: string[];
  example?: string;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function fetchAll(): Promise<VocabularyFile> {
  return request<VocabularyFile>('/words');
}

export function createWord(input: CreateWordInput): Promise<Word> {
  return request<Word>('/words', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateWord(
  id: string,
  patch: Partial<CreateWordInput>
): Promise<Word> {
  return request<Word>(`/words/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export function deleteWord(id: string): Promise<void> {
  return request<void>(`/words/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function reportProgress(id: string, known: boolean): Promise<Word> {
  return request<Word>(`/words/${encodeURIComponent(id)}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ known }),
  });
}

export function resetToSeed(): Promise<void> {
  return request<VocabularyFile>('/sync/seed', {
    method: 'POST',
  }).then(() => undefined);
}
