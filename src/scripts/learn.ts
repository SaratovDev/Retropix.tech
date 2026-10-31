/**
 * Секция «Обучение».
 * - Карточки-навыки появляются с задержкой при скролле
 */

export function initLearn() {
  const section = document.querySelector<HTMLElement>('.learn');
  if (!section) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Если reduce-motion — сразу показываем карточки
  if (prefersReducedMotion) {
    section.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('is-visible');
          observer.disconnect();
        }
      });
    },
    {
      rootMargin: '0px 0px -15% 0px',
      threshold: 0.15,
    }
  );

  observer.observe(section);
}