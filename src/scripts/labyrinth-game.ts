/**
 * Слепой лабиринт с ловушками.
 *
 * Механика:
 * - Нет стен — все клетки проходимые
 * - Ловушки — фиксированное количество: 4×4 → 3, 6×6 → 8, 8×8 → 15
 * - Туман — неразведанные клетки серые с точкой в центре
 * - Ловушки запоминаются 💀 после попадания
 * - Соседние с игроком клетки подсвечиваются как кликабельные
 * - Выход виден только рядом (манхэттенское расстояние 1)
 * - Управление — клик по соседней клетке
 * - Победа — дошёл до выхода
 * - Победа = результат уходит в таблицу лидеров (по уровню)
 */

import { submitScore, type GameType } from '../lib/leaderboard';

// === Конфигурация уровней ===
const LEVELS = {
  4: { size: 4, discount: 5, traps: 3 },
  6: { size: 6, discount: 15, traps: 8 },
  8: { size: 8, discount: 30, traps: 15 },
} as const;

type LevelSize = keyof typeof LEVELS;

// === Типы ===
type Cell = {
  isTrap: boolean;
  isTrapRevealed: boolean;
};

type GameState = {
  size: number;
  discount: number;
  grid: Cell[][];
  playerX: number;
  playerY: number;
  startX: number;
  startY: number;
  exitX: number;
  exitY: number;
  startTime: number;
  timerId: number | null;
};

// === Утилита: манхэттенское расстояние ===
function manhattan(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// === Генерация ловушек ===
function generateTraps(size: number, trapCount: number): boolean[][] {
  const traps: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  // Исключаем старт и выход — там ловушек не бывает
  const excluded = new Set<string>([
    '0,0',
    `${size - 1},${size - 1}`,
  ]);

  const candidates: Array<[number, number]> = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!excluded.has(`${x},${y}`)) {
        candidates.push([x, y]);
      }
    }
  }

  // Перемешиваем и берём первые N
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  for (let i = 0; i < trapCount && i < shuffled.length; i++) {
    const [x, y] = shuffled[i];
    traps[y][x] = true;
  }

  return traps;
}

