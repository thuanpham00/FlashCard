import { useEffect, useState, type FormEvent } from 'react';
import type { Word, WordType } from '../types/Vocabulary';
import { WORD_TYPES, WORD_TYPE_LABEL } from '../types/Vocabulary';

export interface WordFormValues {
  term: string;
  type: WordType;
  meaning: string;
  synonyms: string[];
  example: string;
}

interface Props {
  initial?: Word | null;
  onSubmit: (values: WordFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const emptyValues: WordFormValues = {
  term: '',
  type: 'noun',
  meaning: '',
  synonyms: [],
  example: '',
};

function toValues(word?: Word | null): WordFormValues {
  if (!word) return emptyValues;
  return {
    term: word.term,
    type: word.type,
    meaning: word.meaning,
    synonyms: [...word.synonyms],
    example: word.example ?? '',
  };
}

export function WordForm({ initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<WordFormValues>(toValues(initial));
  const [synonymInput, setSynonymInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(toValues(initial));
    setSynonymInput('');
    setError(null);
  }, [initial]);

  function update<K extends keyof WordFormValues>(key: K, value: WordFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addSynonym() {
    const trimmed = synonymInput.trim();
    if (!trimmed) return;
    if (values.synonyms.includes(trimmed)) {
      setSynonymInput('');
      return;
    }
    update('synonyms', [...values.synonyms, trimmed]);
    setSynonymInput('');
  }

  function removeSynonym(s: string) {
    update(
      'synonyms',
      values.synonyms.filter((x) => x !== s)
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.term.trim()) return setError('Vui lòng nhập từ vựng');
    if (!values.meaning.trim()) return setError('Vui lòng nhập nghĩa của từ');
    try {
      setSubmitting(true);
      await onSubmit({
        ...values,
        term: values.term.trim(),
        meaning: values.meaning.trim(),
        example: values.example.trim(),
      });
      if (!initial) setValues(emptyValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          {initial ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}
        </h2>
        {initial && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Hủy chỉnh sửa
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Từ vựng (tiếng Anh)
          </label>
          <input
            type="text"
            value={values.term}
            onChange={(e) => update('term', e.target.value)}
            placeholder="ví dụ: abundant"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Loại từ
          </label>
          <select
            value={values.type}
            onChange={(e) => update('type', e.target.value as WordType)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {WORD_TYPES.map((t) => (
              <option key={t} value={t}>
                {WORD_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nghĩa (tiếng Việt)
          </label>
          <input
            type="text"
            value={values.meaning}
            onChange={(e) => update('meaning', e.target.value)}
            placeholder="ví dụ: phong phú, dồi dào"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Từ đồng nghĩa
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={synonymInput}
              onChange={(e) => setSynonymInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSynonym();
                }
              }}
              placeholder="Nhập từ đồng nghĩa rồi nhấn Enter hoặc Thêm"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={addSynonym}
              className="px-3 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium sm:shrink-0"
            >
              Thêm
            </button>
          </div>
          {values.synonyms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {values.synonyms.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSynonym(s)}
                    className="hover:text-red-500"
                    aria-label={`Xóa ${s}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ví dụ minh họa (tuỳ chọn)
          </label>
          <textarea
            value={values.example}
            onChange={(e) => update('example', e.target.value)}
            rows={2}
            placeholder="The region has abundant natural resources."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-sm font-medium shadow-sm transition"
        >
          {submitting ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Thêm từ vựng'}
        </button>
      </div>
    </form>
  );
}