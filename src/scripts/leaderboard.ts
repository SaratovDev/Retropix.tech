import {
  getScores,
  getPlayerRank,
  type GameType,
  type LeaderboardEntry,
} from '../lib/leaderboard';

// === Конфиг пагинации ===
const PAGE_SIZE = 20;

// === Звания по времени ===
const RANKS: Record<GameType, Array<{ max: number; rank: string }>> = {
  memory: [
    { max: 10, rank: '🥇 Эйдетик' },
    { max: 12, rank: '🥈 Мастер памяти' },
    { max: 15, rank: '🥉 Карточный шулер' },
    { max: 18, rank: '🎯 Упёртый' },
    { max: Infinity, rank: '🐣 Птенчик' },
  ],
  'labyrinth-4x4': [
    { max: 2, rank: '🥇 Эйдетик' },
    { max: 3, rank: '🥈 Ясновидящий' },
    { max: 5, rank: '🥉 Фотографическая память' },
    { max: 7, rank: '🎯 Телепат' },
    { max: Infinity, rank: '🐣 Слепой крот' },
  ],
  'labyrinth-6x6': [
    { max: 9, rank: '🥇 Эйдетик' },
    { max: 12, rank: '🥈 Ясновидящий' },
    { max: 15, rank: '🥉 Фотографическая память' },
    { max: 18, rank: '🎯 Телепат' },
    { max: Infinity, rank: '🐣 Слепой крот' },
  ],
  'labyrinth-8x8': [
    { max: 12, rank: '🏆 Эйдетик' },
    { max: 15, rank: '🥇 Ясновидящий' },
    { max: 18, rank: '🥈 Фотографическая память' },
    { max: 24, rank: '🥉 Телепат' },
    { max: Infinity, rank: '🐣 Слепой крот' },
  ],
};

const SUSPICIOUS_THRESHOLD: Record<GameType, number> = {
  memory: 10,
  'labyrinth-4x4': 2,
  'labyrinth-6x6': 12,
  'labyrinth-8x8': 20,
};

// === Ключ localStorage ===
const LAST_SCORE_KEY = 'lastScore';
const LAST_SCORE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 дней

type LastScore = {
  game: GameType;
  time: number;
  nickname: string;
  ts: number;
};

