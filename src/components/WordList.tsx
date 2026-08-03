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

interface WordActionsProps {
  word: Word;
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
  onToggleKnown: (word: Word) => void;
  layout?: 'inline' | 'grid';
}

function TypeBadge({ type }: { type: Word['type'] }) {
  return (
    <span
      className={clsx(
        'inline-block px-2 py-0.5 rounded-md text-xs font-medium shrink-0',
        'bg-indigo-50 text-indigo-700'
      )}
    >
      {WORD_TYPE_LABEL[type]}
    </span>
  );
}

function SynonymList({ synonyms }: { synonyms: string[] }) {
  if (synonyms.length === 0) {
    return <span className="text-slate-400 text-xs">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {synonyms.map((s) => (
        <span
          key={s}
          className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function WordActions({
  word,
  onEdit,
  onDelete,
  onToggleKnown,
  layout = 'inline',
}: WordActionsProps) {
  const knownBtnClass = clsx(
    'rounded-md text-xs font-medium transition',
    layout === 'grid' ? 'py-2.5' : 'px-3 py-1',
    word.progress.known
      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
  );
  const editBtnClass = clsx(
    'rounded-md text-xs font-medium bg-slate-200 text-slate-700 hover:bg-slate-300',
    layout === 'grid' ? 'py-2.5' : 'px-3 py-1'
  );
  const deleteBtnClass = clsx(
    'rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200',
    layout === 'grid' ? 'py-2.5' : 'px-3 py-1'
  );

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onToggleKnown(word)}
          className={knownBtnClass}
        >
          {word.progress.known ? 'Bỏ thuộc' : 'Đã thuộc'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(word)}
          className={editBtnClass}
        >
          Sửa
        </button>
        <button
          type="button"
          onClick={() => onDelete(word)}
          className={deleteBtnClass}
        >
          Xóa
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onToggleKnown(word)}
        className={knownBtnClass}
      >
        {word.progress.known ? 'Bỏ đã thuộc' : 'Đã thuộc'}
      </button>
      <button type="button" onClick={() => onEdit(word)} className={editBtnClass}>
        Sửa
      </button>
      <button
        type="button"
        onClick={() => onDelete(word)}
        className={deleteBtnClass}
      >
        Xóa
      </button>
    </div>
  );
}

function WordCard({
  word,
  onEdit,
  onDelete,
  onToggleKnown,
}: Omit<Props, 'words'> & { word: Word }) {
  return (
    <article className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 text-base">{word.term}</div>
          {word.example && (
            <div className="text-xs text-slate-500 italic mt-1 break-words">
              "{word.example}"
            </div>
          )}
        </div>
        <TypeBadge type={word.type} />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
          Nghĩa
        </div>
        <div className="text-sm text-slate-700">{word.meaning}</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
          Đồng nghĩa
        </div>
        <SynonymList synonyms={word.synonyms} />
      </div>

      <ProgressBadge word={word} size="md" />

      <WordActions
        word={word}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleKnown={onToggleKnown}
        layout="grid"
      />
    </article>
  );
}

export function WordList({ words, onEdit, onDelete, onToggleKnown }: Props) {
  if (words.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 sm:p-10 text-center text-slate-500 text-sm">
        Chưa có từ vựng nào. Hãy thêm từ đầu tiên của bạn ở form phía trên.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="md:hidden divide-y divide-slate-100">
        {words.map((w) => (
          <WordCard
            key={w.id}
            word={w}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleKnown={onToggleKnown}
          />
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
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
                  <TypeBadge type={w.type} />
                </td>
                <td className="px-4 py-3 text-slate-700">{w.meaning}</td>
                <td className="px-4 py-3">
                  <SynonymList synonyms={w.synonyms} />
                </td>
                <td className="px-4 py-3">
                  <ProgressBadge word={w} />
                </td>
                <td className="px-4 py-3">
                  <WordActions
                    word={w}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleKnown={onToggleKnown}
                    layout="inline"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
