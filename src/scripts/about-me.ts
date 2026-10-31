/**
 * Секция «Кто я».
 * - Фото появляется с fade-in при скролле
 * - Цифры «накручиваются» от 0 до нужного значения
 */

export function initAboutMe() {
  const section = document.querySelector<HTMLElement>('[data-about-me]');
  if (!section) return;

  const statValues = section.querySelectorAll<HTMLElement>('[data-about-stat-value]');
  if (statValues.length === 0) return;

  // Проверяем, не просил ли пользователь уменьшить движение
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Если reduce-motion — сразу ставим финальные значения
  if (prefersReducedMotion) {
    statValues.forEach((el) => {
      el.textContent = el.dataset.value ?? '0';
    });
    section.classList.add('is-visible');
    return;
  }

  let hasAnimated = false;

  // Анимация одной цифры
  function animateNumber(el: HTMLElement, target: number, duration = 1500) {
    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Плавность — ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      el.textContent = String(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = String(target);
      }
    }

    requestAnimationFrame(update);
  }

  // Запуск анимации всех цифр с небольшой задержкой
  function runAnimation() {
    if (hasAnimated) return;
    hasAnimated = true;

    statValues.forEach((el, i) => {
      const target = parseInt(el.dataset.value ?? '0', 10);
      // Задержка между цифрами — 100ms
      setTimeout(() => {
        animateNumber(el, target);
      }, i * 100);
    });
  }

  // Наблюдаем за секцией — когда попадает в зону видимости — запускаем
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('is-visible');
          runAnimation();
          observer.disconnect(); // срабатывает один раз
        }
      });
    },
    {
      rootMargin: '0px 0px -20% 0px',
      threshold: 0.2,
    }
  );

  observer.observe(section);
}