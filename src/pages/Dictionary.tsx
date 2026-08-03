import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useVocabulary } from '../hooks/useVocabulary';
import { WordForm } from '../components/WordForm';
import { WordList } from '../components/WordList';
import type { Word, WordType } from '../types/Vocabulary';
import { WORD_TYPES, WORD_TYPE_LABEL } from '../types/Vocabulary';
import { resetToSeed } from '../api/vocabulary';

type StatusFilter = 'all' | 'known' | 'unknown';
type SortMode = 'newest' | 'oldest' | 'a-z';

export function Dictionary() {
  const {
    words,
    loading,
    error,
    stats,
    byType,
    addWord,
    editWord,
    removeWord,
    markKnown,
    reload,
  } = useVocabulary();

  const [editing, setEditing] = useState<Word | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | WordType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = words.filter((w) => {
      if (typeFilter !== 'all' && w.type !== typeFilter) return false;
      if (statusFilter === 'known' && !w.progress.known) return false;
      if (statusFilter === 'unknown' && w.progress.known) return false;
      if (!q) return true;
      return (
        w.term.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.synonyms.some((s) => s.toLowerCase().includes(q))
      );
    });

    const sorted = [...matched];
    if (sortMode === 'newest') {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortMode === 'oldest') {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else {
      sorted.sort((a, b) =>
        a.term.localeCompare(b.term, 'vi', { sensitivity: 'base' })
      );
    }
    return sorted;
  }, [words, search, typeFilter, statusFilter, sortMode]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Tổng số từ" value={stats.total} tone="brand" />
        <StatCard label="Đã thuộc" value={stats.known} tone="emerald" />
        <StatCard label="Chưa thuộc" value={stats.unknown} tone="amber" />
        <StatCard
          label="Tỉ lệ thuộc"
          value={`${stats.ratio}%`}
          tone="indigo"
        />
      </div>

      <WordForm
        initial={editing}
        onSubmit={async (values) => {
          if (editing) {
            await editWord(editing.id, values);
            setEditing(null);
          } else {
            await addWord(values);
          }
        }}
        onCancel={() => setEditing(null)}
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo từ, nghĩa, từ đồng nghĩa..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as 'all' | WordType)
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Tất cả loại từ</option>
          {WORD_TYPES.map((t) => (
            <option key={t} value={t}>
              {WORD_TYPE_LABEL[t]} ({byType[t] ?? 0})
            </option>
          ))}
        </select>
        <div className="w-full grid grid-cols-3 rounded-lg border border-slate-300 overflow-hidden">
          {(['all', 'known', 'unknown'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'px-3 py-2 text-xs font-medium transition text-center',
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {s === 'all' ? 'Tất cả' : s === 'known' ? 'Đã thuộc' : 'Chưa thuộc'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Sắp xếp:
          </span>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
          {(
            [
              { id: 'newest', label: 'Mới nhất' },
              { id: 'oldest', label: 'Cũ nhất' },
              { id: 'a-z', label: 'A - Z' },
            ] as { id: SortMode; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortMode(opt.id)}
              className={clsx(
                'px-3 py-2 sm:py-1.5 text-xs font-medium transition',
                sortMode === opt.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {opt.label}
            </button>
          ))}
          </div>
        </div>
        <span className="text-xs text-slate-500 sm:ml-auto">
          Hiển thị {filtered.length} / {words.length} từ
        </span>
        <button
          type="button"
          onClick={() => {
            if (
              confirm(
                'Khôi phục toàn bộ danh sách từ vựng ban đầu (175 từ)? Mọi thay đổi của bạn sẽ bị mất.'
              )
            ) {
              void resetToSeed().then(() => reload());
            }
          }}
          className="w-full sm:w-auto px-3 py-2.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
          title="Khôi phục danh sách từ vựng ban đầu"
        >
          Khôi phục mặc định
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span>Lỗi: {error}</span>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-xs underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          Đang tải dữ liệu...
        </div>
      ) : (
        <WordList
          words={filtered}
          onEdit={(w) => setEditing(w)}
          onDelete={(w) => {
            if (confirm(`Xóa từ "${w.term}"?`)) {
              void removeWord(w.id);
            }
          }}
          onToggleKnown={(w) => void markKnown(w.id, !w.progress.known)}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  tone: 'brand' | 'emerald' | 'amber' | 'indigo';
}

function StatCard({ label, value, tone }: StatCardProps) {
  const toneClass: Record<StatCardProps['tone'], string> = {
    brand: 'from-brand-500 to-brand-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-600',
    indigo: 'from-indigo-500 to-indigo-700',
  };
  return (
    <div
      className={clsx(
        'rounded-2xl text-white px-5 py-4 shadow-sm bg-gradient-to-br',
        toneClass[tone]
      )}
    >
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}