// === Инициализация игры ===
export function initLabyrinthGame() {
  const modal = document.querySelector<HTMLElement>('[data-labyrinth-modal]');
  if (!modal) return;

  const openButtons = document.querySelectorAll<HTMLElement>('[data-labyrinth-open]');
  const closeButtons = modal.querySelectorAll<HTMLElement>('[data-labyrinth-close]');
  const resetButtons = modal.querySelectorAll<HTMLElement>('[data-labyrinth-reset]');
  const backButtons = modal.querySelectorAll<HTMLElement>('[data-labyrinth-back]');
  const startButtons = modal.querySelectorAll<HTMLButtonElement>('[data-labyrinth-start]');

  const screens = modal.querySelectorAll<HTMLElement>('[data-labyrinth-screen]');
  const board = modal.querySelector<HTMLElement>('[data-labyrinth-board]');
  const sizeEl = modal.querySelector<HTMLElement>('[data-labyrinth-size]');
  const discountEl = modal.querySelector<HTMLElement>('[data-labyrinth-discount]');
  const timeEl = modal.querySelector<HTMLElement>('[data-labyrinth-time]');
  const winDiscountEl = modal.querySelector<HTMLElement>('[data-labyrinth-win-discount]');
  const discountField = modal.querySelector<HTMLInputElement>('[data-labyrinth-discount-field]');
  const levelField = modal.querySelector<HTMLInputElement>('[data-labyrinth-level-field]');

  if (!board || !sizeEl || !discountEl || !timeEl) return;

  let state: GameState | null = null;

  // Переменные для таблицы лидеров
  let gameStartTime = 0;
  let currentGameTime = 0;
  let currentGameType: GameType = 'labyrinth-4x4';
  let scoreSubmitted = false;
  let lastTrigger: HTMLElement | null = null;

  // === Показ экрана ===
  function showScreen(name: 'select' | 'playing' | 'win' | 'lose') {
    screens.forEach((s) => {
      s.hidden = s.dataset.labyrinthScreen !== name;
    });
  }

  // === Форматирование времени ===
function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = (totalSeconds % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

  // === Таймер ===
  function startTimer() {
    if (!state) return;
    state.startTime = Date.now();
state.timerId = window.setInterval(() => {
  if (!state || !timeEl) return;
  const elapsed = Date.now() - state.startTime;
  timeEl.textContent = formatTime(elapsed);
}, 50);
  }

  function stopTimer() {
    if (state?.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  // === Создание игры ===
  function createGame(levelSize: LevelSize) {
    const config = LEVELS[levelSize];
    const size = config.size;

    // Засекаем время старта
    gameStartTime = Date.now();
    currentGameTime = 0;
    scoreSubmitted = false;

    // Запоминаем тип игры для таблицы
    currentGameType = `labyrinth-${size}x${size}` as GameType;


const winStatusEl = modal!.querySelector<HTMLElement>('[data-labyrinth-win-status]');
if (winStatusEl) {
  winStatusEl.textContent = '';
  winStatusEl.classList.remove('is-success', 'is-error');
}
const submitBtn = modal!.querySelector<HTMLButtonElement>('[data-labyrinth-win-form] button[type="submit"]');
if (submitBtn) {
  submitBtn.disabled = false;
  submitBtn.classList.remove('is-success');
}

    const traps = generateTraps(size, config.traps);

    const grid: Cell[][] = [];
    for (let y = 0; y < size; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < size; x++) {
        row.push({
          isTrap: traps[y][x],
          isTrapRevealed: false,
        });
      }
      grid.push(row);
    }

    state = {
      size,
      discount: config.discount,
      grid,
      playerX: 0,
      playerY: 0,
      startX: 0,
      startY: 0,
      exitX: size - 1,
      exitY: size - 1,
      startTime: 0,
      timerId: null,
    };

    sizeEl!.textContent = `${size}×${size}`;
    discountEl!.textContent = String(config.discount);
    if (winDiscountEl) winDiscountEl.textContent = String(config.discount);
    if (discountField) discountField.value = String(config.discount);
    if (levelField) levelField.value = `${size}x${size}`;
    if (timeEl) timeEl.textContent = '00:00';

    renderBoard();
    showScreen('playing');
    startTimer();
  }

  // === Сброс на текущем уровне ===
  function resetCurrentLevel() {
    if (!state) return;
    stopTimer();
    const size = state.size as LevelSize;
    createGame(size);
  }

  // === Рендер поля ===
  function renderBoard() {
    if (!state || !board) return;
    board.innerHTML = '';

    const { size, grid, playerX, playerY, exitX, exitY } = state;

    // Устанавливаем CSS grid
    board.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = grid[y][x];
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'labyrinth-cell';
        el.dataset.x = String(x);
        el.dataset.y = String(y);

        const isPlayer = x === playerX && y === playerY;
        const isExit = x === exitX && y === exitY;
        const isAdjacent = manhattan(x, y, playerX, playerY) === 1;
        const playerDistToExit = manhattan(playerX, playerY, exitX, exitY);

        // === 1. Игрок ===
        if (isPlayer) {
          el.classList.add('is-player');
          el.textContent = '🧍';
          el.disabled = true;
        }
        // === 2. Ловушка раскрыта ===
        else if (cell.isTrapRevealed) {
          el.classList.add('is-trap');
          el.textContent = '💀';
          el.disabled = true;
        }
        // === 3. Выход виден (игрок рядом) ===
        else if (isExit && playerDistToExit === 1) {
          el.classList.add('is-exit');
          el.textContent = '🏁';
          // Выход кликабельный, если он в радиусе 1
          if (isAdjacent) {
            el.classList.add('is-clickable');
            el.addEventListener('click', () => movePlayer(x, y));
          } else {
            el.disabled = true;
          }
        }
        // === 4. Кликабельный сосед ===
        else if (isAdjacent) {
          el.classList.add('is-clickable');
          el.addEventListener('click', () => movePlayer(x, y));
        }
        // === 5. Туман ===
        else {
          el.classList.add('is-fog');
          el.disabled = true;
        }

        board.appendChild(el);
      }
    }
  }

  // === Движение игрока ===
  function movePlayer(x: number, y: number) {
    if (!state) return;

    // Проверяем, что ход допустим — только соседняя клетка
    if (manhattan(x, y, state.playerX, state.playerY) !== 1) return;

    const cell = state.grid[y][x];

    // Ловушка
    if (cell.isTrap && !cell.isTrapRevealed) {
      cell.isTrapRevealed = true;

      // Возврат на старт
      state.playerX = state.startX;
      state.playerY = state.startY;

      renderBoard();
      return;
    }

    // Двигаем игрока
    state.playerX = x;
    state.playerY = y;

// Победа
if (x === state.exitX && y === state.exitY) {
  stopTimer();

  // Считаем время (доли секунды)
  currentGameTime = (Date.now() - gameStartTime) / 1000;

  // Показываем в блоке лидерборда
  const resultTimeEl = modal!.querySelector<HTMLElement>('[data-labyrinth-result-time]');
  if (resultTimeEl) {
    const m = String(Math.floor(currentGameTime / 60)).padStart(2, '0');
    const s = (currentGameTime % 60).toFixed(2).padStart(5, '0');
    resultTimeEl.textContent = `${m}:${s}`;
  }

  renderBoard();
  setTimeout(() => showScreen('win'), 400);
  return;
}

    renderBoard();
  }

  // === Открытие / закрытие модалки ===
function openModal(trigger?: HTMLElement) {
  if (!modal) return;
  lastTrigger = trigger ?? null;
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  stopTimer();
  state = null;
  showScreen('select');
}

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    stopTimer();
    state = null;
  }

  function closeModalAndRestoreFocus() {
  closeModal();
  requestAnimationFrame(() => {
    lastTrigger?.focus({ preventScroll: true });
    lastTrigger = null;
  });
}


  // === Обработчики ===
openButtons.forEach((btn) => {
  btn.addEventListener('click', () => openModal(btn));
});


  closeButtons.forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  resetButtons.forEach((btn) => {
    btn.addEventListener('click', resetCurrentLevel);
  });

  backButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      stopTimer();
      state = null;
      showScreen('select');
    });
  });

  startButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = parseInt(btn.dataset.labyrinthStart ?? '4', 10);
      if (size === 4 || size === 6 || size === 8) {
        createGame(size as LevelSize);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });

// === Отправка формы + запись результата в таблицу лидеров ===
const winForm = modal.querySelector<HTMLFormElement>('[data-labyrinth-win-form]');
const winStatus = modal.querySelector<HTMLElement>('[data-labyrinth-win-status]');

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

  // === 1) Рекорд в Supabase ===
  const leaderboardResult = await submitScore({
    game: currentGameType,
    nickname,
    time: currentGameTime,
  });

  // === 2) Заявка в /api/lead (email) ===
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
        source: 'labyrinth-game',
        discount: String(formData.get('discount') ?? '').trim() || undefined,
        level: String(formData.get('level') ?? '').trim() || undefined,
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
          game: currentGameType,
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