function readLastScore(): LastScore | null {
  try {
    const raw = localStorage.getItem(LAST_SCORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastScore;
    if (!parsed.ts || Date.now() - parsed.ts > LAST_SCORE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getRank(game: GameType, time: number): string {
  const ranks = RANKS[game];
  const found = ranks.find((r) => time < r.max);
  return found?.rank ?? ranks[ranks.length - 1].rank;
}

function isSuspicious(game: GameType, time: number): boolean {
  return time < SUSPICIOUS_THRESHOLD[game];
}

function formatTime(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTable(entries: LeaderboardEntry[], game: GameType, offset: number): string {
  if (entries.length === 0) {
    return `
      <div class="leaderboard__empty">
        <p>Пока никто не играл в этой игре. Станьте первым!</p>
      </div>
    `;
  }

  const rows = entries
    .map((entry, i) => {
      const place = offset + i + 1; // глобальное место, не локальное
      const suspicious = isSuspicious(game, entry.time);
      const rank = getRank(game, entry.time);
      const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `#${place}`;
      const suspiciousBadge = suspicious ? ' <span title="Подозрительно быстро">🤖</span>' : '';

      return `
        <tr class="leaderboard-row ${place <= 3 ? `leaderboard-row--top-${place}` : ''}">
          <td class="leaderboard-row__place">${medal}</td>
          <td class="leaderboard-row__nick">
            ${escapeHtml(entry.nickname)}${suspiciousBadge}
          </td>
          <td class="leaderboard-row__rank">${rank}</td>
          <td class="leaderboard-row__time">${formatTime(entry.time)}</td>
          <td class="leaderboard-row__date">${formatDate(entry.created_at)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Игрок</th>
          <th>Звание</th>
          <th>Время</th>
          <th>Дата</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export function initLeaderboard() {
  const tabs = document.querySelectorAll<HTMLButtonElement>('[data-leaderboard-tab]');
  const content = document.querySelector<HTMLElement>('[data-leaderboard-content]');
  const pagination = document.querySelector<HTMLElement>('[data-leaderboard-pagination]');
  const pageInfo = document.querySelector<HTMLElement>('[data-leaderboard-page-info]');
  const prevBtn = document.querySelector<HTMLButtonElement>('[data-leaderboard-prev]');
  const nextBtn = document.querySelector<HTMLButtonElement>('[data-leaderboard-next]');
  const myRankBox = document.querySelector<HTMLElement>('[data-leaderboard-my-rank]');
  const myRankValue = document.querySelector<HTMLElement>('[data-leaderboard-my-rank-value]');
  const myRankNote = document.querySelector<HTMLElement>('[data-leaderboard-my-rank-note]');

  if (!content || tabs.length === 0) return;

  let currentGame: GameType = 'memory';
  let currentPage = 0; // 0-based
  let total = 0;
  let isLoading = false;

  const lastScore = readLastScore();

  function totalPages(): number {
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }

  function updatePagination() {
    if (!pagination || !pageInfo || !prevBtn || !nextBtn) return;

    if (total === 0) {
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;
    const pages = totalPages();
    const from = currentPage * PAGE_SIZE + 1;
    const to = Math.min((currentPage + 1) * PAGE_SIZE, total);

    pageInfo.textContent = `Показано ${from}–${to} из ${total} · Стр. ${currentPage + 1} из ${pages}`;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= pages - 1;
  }

  async function updateMyRank(game: GameType) {
    if (!myRankBox || !myRankValue || !myRankNote) return;

    if (!lastScore || lastScore.game !== game) {
      myRankBox.hidden = true;
      return;
    }

    myRankBox.hidden = false;
    myRankValue.textContent = '…';
    myRankNote.textContent = `${formatTime(lastScore.time)} · ${escapeHtml(lastScore.nickname)}`;

    const rank = await getPlayerRank(game, lastScore.time);
    if (rank === null) {
      myRankValue.textContent = '—';
      return;
    }
    myRankValue.textContent = `#${rank}`;
  }

  async function loadPage(game: GameType, page: number) {
    if (isLoading) return;
    isLoading = true;

    currentGame = game;
    currentPage = page;

    // Активная вкладка
    tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.leaderboardTab === game);
    });

    content!.innerHTML = '<p class="leaderboard__empty">Загрузка...</p>';

  const { entries, total: t } = await getScores(game, {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });

    // Защита от гонки при быстрых кликах
    if (game !== currentGame || page !== currentPage) {
      isLoading = false;
      return;
    }

    total = t;

    // Если total = 0 и записи пустые — либо пустая игра,
    // либо Supabase не сконфигурирован. Проверяем импортом.
    const { isSupabaseConfigured } = await import('../lib/supabase');
    if (!isSupabaseConfigured) {
      content!.innerHTML = `
        <div class="leaderboard__empty">
          <p>Сервис лидерборда временно недоступен. Попробуйте позже.</p>
        </div>
      `;
      pagination && (pagination.hidden = true);
      if (myRankBox) myRankBox.hidden = true;
      isLoading = false;
      return;
    }

    content!.innerHTML = renderTable(entries, game, page * PAGE_SIZE);
    updatePagination();
    await updateMyRank(game);
    isLoading = false; }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const game = tab.dataset.leaderboardTab as GameType;
      if (game && game !== currentGame) {
        loadPage(game, 0);
      }
    });
  });

  prevBtn?.addEventListener('click', () => {
    if (currentPage > 0) loadPage(currentGame, currentPage - 1);
  });

  nextBtn?.addEventListener('click', () => {
    if (currentPage < totalPages() - 1) loadPage(currentGame, currentPage + 1);
  });

  // Первая загрузка
  loadPage('memory', 0);
}