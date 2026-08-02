import { useState } from 'react';
import clsx from 'clsx';
import type { Word } from '../types/Vocabulary';
import { WORD_TYPE_LABEL } from '../types/Vocabulary';
import type { MultipleChoice } from '../utils/mcq';

export type FlashCardMode = 'flip' | 'mc';

interface Props {
  word: Word;
  mode?: FlashCardMode;
  mc?: MultipleChoice;
  onAnswered?: (correct: boolean) => void;
}

export function FlashCard({ word, mode = 'flip', mc, onAnswered }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  if (mode === 'mc' && mc) {
    const mcData = mc;
    const answered = selected !== null;
    const correct = answered ? selected === mcData.correctIndex : false;
    const optionLabels = ['A', 'B', 'C', 'D'];

    function pick(i: number) {
      if (answered) return;
      setSelected(i);
      const isCorrect = i === mcData.correctIndex;
      onAnswered?.(isCorrect);
    }

    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="rounded-3xl shadow-card bg-gradient-to-br from-brand-500 to-indigo-600 text-white p-6">
          <div className="text-xs uppercase tracking-widest opacity-80">
            {WORD_TYPE_LABEL[word.type]} · Chọn nghĩa đúng
          </div>
          <div className="text-4xl md:text-5xl font-bold mt-3 text-center break-words">
            {word.term}
          </div>
          {word.example && (
            <div className="mt-4 text-sm italic opacity-80 text-center">
              "{word.example}"
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mcData.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === mcData.correctIndex;
            const tone = !answered
              ? 'hover:border-brand-400 hover:bg-brand-50'
              : isCorrect
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
              : isSelected
              ? 'border-rose-500 bg-rose-50 text-rose-800'
              : 'border-slate-200 bg-white text-slate-500';
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                disabled={answered}
                className={clsx(
                  'text-left rounded-xl border-2 px-4 py-3 text-sm transition flex items-start gap-3',
                  tone,
                  answered && 'cursor-default'
                )}
              >
                <span
                  className={clsx(
                    'shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs',
                    answered && isCorrect
                      ? 'bg-emerald-600 text-white'
                      : answered && isSelected
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {optionLabels[i]}
                </span>
                <span className="flex-1 break-words">{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={clsx(
              'mt-4 rounded-xl px-4 py-3 text-sm font-medium',
              correct
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            )}
          >
            {correct
              ? '🎉 Chính xác!'
              : `❌ Sai rồi. Đáp án đúng: ${mcData.options[mcData.correctIndex]}`}
          </div>
        )}
      </div>
    );
  }

  // flip mode (mặc định)
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="perspective relative w-full max-w-xl mx-auto block focus:outline-none"
      aria-label={flipped ? 'Đang hiển thị nghĩa' : 'Bấm để lật thẻ'}
    >
      <div
        className={clsx(
          'relative w-full h-72 rounded-3xl shadow-card transition-transform duration-500 preserve-3d',
          flipped && 'rotate-y-180'
        )}
      >
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-brand-500 to-indigo-600 text-white rounded-3xl flex flex-col items-center justify-center p-6">
          <div className="text-xs uppercase tracking-widest opacity-80">
            {WORD_TYPE_LABEL[word.type]}
          </div>
          <div className="text-4xl md:text-5xl font-bold mt-3 text-center break-words">
            {word.term}
          </div>
          <div className="mt-6 text-xs opacity-80">Bấm để lật xem nghĩa</div>
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl p-6 flex flex-col">
          <div className="text-xs uppercase tracking-widest text-brand-200">
            Nghĩa
          </div>
          <div className="text-2xl md:text-3xl font-semibold mt-2 break-words">
            {word.meaning}
          </div>

          {word.synonyms.length > 0 && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-widest text-slate-300">
                Đồng nghĩa
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {word.synonyms.map((s) => (
                  <span
                    key={s}
                    className="bg-white/10 px-3 py-1 rounded-full text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {word.example && (
            <div className="mt-auto pt-3 border-t border-white/10">
              <div className="text-xs uppercase tracking-widest text-slate-300">
                Ví dụ
              </div>
              <div className="text-sm italic mt-1 break-words">
                "{word.example}"
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}