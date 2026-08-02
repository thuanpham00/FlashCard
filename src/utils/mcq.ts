import type { Word } from '../types/Vocabulary';

export interface MultipleChoice {
  /** 4 nghĩa, đã được xáo trộn thứ tự */
  options: string[];
  /** Index trong mảng options chứa đáp án đúng */
  correctIndex: number;
}

/**
 * Tạo 4 lựa chọn nghĩa: 1 đúng + 3 ngẫu nhiên từ các từ khác trong danh sách.
 * Đảm bảo 4 option là 4 chuỗi phân biệt (không trùng nhau và không trùng đáp án).
 * Nếu danh sách không đủ nghĩa khác → fallback đệm bằng placeholder có đánh dấu.
 */
export function generateMultipleChoice(
  current: Word,
  pool: Word[]
): MultipleChoice {
  const correct = current.meaning;

  // 1. Thu tất cả meaning từ các từ KHÁC, dedupe và loại trùng correct.
  const uniqueMeanings = new Set<string>();
  for (const w of pool) {
    if (w.id === current.id) continue;
    if (w.meaning === correct) continue;
    uniqueMeanings.add(w.meaning);
  }

  // 2. Shuffle deterministic-ish bằng Fisher-Yates.
  const distractors = Array.from(uniqueMeanings);
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }

  // 3. Lấy 3 distractor đầu tiên (đã đảm bảo duy nhất + khác correct).
  const picks = distractors.slice(0, 3);

  // 4. Fallback: nếu thiếu, đệm bằng placeholder khác correct để tránh trùng.
  let placeholderIdx = 0;
  while (picks.length < 3) {
    placeholderIdx += 1;
    const placeholder = `_(lựa chọn thay thế ${placeholderIdx})_`;
    if (placeholder === correct) continue;
    picks.push(placeholder);
  }

  // 5. Ghép correct + 3 distractors rồi shuffle.
  const options = [correct, ...picks];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIndex = options.indexOf(correct);
  return { options, correctIndex };
}
