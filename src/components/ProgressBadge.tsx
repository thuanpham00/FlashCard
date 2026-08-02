import clsx from 'clsx';
import type { Word } from '../types/Vocabulary';

interface Props {
  word: Word;
  size?: 'sm' | 'md';
}

export function ProgressBadge({ word, size = 'sm' }: Props) {
  const known = word.progress.known;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        known
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      )}
    >
      <span
        className={clsx(
          'inline-block h-2 w-2 rounded-full',
          known ? 'bg-emerald-500' : 'bg-amber-500'
        )}
      />
      {known ? 'Đã thuộc' : 'Chưa thuộc'}
      <span className="ml-1 text-[10px] text-slate-500">
        ({word.progress.reviewCount} lần ôn)
      </span>
    </span>
  );
}