/**
 * Мемори 4×3 с системой ошибок и победой.
 * - 6 пар эмодзи, 12 карточек
 * - 4 ошибки = проигрыш
 * - Все пары открыты = победа + форма
 * - Победа = результат уходит в таблицу лидеров
 */

import { submitScore } from '../lib/leaderboard';

const EMOJIS = ['🎨', '⚡', '🚀', '💎', '🔥', '🌊'];
const MAX_ERRORS = 4;
const FLIP_BACK_DELAY = 500; // мс, сколько показываются несовпавшие карточки

type EmojiCard = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

export function initMemoryGame() {
  const modal = document.querySelector<HTMLElement>('[data-game-modal]');
  if (!modal) return;

  const openButtons = document.querySelectorAll<HTMLElement>('[data-game-open]');
  const closeButtons = modal.querySelectorAll<HTMLElement>('[data-game-close]');
  const resetButtons = modal.querySelectorAll<HTMLElement>('[data-game-reset]');

  const board = modal.querySelector<HTMLElement>('[data-game-board]');
  const errorsEl = modal.querySelector<HTMLElement>('[data-game-errors]');
  const foundEl = modal.querySelector<HTMLElement>('[data-game-found]');
  const screens = modal.querySelectorAll<HTMLElement>('[data-game-screen]');

  if (!board || !errorsEl || !foundEl) return;

  let cards: EmojiCard[] = [];
  let flipped: number[] = []; // индексы открытых карточек в текущем раунде
  let errors = 0;
  let found = 0;
  let isLocked = false;

  // Переменные для таблицы лидеров
  let gameStartTime = 0;
  let currentGameTime = 0;
  let scoreSubmitted = false;
  let lastTrigger: HTMLElement | null = null;

  // === Утилиты ===
  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showScreen(name: 'playing' | 'win' | 'lose') {
    screens.forEach((s) => {
      s.hidden = s.dataset.gameScreen !== name;
    });
  }

  // === Инициализация поля ===
  function initBoard() {
    // Засекаем время старта игры
    gameStartTime = Date.now();
    currentGameTime = 0;
    scoreSubmitted = false;

const winStatusEl = modal!.querySelector<HTMLElement>('[data-game-win-status]');
if (winStatusEl) {
  winStatusEl.textContent = '';
  winStatusEl.classList.remove('is-success', 'is-error');
}
const submitBtn = modal!.querySelector<HTMLButtonElement>('[data-game-win-form] button[type="submit"]');
if (submitBtn) {
  submitBtn.disabled = false;
  submitBtn.classList.remove('is-success');
}

    // Пересобираем карточки
    cards = shuffle([...EMOJIS, ...EMOJIS]).map((emoji, i) => ({
      id: i,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));

    flipped = [];
    errors = 0;
    found = 0;
    isLocked = false;

    errorsEl!.textContent = '0';
    foundEl!.textContent = '0';

    render();
    showScreen('playing');
  }

  // === Рендер ===
  function render() {
    board!.innerHTML = '';
    cards.forEach((card, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'game-card';
      el.dataset.index = String(i);
      el.setAttribute('aria-label', `Карточка ${i + 1}`);

      if (card.isFlipped || card.isMatched) {
        el.classList.add('is-flipped');
        el.textContent = card.emoji;
      } else {
        el.textContent = '?';
      }

      if (card.isMatched) {
        el.classList.add('is-matched');
        el.disabled = true;
      }

      el.addEventListener('click', () => onCardClick(i));
      board!.appendChild(el);
    });
  }

  // === Обновление одной карточки (без перерисовки всего поля) ===
  function updateCard(index: number) {
    const el = board!.querySelector<HTMLButtonElement>(
      `[data-index="${index}"]`
    );
    if (!el) return;

    const card = cards[index];
    if (card.isFlipped || card.isMatched) {
      el.classList.add('is-flipped');
      el.textContent = card.emoji;
    } else {
      el.classList.remove('is-flipped');
      el.textContent = '?';
    }

    if (card.isMatched) {
      el.classList.add('is-matched');
      el.disabled = true;
    }
  }

  // === Клик по карточке ===
  function onCardClick(index: number) {
    if (isLocked) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    card.isFlipped = true;
    flipped.push(index);
    updateCard(index);

    if (flipped.length < 2) return;

    // Две карточки открыты
    const [a, b] = flipped;
    const cardA = cards[a];
    const cardB = cards[b];

    if (cardA.emoji === cardB.emoji) {
      // Совпали
      cardA.isMatched = true;
      cardB.isMatched = true;
      found++;
      foundEl!.textContent = String(found);
      flipped = [];

      setTimeout(() => {
        updateCard(a);
        updateCard(b);
      }, 200);

if (found === EMOJIS.length) {
  // Считаем время
  currentGameTime = (Date.now() - gameStartTime) / 1000;

  // Показываем в блоке лидерборда
  const resultTimeEl = modal!.querySelector<HTMLElement>('[data-memory-result-time]');
  if (resultTimeEl) {
    const m = String(Math.floor(currentGameTime / 60)).padStart(2, '0');
    const s = (currentGameTime % 60).toFixed(2).padStart(5, '0');
    resultTimeEl.textContent = `${m}:${s}`;
  }

  setTimeout(() => showScreen('win'), 500);
}

    } else {
      // Не совпали
      isLocked = true;
      errors++;
      errorsEl!.textContent = String(errors);

      setTimeout(() => {
        cardA.isFlipped = false;
        cardB.isFlipped = false;
        updateCard(a);
        updateCard(b);
        flipped = [];
        isLocked = false;

        if (errors >= MAX_ERRORS) {
          setTimeout(() => showScreen('lose'), 300);
        }
      }, FLIP_BACK_DELAY);
    }
  }

  // === Открытие / закрытие модалки ===
function openModal(trigger?: HTMLElement) {
  lastTrigger = trigger ?? null;
  modal!.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  initBoard();
}

  function closeModal() {
    modal!.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function closeModalAndRestoreFocus() {
  closeModal();
  requestAnimationFrame(() => {
    lastTrigger?.focus({ preventScroll: true });
    lastTrigger = null;
  });
}

openButtons.forEach((btn) => {
  btn.addEventListener('click', () => openModal(btn));
});

  closeButtons.forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  resetButtons.forEach((btn) => {
    btn.addEventListener('click', initBoard);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });
// === Отправка формы + запись результата в таблицу лидеров ===
const winForm = modal.querySelector<HTMLFormElement>('[data-game-win-form]');
const winStatus = modal.querySelector<HTMLElement>('[data-game-win-status]');

winForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (scoreSubmitted) {
    if (winStatus) winStatus.textContent = 'Результат уже записан.';
    return;
  }

  if (currentGameTime <= 0) {
    if (winStatus) winStatus.textContent = 'Ошибка: время не засечено. Сыграйте ещё раз.';
    return;
  }

  const nicknameField = winForm.querySelector<HTMLInputElement>('[data-leaderboard-nickname]');
  const nickname = nicknameField?.value.trim() || 'Аноним';

  const submitBtn = winForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  submitBtn?.setAttribute('disabled', 'true');
  if (winStatus) winStatus.textContent = 'Отправка...';

  // Собираем данные формы
  const formData = new FormData(winForm);
  const methodRadio = winForm.querySelector<HTMLInputElement>('[data-method]:checked');
  const methodValue = methodRadio?.value ?? 'telegram';

  // === 1) Пишем рекорд в Supabase ===
  const leaderboardResult = await submitScore({
    game: 'memory',
    nickname,
    time: currentGameTime,
    errors,
  });

  // === 2) Отправляем заявку в /api/lead (email) ===
  let leadResult = { ok: true, error: undefined as string | undefined };
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(formData.get('name') ?? '').trim(),
        contact: String(formData.get('contact') ?? '').trim(),
        method: methodValue,
        message: String(formData.get('message') ?? '').trim() || undefined,
        source: 'memory-game',
        discount: '15',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      leadResult = { ok: false, error: json.error ?? 'не удалось отправить заявку' };
    }
  } catch (err) {
    console.error('Lead send error:', err);
    leadResult = { ok: false, error: 'ошибка сети' };
  }

  submitBtn?.removeAttribute('disabled');

  // === Итог ===
  if (leaderboardResult.success) {
    scoreSubmitted = true;

    try {
      localStorage.setItem(
        'lastScore',
        JSON.stringify({
          game: 'memory',
          time: currentGameTime,
          nickname,
          ts: Date.now(),
        })
      );
    } catch {}

    if (winStatus) {
      if (leadResult.ok) {
        winStatus.textContent = '✅ Заявка отправлена, результат записан в таблицу лидеров.';
        winStatus.classList.add('is-success');
      } else {
        winStatus.textContent = `Результат записан, но заявка не отправлена: ${leadResult.error}. Напишите мне в Telegram.`;
        winStatus.classList.add('is-error');
      }
    }

    submitBtn?.classList.add('is-success');

    window.setTimeout(() => {
      closeModalAndRestoreFocus();
    }, 1500);
  } else {
    if (winStatus) {
      if (leadResult.ok) {
        winStatus.textContent = `✅ Заявка отправлена. ${leaderboardResult.error}. Напишите мне в Telegram, чтобы я занёс результат вручную.`;
        winStatus.classList.add('is-error');
      } else {
        winStatus.textContent = `Не удалось ни записать результат (${leaderboardResult.error}), ни отправить заявку (${leadResult.error}). Напишите мне в Telegram.`;
        winStatus.classList.add('is-error');
      }
    }
    // Не закрываем модалку — пользователь должен увидеть сообщение
  }
});
}