/**
 * Прогресс пути новичка:
 * - Точки и линии активируются, когда шаг в зоне видимости
 * - Прогресс-панель справа обновляется: счётчик, полоска, «Дальше»
 * - При скролле вверх — шаги плавно гаснут
 */

interface StepData {
  element: HTMLElement;
  title: string;
  href: string;
}

export function initStartHere() {
  const container = document.querySelector<HTMLElement>('[data-start-here]');
  if (!container) return;

  const stepElements = container.querySelectorAll<HTMLElement>('[data-start-step]');
  if (stepElements.length === 0) return;

  // Собираем данные шагов
  const steps: StepData[] = Array.from(stepElements).map((el) => {
    const link = el.querySelector<HTMLAnchorElement>('.start-step__content');
    const title = el.querySelector<HTMLElement>('.start-step__title');
    return {
      element: el,
      title: title?.textContent?.trim() ?? '',
      href: link?.href ?? '',
    };
  });

  // Элементы прогресс-панели
  const progressContainer = document.querySelector<HTMLElement>('[data-start-progress]');
  const currentEl = progressContainer?.querySelector<HTMLElement>('[data-progress-current]');
  const fillEl = progressContainer?.querySelector<HTMLElement>('[data-progress-fill]');
  const nextBlock = progressContainer?.querySelector<HTMLElement>('[data-progress-next]');
  const nextTitle = progressContainer?.querySelector<HTMLElement>('[data-progress-next-title]');
  const nextLink = progressContainer?.querySelector<HTMLAnchorElement>('[data-progress-next-link]');
  const doneBlock = progressContainer?.querySelector<HTMLElement>('[data-progress-done]');

  // Отслеживаем активные шаги
  const passedIndices = new Set<number>();

  function updateProgress() {
    const total = steps.length;
    const passed = passedIndices.size;

    // Обновляем счётчик
    if (currentEl) currentEl.textContent = String(passed);

    // Обновляем полоску
    if (fillEl) {
      fillEl.style.width = `${(passed / total) * 100}%`;
    }

    // Обновляем «Дальше»
    if (passed < total) {
      const nextIndex = passed; // индекс следующего шага
      const nextStep = steps[nextIndex];

      if (nextBlock) nextBlock.hidden = false;
      if (doneBlock) doneBlock.hidden = true;

      if (nextTitle) nextTitle.textContent = nextStep.title;
      if (nextLink) nextLink.href = nextStep.href;
    } else {
      // Все шаги пройдены
      if (nextBlock) nextBlock.hidden = true;
      if (doneBlock) doneBlock.hidden = false;
    }
  }

  // IntersectionObserver — двусторонний
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        const index = parseInt(target.dataset.stepIndex ?? '0', 10);

        if (entry.isIntersecting) {
          target.classList.add('is-passed');
          passedIndices.add(index);
        } else {
          target.classList.remove('is-passed');
          passedIndices.delete(index);
        }
      });

      updateProgress();
    },
    {
      rootMargin: '-200px 0px -200px 0px',
      threshold: 0,
    }
  );

  steps.forEach((step) => observer.observe(step.element));

  // Стартовое состояние
  updateProgress();
}