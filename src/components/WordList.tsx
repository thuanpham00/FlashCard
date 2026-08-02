import clsx from 'clsx';
import type { Word } from '../types/Vocabulary';
import { WORD_TYPE_LABEL } from '../types/Vocabulary';
import { ProgressBadge } from './ProgressBadge';

interface Props {
  words: Word[];
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
  onToggleKnown: (word: Word) => void;
}

export function WordList({ words, onEdit, onDelete, onToggleKnown }: Props) {
  if (words.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500">
        Chưa có từ vựng nào. Hãy thêm từ đầu tiên của bạn ở form phía trên.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3">Từ vựng</th>
              <th className="text-left px-4 py-3">Loại</th>
              <th className="text-left px-4 py-3">Nghĩa</th>
              <th className="text-left px-4 py-3">Đồng nghĩa</th>
              <th className="text-left px-4 py-3">Tiến độ</th>
              <th className="text-right px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {words.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">{w.term}</div>
                  {w.example && (
                    <div className="text-xs text-slate-500 italic mt-1">
                      "{w.example}"
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'inline-block px-2 py-0.5 rounded-md text-xs font-medium',
                      'bg-indigo-50 text-indigo-700'
                    )}
                  >
                    {WORD_TYPE_LABEL[w.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{w.meaning}</td>
                <td className="px-4 py-3">
                  {w.synonyms.length === 0 ? (
                    <span className="text-slate-400 text-xs">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {w.synonyms.map((s) => (
                        <span
                          key={s}
                          className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ProgressBadge word={w} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleKnown(w)}
                      className={clsx(
                        'px-3 py-1 rounded-md text-xs font-medium transition',
                        w.progress.known
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      )}
                    >
                      {w.progress.known ? 'Bỏ đã thuộc' : 'Đã thuộc'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(w)}
                      className="px-3 py-1 rounded-md text-xs font-medium bg-slate-200 text-slate-700 hover:bg-slate-300"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(w)}
                      className="px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}