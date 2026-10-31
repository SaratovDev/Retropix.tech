/**
 * Секция «Как я работаю» — аккордеон.
 * При открытии одного блока — остальные закрываются.
 * Плавная анимация через CSS transition на grid-template-rows.
 */

export function initWorkSteps() {
  const container = document.querySelector<HTMLElement>('[data-work-steps]');
  if (!container) return;

  const steps = container.querySelectorAll<HTMLElement>('[data-work-step]');
  if (steps.length === 0) return;

  // Открываем первый по умолчанию
  if (steps[0]) {
    steps[0].classList.add('is-open');
  }

  steps.forEach((step) => {
    const toggle = step.querySelector<HTMLButtonElement>('[data-work-step-toggle]');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const isOpen = step.classList.contains('is-open');

      // Закрываем все
      steps.forEach((other) => {
        other.classList.remove('is-open');
        const otherToggle = other.querySelector<HTMLButtonElement>('[data-work-step-toggle]');
        if (otherToggle) {
          otherToggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Если текущий был закрыт — открываем
      if (!isOpen) {
        step.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
}