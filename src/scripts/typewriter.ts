/**
 * Эффект печатной машинки для hero-заголовка.
 * Печатает слово по буквам, делает паузу, стирает, переходит к следующему.
 * Циклично перебирает массив слов.
 */

const WORDS = ['Tilda', 'WordPress', 'чистом коде', 'Astro JS'];

// Тайминги (в миллисекундах)
const TYPE_SPEED = 80;      // скорость печати одной буквы
const ERASE_SPEED = 40;     // скорость стирания одной буквы
const HOLD_TIME = 2200;     // пауза после полного слова
const RESTART_DELAY = 400;  // пауза перед печатью следующего

export function initTypewriter() {
  const textEl = document.querySelector<HTMLElement>('[data-typewriter-text]');
  if (!textEl) return;

  // Проверяем, не просил ли пользователь уменьшить анимацию
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Не анимируем — показываем все слова статично через " / "
    textEl.textContent = WORDS.join(' / ');
    return;
  }

  let wordIndex = 0;      // индекс текущего слова
  let charIndex = 0;      // индекс текущей буквы
  let isDeleting = false; // режим стирания или печати

  function tick() {
    const currentWord = WORDS[wordIndex];

    if (isDeleting) {
      // Стираем
      charIndex--;
      textEl.textContent = currentWord.slice(0, charIndex);

      if (charIndex === 0) {
        // Слово стёрто — переходим к следующему
        isDeleting = false;
        wordIndex = (wordIndex + 1) % WORDS.length;
        setTimeout(tick, RESTART_DELAY);
        return;
      }

      setTimeout(tick, ERASE_SPEED);
    } else {
      // Печатаем
      charIndex++;
      textEl.textContent = currentWord.slice(0, charIndex);

      if (charIndex === currentWord.length) {
        // Слово напечатано — делаем паузу, потом стираем
        isDeleting = true;
        setTimeout(tick, HOLD_TIME);
        return;
      }

      setTimeout(tick, TYPE_SPEED);
    }
  }

  // Запускаем с небольшой задержкой
  setTimeout(tick, 600);
}