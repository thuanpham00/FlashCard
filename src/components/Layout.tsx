import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const tabs = [
  { to: '/', label: 'Từ điển' },
  { to: '/flashcards', label: 'Flashcards' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
              F
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800">
                FlashCard Dictionary
              </div>
              <div className="text-xs text-slate-500 hidden sm:block">
                Lưu từ vựng & luyện flashcard
              </div>
            </div>
          </div>
          <nav className="flex gap-1 w-full sm:w-auto justify-center sm:justify-end">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex-1 sm:flex-none text-center px-3 py-2 rounded-lg text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  )
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6">{children}</div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 text-xs text-slate-500">
          Dữ liệu lưu trữ tại{' '}
          <code className="break-all">backend/src/data/vocabulary.json</code>
        </div>
      </footer>
    </div>
  );
}
