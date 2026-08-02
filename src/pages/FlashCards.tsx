import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useFlashcardMemory, poolForNextSession } from '../hooks/useFlashcardMemory';
import { FlashCard, type FlashCardMode } from '../components/FlashCard';
import { generateMultipleChoice, type MultipleChoice } from '../utils/mcq';

type Scope = 'all' | 'unknown' | 'known';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MIN_QUIZ_SIZE = 10;

export function FlashCards() {
  const { words, loading } = useVocabulary();
  const memory = useFlashcardMemory();
  const [scope, setScope] = useState<Scope>('all');
  const [mode, setMode] = useState<FlashCardMode>('mc');

  // Danh sách câu hỏi: session = null → chưa bắt đầu phiên (tab "Tất cả" hiển thị form)
  const [session, setSession] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);

  // Input số lượng cho phiên
  const [quizSize, setQuizSize] = useState<number>(MIN_QUIZ_SIZE);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [mcByCard, setMcByCard] = useState<Record<string, MultipleChoice>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>({});
  const [appearedCount, setAppearedCount] = useState<Record<string, number>>({});
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const filteredWords = useMemo(() => {
    if (scope === 'all') return words;
    const knownSet = new Set(memory.knownIds);
    const unknownSet = new Set(memory.unknownIds);
    if (scope === 'known') return words.filter((w) => knownSet.has(w.id));
    return words.filter((w) => unknownSet.has(w.id));
  }, [words, scope, memory.knownIds, memory.unknownIds]);

  // Chỉ reset order khi scope đổi và không trong session 'Tất cả'
  useEffect(() => {
    if (scope === 'all' && session !== null) return;
    setOrderForScope(shuffle(filteredWords.map((w) => w.id)));
    setIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setAnsweredMap({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // State phụ để lưu order cho tab "Chưa thuộc / Đã thuộc"
  const [orderForScope, setOrderForScope] = useState<string[]>([]);

  const order = session ?? orderForScope;
  const total = order.length;
  const current = filteredWords.find((w) => order[index] === w.id);
  const progressPct = total === 0 ? 0 : Math.round(((index + 1) / total) * 100);
  const isSessionActive = scope === 'all' && session !== null;
  const isLastCard = index >= total - 1;
  const isCurrentAnswered = current ? answeredMap[current.id] !== undefined : false;

  useEffect(() => {
    if (!current || mode !== 'mc') return;
    setMcByCard((prev) => {
      if (prev[current.id]) return prev;
      return {
        ...prev,
        [current.id]: generateMultipleChoice(current, words),
      };
    });
  }, [current, mode, words]);

  // Reset answeredMap/answeredCount khi session mới
  // Pool phiên ôn = các từ CHƯA xuất hiện + CHƯA thuộc (theo memory riêng của flashcard,
  // không đụng vào progress.known của Vocabulary).
  function startSession() {
    const pool = poolForNextSession(words, memory.knownIds, memory.unknownIds);
    const totalPool = pool.length;
    if (quizSize < MIN_QUIZ_SIZE) {
      setQuizError(`Tối thiểu ${MIN_QUIZ_SIZE} từ`);
      return;
    }
    if (totalPool === 0) {
      setQuizError('Không còn từ nào để ôn. Hãy reset để bắt đầu lại.');
      return;
    }
    if (quizSize >= totalPool) {
      setQuizError(`Số lượng phải nhỏ hơn tổng pool (${totalPool})`);
      return;
    }
    setQuizError(null);
    const ids = pool.map((w) => w.id);
    const picked: string[] = [];
    for (let i = 0; i < quizSize; i++) {
      picked.push(ids[Math.floor(Math.random() * ids.length)]);
    }
    setSession(picked);
    setIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setAnsweredMap({});
    setAppearedCount(Object.fromEntries(picked.map((id) => [id, 1])));
    setReviewQueue([]);
    setMcByCard({});
  }

  function endSession() {
    setSession(null);
    setIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setAnsweredMap({});
    setAppearedCount({});
    setReviewQueue([]);
  }

  function handleResetMemory() {
    if (!confirm('Reset toàn bộ tiến độ Đã thuộc / Chưa thuộc của flashcard?')) return;
    memory.reset();
    endSession();
  }

  function reshuffle() {
    setOrderForScope(shuffle(filteredWords.map((w) => w.id)));
    setIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setAnsweredMap({});
  }

  async function handleAnswered(correct: boolean) {
    setAnsweredCount((c) => c + 1);
    if (correct) setCorrectCount((c) => c + 1);
    if (current) {
      const id = current.id;
      setAnsweredMap((m) => ({ ...m, [id]: correct }));
      memory.classify(id, correct);
      setActionMsg(
        correct
          ? '✅ Đúng! Đã chuyển sang "Đã thuộc"'
          : '❌ Sai. Đã chuyển sang "Chưa thuộc"'
      );
      // Nếu sai và từ chưa xuất hiện quá 2 lần, đẩy vào review queue
      if (!correct) {
        setAppearedCount((c) => {
          const times = (c[id] ?? 0);
          if (times < 2) {
            setReviewQueue((q) => (q.includes(id) ? q : [...q, id]));
          }
          return { ...c, [id]: times };
        });
      }
    }
  }

  function next() {
    setIndex((i) => {
      // Khi sắp hết session, gắn review queue vào cuối
      const nextIndex = i + 1;
      setSession((s) => {
        if (!s) return s;
        if (nextIndex >= s.length && reviewQueue.length > 0) {
          const extra = [...reviewQueue];
          setReviewQueue([]);
          setAppearedCount((c) => {
            const next = { ...c };
            for (const id of extra) {
              next[id] = (next[id] ?? 0) + 1;
            }
            return next;
          });
          return [...s, ...extra];
        }
        return s;
      });
      return total === 0 ? 0 : Math.min(nextIndex, total - 1);
    });
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  // Tự ẩn banner phản hồi sau 2s
  useEffect(() => {
    if (!actionMsg) return;
    const t = setTimeout(() => setActionMsg(null), 2000);
    return () => clearTimeout(t);
  }, [actionMsg]);

  const currentMc = current && mcByCard[current.id];
  const canMarkKnown = mode === 'mc' && current && answeredCount > 0;

  const showStartForm = scope === 'all' && !isSessionActive;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-300 overflow-hidden w-fit">
            {(['all', 'unknown', 'known'] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setScope(s);
                  if (s !== 'all') setSession(null);
                }}
                className={clsx(
                  'px-4 py-2 text-sm font-medium transition',
                  scope === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {s === 'all' ? 'Tất cả' : s === 'known' ? 'Đã thuộc' : 'Chưa thuộc'}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden w-fit">
            {(['mc', 'flip'] as FlashCardMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium transition',
                  mode === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {m === 'mc' ? 'Trắc nghiệm' : 'Lật thẻ'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'mc' && total > 0 && isSessionActive && (
            <div className="text-sm text-slate-500">
              Đúng {correctCount}/{answeredCount}
            </div>
          )}
          <div className="text-sm text-slate-500">
            {total === 0
              ? 'Không có thẻ nào'
              : `Thẻ ${index + 1} / ${total}`}
          </div>
          {!isSessionActive && (
            <button
              type="button"
              onClick={reshuffle}
              disabled={total === 0}
              className="px-3 py-2 text-sm rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700"
            >
              Xáo trộn
            </button>
          )}
          {!isSessionActive && (
            <button
              type="button"
              onClick={handleResetMemory}
              disabled={memory.knownIds.length === 0 && memory.unknownIds.length === 0}
              className="px-3 py-2 text-sm rounded-lg bg-rose-100 hover:bg-rose-200 disabled:opacity-40 text-rose-700"
              title="Xoá toàn bộ trạng thái Đã thuộc / Chưa thuộc của flashcard"
            >
              Reset
            </button>
          )}
          {isSessionActive && reviewQueue.length > 0 && (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
              Từ yếu cần ôn: <span className="font-medium">{reviewQueue.length}</span>
            </div>
          )}
          {isSessionActive && (
            <button
              type="button"
              onClick={endSession}
              className="px-3 py-2 text-sm rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700"
            >
              Kết thúc phiên
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {actionMsg && (
        <div className="w-full max-w-xl mx-auto">
          <div className="rounded-lg bg-slate-800 text-white text-sm px-4 py-2 text-center shadow">
            {actionMsg}
          </div>
        </div>
      )}

      <div className="pt-2">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : showStartForm ? (
          <StartSessionForm
            unknownCount={poolForNextSession(words, memory.knownIds, memory.unknownIds).length}
            knownCount={memory.knownIds.length}
            unknownTrackedCount={memory.unknownIds.length}
            totalCount={words.length}
            quizSize={quizSize}
            onChangeQuizSize={setQuizSize}
            error={quizError}
            onStart={startSession}
          />
        ) : current ? (
          <FlashCard
            key={`${current.id}-${mode}-${index}`}
            word={current}
            mode={mode}
            {...(mode === 'mc' && currentMc ? { mc: currentMc } : {})}
            {...(mode === 'mc' ? { onAnswered: handleAnswered } : {})}
          />
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500">
            {total === 0
              ? 'Không có từ vựng phù hợp với bộ lọc hiện tại.'
              : 'Bạn đã ôn xong bộ thẻ này!'}
          </div>
        )}
      </div>

      {current && !showStartForm && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 text-sm font-medium"
          >
            ← Trước
          </button>

          {mode === 'mc' && isSessionActive && isCurrentAnswered && (
            <button
              type="button"
              onClick={next}
              disabled={isLastCard}
              className="px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-medium shadow-sm"
            >
              Tiếp tục →
            </button>
          )}

          {mode === 'mc' && isSessionActive && !isCurrentAnswered && (
            <span className="text-sm text-slate-500 italic">
              Hãy chọn 1 đáp án
            </span>
          )}

          {mode === 'mc' && !isSessionActive && (
            <>
              <button
                type="button"
                onClick={() => {
                  memory.classify(current.id, false);
                  setActionMsg('↩️ Đã đánh dấu "Cần ôn thêm"');
                }}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium shadow-sm"
                title="Đánh dấu cần ôn thêm (không phụ thuộc vào đúng/sai)"
              >
                Cần ôn thêm
              </button>
              <button
                type="button"
                onClick={() => {
                  memory.classify(current.id, true);
                  setActionMsg('✅ Đã đánh dấu "Đã thuộc"');
                }}
                disabled={!canMarkKnown}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-medium shadow-sm"
                title="Đánh dấu đã thuộc (chỉ bật sau khi đã trả lời)"
              >
                Đã thuộc
              </button>
            </>
          )}

          {mode === 'flip' && (
            <>
              <button
                type="button"
                onClick={() => {
                  memory.classify(current.id, false);
                  setActionMsg('↩️ Đã đánh dấu "Cần ôn thêm"');
                }}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium shadow-sm"
              >
                Cần ôn thêm
              </button>
              <button
                type="button"
                onClick={() => {
                  memory.classify(current.id, true);
                  setActionMsg('✅ Đã đánh dấu "Đã thuộc"');
                }}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium shadow-sm"
              >
                Đã thuộc
              </button>
            </>
          )}

          <button
            type="button"
            onClick={next}
            disabled={isLastCard}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 text-sm font-medium"
          >
            Sau →
          </button>
        </div>
      )}

      {isSessionActive && isLastCard && isCurrentAnswered && (
        <div className="w-full max-w-xl mx-auto bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
          <div className="text-2xl font-semibold text-emerald-700">
            Hoàn thành phiên ôn!
          </div>
          <div className="text-slate-600">
            Đúng <span className="font-bold">{correctCount}</span> / {answeredCount} câu
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={startSession}
              className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
            >
              Làm lại
            </button>
            <button
              type="button"
              onClick={endSession}
              className="px-5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface StartSessionFormProps {
  unknownCount: number;
  knownCount: number;
  unknownTrackedCount: number;
  totalCount: number;
  quizSize: number;
  onChangeQuizSize: (n: number) => void;
  error: string | null;
  onStart: () => void;
}

function StartSessionForm({
  unknownCount,
  knownCount,
  unknownTrackedCount,
  totalCount,
  quizSize,
  onChangeQuizSize,
  error,
  onStart,
}: StartSessionFormProps) {
  const tooSmall = unknownCount <= MIN_QUIZ_SIZE;
  const maxAllowed = Math.max(0, unknownCount - 1);
  return (
    <div className="w-full max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Bắt đầu phiên ôn</h2>
        <p className="text-sm text-slate-500 mt-1">
          Nhập số lượng từ muốn kiểm tra trong phiên này. Hệ thống sẽ random từ các từ
          <span className="font-medium"> chưa xuất hiện</span> và
          <span className="font-medium"> chưa thuộc</span> (có thể trùng từ).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="quiz-size" className="text-sm text-slate-600 shrink-0">
          Số lượng:
        </label>
        <input
          id="quiz-size"
          type="number"
          min={MIN_QUIZ_SIZE}
          max={maxAllowed}
          value={quizSize}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChangeQuizSize(Number.isFinite(v) ? v : 0);
          }}
          disabled={tooSmall}
          className="w-32 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
        />
        <span className="text-sm text-slate-500">
          (tối thiểu {MIN_QUIZ_SIZE}, tối đa {maxAllowed})
        </span>
      </div>

      <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Pool (chưa xuất hiện + chưa thuộc): <span className="font-medium">{unknownCount}</span>
        </span>
        <span>
          Đã thuộc: <span className="font-medium">{knownCount}</span>
        </span>
        <span>
          Chưa thuộc: <span className="font-medium">{unknownTrackedCount}</span>
        </span>
        <span>
          Tổng: <span className="font-medium">{totalCount}</span>
        </span>
      </div>

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={tooSmall}
        className="px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium shadow-sm"
      >
        Bắt đầu
      </button>

      {tooSmall && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Cần có ít nhất {MIN_QUIZ_SIZE + 1} từ trong pool
          (chưa xuất hiện + chưa thuộc) để bắt đầu phiên ôn. Hiện có {unknownCount}/{totalCount}.
          Bấm <span className="font-medium">Reset</span> ở trên để bắt đầu lại từ đầu, hoặc thêm từ mới ở tab "Từ vựng".
        </div>
      )}
    </div>
  );
}