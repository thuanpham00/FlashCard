export type WordType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'interjection';

export interface WordProgress {
  known: boolean;
  reviewCount: number;
  lastReviewedAt?: string;
}

export interface Word {
  id: string;
  term: string;
  type: WordType;
  meaning: string;
  synonyms: string[];
  example?: string;
  progress: WordProgress;
  createdAt: string;
}

export interface VocabularyFile {
  words: Word[];
}

export const WORD_TYPES: WordType[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'interjection',
];

export const WORD_TYPE_LABEL: Record<WordType, string> = {
  noun: 'Danh từ (noun)',
  verb: 'Động từ (verb)',
  adjective: 'Tính từ (adjective)',
  adverb: 'Trạng từ (adverb)',
  preposition: 'Giới từ (preposition)',
  conjunction: 'Liên từ (conjunction)',
  pronoun: 'Đại từ (pronoun)',
  interjection: 'Thán từ (interjection)',
};